import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const promises = [
  "30 Belege kostenlos, keine Kreditkarte",
  "Kein Systemwechsel — die Kasse bleibt, wie sie ist",
  "Kündbar zum Monatsende, Daten bleiben exportierbar",
];

export default function RegistrierenPage() {
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
            14 Tage testen.
            <br />
            Ohne Karte.
          </p>
          <p className="text-sidebar-foreground/70 mt-4 text-pretty">
            Der erste Beleg ist in zwei Minuten drin. Danach wissen Sie, ob sich
            das für Ihren Betrieb rechnet.
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Konto anlegen
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ein Konto je Betrieb. Weitere Nutzer laden Sie danach ein.
          </p>

          <form className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Betrieb</Label>
              <Input id="company" placeholder="Trattoria Bellavista" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Ihr Name</Label>
              <Input id="name" autoComplete="name" placeholder="Marco Ferrante" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="chef@betrieb.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
              />
              <p className="text-muted-foreground text-xs">
                Mindestens 10 Zeichen.
              </p>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/onboarding">Kostenlos starten</Link>
            </Button>
            <p className="text-muted-foreground text-center text-xs text-pretty">
              Mit dem Anlegen des Kontos gelten AGB und Datenschutzerklärung.
              Den AVV stellen wir zur Unterschrift bereit.
            </p>
          </form>

          <p className="text-muted-foreground mt-8 border-t pt-6 text-center text-sm">
            Schon ein Konto?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
