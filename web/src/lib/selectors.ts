import type {
  BelegDocument,
  CatalogItem,
  Cents,
  DocumentLine,
  Supplier,
} from "@/lib/domain";
import { documentTotals } from "@/lib/domain";
import {
  catalogItems,
  datevAccounts,
  priceHistory,
  suppliers,
} from "@/lib/mock/data";

export function findSupplier(supplierId: string): Supplier {
  const supplier = suppliers.find((entry) => entry.id === supplierId);
  if (!supplier) throw new Error(`Unknown supplier ${supplierId}`);
  return supplier;
}

export function findCatalogItem(
  catalogItemId: string | null,
): CatalogItem | null {
  if (!catalogItemId) return null;
  return catalogItems.find((entry) => entry.id === catalogItemId) ?? null;
}

export function lineCategory(line: DocumentLine): string {
  if (line.isPfand) return "Pfand";
  return findCatalogItem(line.catalogItemId)?.category ?? "Sonstiges";
}

export interface ReconciliationRow {
  key: string;
  description: string;
  deliveredQuantity: number | null;
  invoicedQuantity: number | null;
  deliveredUnitPrice: Cents | null;
  invoicedUnitPrice: Cents | null;
  unit: string;
  /** Positive means the invoice asks for more than the delivery note shows. */
  deltaCents: Cents;
  issue: "menge" | "preis" | "fehlt" | "zusatz" | null;
}

export function reconcile(
  deliveryNote: BelegDocument,
  invoice: BelegDocument,
): ReconciliationRow[] {
  const keys = new Set<string>([
    ...deliveryNote.lines.map((line) => line.rawDescription),
    ...invoice.lines.map((line) => line.rawDescription),
  ]);

  return [...keys].map((key) => {
    const delivered = deliveryNote.lines.find(
      (line) => line.rawDescription === key,
    );
    const invoiced = invoice.lines.find((line) => line.rawDescription === key);

    const deltaCents = (invoiced?.totalCents ?? 0) - (delivered?.totalCents ?? 0);

    let issue: ReconciliationRow["issue"] = null;
    if (!delivered) issue = "zusatz";
    else if (!invoiced) issue = "fehlt";
    else if (delivered.quantity !== invoiced.quantity) issue = "menge";
    else if (delivered.unitPriceCents !== invoiced.unitPriceCents) issue = "preis";

    return {
      key,
      description: key,
      deliveredQuantity: delivered?.quantity ?? null,
      invoicedQuantity: invoiced?.quantity ?? null,
      deliveredUnitPrice: delivered?.unitPriceCents ?? null,
      invoicedUnitPrice: invoiced?.unitPriceCents ?? null,
      unit: invoiced?.unit ?? delivered?.unit ?? "",
      deltaCents,
      issue,
    };
  });
}

export interface PriceTrend {
  catalogItemId: string;
  catalogItemName: string;
  supplierName: string;
  previousCents: Cents;
  currentCents: Cents;
  delta: number;
  series: { date: string; unitPriceCents: Cents }[];
}

export function priceTrends(): PriceTrend[] {
  const byItem = new Map<string, typeof priceHistory>();
  for (const point of priceHistory) {
    const key = `${point.catalogItemId}|${point.supplierId}`;
    byItem.set(key, [...(byItem.get(key) ?? []), point]);
  }

  return [...byItem.entries()]
    .map(([key, points]) => {
      const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
      const [catalogItemId, supplierId] = key.split("|");
      const previousCents = sorted[sorted.length - 2].unitPriceCents;
      const currentCents = sorted[sorted.length - 1].unitPriceCents;
      return {
        catalogItemId,
        catalogItemName: findCatalogItem(catalogItemId)?.name ?? catalogItemId,
        supplierName: findSupplier(supplierId).name,
        previousCents,
        currentCents,
        delta: (currentCents - previousCents) / previousCents,
        series: sorted.map((point) => ({
          date: point.date,
          unitPriceCents: point.unitPriceCents,
        })),
      };
    })
    .sort((a, b) => b.delta - a.delta);
}

export function pfandBalance(documents: BelegDocument[]): {
  supplierId: string;
  supplierName: string;
  cents: Cents;
}[] {
  const balances = new Map<string, Cents>();
  for (const document of documents) {
    const pfand = documentTotals(document.lines).pfandCents;
    if (pfand === 0) continue;
    balances.set(
      document.supplierId,
      (balances.get(document.supplierId) ?? 0) + pfand,
    );
  }
  return [...balances.entries()]
    .map(([supplierId, cents]) => ({
      supplierId,
      supplierName: findSupplier(supplierId).name,
      cents,
    }))
    .sort((a, b) => b.cents - a.cents);
}

export interface DatevRow {
  umsatzCents: Cents;
  sollHaben: "S" | "H";
  konto: string;
  kontoLabel: string;
  gegenkonto: string;
  buSchluessel: string;
  belegdatum: string;
  belegfeld1: string;
  buchungstext: string;
}

const CREDITOR_ACCOUNTS: Record<string, string> = {
  "sup-metro": "70001",
  "sup-brandt": "70002",
  "sup-sommer": "70003",
  "sup-kohl": "70004",
  "sup-gruenhof": "70005",
};

export function buildDatevRows(documents: BelegDocument[]): DatevRow[] {
  const rows: DatevRow[] = [];

  for (const document of documents) {
    const supplier = findSupplier(document.supplierId);
    const creditor = CREDITOR_ACCOUNTS[document.supplierId] ?? "70099";
    const buckets = new Map<string, { cents: Cents; vatRate: number }>();

    for (const line of document.lines) {
      const category = lineCategory(line);
      const key = `${category}|${line.vatRate}`;
      const bucket = buckets.get(key) ?? { cents: 0, vatRate: line.vatRate };
      bucket.cents += line.totalCents + Math.round((line.totalCents * line.vatRate) / 100);
      buckets.set(key, bucket);
    }

    for (const [key, bucket] of buckets) {
      const category = key.split("|")[0];
      const account = datevAccounts[category] ?? datevAccounts.Sonstiges;
      rows.push({
        umsatzCents: Math.abs(bucket.cents),
        sollHaben: bucket.cents >= 0 ? "S" : "H",
        konto: account.account,
        kontoLabel: account.label,
        gegenkonto: creditor,
        buSchluessel: bucket.vatRate === 7 ? "2" : bucket.vatRate === 19 ? "3" : "0",
        belegdatum: document.date.slice(8, 10) + document.date.slice(5, 7),
        belegfeld1: document.number.slice(0, 36),
        buchungstext: `${supplier.name} ${category}`.slice(0, 60),
      });
    }
  }

  return rows;
}

/**
 * DATEV EXTF Buchungsstapel, format version 700. The header line is positional and
 * picky — DATEV rejects the file outright if a field moves.
 */
export function toExtfCsv(
  rows: DatevRow[],
  options: { consultantNumber: string; clientNumber: string; year: number; from: string; to: string },
): string {
  const header = [
    '"EXTF"',
    "700",
    "21",
    '"Buchungsstapel"',
    "13",
    "",
    "",
    '"GastroBeleg"',
    '""',
    "",
    options.consultantNumber,
    options.clientNumber,
    `${options.year}0101`,
    "4",
    options.from.replace(/-/g, ""),
    options.to.replace(/-/g, ""),
    '""',
    '""',
    "1",
    "0",
    "0",
    '"EUR"',
    "",
    '""',
    "",
    "",
    '""',
    '""',
    "",
    "",
    "",
  ].join(";");

  const columns = [
    "Umsatz (ohne Soll/Haben-Kz)",
    "Soll/Haben-Kennzeichen",
    "WKZ Umsatz",
    "Kurs",
    "Basis-Umsatz",
    "WKZ Basis-Umsatz",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Belegdatum",
    "Belegfeld 1",
    "Belegfeld 2",
    "Skonto",
    "Buchungstext",
  ]
    .map((column) => `"${column}"`)
    .join(";");

  const body = rows.map((row) =>
    [
      (row.umsatzCents / 100).toFixed(2).replace(".", ","),
      row.sollHaben,
      '"EUR"',
      "",
      "",
      "",
      row.konto,
      row.gegenkonto,
      row.buSchluessel,
      row.belegdatum,
      `"${row.belegfeld1}"`,
      '""',
      "",
      `"${row.buchungstext}"`,
    ].join(";"),
  );

  return [header, columns, ...body].join("\r\n");
}
