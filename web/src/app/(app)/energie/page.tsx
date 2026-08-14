"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Droplets, Flame, Zap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  formatDelta,
  formatEuro,
  formatMonthShort,
  formatQuantity,
  formatThousands,
} from "@/lib/format";
import { energyCosts, energySeries } from "@/lib/mock/phase2";

const chartConfig = {
  strom: { label: "Strom (kWh)", color: "var(--chart-1)" },
  gas: { label: "Gas (kWh)", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function EnergiePage() {
  const current = energySeries[energySeries.length - 1];
  const previous = energySeries[energySeries.length - 2];

  const stromCost = current.stromKwh * energyCosts.stromCentsPerKwh;
  const gasCost = current.gasKwh * energyCosts.gasCentsPerKwh;
  const wasserCost = current.wasserM3 * energyCosts.wasserCentsPerM3;

  return (
    <>
      <PageHeader
        title="Energie"
        lead="Strom, Gas und Wasser aus den Abrechnungen — und der Verbrauch, der auch dann läuft, wenn niemand da ist."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <MeterCard
          icon={<Zap className="size-4" />}
          label="Strom"
          value={`${formatThousands(current.stromKwh)} kWh`}
          cost={formatEuro(stromCost)}
          delta={(current.stromKwh - previous.stromKwh) / previous.stromKwh}
        />
        <MeterCard
          icon={<Flame className="size-4" />}
          label="Gas"
          value={`${formatThousands(current.gasKwh)} kWh`}
          cost={formatEuro(gasCost)}
          delta={(current.gasKwh - previous.gasKwh) / previous.gasKwh}
        />
        <MeterCard
          icon={<Droplets className="size-4" />}
          label="Wasser"
          value={`${formatThousands(current.wasserM3)} m³`}
          cost={formatEuro(wasserCost)}
          delta={(current.wasserM3 - previous.wasserM3) / previous.wasserM3}
        />
      </div>

      <Alert className="border-warning/30 bg-warning-muted text-warning [&>svg]:text-warning mt-4">
        <Zap />
        <AlertTitle>
          Nachts laufen dauerhaft {formatQuantity(energyCosts.nightBaseLoadKw)} kW
        </AlertTitle>
        <AlertDescription className="text-warning/90">
          Zwischen 2 und 5 Uhr sinkt der Verbrauch nie unter diesen Wert. Das
          sind {formatEuro(energyCosts.nightBaseLoadCostCents)} im Jahr. Typische
          Ursachen: eine alte Kühlzelle mit defekter Türdichtung, die
          Dunstabzugshaube im Dauerlauf, oder Beleuchtung ohne Zeitschaltung.
        </AlertDescription>
      </Alert>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Verbrauch je Monat</CardTitle>
          <CardDescription>
            Gas fällt im Sommer, Strom steigt — das ist die Kühlung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              data={energySeries.map((entry) => ({
                month: formatMonthShort(entry.month),
                strom: entry.stromKwh,
                gas: entry.gasKwh,
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
                width={48}
                tickFormatter={(value: number) => formatThousands(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* Two series always carry a legend. */}
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="strom"
                fill="var(--color-strom)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="gas"
                fill="var(--color-gas)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 max-w-prose text-sm text-pretty">
        Die Werte stammen aus den Abrechnungen der Versorger, nicht aus einem
        Messgerät. Für die Nachtgrundlast wird der Lastgang des Stromanbieters
        ausgewertet, sofern er ihn liefert.
      </p>
    </>
  );
}

function MeterCard({
  icon,
  label,
  value,
  cost,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  cost: string;
  delta: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em]">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="tabular text-[30px] leading-[39px]">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-baseline justify-between gap-2">
        <p className="text-muted-foreground text-xs">{cost} im Monat</p>
        <p
          className={
            delta > 0
              ? "text-warning tabular text-xs font-medium"
              : "text-primary tabular text-xs font-medium"
          }
        >
          {formatDelta(delta, 0)}
        </p>
      </CardContent>
    </Card>
  );
}
