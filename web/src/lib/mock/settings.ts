import type { Cents } from "@/lib/domain";

export const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyCents: 3900,
    documents: 80,
    features: ["1 Betrieb", "Belege per Foto, PDF und E-Mail", "DATEV-Export"],
  },
  {
    id: "standard",
    name: "Standard",
    monthlyCents: 8900,
    documents: 200,
    features: [
      "Bis 2 Betriebe",
      "Abgleich Lieferschein gegen Rechnung",
      "Preisalarm und Wochenbericht",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCents: 14_900,
    documents: 400,
    features: [
      "Bis 5 Betriebe",
      "Kassendaten und Wareneinsatz-Quote",
      "Steuerberater-Zugang inklusive",
    ],
  },
];

export const topUpPacks: { documents: number; priceCents: Cents }[] = [
  { documents: 50, priceCents: 2400 },
  { documents: 150, priceCents: 5900 },
  { documents: 400, priceCents: 12_900 },
];

export const invoices = [
  { id: "inv-8", period: "Juli 2026", grossCents: 10_591, status: "bezahlt" },
  { id: "inv-7", period: "Juni 2026", grossCents: 10_591, status: "bezahlt" },
  { id: "inv-6", period: "Mai 2026", grossCents: 10_591, status: "bezahlt" },
];

export const businessProfile = {
  legalName: "Bellavista Gastronomie GmbH",
  tradeName: "Trattoria Bellavista",
  street: "Venloer Straße 214",
  zip: "50823",
  city: "Köln",
  ustId: "DE327441902",
  taxNumber: "215/5711/0043",
  registerCourt: "Amtsgericht Köln, HRB 88214",
  managingDirector: "Marco Ferrante",
  seats: 64,
  openingDays: 6,
  cuisine: "Italienisch",
  locations: [
    { id: "loc-1", name: "Ehrenfeld", street: "Venloer Straße 214", city: "Köln", isMain: true },
    { id: "loc-2", name: "Südstadt", street: "Bonner Straße 41", city: "Köln", isMain: false },
  ],
};

export const users = [
  {
    id: "usr-1",
    name: "Marco Ferrante",
    email: "chef@trattoria-bellavista.de",
    role: "Inhaber" as const,
    lastSeen: "2026-08-12",
    locations: ["Ehrenfeld", "Südstadt"],
  },
  {
    id: "usr-2",
    name: "Lena Brück",
    email: "buero@trattoria-bellavista.de",
    role: "Manager" as const,
    lastSeen: "2026-08-11",
    locations: ["Ehrenfeld", "Südstadt"],
  },
  {
    id: "usr-3",
    name: "Tomasz Wójcik",
    email: "kueche@trattoria-bellavista.de",
    role: "Mitarbeiter" as const,
    lastSeen: "2026-08-12",
    locations: ["Ehrenfeld"],
  },
  {
    id: "usr-4",
    name: "Kanzlei Kramer & Partner",
    email: "belege@kramer-partner.de",
    role: "Steuerberater" as const,
    lastSeen: "2026-08-05",
    locations: ["Ehrenfeld", "Südstadt"],
  },
];

export const roleDescriptions = {
  Inhaber: "Sieht und ändert alles, inklusive Tarif und Rechnungen.",
  Manager: "Belege prüfen und buchen, Auswertungen sehen. Kein Zugriff auf den Tarif.",
  Mitarbeiter: "Nur Belege hochladen. Sieht keine Preise und keine Auswertungen.",
  Steuerberater: "Nur lesen und Stapel abholen. Kann nichts ändern.",
} as const;

export const accountingSettings = {
  skr: "SKR03",
  consultantNumber: "1234567",
  clientNumber: "54321",
  fiscalYearStart: "01.01.",
  advisor: {
    firm: "Kramer & Partner Steuerberatungsgesellschaft",
    contact: "Frau Kramer",
    email: "belege@kramer-partner.de",
    phone: "+49 221 998877",
  },
  accounts: [
    { category: "Wareneingang 7 %", account: "3100" },
    { category: "Wareneingang 19 %", account: "3300" },
    { category: "Pfandgelder (durchlaufend)", account: "3960" },
    { category: "Sonstiger Betriebsbedarf", account: "4980" },
    { category: "Energie", account: "4240" },
    { category: "Reinigung", account: "4250" },
  ],
};

export const legalSettings = {
  retentionYears: 10,
  legalMinimumYears: 8,
  dpaSignedOn: "2026-01-14",
  processingRegion: "EU (Frankfurt und Falkenstein)",
  subProcessors: [
    { name: "Hetzner Online GmbH", purpose: "Server und Objektspeicher", region: "Deutschland" },
    { name: "Anthropic (EU-Endpunkt)", purpose: "Belegerkennung", region: "EU" },
    { name: "Stripe Payments Europe", purpose: "Zahlungsabwicklung", region: "Irland" },
  ],
  documents: [
    { id: "doc-avv", label: "Auftragsverarbeitungsvertrag (AVV)", updatedOn: "2026-01-14" },
    { id: "doc-tom", label: "Technische und organisatorische Maßnahmen", updatedOn: "2026-01-14" },
    { id: "doc-vd", label: "Verfahrensdokumentation GoBD", updatedOn: "2026-06-02" },
    { id: "doc-agb", label: "Allgemeine Geschäftsbedingungen", updatedOn: "2025-11-30" },
  ],
};

export const onboardingQuestions = [
  {
    id: "seats",
    question: "Wie viele Sitzplätze hat der Betrieb?",
    hint: "Damit lassen sich Kosten je Sitzplatz vergleichen.",
    options: ["bis 30", "31 bis 60", "61 bis 120", "über 120"],
  },
  {
    id: "format",
    question: "Was beschreibt den Betrieb am besten?",
    hint: "Bestimmt die Vergleichsgruppe im Regionalvergleich.",
    options: ["Restaurant", "Café oder Bäckerei", "Bar", "Imbiss oder Lieferdienst"],
  },
  {
    id: "cuisine",
    question: "Welche Küche?",
    hint: "Wareneinsatz unterscheidet sich stark nach Küche.",
    options: ["Italienisch", "Deutsch", "Asiatisch", "Andere"],
  },
  {
    id: "days",
    question: "An wie vielen Tagen pro Woche ist geöffnet?",
    hint: "Normalisiert alle Wochenwerte.",
    options: ["5", "6", "7", "wechselnd"],
  },
];
