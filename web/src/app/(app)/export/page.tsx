"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Info } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatEuro } from "@/lib/format";
import { buildDatevRows, findSupplier, toExtfCsv } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";

export default function ExportPage() {
  const { documents, skr, setSkr, setDocumentStatus } = usePrototype();

  const exportable = documents.filter(
    (document) => document.status === "gebucht",
  );
  /** Everything bookable is in the batch unless it was explicitly taken out. */
  const [excluded, setExcluded] = React.useState<string[]>([]);
  const chosen = exportable.filter(
    (document) => !excluded.includes(document.id),
  );
  const rows = buildDatevRows(chosen);
  const total = rows.reduce((sum, row) => sum + row.umsatzCents, 0);

  const download = () => {
    const csv = toExtfCsv(rows, {
      consultantNumber: "1234567",
      clientNumber: "54321",
      year: 2026,
      from: "2026-08-01",
      to: "2026-08-31",
    });
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "EXTF_Buchungsstapel_2026-08.csv";
    anchor.click();
    URL.revokeObjectURL(url);

    for (const entry of chosen) setDocumentStatus(entry.id, "exportiert");
    toast.success("Buchungsstapel erzeugt", {
      description: `${rows.length} Buchungszeilen aus ${chosen.length} Belegen — bereit für DATEV Unternehmen Online.`,
    });
  };

  return (
    <>
      <PageHeader
        title="DATEV-Export"
        lead="Ein Buchungsstapel im EXTF-Format, wie ihn die Kanzlei erwartet. Pfand läuft auf ein eigenes Konto, 7 % und 19 % werden je Position getrennt."
        actions={
          <Button onClick={download} disabled={chosen.length === 0}>
            <Download />
            Stapel herunterladen
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-5 lg:order-1">
          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Belege im Stapel</CardTitle>
              <CardDescription>
                Nur gebuchte Belege werden exportiert. Nach dem Export sind sie
                gesperrt.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {exportable.length === 0 ? (
                <p className="text-muted-foreground px-6 py-8 text-sm">
                  Kein gebuchter Beleg vorhanden. Prüfe zuerst die offenen
                  Belege.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Lieferant</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Belegnummer
                      </TableHead>
                      <TableHead className="text-right">Datum</TableHead>
                      <TableHead className="text-right">Zeilen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportable.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Checkbox
                            checked={!excluded.includes(document.id)}
                            aria-label={`${findSupplier(document.supplierId).name} in den Stapel aufnehmen`}
                            onCheckedChange={(checked) =>
                              setExcluded((current) =>
                                checked
                                  ? current.filter((id) => id !== document.id)
                                  : [...current, document.id],
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {findSupplier(document.supplierId).name}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {document.number}
                        </TableCell>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {formatDate(document.date)}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {document.lines.length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Buchungszeilen</CardTitle>
              <CardDescription>
                So sieht der Stapel in DATEV aus — Vorschau vor dem Download.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Umsatz</TableHead>
                      <TableHead>S/H</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead>Gegenkonto</TableHead>
                      <TableHead>BU</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Belegfeld 1
                      </TableHead>
                      <TableHead className="min-w-[12rem]">
                        Buchungstext
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.konto}-${row.belegfeld1}-${index}`}>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {formatEuro(row.umsatzCents)}
                        </TableCell>
                        <TableCell>{row.sollHaben}</TableCell>
                        <TableCell className="tabular">
                          {row.konto}
                          <span className="text-muted-foreground ml-2 hidden text-xs lg:inline">
                            {row.kontoLabel}
                          </span>
                        </TableCell>
                        <TableCell className="tabular">
                          {row.gegenkonto}
                        </TableCell>
                        <TableCell className="tabular">
                          {row.buSchluessel}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">
                          {row.belegfeld1}
                        </TableCell>
                        <TableCell>{row.buchungstext}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skr">Kontenrahmen</Label>
                <Select
                  value={skr}
                  onValueChange={(value) =>
                    setSkr(value as "SKR03" | "SKR04")
                  }
                >
                  <SelectTrigger id="skr" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SKR03">SKR03</SelectItem>
                    <SelectItem value="SKR04">SKR04</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Die Kontenzuordnung unten zeigt SKR03. Die SKR04-Konten werden
                  vor dem ersten echten Export mit der Kanzlei abgestimmt.
                </p>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Format</dt>
                  <dd>
                    <Badge variant="outline" className="font-normal">
                      EXTF 700
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Zeitraum</dt>
                  <dd className="tabular">01.08.–31.08.2026</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Belege</dt>
                  <dd className="tabular">{chosen.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Buchungszeilen</dt>
                  <dd className="tabular">{rows.length}</dd>
                </div>
                <div className="flex justify-between gap-3 font-medium">
                  <dt>Summe</dt>
                  <dd className="tabular">{formatEuro(total)}</dd>
                </div>
              </dl>
              <Button
                className="w-full"
                onClick={download}
                disabled={chosen.length === 0}
              >
                <FileSpreadsheet />
                Stapel herunterladen
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Info />
            <AlertTitle>Vor dem ersten echten Export</AlertTitle>
            <AlertDescription>
              Der Kanzlei einmal einen Testexport schicken und die Kontenzuordnung
              bestätigen lassen. Das EXTF-Format ist versioniert und heikel.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </>
  );
}
