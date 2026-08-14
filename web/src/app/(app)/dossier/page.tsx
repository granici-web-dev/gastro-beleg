"use client";

import Link from "next/link";
import { ArrowLeft, Download, Quote } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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
import { formatDelta, formatEuro } from "@/lib/format";
import { dossier } from "@/lib/mock/phase2";
import { findSupplier } from "@/lib/selectors";
import { cn } from "@/lib/utils";

export default function DossierPage() {
  const supplier = findSupplier(dossier.supplierId);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/lieferanten">
          <ArrowLeft />
          Lieferanten
        </Link>
      </Button>

      <PageHeader
        title={`Verhandlungsdossier — ${supplier.name}`}
        lead="Was Sie im Gespräch brauchen: Ihr Volumen, die Preisentwicklung und der Vergleich mit der Region. Zahlen aus Ihren Belegen, keine Schätzungen."
        actions={
          <Button size="sm" variant="outline">
            <Download />
            Als PDF
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard
          label="Einkaufsvolumen im Jahr"
          value={formatEuro(dossier.yearVolumeCents)}
          hint="{formatPercent(dossier.shareOfPurchasing, 0)} Ihres gesamten Einkaufs"
        />
        <StatCard
          label="Preise seit Januar"
          value={formatDelta(dossier.priceChangeSinceJanuary)}
          hint="Gewichtet nach Einkaufsmenge"
          tone="warning"
        />
        <StatCard
          label="Gegenüber der Region"
          value={formatDelta(dossier.regionMedianDelta, 0)}
          hint="Über dem Median vergleichbarer Betriebe in NRW"
          tone="warning"
        />
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden py-0 lg:order-1">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Die vier größten Posten</CardTitle>
            <CardDescription>
              Über diese Artikel wird verhandelt, der Rest ist Beiwerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikel</TableHead>
                  <TableHead className="text-right">Volumen im Jahr</TableHead>
                  <TableHead className="text-right">Preisänderung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossier.topItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatEuro(item.volumeCents)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        item.delta > 0.03 && "text-warning font-medium",
                      )}
                    >
                      {formatDelta(item.delta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Quote className="size-4" />
              Drei Sätze für das Gespräch
            </CardTitle>
            <CardDescription>
              Vorformuliert, mit Ihren Zahlen. Umformulieren erlaubt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dossier.talkingPoints.map((point, index) => (
              <div key={point} className="bg-muted rounded-md p-3 text-sm">
                <span className="text-muted-foreground mr-2 text-xs">
                  {index + 1}
                </span>
                <span className="text-pretty">{point}</span>
              </div>
            ))}
            <p className="text-muted-foreground text-xs text-pretty">
              Der Regionalvergleich beruht auf anonymisierten Preisen anderer
              Betriebe. Kein Lieferant und kein Betrieb ist darin erkennbar.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
