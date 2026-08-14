import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { businessProfile } from "@/lib/mock/settings";

export default function BetriebPage() {
  return (
    <>
      <PageHeader
        title="Betrieb"
        lead="Firmierung, Standorte und die vier Angaben zum Betriebsprofil, ohne die sich später keine Kennzahl vergleichen lässt."
      />
      <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firmierung</CardTitle>
          <CardDescription>
            Steht so auf jeder Rechnung und im DATEV-Export.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Rechtlicher Name" value={businessProfile.legalName} wide />
          <Field label="Betriebsname" value={businessProfile.tradeName} wide />
          <Field label="Straße" value={businessProfile.street} />
          <Field label="PLZ und Ort" value={`${businessProfile.zip} ${businessProfile.city}`} />
          <Field label="USt-IdNr." value={businessProfile.ustId} />
          <Field label="Steuernummer" value={businessProfile.taxNumber} />
          <Field label="Registergericht" value={businessProfile.registerCourt} wide />
          <Field label="Geschäftsführung" value={businessProfile.managingDirector} wide />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standorte</CardTitle>
            <CardDescription>
              Jeder Standort hat eine eigene Auswertung, die Buchhaltung bleibt
              gemeinsam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {businessProfile.locations.map((location) => (
              <div
                key={location.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {location.name}
                    {location.isMain ? (
                      <Badge variant="outline" className="font-normal">
                        Hauptstandort
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {location.street}, {location.city}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Bearbeiten
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm">
              Standort hinzufügen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Betriebsprofil</CardTitle>
            <CardDescription>
              Diese vier Angaben normalisieren jede spätere Kennzahl — ohne sie
              lässt sich nichts vergleichen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Sitzplätze" value={String(businessProfile.seats)} />
            <Field
              label="Öffnungstage je Woche"
              value={String(businessProfile.openingDays)}
            />
            <Field label="Küche" value={businessProfile.cuisine} />
            <Field label="Betriebsform" value="Restaurant" />
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={value} />
    </div>
  );
}
