"""Vision provider tests.

No network. The SDK call is faked at the `messages.parse` seam, so these test
what we own — routing, the translation into the domain model, and the failure
paths — rather than re-testing Anthropic's client. The one thing they cannot
cover is whether the model reads a real receipt correctly; that needs the
fixtures listed in `fixtures/README.md`.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import anthropic
import pytest

from app.domain import DocumentSource, DocumentType, VatRate
from app.extraction.client import (
    EU_RESIDENCY,
    Residency,
    ResidencyError,
    build_client,
    model_id_for,
)
from app.extraction.provider import ExtractionError, IntakeFile, UnsupportedInput
from app.extraction.schema import DocumentDraft, ExtractionDraft, LineDraft
from app.extraction.vision import ClaudeVisionProvider
from app.validation.rules import Code, ValidationContext, validate
from tests.conftest import load

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.7\n% a scan, no attachment\n"


@dataclass
class FakeResponse:
    parsed_output: ExtractionDraft | None
    stop_reason: str = "end_turn"


class FakeMessages:
    def __init__(self, response: Any = None, error: Exception | None = None) -> None:
        self._response = response
        self._error = error
        self.calls: list[dict[str, Any]] = []

    def parse(self, **kwargs: Any) -> Any:
        self.calls.append(kwargs)
        if self._error is not None:
            raise self._error
        return self._response


class FakeClient:
    def __init__(self, response: Any = None, error: Exception | None = None) -> None:
        self.messages = FakeMessages(response, error)


def draft(**overrides: Any) -> ExtractionDraft:
    line = LineDraft(
        position=1,
        description="Tomaten gehackt 2,5 kg",
        quantity="6",
        unit="Stk",
        unit_price="3,20",
        line_total="19,20",
        vat_rate="7",
        is_pfand=False,
        confidence=0.97,
    )
    base: dict[str, Any] = {
        "doc_type": "Lieferschein",
        "doc_number": "LS-4711",
        "doc_date": "2026-08-11",
        "currency": "EUR",
        "supplier_name": "Gemüse Rhein GmbH",
        "supplier_vat_id": "DE123456789",
        "lines": [line],
        "total_net": "19,20",
        "total_vat": "1,34",
        "total_gross": "20,54",
        "confidence": 0.97,
    }
    return ExtractionDraft(documents=[DocumentDraft(**(base | overrides))])


def provider(response: Any = None, error: Exception | None = None) -> ClaudeVisionProvider:
    return ClaudeVisionProvider(
        FakeClient(response, error), residency=Residency.DEV_UNRESTRICTED
    )


# --------------------------------------------------------------- residency


def test_non_eu_route_is_refused_by_default() -> None:
    """CLAUDE.md § 2.5 is unconditional — the default must not be a US region."""
    with pytest.raises(ResidencyError, match="EU processing"):
        build_client(Residency.DEV_UNRESTRICTED)


def test_us_region_is_refused_even_on_an_eu_route() -> None:
    with pytest.raises(ResidencyError, match="not an EU region"):
        build_client(Residency.BEDROCK_EU, region="us-east-1")


@pytest.mark.parametrize("region", ["eu-central-1", "europe-west4", "EU-WEST-1"])
def test_eu_regions_are_accepted(region: str) -> None:
    """Prefix check, so a region added next year is accepted without a code change."""
    assert build_client(Residency.BEDROCK_EU, region=region) is not None


@pytest.mark.parametrize("region", ["us-east-1", "ap-southeast-2", "sa-east-1", "europ"])
def test_non_eu_regions_are_rejected(region: str) -> None:
    with pytest.raises(ResidencyError, match="not an EU region"):
        build_client(Residency.BEDROCK_EU, region=region)


def test_both_eu_routes_are_marked_as_such() -> None:
    assert {Residency.VERTEX_EU, Residency.BEDROCK_EU} == EU_RESIDENCY
    assert Residency.DEV_UNRESTRICTED not in EU_RESIDENCY


def test_bedrock_prefixes_the_model_id() -> None:
    assert model_id_for(Residency.BEDROCK_EU, "claude-opus-5") == "anthropic.claude-opus-5"
    assert model_id_for(Residency.VERTEX_EU, "claude-opus-5") == "claude-opus-5"


# --------------------------------------------------------------- routing


def test_structured_xml_never_reaches_the_model() -> None:
    """The whole point of the classifier: exact data must not be restated by an LLM."""
    p = provider(FakeResponse(draft()))
    xrechnung = load("xrechnung-ubl-getraenke.xml")

    assert not p.supports(xrechnung)
    with pytest.raises(UnsupportedInput):
        p.extract(xrechnung)


def test_photo_and_scanned_pdf_are_claimed() -> None:
    p = provider(FakeResponse(draft()))
    assert p.supports(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))
    assert p.supports(IntakeFile("scan.pdf", PDF, DocumentSource.UPLOAD))


def test_pdf_is_sent_as_a_document_block_not_an_image() -> None:
    p = provider(FakeResponse(draft()))
    p.extract(IntakeFile("scan.pdf", PDF, DocumentSource.UPLOAD))

    blocks = p._client.messages.calls[0]["messages"][0]["content"]
    assert blocks[0]["type"] == "document"
    assert blocks[0]["source"]["media_type"] == "application/pdf"


def test_system_prompt_is_cached() -> None:
    """It is byte-identical per document, so it is the entire cacheable prefix."""
    p = provider(FakeResponse(draft()))
    p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))

    system = p._client.messages.calls[0]["system"]
    assert system[0]["cache_control"] == {"type": "ephemeral"}


# --------------------------------------------------------------- translation


def test_draft_becomes_a_domain_document() -> None:
    p = provider(FakeResponse(draft()))
    (doc,) = p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))

    assert doc.doc_type is DocumentType.LIEFERSCHEIN
    assert doc.doc_number == "LS-4711"
    assert doc.doc_date == dt.date(2026, 8, 11)
    assert doc.supplier.vat_id == "DE123456789"
    assert doc.provider == "claude-vision"
    assert doc.source is DocumentSource.PHOTO

    (line,) = doc.lines
    assert line.unit_price == Decimal("3.20")
    assert line.line_total_cents == 1920
    assert line.vat_rate is VatRate.REDUCED


def test_german_amounts_survive_as_written() -> None:
    """"1.234,56" is one thousand two hundred, not one point two three."""
    p = provider(FakeResponse(draft(total_gross="1.234,56")))
    (doc,) = p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))
    assert doc.total_gross_cents == 123456


def test_weight_keeps_three_decimals() -> None:
    """A butcher's line is "1,234 kg" — rounding it to cents breaks line math."""
    line = LineDraft(
        position=1,
        description="Rinderhack",
        quantity="1,234",
        unit="kg",
        unit_price="9,90",
        line_total="12,22",
        vat_rate="7",
        is_pfand=False,
        confidence=0.9,
    )
    p = provider(
        FakeResponse(draft(lines=[line], total_net="12,22", total_vat="0,86", total_gross="13,08"))
    )
    (doc,) = p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))

    assert doc.lines[0].quantity == Decimal("1.234")
    assert Code.LINE_MATH not in {
        f.code for f in validate(doc, ValidationContext(today=dt.date(2026, 8, 14)))
    }


def test_missing_unit_price_is_derived_not_invented() -> None:
    """Metro receipts print quantity and line total only."""
    line = LineDraft(
        position=1,
        description="Mehl Type 405",
        quantity="4",
        unit="Sack",
        unit_price="",
        line_total="73,60",
        vat_rate="7",
        is_pfand=False,
        confidence=0.9,
    )
    p = provider(
        FakeResponse(draft(lines=[line], total_net="73,60", total_vat="5,15", total_gross="78,75"))
    )
    (doc,) = p.extract(IntakeFile("kassenbon.png", PNG, DocumentSource.PHOTO))

    assert doc.lines[0].unit_price == Decimal("18.40")


def test_unknown_vat_rate_survives_translation() -> None:
    """It must reach validation as UNKNOWN so the blocking rule can fire."""
    line = LineDraft(
        position=1,
        description="Unleserlich",
        quantity="1",
        unit="Stk",
        unit_price="5,00",
        line_total="5,00",
        vat_rate="unknown",
        is_pfand=False,
        confidence=0.4,
    )
    p = provider(FakeResponse(draft(lines=[line], total_net="5,00", total_vat="", total_gross="")))
    (doc,) = p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))

    assert doc.lines[0].vat_rate is VatRate.UNKNOWN
    findings = validate(doc, ValidationContext(today=dt.date(2026, 8, 14)))
    assert Code.VAT_RATE_MISSING in {f.code for f in findings}


def test_low_confidence_reaches_the_review_queue() -> None:
    p = provider(FakeResponse(draft(confidence=0.55)))
    (doc,) = p.extract(IntakeFile("knitter.png", PNG, DocumentSource.PHOTO))

    findings = validate(doc, ValidationContext(today=dt.date(2026, 8, 14)))
    assert Code.LOW_CONFIDENCE in {f.code for f in findings}


def test_multi_document_photo_splits() -> None:
    both = ExtractionDraft(
        documents=[draft().documents[0], draft(doc_number="LS-4712").documents[0]]
    )
    p = provider(FakeResponse(both))
    docs = p.extract(IntakeFile("stapel.pdf", PDF, DocumentSource.UPLOAD))

    assert [d.doc_number for d in docs] == ["LS-4711", "LS-4712"]


# --------------------------------------------------------------- failures


def test_refusal_is_reported_not_indexed_into() -> None:
    """On a refusal `content` is empty; reading it would raise something unrelated."""
    p = provider(FakeResponse(None, stop_reason="refusal"))
    with pytest.raises(ExtractionError, match="declined"):
        p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))


def test_truncated_response_is_refused_rather_than_booked() -> None:
    """A partial document is silent data loss — the worst possible outcome here."""
    p = provider(FakeResponse(draft(), stop_reason="max_tokens"))
    with pytest.raises(ExtractionError, match="truncated"):
        p.extract(IntakeFile("langer-bon.pdf", PDF, DocumentSource.UPLOAD))


def test_api_errors_surface_as_extraction_errors() -> None:
    error = anthropic.APIStatusError(
        "rate limited", response=_stub_httpx_response(429), body=None
    )
    p = provider(error=error)
    with pytest.raises(ExtractionError, match="429"):
        p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))


def test_unreadable_amount_fails_loudly() -> None:
    """Better a visible failure than a guessed number in the books."""
    p = provider(FakeResponse(draft(total_gross="etwa zwanzig")))
    with pytest.raises(ExtractionError, match="unreadable amount"):
        p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))


def _stub_httpx_response(status: int) -> Any:
    import httpx

    return httpx.Response(status, request=httpx.Request("POST", "https://api.anthropic.com"))


# --------------------------------------------------------- grammar retry


class FlakyMessages(FakeMessages):
    """400s once with the grammar-compilation message, then succeeds."""

    def __init__(self, response: Any, message: str) -> None:
        super().__init__(response)
        self._message = message
        self._raised = False

    def parse(self, **kwargs: Any) -> Any:
        if not self._raised:
            self._raised = True
            raise anthropic.APIStatusError(
                self._message, response=_stub_httpx_response(400), body=None
            )
        return super().parse(**kwargs)


def _flaky_provider(message: str) -> ClaudeVisionProvider:
    client = FakeClient()
    client.messages = FlakyMessages(FakeResponse(draft()), message)
    return ClaudeVisionProvider(client, residency=Residency.DEV_UNRESTRICTED)


def test_grammar_compilation_timeout_is_retried_once() -> None:
    """Seen live on first use of a new schema; the retry succeeds immediately.

    Without this, the first upload after any schema change is rejected with a
    400 that no layer retries — a real document lost to a server-side cache miss.
    """
    p = _flaky_provider("Grammar compilation timed out.")
    (doc,) = p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))

    assert doc.doc_number == "LS-4711"
    assert len(p._client.messages.calls) == 1, "the retry, not the failed first call"


def test_other_400s_still_fail_fast() -> None:
    """A malformed request must not be retried into the same wall."""
    p = _flaky_provider("messages.0: content is required")
    with pytest.raises(ExtractionError, match="400"):
        p.extract(IntakeFile("foto.png", PNG, DocumentSource.PHOTO))
