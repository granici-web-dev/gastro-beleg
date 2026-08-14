"use client";

import { PiggyBank } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SavingsKind } from "@/lib/domain";
import { formatDate, formatEuro } from "@/lib/format";
import { TENANT } from "@/lib/mock/data";
import { findSupplier } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";

const kindLabel: Record<SavingsKind, string> = {
  preisabweichung: "Preisabweichung",
  fehlmenge: "Fehlmenge",
  doppelt: "Doppelbeleg",
  skonto: "Skonto",
  pfand: "Pfand",
};

export default function ErsparnisPage() {
  const { savingsEvents, confirmSaving } = usePrototype();

  const total = savingsEvents.reduce((sum, event) => sum + event.amountCents, 0);
  const confirmed = savingsEvents
    .filter((event) => event.confirmed)
    .reduce((sum, event) => sum + event.amountCents, 0);

  const byKind = new Map<SavingsKind, number>();
  for (const event of savingsEvents) {
    byKind.set(event.kind, (byKind.get(event.kind) ?? 0) + event.amountCents);
  }
  const ranked = [...byKind.entries()].sort((a, b) => b[1] - a[1]);

  const monthlyFee = 8900;

  return (
    <>
      <PageHeader
        title="Gefundenes Geld"
        lead="Jeder Alarm schreibt mit, was er wert war. Damit lässt sich die Frage beantworten, ob sich das Abo trägt."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="bg-primary text-primary-foreground lg:col-span-1">
          <CardHeader>
            <CardDescription className="text-primary-foreground/70">
              Seit Jahresbeginn zurückgeholt
            </CardDescription>
            <CardTitle className="tabular text-4xl">
              {formatEuro(total)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-primary-foreground/80">
              Davon bestätigt: {formatEuro(confirmed)}
            </p>
            <p className="text-primary-foreground/80">
              Das entspricht {(total / monthlyFee).toFixed(1).replace(".", ",")}{" "}
              Monatsbeiträgen im Tarif {TENANT.plan}.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Wo es herkommt</CardTitle>
            <CardDescription>
              Nach Art des Befunds, laufendes Jahr.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranked.map(([kind, cents]) => (
              <div key={kind} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{kindLabel[kind]}</span>
                  <span className="text-muted-foreground tabular">
                    {formatEuro(cents)}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-lime h-full rounded-full"
                    style={{ width: `${(cents / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[6.5rem]">Datum</TableHead>
                <TableHead className="hidden sm:table-cell">Art</TableHead>
                <TableHead>Befund</TableHead>
                <TableHead className="hidden md:table-cell">
                  Lieferant
                </TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingsEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="tabular whitespace-nowrap">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="font-normal">
                      {kindLabel[event.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[24rem]">
                    <span className="block truncate">{event.description}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {findSupplier(event.supplierId).name}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium whitespace-nowrap">
                    {formatEuro(event.amountCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    {event.confirmed ? (
                      <span className="text-primary inline-flex items-center gap-1 text-xs font-medium">
                        <PiggyBank className="size-3.5" />
                        bestätigt
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmSaving(event.id)}
                      >
                        Bestätigen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
