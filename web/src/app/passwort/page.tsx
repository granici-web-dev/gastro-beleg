import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswortPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
            GB
          </span>
          <span className="font-semibold">GastroBeleg</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Passwort zurücksetzen
        </h1>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          Wir schicken einen Link an die hinterlegte Adresse. Er gilt eine
          Stunde.
        </p>

        <form className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="chef@betrieb.de"
            />
          </div>
          <Button size="lg" className="w-full">
            <MailCheck />
            Link anfordern
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Kommt nichts an, prüfen Sie den Spam-Ordner.
          </p>
        </form>

        <Button asChild variant="ghost" size="sm" className="mt-8 -ml-2">
          <Link href="/login">
            <ArrowLeft />
            Zurück zur Anmeldung
          </Link>
        </Button>
      </div>
    </div>
  );
}
