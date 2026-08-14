"use client";

import { Line, LineChart, YAxis } from "recharts";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDelta, formatEuro, formatPercent } from "@/lib/format";
import { supplierScores } from "@/lib/mock/data";
import { findSupplier, priceTrends } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const chartConfig = {
  price: { label: "Preis", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function LieferantenPage() {
  const ranked = [...supplierScores].sort((a, b) => b.score - a.score);
  const trends = priceTrends();

  return (
    <>
      <PageHeader
        title="Lieferanten"
        lead="Wer liefert, was er berechnet — und wessen Preise am schnellsten steigen. Die Grundlage für das nächste Gespräch."
      />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lieferant</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Belege
                </TableHead>
                <TableHead className="text-right">Abweichungen</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Preistrend
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Pünktlich
                </TableHead>
                <TableHead className="text-right">Offene Fälle</TableHead>
                <TableHead className="w-40">Bewertung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((entry) => {
                const supplier = findSupplier(entry.supplierId);
                return (
                  <TableRow key={entry.supplierId}>
                    <TableCell>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {supplier.city}
                        {supplier.sendsERechnung ? " — E-Rechnung" : ""}
                      </p>
                    </TableCell>
                    <TableCell className="tabular hidden text-right sm:table-cell">
                      {entry.documents}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        entry.mismatchRate > 0.1 && "text-warning font-medium",
                      )}
                    >
                      {formatPercent(entry.mismatchRate, 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular hidden text-right md:table-cell",
                        entry.avgPriceDelta > 0.05 && "text-warning font-medium",
                      )}
                    >
                      {formatDelta(entry.avgPriceDelta)}
                    </TableCell>
                    <TableCell className="tabular hidden text-right lg:table-cell">
                      {formatPercent(entry.onTimeRate, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.openClaims === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <Badge className="bg-warning-muted text-warning font-medium">
                          {entry.openClaims}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={entry.score} className="h-1.5" />
                        <span className="tabular w-8 text-right text-sm font-medium">
                          {entry.score}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <h2 className="mt-8 mb-3 text-sm font-medium">Preisverlauf je Artikel</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {trends.map((trend) => (
          <Card key={`${trend.catalogItemId}-${trend.supplierName}`}>
            <CardHeader className="pb-2">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.07em]">{trend.supplierName}</CardDescription>
              <CardTitle className="text-base">
                {trend.catalogItemName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="tabular text-lg font-semibold">
                  {formatEuro(trend.currentCents)}
                </span>
                <span
                  className={cn(
                    "tabular text-sm font-medium",
                    trend.delta > 0 ? "text-warning" : "text-primary",
                  )}
                >
                  {formatDelta(trend.delta)}
                </span>
              </div>
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <LineChart
                  data={trend.series.map((point) => ({
                    date: point.date,
                    price: point.unitPriceCents / 100,
                  }))}
                  margin={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  {/* Without a padded domain the line flattens against the floor. */}
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          formatEuro(Math.round(Number(value) * 100))
                        }
                      />
                    }
                  />
                  <Line
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
