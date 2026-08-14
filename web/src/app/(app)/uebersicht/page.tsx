"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, TypeBadge } from "@/components/domain-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { documentTotals } from "@/lib/domain";
import {
  formatDelta,
  formatEuro,
  formatDate,
  formatMonthShort,
  formatThousands,
} from "@/lib/format";
import { categorySpend, monthlySpend } from "@/lib/mock/data";
import { findSupplier, pfandBalance, priceTrends } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";

const chartConfig = {
  goods: { label: "Wareneinsatz", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function UebersichtPage() {
  const { documents, savingsEvents } = usePrototype();

  const openDocuments = documents.filter(
    (document) => document.status === "pruefung",
  );
  const savedThisYear = savingsEvents.reduce(
    (sum, event) => sum + event.amountCents,
    0,
  );
  const pfandTotal = pfandBalance(documents).reduce(
    (sum, entry) => sum + entry.cents,
    0,
  );

  const currentMonth = monthlySpend[monthlySpend.length - 1];
  const previousMonth = monthlySpend[monthlySpend.length - 2];
  const trends = priceTrends();
  const recent = [...documents]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 6);

  const chartData = monthlySpend.map((entry, index) => {
    const running = index === monthlySpend.length - 1;
    return {
      month: running
        ? `${formatMonthShort(entry.month)} (läuft)`
        : formatMonthShort(entry.month),
      goods: entry.goodsCents / 100,
      running,
    };
  });

  const categoryTotal = categorySpend.reduce(
    (sum, entry) => sum + entry.cents,
    0,
  );

  return (
    <>
      <PageHeader
        title="Übersicht"
        lead="Was der Einkauf diesen Monat kostet, wo die Preise gestiegen sind und was noch auf Prüfung wartet."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/export">Buchungsstapel erzeugen</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
        <StatCard
          label="Wareneinsatz August"
          value={formatEuro(currentMonth.goodsCents)}
          hint="1.–12. August 2026, ohne Pfand"
        />
        <StatCard
          label="Belege zu prüfen"
          value={String(openDocuments.length)}
          hint={
            openDocuments.length === 0
              ? "Nichts offen"
              : "Warten auf deine Bestätigung"
          }
          href="/belege"
        />
        <StatCard
          label="Gefundenes Geld"
          value={formatEuro(savedThisYear)}
          hint="Seit Jahresbeginn zurückgeholt"
          href="/ersparnis"
          tone="primary"
        />
        <StatCard
          label="Pfand-Saldo"
          value={formatEuro(pfandTotal)}
          hint="Kästen und Flaschen bei Lieferanten"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wareneinsatz pro Monat</CardTitle>
            <CardDescription>
              August läuft noch — verglichen wird erst zum Monatsende.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                {/*
                 * Without a value axis the only way to read a bar was to hover
                 * it — on a phone there is no hover at all.
                 */}
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(value: number) =>
                    `${formatThousands(value / 1000)} T€`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        formatEuro(Math.round(Number(value) * 100))
                      }
                    />
                  }
                />
                <Bar dataKey="goods" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {/*
                   * The running month is not comparable to six closed ones.
                   * Marked twice — lighter fill and a tick that says so —
                   * because colour alone is not a statement.
                   */}
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={
                        entry.running ? "var(--chart-4)" : "var(--color-goods)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Größte Preisänderungen</CardTitle>
            <CardDescription>
              Einkaufspreis je Basiseinheit gegenüber Vormonat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trends.slice(0, 5).map((trend) => (
              <div
                key={trend.catalogItemId}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {trend.catalogItemName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {trend.supplierName} — {formatEuro(trend.currentCents)}
                  </p>
                </div>
                <span
                  className={
                    trend.delta >= 0
                      ? "text-warning flex shrink-0 items-center gap-1 text-sm font-medium tabular"
                      : "text-primary flex shrink-0 items-center gap-1 text-sm font-medium tabular"
                  }
                >
                  {trend.delta >= 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {formatDelta(trend.delta)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Zuletzt eingegangen</CardTitle>
            <CardDescription>
              Belege aus Foto, E-Mail-Postfach und E-Rechnung.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead>Lieferant</TableHead>
                  <TableHead className="hidden sm:table-cell">Art</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((document) => {
                  const totals = documentTotals(document.lines);
                  return (
                    <TableRow key={document.id}>
                      <TableCell className="tabular hidden whitespace-nowrap sm:table-cell">
                        <Link
                          href={`/belege/${document.id}`}
                          className="hover:underline"
                        >
                          {formatDate(document.date)}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[12rem]">
                        <p className="tabular text-muted-foreground text-xs sm:hidden">
                          {formatDate(document.date)}
                        </p>
                        <Link
                          href={`/belege/${document.id}`}
                          className="block truncate hover:underline"
                        >
                          {findSupplier(document.supplierId).name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <TypeBadge type={document.type} />
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatEuro(totals.grossCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={document.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Einkauf nach Kategorie</CardTitle>
            <CardDescription>Laufendes Quartal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorySpend.map((entry) => (
              <div key={entry.category} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{entry.category}</span>
                  <span className="text-muted-foreground tabular">
                    {formatEuro(entry.cents)}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${(entry.cents / categoryTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-muted-foreground pt-1 text-xs">
              Vormonat: {formatEuro(previousMonth.goodsCents)} Wareneinsatz.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
