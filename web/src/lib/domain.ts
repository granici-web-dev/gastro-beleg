export type Cents = number;

export type VatRate = 0 | 7 | 19;

export type DocumentType =
  | "Rechnung"
  | "Lieferschein"
  | "Gutschrift"
  | "Kassenbeleg";

export type DocumentStatus =
  | "verarbeitung"
  | "pruefung"
  | "gebucht"
  | "exportiert";

export type DocumentSource = "foto" | "pdf" | "email" | "erechnung";

export type BaseUnit = "kg" | "l" | "Stk";

export interface Supplier {
  id: string;
  name: string;
  city: string;
  ustId: string | null;
  /** Documents that arrive as structured XML never go through OCR. */
  sendsERechnung: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  baseUnit: BaseUnit;
}

export interface SupplierProductMapping {
  supplierId: string;
  rawString: string;
  articleNo: string | null;
  catalogItemId: string;
  /** Supplier unit → base unit. "1 Kiste = 24 × 0,33 l" is 7.92. */
  conversionFactor: number;
}

export interface DocumentLine {
  id: string;
  rawDescription: string;
  articleNo: string | null;
  quantity: number;
  unit: string;
  unitPriceCents: Cents;
  totalCents: Cents;
  vatRate: VatRate;
  isPfand: boolean;
  /** 0…1. Below 0.85 the line is routed to human review. */
  confidence: number;
  catalogItemId: string | null;
}

export interface BelegDocument {
  id: string;
  type: DocumentType;
  supplierId: string;
  number: string;
  /** Document date, never the upload date — the onboarding backlog would collapse into one day. */
  date: string;
  uploadedAt: string;
  status: DocumentStatus;
  source: DocumentSource;
  fileLabel: string;
  pageCount: number;
  lines: DocumentLine[];
  /** Set once the matching Lieferschein has been reconciled against this invoice. */
  matchedDocumentId: string | null;
}

export type SavingsKind =
  | "preisabweichung"
  | "fehlmenge"
  | "doppelt"
  | "skonto"
  | "pfand";

export interface SavingsEvent {
  id: string;
  date: string;
  kind: SavingsKind;
  supplierId: string;
  description: string;
  amountCents: Cents;
  documentId: string | null;
  confirmed: boolean;
}

export interface PricePoint {
  catalogItemId: string;
  supplierId: string;
  date: string;
  unitPriceCents: Cents;
}

export const CONFIDENCE_REVIEW_THRESHOLD = 0.85;

/** qty × unit price must land within this of the printed line total. */
export const LINE_TOLERANCE_CENTS = 2;

/** Unit price change against the last known price for the same supplier + product. */
export const PRICE_JUMP_THRESHOLD = 0.05;

export function lineNetCents(line: DocumentLine): Cents {
  return line.totalCents;
}

export function lineVatCents(line: DocumentLine): Cents {
  return Math.round((line.totalCents * line.vatRate) / 100);
}

export function expectedLineTotalCents(line: DocumentLine): Cents {
  return Math.round(line.quantity * line.unitPriceCents);
}

export function lineMathIsOff(line: DocumentLine): boolean {
  return (
    Math.abs(expectedLineTotalCents(line) - line.totalCents) >
    LINE_TOLERANCE_CENTS
  );
}

export interface DocumentTotals {
  netCents: Cents;
  vatCents: Cents;
  grossCents: Cents;
  /** Pfand is never goods cost — it is carried as a per-supplier balance. */
  pfandCents: Cents;
  goodsCents: Cents;
  vatByRate: { rate: VatRate; netCents: Cents; vatCents: Cents }[];
}

export function documentTotals(lines: DocumentLine[]): DocumentTotals {
  const byRate = new Map<VatRate, { netCents: Cents; vatCents: Cents }>();
  let netCents = 0;
  let vatCents = 0;
  let pfandCents = 0;

  for (const line of lines) {
    const net = lineNetCents(line);
    const vat = lineVatCents(line);
    netCents += net;
    vatCents += vat;
    if (line.isPfand) pfandCents += net;

    const bucket = byRate.get(line.vatRate) ?? { netCents: 0, vatCents: 0 };
    bucket.netCents += net;
    bucket.vatCents += vat;
    byRate.set(line.vatRate, bucket);
  }

  return {
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
    pfandCents,
    goodsCents: netCents - pfandCents,
    vatByRate: [...byRate.entries()]
      .map(([rate, bucket]) => ({ rate, ...bucket }))
      .sort((a, b) => a.rate - b.rate),
  };
}

export function linesNeedingReview(lines: DocumentLine[]): DocumentLine[] {
  return lines.filter(
    (line) =>
      line.confidence < CONFIDENCE_REVIEW_THRESHOLD ||
      lineMathIsOff(line) ||
      line.catalogItemId === null,
  );
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  verarbeitung: "In Verarbeitung",
  pruefung: "Zu prüfen",
  gebucht: "Gebucht",
  exportiert: "Exportiert",
};

export const DOCUMENT_SOURCE_LABEL: Record<DocumentSource, string> = {
  foto: "Foto",
  pdf: "PDF",
  email: "E-Mail",
  erechnung: "E-Rechnung",
};
