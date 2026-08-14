"""Where inference runs.

CLAUDE.md § 2.5 is unconditional: all data and LLM processing in the EU, no
US-region inference endpoints. That is a deployment decision, not a code detail,
so this module refuses to make it implicitly — there is no default. A caller
that does not choose gets an exception, never a request to whatever region
happens to be nearest.

The three routes differ in *how* residency is expressed, which is why they are
not interchangeable behind a flag:

* **Vertex AI** and **Bedrock** take a region as a constructor argument. The
  region is the residency control, and it is verifiable from configuration.
* **The first-party API** has no region argument. `inference_geo` exists on the
  Messages API but its documented values are "us" and "global" — neither is an
  EU guarantee, so this module does not pretend otherwise. First-party is
  offered for local development and evaluation, and is explicitly named
  `DEV_UNRESTRICTED` so nobody reaches for it in production by accident.
"""

from __future__ import annotations

import os
from enum import StrEnum
from typing import Protocol


class Residency(StrEnum):
    """Which inference route to use. No default — the caller must say."""

    #: Google Cloud Vertex AI pinned to an EU region.
    VERTEX_EU = "vertex-eu"
    #: Amazon Bedrock pinned to an EU region.
    BEDROCK_EU = "bedrock-eu"
    #: First-party API. Not EU-guaranteed — development and evaluation only.
    DEV_UNRESTRICTED = "dev-unrestricted"


EU_RESIDENCY: frozenset[Residency] = frozenset({Residency.VERTEX_EU, Residency.BEDROCK_EU})


class ResidencyError(RuntimeError):
    """The configured route cannot satisfy the EU processing requirement."""


class MessagesClient(Protocol):
    """The slice of the Anthropic SDK this project uses.

    Narrow on purpose: it is what the tests fake, and it keeps the provider
    from quietly growing a dependency on the rest of the SDK surface.
    """

    @property
    def messages(self) -> object: ...


def build_client(
    residency: Residency,
    *,
    region: str | None = None,
    project_id: str | None = None,
    allow_non_eu: bool = False,
) -> MessagesClient:
    """Construct the SDK client for the chosen route.

    `allow_non_eu` is a second, explicit gate on the development route: naming
    the enum member is not enough, because a config file typo could do that.
    Two independent mistakes are needed to send a real document outside the EU.
    """
    if residency not in EU_RESIDENCY and not allow_non_eu:
        raise ResidencyError(
            f"{residency} does not guarantee EU processing (CLAUDE.md § 2.5). "
            "Pass allow_non_eu=True to use it for development."
        )

    match residency:
        case Residency.VERTEX_EU:
            from anthropic import AnthropicVertex

            resolved_region = region or os.environ.get("ANTHROPIC_VERTEX_REGION")
            resolved_project = project_id or os.environ.get("ANTHROPIC_VERTEX_PROJECT")
            if not resolved_region or not resolved_project:
                raise ResidencyError("Vertex needs both a region and a project id")
            _require_eu_region(resolved_region)
            return AnthropicVertex(region=resolved_region, project_id=resolved_project)

        case Residency.BEDROCK_EU:
            from anthropic import AnthropicBedrockMantle

            resolved_region = region or os.environ.get("AWS_REGION")
            if not resolved_region:
                raise ResidencyError("Bedrock needs an explicit AWS region")
            _require_eu_region(resolved_region)
            return AnthropicBedrockMantle(aws_region=resolved_region)

        case Residency.DEV_UNRESTRICTED:
            from anthropic import Anthropic

            return Anthropic()


def _require_eu_region(region: str) -> None:
    """Reject a region string that is not obviously European.

    A prefix check, not a lookup table: both providers name EU regions with an
    `eu`/`europe` prefix, and a table would silently go stale as regions are
    added. The failure mode of a prefix check is refusing a valid new EU region
    — loud and fixable. The failure mode of a stale table is accepting a US one.
    """
    normalized = region.strip().casefold()
    if not (normalized.startswith("eu-") or normalized.startswith("europe-")):
        raise ResidencyError(
            f"region {region!r} is not an EU region; EU processing is required (CLAUDE.md § 2.5)"
        )


#: Bedrock prefixes model IDs; Vertex and first-party use the bare ID.
def model_id_for(residency: Residency, model: str) -> str:
    return f"anthropic.{model}" if residency is Residency.BEDROCK_EU else model
