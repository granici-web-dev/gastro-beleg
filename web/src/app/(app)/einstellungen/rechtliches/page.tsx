import { Download, Lock } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { legalSettings } from "@/lib/mock/settings";

export default function RechtlichesPage() {
  return (
    <>
      <PageHeader
        title="Rechtliches"
        lead="Aufbewahrung, Verarbeitung und die Unterlagen, die Kanzlei oder Prüfer sehen wollen."
      />
      <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufbewahrung</CardTitle>
            <CardDescription>
              Gilt für Buchungsbelege. Jahresabschlüsse, Bücher und Inventare
              bleiben immer bei zehn Jahren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retention">Aufbewahrungsfrist in Jahren</Label>
              <Input
                id="retention"
                className="tabular w-32"
                defaultValue={String(legalSettings.retentionYears)}
              />
            </div>
            <Alert>
              <Lock />
              <AlertTitle>
                {legalSettings.legalMinimumYears} Jahre sind Pflicht,{" "}
                {legalSettings.retentionYears} Jahre unsere Voreinstellung
              </AlertTitle>
              <AlertDescription>
                Die gesetzliche Mindestfrist für Buchungsbelege beträgt acht
                Jahre (§ 147 AO, § 257 HGB). Wir halten zehn Jahre vor, weil
                eine noch nicht abgelaufene Festsetzungsfrist die Pflicht
                verlängern kann. Innerhalb der Frist lässt sich kein gebuchter
                Beleg löschen.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verarbeitung</CardTitle>
            <CardDescription>
              Wo die Daten liegen und wer sie im Auftrag verarbeitet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium">
                {legalSettings.processingRegion}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">AVV unterzeichnet</span>
              <span className="tabular">
                {formatDate(legalSettings.dpaSignedOn)}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              {legalSettings.subProcessors.map((processor) => (
                <div
                  key={processor.name}
                  className="rounded-md border p-3 text-sm"
                >
                  <p className="font-medium">{processor.name}</p>
                  <p className="text-muted-foreground">
                    {processor.purpose} — {processor.region}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Unterlagen</CardTitle>
          <CardDescription>
            Zum Herunterladen und Weitergeben an Kanzlei oder Prüfer.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokument</TableHead>
                <TableHead className="text-right">Stand</TableHead>
                <TableHead className="w-24 text-right">Datei</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legalSettings.documents.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.label}</TableCell>
                  <TableCell className="tabular text-right whitespace-nowrap">
                    {formatDate(entry.updatedOn)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
