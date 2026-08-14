import {
  ArrowLeftRight,
  BookOpen,
  ChartColumn,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  Truck,
  Upload,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SectionTab {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Sibling screens of the same section — shown as tabs under the topbar, not in the sidebar. */
  tabs?: SectionTab[];
}

/**
 * Eleven entries, in the order of the Figma sidebar. Everything below a section
 * lives in its tab row: a sidebar you have to scroll is a sidebar you stop reading.
 */
export const navigation: NavItem[] = [
  {
    href: "/uebersicht",
    label: "Übersicht",
    description: "Wareneinsatz, Preise, Pfand",
    icon: LayoutDashboard,
  },
  {
    href: "/belege",
    label: "Belege",
    description: "Alle Rechnungen und Lieferscheine",
    icon: FileText,
    tabs: [
      { href: "/belege", label: "Alle Belege" },
      { href: "/scan", label: "Erfassen" },
      { href: "/whatsapp", label: "WhatsApp-Eingang" },
    ],
  },
  {
    href: "/abgleich",
    label: "Abgleich",
    description: "Lieferschein gegen Rechnung",
    icon: ArrowLeftRight,
    tabs: [
      { href: "/abgleich", label: "Abgleich" },
      { href: "/gutschriften", label: "Gutschriften" },
      { href: "/ersparnis", label: "Gefundenes Geld" },
    ],
  },
  {
    href: "/analyse",
    label: "Analyse",
    description: "Einkauf, Quote, Marge, Wochenbericht",
    icon: ChartColumn,
    tabs: [
      { href: "/analyse", label: "Einkauf" },
      { href: "/wareneinsatz", label: "Wareneinsatz" },
      { href: "/marge", label: "Marge je Gericht" },
      { href: "/wochenbericht", label: "Wochenbericht" },
    ],
  },
  {
    href: "/faelligkeiten",
    label: "Kosten",
    description: "Fälligkeiten, Verträge, Energie, Plattformen",
    icon: Wallet,
    tabs: [
      { href: "/faelligkeiten", label: "Fälligkeiten" },
      { href: "/vertraege", label: "Verträge und Abos" },
      { href: "/energie", label: "Energie" },
      { href: "/plattformen", label: "Lieferplattformen" },
    ],
  },
  {
    href: "/katalog",
    label: "Katalog",
    description: "Produkte und Zuordnungen",
    icon: BookOpen,
  },
  {
    href: "/speisekarte",
    label: "Speisekarte",
    description: "Gerichte, Allergene, Gastansicht",
    icon: UtensilsCrossed,
    tabs: [
      { href: "/speisekarte", label: "Gerichte" },
      { href: "/qr-karte", label: "QR-Karte" },
    ],
  },
  {
    href: "/lieferanten",
    label: "Lieferanten",
    description: "Zuverlässigkeit und Preise",
    icon: Truck,
    tabs: [
      { href: "/lieferanten", label: "Übersicht" },
      { href: "/dossier", label: "Verhandlungsdossier" },
    ],
  },
  {
    href: "/kasse",
    label: "Kassendaten",
    description: "DSFinV-K-Export einlesen",
    icon: Receipt,
  },
  {
    href: "/export",
    label: "DATEV-Export",
    description: "Buchungsstapel, Prüfung, Kanzlei",
    icon: Upload,
    tabs: [
      { href: "/export", label: "Buchungsstapel" },
      { href: "/betriebspruefung", label: "Betriebsprüfung" },
      { href: "/kanzlei", label: "Kanzlei-Portal" },
    ],
  },
  {
    href: "/einstellungen/tarif",
    label: "Einstellungen",
    description: "Tarif, Betrieb, Nutzer, Buchhaltung, Rechtliches",
    icon: Settings,
    tabs: [
      { href: "/einstellungen/tarif", label: "Tarif" },
      { href: "/einstellungen/betrieb", label: "Betrieb" },
      { href: "/einstellungen/nutzer", label: "Nutzer" },
      { href: "/einstellungen/buchhaltung", label: "Buchhaltung" },
      { href: "/einstellungen/rechtliches", label: "Rechtliches" },
    ],
  },
];

function ownsPath(item: NavItem, pathname: string): boolean {
  const candidates = [item.href, ...(item.tabs?.map((tab) => tab.href) ?? [])];
  return candidates.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

export function navItemForPath(pathname: string): NavItem | null {
  const matches = navigation
    .filter((item) => ownsPath(item, pathname))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0] ?? null;
}

/** The tab row for the current screen, or null when the section has only one screen. */
export function tabsForPath(pathname: string): SectionTab[] | null {
  const item = navItemForPath(pathname);
  if (!item?.tabs) return null;
  return item.tabs;
}
