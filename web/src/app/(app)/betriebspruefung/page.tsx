"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Download, Lock, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatDate } from "@/lib/format";
import { auditExports, auditPackageContents } from "@/lib/mock/phase2";

export default function BetriebspruefungPage() {
  const [year, setYear] = React.useState("2026");
  const [building, setBuilding] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Betriebsprüfung"
        lead="Kommt die Prüfung, will der Prüfer die Daten in einer Form, die seine Software lesen kann. Das ist der Z3-Zugriff — Datenträgerüberlassung."
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-5 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paket erstellen</CardTitle>
              <CardDescription>
                Drei Schritte, danach liegt eine Datei bereit, die sich dem
                Prüfer übergeben lässt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Step
                number={1}
                title="Zeitraum wählen"
                body={
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026 (laufend)</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              <Step
                number={2}
                title="Inhalt prüfen"
                body={
                  <ul className="space-y-1.5 text-sm">
                    {auditPackageContents.map((entry) => (
                      <li key={entry} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        <span className="text-pretty">{entry}</span>
                      </li>
                    ))}
                  </ul>
                }
              />
              <Step
                number={3}
                title="Erzeugen und übergeben"
                body={
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      disabled={building}
                      onClick={() => {
                        setBuilding(true);
                        toast.success("Paket wird erzeugt", {
                          description:
                            "Sie bekommen eine Mail, sobald die Datei bereitliegt. Das dauert bei großen Zeiträumen einige Minuten.",
                        });
                      }}
                    >
                      <ShieldCheck />
                      Prüfungspaket für {year} erzeugen
                    </Button>
                    <span className="text-muted-foreground text-xs">
                      Wird verschlüsselt bereitgestellt, Link gilt 7 Tage
                    </span>
                  </div>
                }
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Frühere Pakete</CardTitle>
              <CardDescription>
                Jede Erzeugung wird protokolliert — auch das gehört zur
                Nachvollziehbarkeit.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead className="text-right">Erzeugt</TableHead>
                    <TableHead className="text-right">Belege</TableHead>
                    <TableHead className="text-right">Größe</TableHead>
                    <TableHead className="w-28 text-right">Datei</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditExports.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tabular font-medium">
                        {entry.period}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatDate(entry.createdOn)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {entry.documents}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {entry.sizeMb} MB
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download />
                          Laden
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5 lg:order-2">
          <Alert>
            <Lock />
            <AlertTitle>8 Jahre Pflicht, 10 Jahre bei uns</AlertTitle>
            <AlertDescription>
              Buchungsbelege müssen acht Jahre aufbewahrt werden. Wir halten
              zehn Jahre vor, weil eine noch offene Festsetzungsfrist die
              Pflicht verlängern kann. Jahresabschlüsse und Inventare bleiben
              ohnehin bei zehn Jahren.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Was der Prüfer sieht</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                Das Original jedes Belegs, unverändert seit dem Tag der
                Erfassung.
              </p>
              <p>
                Jede Korrektur mit Zeitpunkt, Person und altem Wert. Gelöscht
                wird nichts — falsche Buchungen werden storniert.
              </p>
              <p>
                Die Verfahrensdokumentation, die beschreibt, wie ein Beleg vom
                Foto zur Buchung wird.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="bg-primary text-primary-foreground tabular flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium">{title}</p>
        {body}
      </div>
    </div>
  );
}
