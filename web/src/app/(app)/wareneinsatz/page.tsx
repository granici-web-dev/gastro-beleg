"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/page-header";
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
import {
  formatEuro,
  formatMonth,
  formatMonthShort,
  formatPercent,
} from "@/lib/format";
import { foodCostByGroup, foodCostMonths } from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

const chartConfig = {
  ratio: { label: "Wareneinsatz-Quote", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Übliche Spanne in der Vollgastronomie. Kein Gesetz, aber ein brauchbares Band. */
const BAND = { low: 0.28, high: 0.35 };

export default function WareneinsatzPage() {
  const series = foodCostMonths.map((entry) => ({
    ...entry,
    ratio: entry.goodsCents / entry.revenueCents,
  }));
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  const inBand = current.ratio >= BAND.low && current.ratio <= BAND.high;

  return (
    <>
      <PageHeader
        title="Wareneinsatz"
        lead="Einkauf gegen Umsatz aus der Kasse. Ohne Kassendaten wäre das eine Schätzung — mit ihnen ist es eine Zahl."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription>Quote im {formatMonth(current.month)}</CardDescription>
            <CardTitle
              className={cn(
                "tabular text-4xl",
                inBand ? "text-primary" : "text-warning",
              )}
            >
              {formatPercent(current.ratio)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="bg-muted relative h-3 w-full overflow-hidden rounded-full">
                <div
                  className="bg-success-muted absolute inset-y-0"
                  style={{
                    left: `${BAND.low * 100}%`,
                    width: `${(BAND.high - BAND.low) * 100}%`,
                  }}
                />
                <div
                  className={cn(
                    "absolute inset-y-0 w-1 rounded-full",
                    inBand ? "bg-primary" : "bg-warning",
                  )}
                  style={{ left: `${current.ratio * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Übliches Band {formatPercent(BAND.low, 0)} bis{" "}
                {formatPercent(BAND.high, 0)} in der Vollgastronomie.
              </p>
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Umsatz" value={formatEuro(current.revenueCents)} />
              <Row label="Wareneinsatz" value={formatEuro(current.goodsCents)} />
              <Row
                label="Vormonat"
                value={formatPercent(previous.ratio)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Verlauf</CardTitle>
            <CardDescription>
              Sechs Monate. Sprünge nach oben haben meist zwei Gründe: Preise
              oder Schwund.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart
                data={series.map((entry) => ({
                  month: formatMonthShort(entry.month),
                  ratio: Number((entry.ratio * 100).toFixed(1)),
                }))}
                margin={{ left: 4, right: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[25, 40]}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value) => `${value} %`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${String(value).replace(".", ",")} %`}
                    />
                  }
                />
                <Line
                  dataKey="ratio"
                  stroke="var(--color-ratio)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Nach Warengruppe</CardTitle>
          <CardDescription>
            Der Anteil am Umsatz zeigt, wo eine Preisänderung wirklich weh tut.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warengruppe</TableHead>
                <TableHead className="text-right">Einkauf</TableHead>
                <TableHead className="text-right">Anteil am Umsatz</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodCostByGroup.map((entry) => (
                <TableRow key={entry.group}>
                  <TableCell className="font-medium">{entry.group}</TableCell>
                  <TableCell className="tabular text-right whitespace-nowrap">
                    {formatEuro(entry.goodsCents)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatPercent(entry.revenueShare, 0)}
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${entry.revenueShare * 100 * 2.5}%` }}
                      />
                    </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{value}</dd>
    </div>
  );
}
