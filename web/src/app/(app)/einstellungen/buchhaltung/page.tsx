import { PageHeader } from "@/components/page-header";
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
import { accountingSettings } from "@/lib/mock/settings";

export default function BuchhaltungPage() {
  return (
    <>
      <PageHeader
        title="Buchhaltung"
        lead="Kontenzuordnung und DATEV-Zugang. Ein falsches Konto fällt erst im Jahresabschluss auf — deshalb steht hier nichts, was nicht mit der Kanzlei abgestimmt ist."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <Card className="overflow-hidden py-0 lg:order-1">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Kontenzuordnung</CardTitle>
          <CardDescription>
            Gilt für jeden Export. Änderungen bitte vorher mit der Kanzlei
            abstimmen — ein falsches Konto fällt erst im Jahresabschluss auf.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategorie</TableHead>
                <TableHead className="w-32">Konto</TableHead>
                <TableHead className="w-24 text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingSettings.accounts.map((entry) => (
                <TableRow key={entry.category}>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell className="tabular font-medium">
                    {entry.account}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ändern
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-5 lg:order-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DATEV-Zugang</CardTitle>
            <CardDescription>
              Beraternummer und Mandantennummer stehen im Kopf jeder
              EXTF-Datei.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skr">Kontenrahmen</Label>
              <Input id="skr" defaultValue={accountingSettings.skr} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="berater">Beraternummer</Label>
              <Input
                id="berater"
                className="tabular"
                defaultValue={accountingSettings.consultantNumber}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mandant">Mandantennummer</Label>
              <Input
                id="mandant"
                className="tabular"
                defaultValue={accountingSettings.clientNumber}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wj">Beginn Wirtschaftsjahr</Label>
              <Input
                id="wj"
                className="tabular"
                defaultValue={accountingSettings.fiscalYearStart}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Steuerberatung</CardTitle>
            <CardDescription>
              Bekommt jeden Monat den Stapel — lesend, ohne Änderungsrechte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium">{accountingSettings.advisor.firm}</p>
            <p className="text-muted-foreground">
              {accountingSettings.advisor.contact}
            </p>
            <p className="text-muted-foreground">
              {accountingSettings.advisor.email}
            </p>
            <p className="text-muted-foreground tabular">
              {accountingSettings.advisor.phone}
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
