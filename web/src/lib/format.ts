import type { Cents } from "@/lib/domain";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const decimal = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantity = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const axisNumber = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
});

const percentFormatters = new Map<number, Intl.NumberFormat>();

function percentFormatter(digits: number): Intl.NumberFormat {
  const existing = percentFormatters.get(digits);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  percentFormatters.set(digits, formatter);
  return formatter;
}

export function formatEuro(cents: Cents): string {
  return euro.format(cents / 100);
}

export function formatEuroSigned(cents: Cents): string {
  const formatted = euro.format(Math.abs(cents) / 100);
  if (cents > 0) return `+${formatted}`;
  if (cents < 0) return `−${formatted}`;
  return formatted;
}

export function formatAmount(cents: Cents): string {
  return decimal.format(cents / 100);
}

export function formatQuantity(value: number): string {
  return quantity.format(value);
}

/** Axis ticks: whole numbers, German grouping, no currency symbol. */
export function formatThousands(value: number): string {
  return axisNumber.format(value);
}

export function formatPercent(fraction: number, digits = 1): string {
  return percentFormatter(digits).format(fraction);
}

export function formatDelta(fraction: number, digits = 1): string {
  const sign = fraction > 0 ? "+" : fraction < 0 ? "−" : "";
  return `${sign}${percentFormatter(digits).format(Math.abs(fraction))}`;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function formatMonth(iso: string): string {
  const [year, month] = iso.slice(0, 7).split("-");
  return `${MONTHS_DE[Number(month) - 1]} ${year}`;
}

export function formatMonthShort(iso: string): string {
  const [, month] = iso.slice(0, 7).split("-");
  return MONTHS_DE[Number(month) - 1].slice(0, 3);
}

/** "12,34" and "12.34" both mean 1234 cents. Returns null on anything else. */
export function parseCents(input: string): Cents | null {
  const normalised = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d*(\.\d{0,2})?$/.test(normalised) || normalised === "") return null;
  return Math.round(Number(normalised) * 100);
}

export function parseQuantity(input: string): number | null {
  const normalised = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d*(\.\d{0,3})?$/.test(normalised) || normalised === "") return null;
  return Number(normalised);
}
