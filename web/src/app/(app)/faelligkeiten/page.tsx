"use client";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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
import { formatDate, formatEuro, formatPercent } from "@/lib/format";
import { dueInvoices } from "@/lib/mock/phase2";
import { findSupplier } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const TODAY = "2026-08-12";

const week = [
  { day: "Mo", date: "2026-08-10" },
  { day: "Di", date: "2026-08-11" },
  { day: "Mi", date: "2026-08-12" },
  { day: "Do", date: "2026-08-13" },
  { day: "Fr", date: "2026-08-14" },
  { day: "Sa", date: "2026-08-15" },
  { day: "So", date: "2026-08-16" },
];

function skontoCents(grossCents: number, percent: number | null): number {
  return percent === null ? 0 : Math.round(grossCents * percent);
}

export default function FaelligkeitenPage() {
  const open = dueInvoices.filter((invoice) => !invoice.paid);
  const totalOpen = open.reduce((sum, invoice) => sum + invoice.grossCents, 0);
  const skontoAvailable = open.reduce(
    (sum, invoice) => sum + skontoCents(invoice.grossCents, invoice.skontoPercent),
    0,
  );
  const expiringToday = open.filter(
    (invoice) => invoice.skontoUntil === TODAY,
  );

  return (
    <>
      <PageHeader
        title="Fälligkeiten und Skonto"
        lead="Skonto ist der billigste Rabatt, den es gibt — und der am häufigsten verfällt, weil niemand auf das Datum schaut."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard
          label="Offen"
          value={formatEuro(totalOpen)}
          hint="{open.length} Rechnungen"
        />
        <StatCard
          label="Skonto erreichbar"
          value={formatEuro(skontoAvailable)}
          hint="Bei Zahlung innerhalb der Frist"
          tone="primary"
        />
        <Card className={cn(expiringToday.length > 0 && "border-warning/40")}>
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.07em]">Verfällt heute</CardDescription>
            <CardTitle className="text-warning tabular text-[30px] leading-[39px]">
              {formatEuro(
                expiringToday.reduce(
                  (sum, invoice) =>
                    sum + skontoCents(invoice.grossCents, invoice.skontoPercent),
                  0,
                ),
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {expiringToday.length === 0
                ? "Nichts eilig"
                : "Heute überweisen, sonst weg"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Zahlwoche</CardTitle>
          <CardDescription>
            10. bis 16. August 2026 — was in diesen Tagen fällig wird.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const dueHere = open.filter(
                (invoice) => invoice.dueOn === day.date,
              );
              const skontoHere = open.filter(
                (invoice) => invoice.skontoUntil === day.date,
              );
              const isToday = day.date === TODAY;
              return (
                <div
                  key={day.date}
                  className={cn(
                    "min-h-24 rounded-md border p-2",
                    isToday && "border-primary bg-accent/50",
                  )}
                >
                  <p className="text-muted-foreground text-xs">
                    {day.day} {day.date.slice(8, 10)}.
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {skontoHere.map((invoice) => (
                      <p
                        key={`s-${invoice.id}`}
                        className="bg-warning-muted text-warning rounded px-1.5 py-0.5 text-[11px] leading-tight"
                      >
                        Skonto {findSupplier(invoice.supplierId).name.split(" ")[0]}
                      </p>
                    ))}
                    {dueHere.map((invoice) => (
                      <p
                        key={`d-${invoice.id}`}
                        className="bg-muted rounded px-1.5 py-0.5 text-[11px] leading-tight"
                      >
                        Fällig {formatEuro(invoice.grossCents)}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5 overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lieferant</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Belegnummer
                </TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-right">Fällig</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Skonto bis
                </TableHead>
                <TableHead className="text-right">Ersparnis</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dueInvoices.map((invoice) => {
                const saving = skontoCents(
                  invoice.grossCents,
                  invoice.skontoPercent,
                );
                const urgent = !invoice.paid && invoice.skontoUntil === TODAY;
                return (
                  <TableRow
                    key={invoice.id}
                    className={cn(urgent && "bg-warning-muted/40")}
                  >
                    <TableCell className="font-medium">
                      {findSupplier(invoice.supplierId).name}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {invoice.number}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatEuro(invoice.grossCents)}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatDate(invoice.dueOn)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular hidden text-right whitespace-nowrap md:table-cell",
                        urgent && "text-warning font-medium",
                      )}
                    >
                      {invoice.skontoUntil ? formatDate(invoice.skontoUntil) : "—"}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {invoice.skontoPercent ? (
                        <>
                          {formatEuro(saving)}
                          <span className="text-muted-foreground ml-1 text-xs">
                            {formatPercent(invoice.skontoPercent, 0)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.paid ? (
                        <Badge className="bg-success-muted text-primary font-medium">
                          Bezahlt
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm">
                          Als bezahlt markieren
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
