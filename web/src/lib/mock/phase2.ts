import type { Cents } from "@/lib/domain";

export interface DeviationCase {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  deliveryNoteNumber: string;
  date: string;
  status: "offen" | "reklamiert" | "gutschrift-erwartet" | "erledigt";
  amountCents: Cents;
  positions: {
    description: string;
    kind: "menge" | "preis";
    expected: string;
    invoiced: string;
    deltaCents: Cents;
  }[];
  history: { date: string; label: string }[];
}

export const deviationCases: DeviationCase[] = [
  {
    id: "abw-19",
    supplierId: "sup-kohl",
    invoiceNumber: "RE-2026-8801",
    deliveryNoteNumber: "LS-2026-7742",
    date: "2026-08-10",
    status: "offen",
    amountCents: 2356,
    positions: [
      {
        description: "Pils Kiste 24x0,33",
        kind: "menge",
        expected: "5 Kst geliefert",
        invoiced: "6 Kst berechnet",
        deltaCents: 1690,
      },
      {
        description: "Mineralwasser Classic 12x0,75",
        kind: "preis",
        expected: "5,19 € laut Lieferschein",
        invoiced: "5,49 € berechnet",
        deltaCents: 240,
      },
      {
        description: "Pfand Kästen",
        kind: "menge",
        expected: "13 Stk",
        invoiced: "14 Stk",
        deltaCents: 330,
      },
      {
        description: "Pfand Flaschen",
        kind: "menge",
        expected: "156 Stk",
        invoiced: "168 Stk",
        deltaCents: 96,
      },
    ],
    history: [
      { date: "2026-08-10", label: "Rechnung eingegangen, Abweichung erkannt" },
      { date: "2026-08-06", label: "Lieferschein erfasst (PDF)" },
    ],
  },
  {
    id: "abw-18",
    supplierId: "sup-brandt",
    invoiceNumber: "RE 2026/0788",
    deliveryNoteNumber: "LS 2026/0774",
    date: "2026-07-30",
    status: "gutschrift-erwartet",
    amountCents: 3216,
    positions: [
      {
        description: "Hähnchenbrustfilet",
        kind: "menge",
        expected: "9,6 kg geliefert",
        invoiced: "12,0 kg berechnet",
        deltaCents: 3216,
      },
    ],
    history: [
      { date: "2026-08-03", label: "Gutschrift GS 2026/0044 eingegangen" },
      { date: "2026-07-31", label: "Reklamation per Mail versendet" },
      { date: "2026-07-30", label: "Abweichung erkannt" },
    ],
  },
];

export interface CreditNote {
  id: string;
  supplierId: string;
  reason: string;
  expectedCents: Cents;
  receivedCents: Cents | null;
  requestedOn: string;
  receivedOn: string | null;
  documentNumber: string | null;
}

export const creditNotes: CreditNote[] = [
  {
    id: "gs-4",
    supplierId: "sup-brandt",
    reason: "Fehlmenge Hähnchenbrust 2,4 kg",
    expectedCents: 3216,
    receivedCents: 3216,
    requestedOn: "2026-07-31",
    receivedOn: "2026-08-03",
    documentNumber: "GS 2026/0044",
  },
  {
    id: "gs-3",
    supplierId: "sup-gruenhof",
    reason: "Verdorbene Rispentomaten, 2 Kisten",
    expectedCents: 2280,
    receivedCents: 1140,
    requestedOn: "2026-07-19",
    receivedOn: "2026-07-27",
    documentNumber: "GS-2026-0211",
  },
  {
    id: "gs-2",
    supplierId: "sup-kohl",
    reason: "Nicht gutgeschriebene Leerkästen",
    expectedCents: 7590,
    receivedCents: null,
    requestedOn: "2026-07-05",
    receivedOn: null,
    documentNumber: null,
  },
  {
    id: "gs-1",
    supplierId: "sup-metro",
    reason: "Doppelt berechnete Rechnung MR-2026-55118",
    expectedCents: 28_940,
    receivedCents: 28_940,
    requestedOn: "2026-07-24",
    receivedOn: "2026-07-29",
    documentNumber: "MR-2026-55190",
  },
];

export interface PosImport {
  id: string;
  month: string;
  fileLabel: string;
  cashRegister: string;
  revenueCents: Cents;
  receipts: number;
  importedOn: string;
}

export const posImports: PosImport[] = [
  {
    id: "pos-7",
    month: "2026-07",
    fileLabel: "DSFinV-K_2026-07.zip",
    cashRegister: "ready2order",
    revenueCents: 6_842_100,
    receipts: 1834,
    importedOn: "2026-08-02",
  },
  {
    id: "pos-6",
    month: "2026-06",
    fileLabel: "DSFinV-K_2026-06.zip",
    cashRegister: "ready2order",
    revenueCents: 6_411_800,
    receipts: 1721,
    importedOn: "2026-07-02",
  },
  {
    id: "pos-5",
    month: "2026-05",
    fileLabel: "DSFinV-K_2026-05.tar",
    cashRegister: "ready2order",
    revenueCents: 5_988_400,
    receipts: 1602,
    importedOn: "2026-06-03",
  },
];

export const posBrands = [
  { name: "ready2order", hint: "Backoffice → Berichte → DSFinV-K, Zeitraum wählen" },
  { name: "Lightspeed / Gastrofix", hint: "Reports → Exporte → DSFinV-K, Download als ZIP" },
  { name: "orderbird", hint: "MY orderbird → Umsätze → DSFinV-K-Export" },
  { name: "Vectron", hint: "Nur lokal am Kassenrechner — Datei danach am PC hochladen" },
  { name: "ExpressKasse", hint: "Nur lokal am Kassenrechner — Datei danach am PC hochladen" },
  { name: "Sharp", hint: "Nur lokal am Kassenrechner — Datei danach am PC hochladen" },
];

export const foodCostMonths = [
  { month: "2026-02", revenueCents: 5_412_000, goodsCents: 1_684_300 },
  { month: "2026-03", revenueCents: 5_784_000, goodsCents: 1_812_500 },
  { month: "2026-04", revenueCents: 5_602_000, goodsCents: 1_744_900 },
  { month: "2026-05", revenueCents: 5_988_400, goodsCents: 1_968_200 },
  { month: "2026-06", revenueCents: 6_411_800, goodsCents: 2_104_700 },
  { month: "2026-07", revenueCents: 6_842_100, goodsCents: 2_231_400 },
];

export const foodCostByGroup = [
  { group: "Fleisch", goodsCents: 764_200, revenueShare: 0.31 },
  { group: "Molkerei", goodsCents: 412_800, revenueShare: 0.14 },
  { group: "Gemüse", goodsCents: 338_500, revenueShare: 0.12 },
  { group: "Getränke", goodsCents: 297_100, revenueShare: 0.27 },
  { group: "Trockenware", goodsCents: 186_400, revenueShare: 0.09 },
  { group: "Backwaren", goodsCents: 132_400, revenueShare: 0.07 },
];

export interface DueInvoice {
  id: string;
  supplierId: string;
  number: string;
  grossCents: Cents;
  dueOn: string;
  skontoUntil: string | null;
  skontoPercent: number | null;
  paid: boolean;
}

export const dueInvoices: DueInvoice[] = [
  {
    id: "faell-1",
    supplierId: "sup-kohl",
    number: "RE-2026-8801",
    grossCents: 39_705,
    dueOn: "2026-08-24",
    skontoUntil: "2026-08-14",
    skontoPercent: 0.02,
    paid: false,
  },
  {
    id: "faell-2",
    supplierId: "sup-gruenhof",
    number: "2026-1188",
    grossCents: 16_607,
    dueOn: "2026-08-16",
    skontoUntil: "2026-08-13",
    skontoPercent: 0.03,
    paid: false,
  },
  {
    id: "faell-3",
    supplierId: "sup-sommer",
    number: "SO-2026-3312",
    grossCents: 18_554,
    dueOn: "2026-08-18",
    skontoUntil: null,
    skontoPercent: null,
    paid: false,
  },
  {
    id: "faell-4",
    supplierId: "sup-metro",
    number: "MR-2026-55401",
    grossCents: 20_805,
    dueOn: "2026-08-12",
    skontoUntil: "2026-08-12",
    skontoPercent: 0.02,
    paid: false,
  },
  {
    id: "faell-5",
    supplierId: "sup-brandt",
    number: "RE 2026/0788",
    grossCents: 42_180,
    dueOn: "2026-08-15",
    skontoUntil: null,
    skontoPercent: null,
    paid: true,
  },
];

export const whatsappThread = [
  {
    id: "wa-1",
    from: "kitchen" as const,
    time: "07:42",
    kind: "image" as const,
    body: "Lieferschein Brandt",
  },
  {
    id: "wa-2",
    from: "system" as const,
    time: "07:42",
    kind: "text" as const,
    body: "Lieferschein von Fleischerei Brandt erkannt, 4 Positionen. Zwei Zeilen sind unsicher — bitte am Rechner prüfen.",
  },
  {
    id: "wa-3",
    from: "kitchen" as const,
    time: "11:20",
    kind: "image" as const,
    body: "Metro Bon",
  },
  {
    id: "wa-4",
    from: "system" as const,
    time: "11:21",
    kind: "text" as const,
    body: "Kassenbeleg METRO, 370,84 € brutto. Achtung: Olivenöl ist 5,1 % teurer als beim letzten Einkauf.",
  },
  {
    id: "wa-5",
    from: "kitchen" as const,
    time: "18:03",
    kind: "text" as const,
    body: "Was hab ich diesen Monat für Fleisch ausgegeben?",
  },
  {
    id: "wa-6",
    from: "system" as const,
    time: "18:03",
    kind: "text" as const,
    body: "Im August bisher 2.184,60 € für Fleisch — 12 % mehr als im Juli bei gleicher Menge.",
  },
];

export const whatsappNumbers = [
  { number: "+49 171 2345678", label: "Küche (Marco)", role: "Nur hochladen" },
  { number: "+49 152 9988776", label: "Service (Lena)", role: "Nur hochladen" },
  { number: "+49 170 5544332", label: "Inhaber", role: "Alles" },
];

export const whatsappLanguages = [
  "Deutsch",
  "Englisch",
  "Türkisch",
  "Vietnamesisch",
  "Arabisch",
  "Russisch",
  "Polnisch",
];

export interface Contract {
  id: string;
  vendor: string;
  category: string;
  monthlyCents: Cents;
  changeSinceJanuary: number;
  noticePeriod: string;
  nextCancellation: string;
  detectedFrom: number;
}

export const contracts: Contract[] = [
  {
    id: "vtr-1",
    vendor: "Kassensystem ready2order",
    category: "Software",
    monthlyCents: 7900,
    changeSinceJanuary: 0.1,
    noticePeriod: "1 Monat",
    nextCancellation: "2026-09-30",
    detectedFrom: 7,
  },
  {
    id: "vtr-2",
    vendor: "Musikrechte GEMA",
    category: "Abgaben",
    monthlyCents: 5240,
    changeSinceJanuary: 0.04,
    noticePeriod: "3 Monate",
    nextCancellation: "2026-12-31",
    detectedFrom: 7,
  },
  {
    id: "vtr-3",
    vendor: "Wäscheservice Nolte",
    category: "Dienstleistung",
    monthlyCents: 24_800,
    changeSinceJanuary: 0.18,
    noticePeriod: "3 Monate",
    nextCancellation: "2026-11-30",
    detectedFrom: 7,
  },
  {
    id: "vtr-4",
    vendor: "Fettabscheider Wartung",
    category: "Wartung",
    monthlyCents: 6900,
    changeSinceJanuary: 0,
    noticePeriod: "1 Monat",
    nextCancellation: "2026-09-30",
    detectedFrom: 4,
  },
  {
    id: "vtr-5",
    vendor: "Internet und Telefon",
    category: "Kommunikation",
    monthlyCents: 4990,
    changeSinceJanuary: 0.25,
    noticePeriod: "3 Monate",
    nextCancellation: "2027-02-28",
    detectedFrom: 7,
  },
];

export const energySeries = [
  { month: "2026-02", stromKwh: 4120, gasKwh: 8900, wasserM3: 74 },
  { month: "2026-03", stromKwh: 3980, gasKwh: 7600, wasserM3: 71 },
  { month: "2026-04", stromKwh: 3840, gasKwh: 5400, wasserM3: 78 },
  { month: "2026-05", stromKwh: 4210, gasKwh: 3100, wasserM3: 82 },
  { month: "2026-06", stromKwh: 4560, gasKwh: 2400, wasserM3: 88 },
  { month: "2026-07", stromKwh: 4890, gasKwh: 2200, wasserM3: 94 },
];

export const energyCosts = {
  stromCentsPerKwh: 38,
  gasCentsPerKwh: 12,
  wasserCentsPerM3: 480,
  nightBaseLoadKw: 2.4,
  nightBaseLoadCostCents: 26_500,
};

export interface Platform {
  id: string;
  name: string;
  advertisedRate: number;
  ordersLastMonth: number;
  grossRevenueCents: Cents;
  commissionCents: Cents;
  otherFeesCents: Cents;
}

export const platforms: Platform[] = [
  {
    id: "plt-1",
    name: "Lieferando",
    advertisedRate: 0.14,
    ordersLastMonth: 214,
    grossRevenueCents: 612_400,
    commissionCents: 85_736,
    otherFeesCents: 95_200,
  },
  {
    id: "plt-2",
    name: "Wolt",
    advertisedRate: 0.13,
    ordersLastMonth: 96,
    grossRevenueCents: 288_100,
    commissionCents: 37_453,
    otherFeesCents: 41_800,
  },
];

export interface Dish {
  id: string;
  name: string;
  category: string;
  priceCents: Cents;
  foodCostCents: Cents;
  soldLastMonth: number;
  status: "bestaetigt" | "entwurf";
  allergensConfirmed: boolean;
}

export const dishes: Dish[] = [
  {
    id: "dish-1",
    name: "Spaghetti Carbonara",
    category: "Pasta",
    priceCents: 1690,
    foodCostCents: 412,
    soldLastMonth: 218,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
  {
    id: "dish-2",
    name: "Tagliatelle al Ragù",
    category: "Pasta",
    priceCents: 1790,
    foodCostCents: 528,
    soldLastMonth: 186,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
  {
    id: "dish-3",
    name: "Risotto ai Funghi",
    category: "Risotto",
    priceCents: 1890,
    foodCostCents: 604,
    soldLastMonth: 74,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
  {
    id: "dish-4",
    name: "Saltimbocca alla Romana",
    category: "Secondi",
    priceCents: 2490,
    foodCostCents: 1128,
    soldLastMonth: 52,
    status: "bestaetigt",
    allergensConfirmed: false,
  },
  {
    id: "dish-5",
    name: "Vitello Tonnato",
    category: "Antipasti",
    priceCents: 1690,
    foodCostCents: 742,
    soldLastMonth: 38,
    status: "entwurf",
    allergensConfirmed: false,
  },
  {
    id: "dish-6",
    name: "Insalata Caprese",
    category: "Antipasti",
    priceCents: 1290,
    foodCostCents: 486,
    soldLastMonth: 91,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
  {
    id: "dish-7",
    name: "Tiramisù",
    category: "Dolci",
    priceCents: 790,
    foodCostCents: 168,
    soldLastMonth: 142,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
  {
    id: "dish-8",
    name: "Hausgemachte Limonade",
    category: "Getränke",
    priceCents: 490,
    foodCostCents: 64,
    soldLastMonth: 206,
    status: "bestaetigt",
    allergensConfirmed: true,
  },
];

export const recipe = [
  { catalogItemId: "cat-guanciale", label: "Guanciale", quantity: 0.06, unit: "kg", costCents: 149 },
  { catalogItemId: "cat-parmesan", label: "Parmesan 24 Monate", quantity: 0.03, unit: "kg", costCents: 64 },
  { catalogItemId: "cat-mehl", label: "Weizenmehl Tipo 00", quantity: 0.12, unit: "kg", costCents: 22 },
  { catalogItemId: null, label: "Eier (2 Stück)", quantity: 2, unit: "Stk", costCents: 78 },
  { catalogItemId: "cat-olivenoel", label: "Olivenöl extra vergine", quantity: 0.01, unit: "l", costCents: 8 },
  { catalogItemId: null, label: "Pfeffer, Salz", quantity: 1, unit: "Portion", costCents: 6 },
];

export const auditPackageContents = [
  "Alle Originalbelege als PDF und Bilddatei, unverändert",
  "Strukturierte Buchungsdaten im DATEV-Format (Z3)",
  "Änderungsprotokoll je Beleg — wer, wann, was",
  "Verfahrensdokumentation zur Belegerfassung",
  "Index der Dateien mit Prüfsummen",
];

export const auditExports = [
  { id: "bp-2", period: "2025", createdOn: "2026-03-14", documents: 1842, sizeMb: 1240 },
  { id: "bp-1", period: "2024", createdOn: "2025-04-02", documents: 1613, sizeMb: 1080 },
];

export const dossier = {
  supplierId: "sup-metro",
  yearVolumeCents: 4_812_400,
  shareOfPurchasing: 0.38,
  priceChangeSinceJanuary: 0.062,
  regionMedianDelta: 0.09,
  topItems: [
    { name: "Rinderhackfleisch", volumeCents: 986_400, delta: 0.049 },
    { name: "Parmesan 24 Monate", volumeCents: 742_100, delta: 0.019 },
    { name: "Olivenöl extra vergine", volumeCents: 588_900, delta: 0.051 },
    { name: "Tomatenpassata", volumeCents: 412_600, delta: 0.012 },
  ],
  talkingPoints: [
    "Wir kaufen bei Ihnen seit Januar für 48.124 € — das sind 38 % unseres gesamten Einkaufs.",
    "Beim Olivenöl liegen wir 9 % über dem Median vergleichbarer Betriebe in NRW.",
    "Bei einer Zusage auf Jahrespreise für die vier Hauptartikel bleibt das Volumen bei Ihnen.",
  ],
};

export const kanzleiClients = [
  {
    id: "kz-1",
    name: "Trattoria Bellavista",
    city: "Köln",
    openDocuments: 3,
    lastBatch: "2026-08-01",
    status: "bereit" as const,
  },
  {
    id: "kz-2",
    name: "Café Morgenrot",
    city: "Köln",
    openDocuments: 0,
    lastBatch: "2026-08-05",
    status: "abgeholt" as const,
  },
  {
    id: "kz-3",
    name: "Osteria da Nino",
    city: "Bonn",
    openDocuments: 11,
    lastBatch: "2026-07-04",
    status: "rueckfrage" as const,
  },
  {
    id: "kz-4",
    name: "Bistro Nordwind",
    city: "Düsseldorf",
    openDocuments: 2,
    lastBatch: "2026-08-03",
    status: "bereit" as const,
  },
];

export const kanzleiQuestions = [
  {
    id: "rf-2",
    clientId: "kz-3",
    documentLabel: "MR-2026-55118",
    question: "Bewirtungsbeleg ohne Anlass — bitte Teilnehmer und Anlass ergänzen.",
    askedOn: "2026-08-07",
    answered: false,
  },
  {
    id: "rf-1",
    clientId: "kz-1",
    documentLabel: "2026-1141",
    question: "Ist die Position „Blumen“ betrieblich veranlasst?",
    askedOn: "2026-07-28",
    answered: true,
  },
];

export const weeklyDigest = {
  week: "32 / 2026",
  sentOn: "2026-08-10",
  recipients: ["chef@trattoria-bellavista.de", "buero@trattoria-bellavista.de"],
  blocks: [
    { id: "wb-1", label: "Wareneinsatz der Woche", enabled: true },
    { id: "wb-2", label: "Preissprünge über 5 %", enabled: true },
    { id: "wb-3", label: "Offene Abweichungen und Gutschriften", enabled: true },
    { id: "wb-4", label: "Rechnungen mit Skontofrist", enabled: true },
    { id: "wb-5", label: "Belege, die noch auf Prüfung warten", enabled: false },
    { id: "wb-6", label: "Vergleich mit der Vorwoche", enabled: true },
  ],
  summary: {
    goodsCents: 542_800,
    changeToPreviousWeek: 0.07,
    priceJumps: 3,
    openDeviations: 2,
    skontoAtRiskCents: 1_190,
  },
};
