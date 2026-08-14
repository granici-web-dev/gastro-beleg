"use client";

import * as React from "react";
import { Info, QrCode, Sparkles } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatEuro } from "@/lib/format";
import { dishes } from "@/lib/mock/phase2";

export default function QrKartePage() {
  const [showPrices, setShowPrices] = React.useState(true);
  const [showImages, setShowImages] = React.useState(true);

  const visible = dishes.filter(
    (dish) => dish.status === "bestaetigt" && dish.allergensConfirmed,
  );
  const hidden = dishes.length - visible.length;

  const categories = [...new Set(visible.map((dish) => dish.category))];

  return (
    <>
      <PageHeader
        title="QR-Karte"
        lead="Die Karte, die der Gast am Tisch sieht. Sie hängt an denselben Gerichten wie die Marge — steigt der Einkaufspreis, ist der neue Preis einen Klick entfernt."
        actions={
          <Button size="sm" variant="outline">
            <QrCode />
            QR-Code herunterladen
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Darstellung</CardTitle>
              <CardDescription>
                Gilt sofort für alle Gäste, die den Code scannen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="prices" className="font-normal">
                  Preise anzeigen
                </Label>
                <Switch
                  id="prices"
                  checked={showPrices}
                  onCheckedChange={setShowPrices}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="images" className="font-normal">
                  Bilder anzeigen
                </Label>
                <Switch
                  id="images"
                  checked={showImages}
                  onCheckedChange={setShowImages}
                />
              </div>
              <div className="flex items-center justify-between gap-3 opacity-60">
                <Label htmlFor="ai-label" className="font-normal">
                  KI-Bilder kennzeichnen
                </Label>
                <Switch id="ai-label" checked disabled />
              </div>
              <p className="text-muted-foreground text-xs text-pretty">
                Die Kennzeichnung lässt sich nicht abschalten. Sie ist seit dem
                02.08.2026 Pflicht (AI Act Art. 50) und trifft den Betrieb als
                Betreiber, nicht uns.
              </p>
            </CardContent>
          </Card>

          <Alert>
            <Info />
            <AlertTitle>
              {hidden} Gerichte erscheinen nicht in der Gastansicht
            </AlertTitle>
            <AlertDescription>
              Entwürfe und Gerichte ohne bestätigte Allergene bleiben
              ausgeblendet. Eine Karte, die falsche Allergene zeigt, ist
              teurer als eine Karte, auf der ein Gericht fehlt.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilder</CardTitle>
              <CardDescription>
                Ein KI-Bild darf nur zeigen, was tatsächlich serviert wird
                (Art. 7 LMIV, § 5 UWG).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Sparkles />
                Bild erzeugen lassen
              </Button>
              <Button variant="outline" size="sm">
                Eigenes Foto hochladen
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:order-2">
          <CardHeader>
            <CardTitle className="text-base">Gastansicht</CardTitle>
            <CardDescription>So sieht es auf dem Telefon aus.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-sidebar text-sidebar-foreground mx-auto w-full max-w-xs overflow-hidden rounded-2xl">
              <div className="p-5">
                <p className="text-lg font-semibold">Trattoria Bellavista</p>
                <p className="text-sidebar-foreground/60 text-xs">
                  Venloer Straße 214, Köln
                </p>
              </div>
              <div className="bg-background text-foreground space-y-5 rounded-t-2xl p-5">
                {categories.map((category) => (
                  <div key={category}>
                    <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                      {category}
                    </p>
                    <div className="space-y-3">
                      {visible
                        .filter((dish) => dish.category === category)
                        .map((dish) => (
                          <div key={dish.id} className="flex gap-3">
                            {showImages ? (
                              <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md text-[9px]">
                                Foto
                              </span>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-medium">
                                  {dish.name}
                                </span>
                                {showPrices ? (
                                  <span className="tabular shrink-0 text-sm">
                                    {formatEuro(dish.priceCents)}
                                  </span>
                                ) : null}
                              </div>
                              {showImages ? (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-[10px] font-normal"
                                >
                                  KI-generiertes Bild
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                <p className="text-muted-foreground border-t pt-3 text-[11px] text-pretty">
                  Angaben zu Allergenen erhalten Sie auf Nachfrage beim
                  Personal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
