"use client";

import { Info } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatEuro, formatPercent } from "@/lib/format";
import { platforms } from "@/lib/mock/phase2";

export default function PlattformenPage() {
  const rows = platforms.map((platform) => {
    const totalFees = platform.commissionCents + platform.otherFeesCents;
    return {
      ...platform,
      totalFees,
      effectiveRate: totalFees / platform.grossRevenueCents,
      netCents: platform.grossRevenueCents - totalFees,
      perOrderFeeCents: Math.round(totalFees / platform.ordersLastMonth),
    };
  });

  const grossAll = rows.reduce((sum, row) => sum + row.grossRevenueCents, 0);
  const feesAll = rows.reduce((sum, row) => sum + row.totalFees, 0);

  return (
    <>
      <PageHeader
        title="Lieferplattformen"
        lead="Beworben wird die Provision. Bezahlt wird die Provision plus Service-, Zahlungs- und Werbekosten. Der Unterschied entscheidet, ob sich eine Bestellung überhaupt lohnt."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard
          label="Umsatz über Plattformen"
          value={formatEuro(grossAll)}
          hint="Letzter Monat"
        />
        <StatCard
          label="Einbehalten"
          value={formatEuro(feesAll)}
          hint="Provision, Gebühren, Werbung"
          tone="warning"
        />
        <StatCard
          label="Effektive Rate"
          value={formatPercent(feesAll / grossAll)}
          hint="Beworben werden 13 bis 14 %"
          tone="warning"
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <CardTitle className="text-base">{row.name}</CardTitle>
              <CardDescription>
                {row.ordersLastMonth} Bestellungen im letzten Monat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Beworbene Provision
                  </span>
                  <span className="tabular">
                    {formatPercent(row.advertisedRate, 0)}
                  </span>
                </div>
                <Progress value={row.advertisedRate * 100 * 2.5} />
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">Tatsächlich einbehalten</span>
                  <span className="tabular text-warning font-medium">
                    {formatPercent(row.effectiveRate)}
                  </span>
                </div>
                <Progress
                  value={row.effectiveRate * 100 * 2.5}
                  className="[&>div]:bg-warning"
                />
              </div>

              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Bruttoumsatz
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatEuro(row.grossRevenueCents)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Provision
                    </TableCell>
                    <TableCell className="tabular text-right">
                      −{formatEuro(row.commissionCents)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Service, Zahlung, Werbung
                    </TableCell>
                    <TableCell className="tabular text-right">
                      −{formatEuro(row.otherFeesCents)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ausgezahlt</TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatEuro(row.netCents)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Je Bestellung einbehalten
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatEuro(row.perOrderFeeCents)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert className="mt-5">
        <Info />
        <AlertTitle>Was hier nicht steht</AlertTitle>
        <AlertDescription>
          Die Abrechnungen der Plattformen enthalten keine Positionen je
          Gericht. Deshalb lässt sich sagen, was eine Bestellung im Schnitt
          kostet — aber nicht, welches Gericht sich über die Plattform lohnt.
          Dafür bräuchte es den Bon aus der Kasse.
        </AlertDescription>
      </Alert>
    </>
  );
}
