"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, MailWarning, Send } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatEuro, formatEuroSigned } from "@/lib/format";
import { deviationCases } from "@/lib/mock/phase2";
import { findSupplier } from "@/lib/selectors";
import { supplierScores } from "@/lib/mock/data";
import { formatPercent } from "@/lib/format";

const statusLabel = {
  offen: "Offen",
  reklamiert: "Reklamiert",
  "gutschrift-erwartet": "Gutschrift erwartet",
  erledigt: "Erledigt",
} as const;

export default function AbweichungPage({
  params,
}: PageProps<"/abgleich/[id]">) {
  const { id } = React.use(params);
  const entry = deviationCases.find((deviation) => deviation.id === id);
  const [sent, setSent] = React.useState(false);

  if (!entry) {
    return (
      <Alert>
        <AlertTriangle />
        <AlertTitle>Fall nicht gefunden</AlertTitle>
        <AlertDescription>
          <Link href="/abgleich" className="underline">
            Zurück zum Abgleich
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const supplier = findSupplier(entry.supplierId);
  const score = supplierScores.find(
    (item) => item.supplierId === entry.supplierId,
  );

  const draft = `Sehr geehrte Damen und Herren,

bei Rechnung ${entry.invoiceNumber} vom ${formatDate(entry.date)} weichen die berechneten Positionen vom Lieferschein ${entry.deliveryNoteNumber} ab:

${entry.positions
  .map(
    (position) =>
      `- ${position.description}: ${position.expected}, ${position.invoiced} (${formatEuro(position.deltaCents)})`,
  )
  .join("\n")}

Wir bitten um eine Gutschrift über ${formatEuro(entry.amountCents)}.

Mit freundlichen Grüßen
Trattoria Bellavista`;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/abgleich">
          <ArrowLeft />
          Abgleich
        </Link>
      </Button>

      <PageHeader
        title={`Abweichung bei ${supplier.name}`}
        lead={`Rechnung ${entry.invoiceNumber} gegen Lieferschein ${entry.deliveryNoteNumber}`}
        actions={
          <>
            <Badge className="bg-warning-muted text-warning font-medium">
              {statusLabel[entry.status]}
            </Badge>
            <span className="tabular text-warning text-xl font-semibold">
              {formatEuroSigned(entry.amountCents)}
            </span>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5 lg:order-1">
          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Betroffene Positionen</CardTitle>
              <CardDescription>
                Alles andere auf der Rechnung stimmt und wird nicht angefasst.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Lieferschein
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Rechnung
                    </TableHead>
                    <TableHead className="text-right">Differenz</TableHead>
                    <TableHead className="text-right">Art</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.positions.map((position) => (
                    <TableRow key={position.description}>
                      <TableCell className="font-medium">
                        {position.description}
                        <p className="text-muted-foreground text-xs sm:hidden">
                          {position.expected} — {position.invoiced}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {position.expected}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {position.invoiced}
                      </TableCell>
                      <TableCell className="tabular text-warning text-right font-medium whitespace-nowrap">
                        {formatEuroSigned(position.deltaCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-normal">
                          {position.kind === "menge" ? "Menge" : "Preis"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reklamation</CardTitle>
              <CardDescription>
                Fertiger Entwurf. Die eingehende Gutschrift wird automatisch
                diesem Fall zugeordnet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                defaultValue={draft}
                rows={14}
                className="font-mono text-xs"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={sent}
                  onClick={() => {
                    setSent(true);
                    toast.success("Reklamation versendet", {
                      description: `An ${supplier.name}. Der Fall steht jetzt auf „Gutschrift erwartet".`,
                    });
                  }}
                >
                  <Send />
                  {sent ? "Versendet" : "Reklamation senden"}
                </Button>
                <Button variant="outline">Als PDF speichern</Button>
                <span className="text-muted-foreground text-xs">
                  Geht an {supplier.name}, {supplier.city}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verlauf</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entry.history.map((event) => (
                <div key={event.label} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground tabular shrink-0">
                    {formatDate(event.date)}
                  </span>
                  <span>{event.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {score ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Rückblick auf {supplier.name}
                </CardTitle>
                <CardDescription>
                  Kein Einzelfall oder doch? Das entscheidet den Ton des
                  Gesprächs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Belege insgesamt" value={String(score.documents)} />
                <Row
                  label="Anteil mit Abweichung"
                  value={formatPercent(score.mismatchRate, 0)}
                />
                <Row
                  label="Offene Fälle"
                  value={String(score.openClaims)}
                />
                <Separator />
                <Row label="Bewertung" value={`${score.score} von 100`} />
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/dossier">
                    <MailWarning />
                    Verhandlungsdossier öffnen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
