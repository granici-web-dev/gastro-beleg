"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  Link2,
  Lock,
  Trash2,
} from "lucide-react";

import {
  ConfidenceDot,
  PfandBadge,
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from "@/components/domain-badges";
import { MapProductDialog } from "@/components/map-product-dialog";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  PRICE_JUMP_THRESHOLD,
  documentTotals,
  expectedLineTotalCents,
  lineMathIsOff,
  type BelegDocument,
  type DocumentLine,
  type SupplierProductMapping,
  type VatRate,
} from "@/lib/domain";
import {
  formatAmount,
  formatDate,
  formatDelta,
  formatEuro,
  formatQuantity,
  parseCents,
  parseQuantity,
} from "@/lib/format";
import { priceHistory } from "@/lib/mock/data";
import { findCatalogItem, findSupplier } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function BelegDetailPage({
  params,
}: PageProps<"/belege/[id]">) {
  const { id } = React.use(params);
  const router = useRouter();
  const { documents, mappings, updateLine, removeLine, setDocumentStatus } =
    usePrototype();

  const document = documents.find((entry) => entry.id === id);
  const [mapping, setMapping] = React.useState<DocumentLine | null>(null);

  if (!document) {
    return (
      <Alert>
        <FileWarning />
        <AlertTitle>Beleg nicht gefunden</AlertTitle>
        <AlertDescription>
          Der Beleg wurde gelöscht oder der Prototyp wurde zurückgesetzt.
          <Link href="/belege" className="ml-1 underline">
            Zur Belegliste
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const supplier = findSupplier(document.supplierId);
  const totals = documentTotals(document.lines);
  const locked = document.status === "gebucht" || document.status === "exportiert";
  const issues = collectIssues(document, documents, mappings);

  /*
   * The line editors are shared by the table (tablet and up) and the card list
   * (phones). Plain functions rather than components on purpose: a component
   * declared inside this render would be a new type on every keystroke, remount
   * NumberCell and throw away the caret mid-edit.
   */
  const descriptionField = (line: DocumentLine) => {
    const catalogItem = findCatalogItem(line.catalogItemId);
    return (
      <div className="flex items-start gap-2">
        <span className="mt-1.5">
          <ConfidenceDot confidence={line.confidence} />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{line.rawDescription}</p>
          {line.isPfand ? (
            <p className="text-muted-foreground text-xs">
              Pfand — kein Wareneinsatz
            </p>
          ) : catalogItem ? (
            <button
              type="button"
              disabled={locked}
              onClick={() => setMapping(line)}
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline disabled:no-underline"
            >
              {catalogItem.name}
            </button>
          ) : (
            <Button
              variant="link"
              size="xs"
              disabled={locked}
              className="text-warning h-auto p-0"
              onClick={() => setMapping(line)}
            >
              <Link2 />
              Produkt zuordnen
            </Button>
          )}
        </div>
      </div>
    );
  };

  const quantityField = (line: DocumentLine) => (
    <NumberCell
      value={formatQuantity(line.quantity)}
      disabled={locked}
      onCommit={(raw) => {
        const quantity = parseQuantity(raw);
        if (quantity === null) return false;
        updateLine(document.id, line.id, { quantity });
        return true;
      }}
    />
  );

  const priceField = (line: DocumentLine) => (
    <NumberCell
      value={formatAmount(line.unitPriceCents)}
      disabled={locked}
      onCommit={(raw) => {
        const unitPriceCents = parseCents(raw);
        if (unitPriceCents === null) return false;
        updateLine(document.id, line.id, { unitPriceCents });
        return true;
      }}
    />
  );

  const totalField = (line: DocumentLine) => (
    <>
      <NumberCell
        value={formatAmount(line.totalCents)}
        disabled={locked}
        invalid={lineMathIsOff(line)}
        onCommit={(raw) => {
          const totalCents = parseCents(raw);
          if (totalCents === null) return false;
          updateLine(document.id, line.id, { totalCents });
          return true;
        }}
      />
      {lineMathIsOff(line) ? (
        <button
          type="button"
          disabled={locked}
          onClick={() =>
            updateLine(document.id, line.id, {
              totalCents: expectedLineTotalCents(line),
            })
          }
          className="text-warning mt-1 block w-full text-right text-xs underline-offset-2 hover:underline"
        >
          {formatAmount(expectedLineTotalCents(line))} übernehmen
        </button>
      ) : null}
    </>
  );

  const vatField = (line: DocumentLine) => (
    <Select
      value={String(line.vatRate)}
      disabled={locked}
      onValueChange={(value) =>
        updateLine(document.id, line.id, {
          vatRate: Number(value) as VatRate,
        })
      }
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 %</SelectItem>
        <SelectItem value="19">19 %</SelectItem>
        <SelectItem value="0">0 %</SelectItem>
      </SelectContent>
    </Select>
  );

  const pfandField = (line: DocumentLine) =>
    locked ? (
      line.isPfand ? (
        <PfandBadge />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    ) : (
      <Switch
        checked={line.isPfand}
        aria-label="Als Pfand kennzeichnen"
        onCheckedChange={(isPfand) =>
          updateLine(document.id, line.id, { isPfand })
        }
      />
    );

  const removeField = (line: DocumentLine) => (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={locked}
      aria-label="Position entfernen"
      onClick={() => removeLine(document.id, line.id)}
    >
      <Trash2 />
    </Button>
  );

  const book = () => {
    setDocumentStatus(document.id, "gebucht");
    toast.success("Beleg gebucht", {
      description:
        "Original und Änderungsprotokoll liegen unveränderbar im GoBD-Archiv.",
    });
    router.push("/belege");
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/belege">
          <ArrowLeft />
          Belege
        </Link>
      </Button>

      <PageHeader
        title={supplier.name}
        lead={`${document.type} ${document.number} vom ${formatDate(document.date)}`}
        actions={
          <>
            <StatusBadge status={document.status} />
            {locked ? (
              <Badge variant="outline" className="gap-1 font-normal">
                <Lock className="size-3" />
                GoBD-gesperrt
              </Badge>
            ) : (
              /*
               * A disabled primary action has to say what unblocks it —
               * otherwise the screen looks broken rather than guarded.
               */
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Button onClick={book} disabled={issues.blocking.length > 0}>
                  <CheckCircle2 />
                  Beleg buchen
                </Button>
                <p className="text-muted-foreground max-w-[22ch] text-xs text-pretty sm:text-right">
                  {issues.blocking.length > 0
                    ? "Erst die blockierenden Hinweise erledigen"
                    : "Original bleibt unverändert im Archiv"}
                </p>
              </div>
            )}
          </>
        }
      />

      {/*
       * One panel, not one banner per finding: three stacked alerts of the same
       * shape cost 140px above the positions and read as noise. Severity lives
       * in the icon colour, blocking items come first.
       */}
      {issues.blocking.length > 0 || issues.warnings.length > 0 ? (
        <Card className="mb-5 gap-0 py-0">
          <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
            <p className="font-medium">
              {issues.blocking.length > 0
                ? "Vor dem Buchen erledigen"
                : "Bitte gegen das Original prüfen"}
            </p>
            <p className="text-muted-foreground text-xs">
              {issues.blocking.length + issues.warnings.length} Hinweise
            </p>
          </div>
          <ul className="divide-y border-t">
            {[
              ...issues.blocking.map((issue) => ({
                issue,
                blocking: true,
              })),
              ...issues.warnings.map((issue) => ({
                issue,
                blocking: false,
              })),
            ].map(({ issue, blocking }) => (
              <li key={issue.title} className="flex gap-3 px-5 py-3">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    blocking ? "text-destructive" : "text-warning",
                  )}
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {issue.title}
                    {/* Burnt orange and dark red are near-identical at 16px —
                        blocking has to be readable, not just coloured. */}
                    {blocking ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 text-destructive gap-0 px-1.5 text-[11px] font-medium"
                      >
                        Blockiert das Buchen
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                    {issue.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_18rem]">
        <Card className="gap-0 overflow-hidden py-0 xl:order-1">
          <CardHeader className="gap-1 border-b py-4">
            <CardTitle className="text-base">Positionen</CardTitle>
            <CardDescription>
              Werte stammen aus dem Beleg. Was du hier korrigierst, lernt das
              System für den nächsten Beleg desselben Lieferanten.
            </CardDescription>
            {/* The dot in front of each line needs decoding exactly once. */}
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <span className="bg-warning inline-block size-2 shrink-0 rounded-full" />
              unsicher erkannt — gegen das Original prüfen
            </p>
          </CardHeader>
          <CardContent className="px-0">
            {/* Tablet and up: one row per position. */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[14rem]">Bezeichnung</TableHead>
                    <TableHead className="w-28 text-right">Menge</TableHead>
                    <TableHead className="w-16">Einheit</TableHead>
                    <TableHead className="w-28 text-right">Preis</TableHead>
                    <TableHead className="w-28 text-right">Summe</TableHead>
                    <TableHead className="w-20">USt</TableHead>
                    <TableHead className="w-16">Pfand</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {document.lines.map((line) => (
                    <TableRow
                      key={line.id}
                      className={cn(
                        line.confidence < CONFIDENCE_REVIEW_THRESHOLD &&
                          "bg-warning-muted/40",
                      )}
                    >
                      <TableCell className="align-top whitespace-normal">
                        {descriptionField(line)}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        {quantityField(line)}
                      </TableCell>
                      <TableCell className="text-muted-foreground align-top text-sm">
                        {line.unit}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        {priceField(line)}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        {totalField(line)}
                      </TableCell>
                      <TableCell className="align-top">
                        {vatField(line)}
                      </TableCell>
                      <TableCell className="align-top">
                        {pfandField(line)}
                      </TableCell>
                      <TableCell className="align-top">
                        {removeField(line)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/*
             * Phone: a row of eight columns is 800px wide and unusable with a
             * thumb, so each position becomes a card. Same editors, same store.
             */}
            <ul className="divide-y md:hidden">
              {document.lines.map((line) => (
                <li
                  key={line.id}
                  className={cn(
                    "space-y-4 px-4 py-4",
                    line.confidence < CONFIDENCE_REVIEW_THRESHOLD &&
                      "bg-warning-muted/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    {descriptionField(line)}
                    {removeField(line)}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <LineField label={`Menge (${line.unit})`}>
                      {quantityField(line)}
                    </LineField>
                    <LineField label="Preis">{priceField(line)}</LineField>
                    <LineField label="Summe">{totalField(line)}</LineField>
                    <LineField label="USt">{vatField(line)}</LineField>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.07em] uppercase">
                      Pfand
                    </span>
                    {pfandField(line)}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4 xl:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {totals.vatByRate.map((bucket) => (
                <div key={bucket.rate} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    Netto {bucket.rate} %
                  </span>
                  <span className="tabular">{formatEuro(bucket.netCents)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Wareneinsatz</span>
                <span className="tabular">{formatEuro(totals.goodsCents)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Pfand</span>
                <span className="tabular">{formatEuro(totals.pfandCents)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Umsatzsteuer</span>
                <span className="tabular">{formatEuro(totals.vatCents)}</span>
              </div>
              <Separator />
              <div className="flex justify-between gap-4 text-base font-semibold">
                <span>Brutto</span>
                <span className="tabular">{formatEuro(totals.grossCents)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original</CardTitle>
              <CardDescription>
                Unveränderbar archiviert, Aufbewahrung 10 Jahre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-muted text-muted-foreground flex aspect-[3/4] items-center justify-center rounded-md border border-dashed text-xs">
                {document.fileLabel}
              </div>
              <dl className="space-y-1.5">
                <Row label="Quelle">
                  <SourceBadge source={document.source} />
                </Row>
                <Row label="Art">
                  <TypeBadge type={document.type} />
                </Row>
                <Row label="Seiten">
                  <span className="tabular">{document.pageCount}</span>
                </Row>
                <Row label="USt-IdNr.">
                  <span className="tabular">{supplier.ustId ?? "—"}</span>
                </Row>
              </dl>
              {document.matchedDocumentId ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/abgleich">
                    <Link2 />
                    Zum Abgleich
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {mapping ? (
        <MapProductDialog
          open={mapping !== null}
          onOpenChange={(open) => {
            if (!open) setMapping(null);
          }}
          supplierId={document.supplierId}
          rawString={mapping.rawDescription}
          articleNo={mapping.articleNo}
        />
      ) : null}
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** A labelled editor in the phone layout — the table header is gone there. */
function LineField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-[0.07em] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberCell({
  value,
  onCommit,
  disabled,
  invalid,
}: {
  value: string;
  onCommit: (raw: string) => boolean;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [draft, setDraft] = React.useState(value);
  const [committed, setCommitted] = React.useState(value);

  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  if (disabled) {
    return <span className="tabular text-sm">{value}</span>;
  }

  return (
    <Input
      value={draft}
      inputMode="decimal"
      aria-invalid={invalid}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (!onCommit(draft)) setDraft(value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="tabular h-9 w-full min-w-[4.75rem] px-2 text-right"
    />
  );
}

interface Issue {
  title: string;
  body: string;
}

function collectIssues(
  document: BelegDocument,
  allDocuments: BelegDocument[],
  mappings: SupplierProductMapping[],
): { blocking: Issue[]; warnings: Issue[] } {
  const blocking: Issue[] = [];
  const warnings: Issue[] = [];

  const duplicate = allDocuments.find(
    (other) =>
      other.id !== document.id &&
      other.supplierId === document.supplierId &&
      other.number === document.number,
  );
  if (duplicate) {
    blocking.push({
      title: "Möglicher Doppelbeleg",
      body: `Belegnummer ${document.number} liegt bei diesem Lieferanten bereits vor. Buchen ist gesperrt, bis der Fall geklärt ist.`,
    });
  }

  const unmapped = document.lines.filter(
    (line) => !line.isPfand && line.catalogItemId === null,
  );
  if (unmapped.length > 0) {
    blocking.push({
      title: `${unmapped.length} Position${unmapped.length === 1 ? "" : "en"} ohne Produktzuordnung`,
      body: "Ohne Zuordnung landet der Betrag nicht in der Kostenauswertung und nicht auf dem richtigen DATEV-Konto.",
    });
  }

  const offLines = document.lines.filter(lineMathIsOff);
  if (offLines.length > 0) {
    warnings.push({
      title: "Rechenfehler in einer Position",
      body: `Menge mal Einzelpreis ergibt nicht die gedruckte Summe — betroffen: ${offLines
        .map((line) => line.rawDescription)
        .join(", ")}.`,
    });
  }

  const lowConfidence = document.lines.filter(
    (line) => line.confidence < CONFIDENCE_REVIEW_THRESHOLD,
  );
  if (lowConfidence.length > 0) {
    warnings.push({
      title: `${lowConfidence.length} Position${lowConfidence.length === 1 ? "" : "en"} unsicher erkannt`,
      body: "Handschrift oder schlechte Aufnahme. Die markierten Zeilen bitte gegen das Original prüfen.",
    });
  }

  for (const line of document.lines) {
    if (!line.catalogItemId || line.isPfand) continue;
    const series = priceHistory
      .filter(
        (point) =>
          point.catalogItemId === line.catalogItemId &&
          point.supplierId === document.supplierId,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    if (series.length < 2) continue;

    // The history is per base unit; the line carries the supplier's pack price.
    const mapping = mappings.find(
      (entry) =>
        entry.supplierId === document.supplierId &&
        entry.rawString === line.rawDescription,
    );
    if (!mapping || mapping.conversionFactor <= 0) continue;
    const baseUnitPriceCents = Math.round(
      line.unitPriceCents / mapping.conversionFactor,
    );

    const last = series[series.length - 2].unitPriceCents;
    const delta = (baseUnitPriceCents - last) / last;
    if (Math.abs(delta) > PRICE_JUMP_THRESHOLD) {
      warnings.push({
        title: `Preissprung bei ${line.rawDescription}`,
        body: `${formatDelta(delta)} gegenüber dem zuletzt bekannten Preis dieses Lieferanten.`,
      });
    }
  }

  return { blocking, warnings };
}
