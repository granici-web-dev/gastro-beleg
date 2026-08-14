import type { BelegDocument, DocumentLine } from "@/lib/domain";

export interface ScanSample {
  key: string;
  label: string;
  hint: string;
  /** Structured invoices bypass OCR entirely — the pipeline is genuinely shorter. */
  structured: boolean;
  build: (id: string, today: string) => BelegDocument;
}

function line(
  id: string,
  rawDescription: string,
  quantity: number,
  unit: string,
  unitPriceCents: number,
  vatRate: 0 | 7 | 19,
  options: Partial<DocumentLine> = {},
): DocumentLine {
  return {
    id,
    rawDescription,
    articleNo: null,
    quantity,
    unit,
    unitPriceCents,
    totalCents: Math.round(quantity * unitPriceCents),
    vatRate,
    isPfand: false,
    confidence: 0.96,
    catalogItemId: null,
    ...options,
  };
}

export const scanSamples: ScanSample[] = [
  {
    key: "metro",
    label: "METRO Kassenbeleg",
    hint: "Foto, 7 % und 19 % gemischt, Pfandzeilen",
    structured: false,
    build: (id, today) => ({
      id,
      type: "Kassenbeleg",
      supplierId: "sup-metro",
      number: `B-${today}-8812`,
      date: today,
      uploadedAt: new Date().toISOString(),
      status: "pruefung",
      source: "foto",
      fileLabel: "IMG_4517.jpg",
      pageCount: 1,
      matchedDocumentId: null,
      lines: [
        line(`${id}-1`, "RIND HACK 5KG FRISCH", 2, "Pkg", 4290, 7, {
          articleNo: "440221",
          catalogItemId: "cat-rinderhack",
        }),
        line(`${id}-2`, "MOZZARELLA BUFALA 125G", 24, "Stk", 189, 7, {
          articleNo: "553318",
          confidence: 0.81,
        }),
        line(`${id}-3`, "KARTOFFEL FESTK. 12,5KG", 2, "Sack", 1180, 7, {
          articleNo: "601188",
          catalogItemId: "cat-kartoffeln",
        }),
        line(`${id}-4`, "PILS KISTE 24X0,33", 3, "Kst", 1690, 19, {
          articleNo: "884401",
          catalogItemId: "cat-pils",
        }),
        line(`${id}-5`, "PFAND KASTEN 24X0,33", 3, "Kst", 330, 19, {
          isPfand: true,
        }),
        line(`${id}-6`, "PFAND FLASCHEN", 72, "Stk", 8, 19, { isPfand: true }),
      ],
    }),
  },
  {
    key: "brandt",
    label: "Handschriftlicher Lieferschein",
    hint: "Foto, Fleischerei, unsichere Erkennung",
    structured: false,
    build: (id, today) => ({
      id,
      type: "Lieferschein",
      supplierId: "sup-brandt",
      number: `LS ${today.slice(0, 4)}/0871`,
      date: today,
      uploadedAt: new Date().toISOString(),
      status: "pruefung",
      source: "foto",
      fileLabel: "IMG_4519.jpg",
      pageCount: 1,
      matchedDocumentId: null,
      lines: [
        line(`${id}-1`, "Schweinenacken o. Knochen", 7.6, "kg", 1090, 7, {
          catalogItemId: "cat-schweinenacken",
          confidence: 0.62,
        }),
        line(`${id}-2`, "Rinderhack frisch", 5.2, "kg", 890, 7, {
          catalogItemId: "cat-rinderhack",
          confidence: 0.68,
        }),
        line(`${id}-3`, "Guanciale am Stück", 1.8, "kg", 2480, 7, {
          confidence: 0.55,
        }),
        {
          ...line(`${id}-4`, "Hähnchenbrustfilet", 4, "kg", 1340, 7, {
            catalogItemId: "cat-haehnchenbrust",
            confidence: 0.74,
          }),
          totalCents: 4980,
        },
      ],
    }),
  },
  {
    key: "kohl",
    label: "XRechnung Getränke Kohl",
    hint: "XML, keine Bilderkennung nötig",
    structured: true,
    build: (id, today) => ({
      id,
      type: "Rechnung",
      supplierId: "sup-kohl",
      number: `RE-${today.slice(0, 4)}-8934`,
      date: today,
      uploadedAt: new Date().toISOString(),
      status: "pruefung",
      source: "erechnung",
      fileLabel: "XRechnung_RE-8934.xml",
      pageCount: 1,
      matchedDocumentId: null,
      lines: [
        line(`${id}-1`, "Pils Kiste 24x0,33", 4, "Kst", 1690, 19, {
          articleNo: "PI-330",
          catalogItemId: "cat-pils",
          confidence: 1,
        }),
        line(`${id}-2`, "Mineralwasser Classic 12x0,75", 6, "Kst", 549, 19, {
          articleNo: "MW-750",
          catalogItemId: "cat-mineralwasser",
          confidence: 1,
        }),
        line(`${id}-3`, "Grauburgunder trocken 6x0,75", 2, "Krt", 4390, 19, {
          articleNo: "GB-075",
          catalogItemId: "cat-grauburgunder",
          confidence: 1,
        }),
        line(`${id}-4`, "Pfand Kästen", 10, "Stk", 330, 19, {
          isPfand: true,
          confidence: 1,
        }),
      ],
    }),
  },
];

export const ocrStages = [
  "Original gesichert und versioniert",
  "Dokumenttyp und Lieferant erkannt",
  "Positionen, Mengen und Preise gelesen",
  "Umsatzsteuer und Pfand getrennt",
  "Preise gegen die Historie geprüft",
];

export const structuredStages = [
  "Original gesichert und versioniert",
  "XRechnung-XML gelesen — keine Bilderkennung nötig",
  "Positionen und Steuersätze aus dem XML übernommen",
  "Preise gegen die Historie geprüft",
];
