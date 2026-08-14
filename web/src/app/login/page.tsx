import Link from "next/link";
import { Camera, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const promises = [
  "14 Tage testen, 30 Belege, ohne Kreditkarte",
  "Alle Daten und die Erkennung bleiben in der EU",
  "DATEV-Export ab dem ersten Beleg",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-sidebar text-sidebar-foreground hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
            GB
          </span>
          <span className="font-semibold">GastroBeleg</span>
        </div>

        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold text-balance">
            Lieferschein fotografieren.
            <br />
            Fertig.
          </p>
          <p className="text-sidebar-foreground/70 mt-4 text-pretty">
            Preiskontrolle für deinen Einkauf und fertige Buchhaltung für deinen
            Steuerberater — ohne Systemwechsel.
          </p>
          <ul className="mt-8 space-y-3">
            {promises.map((promise) => (
              <li key={promise} className="flex items-start gap-3 text-sm">
                <span className="bg-sidebar-primary text-sidebar-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
                <span className="text-sidebar-foreground/85">{promise}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sidebar-foreground/50 text-xs">
          Impressum — AGB — Datenschutz — AVV
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
              GB
            </span>
            <span className="font-semibold">GastroBeleg</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Für dein Restaurant. Küche und Büro nutzen dieselben Belege.
          </p>

          <form className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="chef@trattoria-bellavista.de"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  href="/uebersicht"
                  className="text-muted-foreground text-xs hover:underline"
                >
                  Vergessen?
                </Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" />
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/uebersicht">Zu meinen Belegen</Link>
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              14 Tage kostenlos, keine Kreditkarte nötig
            </p>
          </form>

          <div className="mt-8 border-t pt-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/scan">
                <Camera />
                Ersten Beleg ohne Konto ausprobieren
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
