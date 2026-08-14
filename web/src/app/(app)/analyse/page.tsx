"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/page-header";
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
  ChartLegend,
  ChartLegendContent,
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
  formatMonthShort,
  formatThousands,
} from "@/lib/format";
import { categorySpend, monthlySpend } from "@/lib/mock/data";
import { findSupplier, priceTrends } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";
import { cn } from "@/lib/utils";

const chartConfig = {
  goods: { label: "Wareneinsatz", color: "var(--chart-1)" },
  pfand: { label: "Pfand", color: "var(--chart-2)" },
} satisfies ChartConfig;

const ranges = [
  { id: "3m", label: "3 Monate", months: 3 },
  { id: "6m", label: "6 Monate", months: 6 },
  { id: "12m", label: "Jahr", months: 12 },
];

export default function AnalysePage() {
  const { documents } = usePrototype();
  const [range, setRange] = React.useState("6m");

  const months = ranges.find((entry) => entry.id === range)?.months ?? 6;
  const series = monthlySpend.slice(-months);

  const bySupplier = new Map<string, number>();
  for (const document of documents) {
    const totals = documentTotals(document.lines);
    bySupplier.set(
      document.supplierId,
      (bySupplier.get(document.supplierId) ?? 0) + totals.goodsCents,
    );
  }
  const supplierRows = [...bySupplier.entries()]
    .map(([supplierId, cents]) => ({
      supplierId,
      name: findSupplier(supplierId).name,
      cents,
    }))
    .sort((a, b) => b.cents - a.cents);
  const supplierTotal = supplierRows.reduce((sum, row) => sum + row.cents, 0);

  const trends = priceTrends();

  return (
    <>
      <PageHeader
        title="Analyse"
        lead="Der Einkauf über die Zeit — nach Monat, Warengruppe und Lieferant. Alles aus geprüften Belegen, nichts geschätzt."
        actions={
          <div className="flex gap-1">
            {ranges.map((entry) => (
              <Button
                key={entry.id}
                size="sm"
                variant={range === entry.id ? "default" : "outline"}
                onClick={() => setRange(entry.id)}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Wareneinsatz und Pfand je Monat
          </CardTitle>
          <CardDescription>
            Pfand wird getrennt ausgewiesen — es ist kein Aufwand, sondern ein
            durchlaufender Posten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={series.map((entry) => ({
                month: formatMonthShort(entry.month),
                goods: entry.goodsCents / 100,
                pfand: entry.pfandCents / 100,
              }))}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
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
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {name === "goods" ? "Wareneinsatz" : "Pfand"}
                        </span>
                        <span className="tabular">
                          {formatEuro(Math.round(Number(value) * 100))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              {/* Two series always carry a legend — identity may never rest on colour memory. */}
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="goods"
                fill="var(--color-goods)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="pfand"
                fill="var(--color-pfand)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Nach Lieferant</CardTitle>
            <CardDescription>Alle erfassten Belege.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lieferant</TableHead>
                  <TableHead className="text-right">Wareneinsatz</TableHead>
                  <TableHead className="w-28 text-right">Anteil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierRows.map((row) => (
                  <TableRow key={row.supplierId}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatEuro(row.cents)}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground text-right">
                      {Math.round((row.cents / supplierTotal) * 100)} %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nach Warengruppe</CardTitle>
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
                        width: `${(entry.cents / categorySpend[0].cents) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preisentwicklung</CardTitle>
              <CardDescription>
                Je Basiseinheit, gegenüber Vormonat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trends.map((trend) => (
                <div
                  key={`${trend.catalogItemId}-${trend.supplierName}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {trend.catalogItemName}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular text-muted-foreground">
                      {formatEuro(trend.currentCents)}
                    </span>
                    <span
                      className={cn(
                        "tabular w-16 text-right font-medium",
                        trend.delta > 0 ? "text-warning" : "text-primary",
                      )}
                    >
                      {formatDelta(trend.delta)}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
