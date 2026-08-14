"use client";

import Link from "next/link";
import { AlertTriangle, QrCode, ScanLine } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { formatEuro, formatPercent } from "@/lib/format";
import { dishes } from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

export default function SpeisekartePage() {
  const drafts = dishes.filter((dish) => dish.status === "entwurf");
  const unconfirmedAllergens = dishes.filter((dish) => !dish.allergensConfirmed);

  return (
    <>
      <PageHeader
        title="Speisekarte"
        lead="Die Karte als Katalog: jedes Gericht mit Preis, Wareneinsatz und Allergenen. Grundlage für Marge, QR-Karte und jede Preisdiskussion."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/qr-karte">
                <QrCode />
                QR-Karte
              </Link>
            </Button>
            <Button size="sm">
              <ScanLine />
              Karte scannen
            </Button>
          </>
        }
      />

      {unconfirmedAllergens.length > 0 ? (
        <Alert className="border-warning/30 bg-warning-muted text-warning [&>svg]:text-warning mb-4">
          <AlertTriangle />
          <AlertTitle>
            {unconfirmedAllergens.length} Gerichte ohne bestätigte Allergene
          </AlertTitle>
          <AlertDescription className="text-warning/90">
            Allergenangaben sind immer nur ein Vorschlag und müssen von der
            Küche bestätigt werden. Ändert sich eine Zutat, gilt das Gericht
            wieder als ungeprüft — solange erscheint es nicht in der Gastansicht.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[14rem]">Gericht</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Kategorie
                  </TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-right">Wareneinsatz</TableHead>
                  <TableHead className="text-right">Quote</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Verkauft
                  </TableHead>
                  <TableHead className="text-right">Allergene</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishes.map((dish) => {
                  const ratio = dish.foodCostCents / dish.priceCents;
                  return (
                    <TableRow
                      key={dish.id}
                      className={cn(dish.status === "entwurf" && "bg-warning-muted/40")}
                    >
                      <TableCell className="font-medium">
                        {dish.name}
                        {dish.status === "entwurf" ? (
                          <Badge
                            variant="outline"
                            className="border-warning/40 text-warning ml-2 font-normal"
                          >
                            Entwurf
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {dish.category}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatEuro(dish.priceCents)}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatEuro(dish.foodCostCents)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular text-right",
                          ratio > 0.35 && "text-warning font-medium",
                        )}
                      >
                        {formatPercent(ratio, 0)}
                      </TableCell>
                      <TableCell className="tabular hidden text-right md:table-cell">
                        {dish.soldLastMonth}
                      </TableCell>
                      <TableCell className="text-right">
                        {dish.allergensConfirmed ? (
                          <Badge className="bg-success-muted text-primary font-medium">
                            bestätigt
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm">
                            Bestätigen
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Entwürfe aus dem letzten Scan
            </CardTitle>
            <CardDescription>
              Bei unklarem Preis oder unklarer Zutat bleibt das Gericht ein
              Entwurf. Geraten wird nicht.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {drafts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Keine offenen Entwürfe.
              </p>
            ) : (
              drafts.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{dish.name}</span>
                  <Button variant="outline" size="sm">
                    Prüfen
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Der nächste Schritt</CardTitle>
            <CardDescription>
              Aus der Karte wird erst dann eine Marge, wenn zu jedem Gericht
              eine Rezeptur hinterlegt ist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/marge">Zur Marge je Gericht</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
