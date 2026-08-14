"use client";

import { toast } from "sonner";
import { Info, Upload } from "lucide-react";

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
import { formatDate, formatEuro, formatMonth } from "@/lib/format";
import { posBrands, posImports } from "@/lib/mock/phase2";

export default function KassePage() {
  return (
    <>
      <PageHeader
        title="Kassendaten"
        lead="Jede deutsche Kasse muss seit 2020 einen DSFinV-K-Export können. Damit kommt der Umsatz ins System — ohne Anbindung an die Kasse, ohne Zugangsdaten."
        actions={
          <Button
            onClick={() =>
              toast.success("Kassenexport eingelesen", {
                description:
                  "August 2026: 1.204 Bons, 4.318.900 € Umsatz. Zählt als ein Beleg.",
              })
            }
          >
            <Upload />
            Export hochladen
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5 lg:order-1">
          <Card className="border-primary/30 bg-accent/40 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full">
                <Upload className="size-6" />
              </span>
              <p className="text-lg font-medium">DSFinV-K-Datei hierher ziehen</p>
              <p className="text-muted-foreground max-w-md text-sm text-pretty">
                ZIP oder TAR, wie die Kasse sie ausgibt. Die Datei wird nicht an
                ein Sprachmodell gegeben — sie ist strukturiert und wird direkt
                gelesen.
              </p>
              <Button variant="outline">Datei wählen</Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Eingelesene Monate</CardTitle>
              <CardDescription>
                Grundlage für die Wareneinsatz-Quote.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monat</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Datei
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Kasse</TableHead>
                    <TableHead className="text-right">Bons</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">
                      Eingelesen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posImports.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatMonth(entry.month)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">
                        {entry.fileLabel}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {entry.cashRegister}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {entry.receipts}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatEuro(entry.revenueCents)}
                      </TableCell>
                      <TableCell className="tabular hidden text-right whitespace-nowrap lg:table-cell">
                        {formatDate(entry.importedOn)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:order-2">
          <Alert>
            <Info />
            <AlertTitle>Ein Kassenexport zählt als ein Beleg</AlertTitle>
            <AlertDescription>
              Egal wie viele Bons darin stehen. Der Tarif ändert sich dadurch
              nicht.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Wo der Export in Ihrer Kasse liegt
              </CardTitle>
              <CardDescription>
                Bei drei Systemen geht es nur direkt am Kassenrechner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {posBrands.map((brand) => (
                <div key={brand.name} className="text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    {brand.name}
                    {brand.hint.startsWith("Nur lokal") ? (
                      <Badge variant="outline" className="font-normal">
                        nur lokal
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-pretty">
                    {brand.hint}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Was nicht importiert wird</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                Bedienernamen und Bediener-IDs werden verworfen. Wer wann
                kassiert hat, ist eine Personalangelegenheit und gehört nicht in
                die Kostenauswertung.
              </p>
              <p>
                Übernommen werden Artikel, Menge, Preis, Steuersatz und
                Warengruppe je Bonposition.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
