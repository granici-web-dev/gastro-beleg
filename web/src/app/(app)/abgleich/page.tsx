"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeftRight, MailWarning, ScanSearch } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatEuro, formatEuroSigned, formatQuantity } from "@/lib/format";
import { deviationCases } from "@/lib/mock/phase2";
import { findSupplier, reconcile } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";
import { cn } from "@/lib/utils";

const issueLabel = {
  menge: "Menge",
  preis: "Preis",
  fehlt: "Nicht geliefert",
  zusatz: "Nicht bestellt",
} as const;

export default function AbgleichPage() {
  const { documents, addSaving } = usePrototype();
  const [claimed, setClaimed] = React.useState<string[]>([]);

  const pairs = documents
    .filter(
      (document) => document.type === "Rechnung" && document.matchedDocumentId,
    )
    .map((invoice) => ({
      invoice,
      deliveryNote: documents.find(
        (entry) => entry.id === invoice.matchedDocumentId,
      ),
    }))
    .filter(
      (pair): pair is { invoice: (typeof documents)[number]; deliveryNote: (typeof documents)[number] } =>
        pair.deliveryNote !== undefined,
    );

  const unmatched = documents.filter(
    (document) => document.type === "Rechnung" && !document.matchedDocumentId,
  );

  const claim = (
    invoiceId: string,
    supplierId: string,
    deltaCents: number,
    supplierName: string,
  ) => {
    setClaimed((current) => [...current, invoiceId]);
    addSaving({
      id: `sav-${invoiceId}`,
      date: "2026-08-12",
      kind: "preisabweichung",
      supplierId,
      description: `Reklamation an ${supplierName} — Abweichung Lieferschein gegen Rechnung`,
      amountCents: Math.abs(deltaCents),
      documentId: invoiceId,
      confirmed: false,
    });
    toast.success("Reklamation vorbereitet", {
      description:
        "Die Mail an den Lieferanten liegt im Entwurf. Die eingehende Gutschrift wird automatisch zugeordnet.",
    });
  };

  return (
    <>
      <PageHeader
        title="Abgleich"
        lead="Was geliefert wurde gegen das, was berechnet wird. Genau hier verschwindet in Restaurants das Geld — Zeile für Zeile, nicht in großen Beträgen."
      />

      {pairs.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowLeftRight />
            </EmptyMedia>
            <EmptyTitle>Noch nichts zu vergleichen</EmptyTitle>
            <EmptyDescription>
              Sobald zu einem Lieferschein die passende Rechnung eingeht, wird
              beides automatisch gegenübergestellt.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {pairs.map(({ invoice, deliveryNote }) => {
            const rows = reconcile(deliveryNote, invoice);
            const problems = rows.filter((row) => row.issue !== null);
            const totalDelta = problems.reduce(
              (sum, row) => sum + row.deltaCents,
              0,
            );
            const supplier = findSupplier(invoice.supplierId);
            const isClaimed = claimed.includes(invoice.id);
            const caseId = deviationCases.find(
              (entry) => entry.invoiceNumber === invoice.number,
            )?.id;

            return (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{supplier.name}</CardTitle>
                      <CardDescription>
                        Rechnung {invoice.number} vom {formatDate(invoice.date)}{" "}
                        gegen Lieferschein {deliveryNote.number} vom{" "}
                        {formatDate(deliveryNote.date)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">
                          Zu viel berechnet
                        </p>
                        <p
                          className={cn(
                            "tabular text-lg font-semibold",
                            totalDelta > 0 ? "text-warning" : "text-primary",
                          )}
                        >
                          {formatEuroSigned(totalDelta)}
                        </p>
                      </div>
                      {caseId ? (
                        <Button asChild variant="outline">
                          <Link href={`/abgleich/${caseId}`}>Fall öffnen</Link>
                        </Button>
                      ) : null}
                      <Button
                        onClick={() =>
                          claim(
                            invoice.id,
                            invoice.supplierId,
                            totalDelta,
                            supplier.name,
                          )
                        }
                        disabled={isClaimed || problems.length === 0}
                      >
                        <MailWarning />
                        {isClaimed ? "Reklamiert" : "Reklamieren"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[14rem]">
                            Position
                          </TableHead>
                          <TableHead className="text-right">
                            Geliefert
                          </TableHead>
                          <TableHead className="text-right">
                            Berechnet
                          </TableHead>
                          <TableHead className="hidden text-right sm:table-cell">
                            Preis LS
                          </TableHead>
                          <TableHead className="hidden text-right sm:table-cell">
                            Preis RE
                          </TableHead>
                          <TableHead className="text-right">
                            Differenz
                          </TableHead>
                          <TableHead className="text-right">Befund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow
                            key={row.key}
                            className={cn(
                              row.issue !== null && "bg-warning-muted/40",
                            )}
                          >
                            <TableCell className="font-medium">
                              {row.description}
                            </TableCell>
                            <TableCell className="tabular text-right">
                              {row.deliveredQuantity === null
                                ? "—"
                                : `${formatQuantity(row.deliveredQuantity)} ${row.unit}`}
                            </TableCell>
                            <TableCell className="tabular text-right">
                              {row.invoicedQuantity === null
                                ? "—"
                                : `${formatQuantity(row.invoicedQuantity)} ${row.unit}`}
                            </TableCell>
                            <TableCell className="tabular hidden text-right sm:table-cell">
                              {row.deliveredUnitPrice === null
                                ? "—"
                                : formatEuro(row.deliveredUnitPrice)}
                            </TableCell>
                            <TableCell className="tabular hidden text-right sm:table-cell">
                              {row.invoicedUnitPrice === null
                                ? "—"
                                : formatEuro(row.invoicedUnitPrice)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "tabular text-right",
                                row.deltaCents > 0 && "text-warning font-medium",
                              )}
                            >
                              {row.deltaCents === 0
                                ? "—"
                                : formatEuroSigned(row.deltaCents)}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.issue ? (
                                <Badge className="bg-warning-muted text-warning font-medium">
                                  {issueLabel[row.issue]}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  stimmt
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {unmatched.length > 0 ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanSearch className="size-4" />
              Rechnungen ohne Lieferschein
            </CardTitle>
            <CardDescription>
              Ohne Lieferschein lässt sich nur der Preis prüfen, nicht die
              Menge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unmatched.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {findSupplier(document.supplierId).name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {document.number} — {formatDate(document.date)}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/belege/${document.id}`}>Beleg öffnen</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
