"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Download } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro } from "@/lib/format";
import { TENANT } from "@/lib/mock/data";
import { invoices, plans, topUpPacks } from "@/lib/mock/settings";
import { cn } from "@/lib/utils";

export default function TarifPage() {
  const [switching, setSwitching] = React.useState<string | null>(null);
  const [current, setCurrent] = React.useState("standard");

  const used = TENANT.documentsUsed;
  const included = TENANT.documentsIncluded;
  const target = plans.find((plan) => plan.id === switching) ?? null;

  return (
    <>
      <PageHeader
        title="Tarif und Abrechnung"
        lead="Bezahlt wird je Beleg. Wird das Kontingent knapp, greift automatisch das nächste Paket — blockiert wird nie etwas."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Belege in diesem Monat</CardTitle>
            <CardDescription>
              Abgerechnet wird je Beleg. Ein Kassenexport zählt als ein Beleg.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="tabular text-2xl font-semibold">
                {used} von {included}
              </span>
              <span className="text-muted-foreground text-sm">
                Zurücksetzung am 01.09.2026
              </span>
            </div>
            <Progress value={(used / included) * 100} />
            <p className="text-muted-foreground text-sm">
              Reicht das Kontingent nicht, greift automatisch das nächste
              Paket — nichts wird blockiert und nichts verfällt.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zusatzpakete</CardTitle>
            <CardDescription>Verfallen nicht.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUpPacks.map((pack) => (
              <div
                key={pack.documents}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="tabular">{pack.documents} Belege</span>
                <div className="flex items-center gap-2">
                  <span className="tabular text-muted-foreground">
                    {formatEuro(pack.priceCents)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast.success("Paket hinzugefügt", {
                        description: `${pack.documents} Belege stehen sofort zur Verfügung.`,
                      })
                    }
                  >
                    Kaufen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === current;
          return (
            <Card
              key={plan.id}
              className={cn(isCurrent && "border-primary ring-primary/20 ring-2")}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrent ? <Badge>Aktuell</Badge> : null}
                </div>
                <CardDescription>
                  <span className="tabular text-foreground text-xl font-semibold">
                    {formatEuro(plan.monthlyCents)}
                  </span>{" "}
                  je Monat, {plan.documents} Belege
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  className="w-full"
                  disabled={isCurrent}
                  onClick={() => setSwitching(plan.id)}
                >
                  {isCurrent ? "Aktueller Tarif" : "Zu diesem Tarif wechseln"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Rechnungen</CardTitle>
          <CardDescription>
            Mit ausgewiesener Umsatzsteuer, Zahlung per SEPA-Lastschrift.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitraum</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Beleg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.period}</TableCell>
                  <TableCell className="tabular text-right">
                    {formatEuro(invoice.grossCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-success-muted text-primary font-medium">
                      {invoice.status}
                    </Badge>
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

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setSwitching(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarif wechseln</DialogTitle>
            <DialogDescription>
              Der Wechsel gilt ab dem nächsten Abrechnungszeitraum. Bereits
              gekaufte Zusatzpakete bleiben erhalten.
            </DialogDescription>
          </DialogHeader>
          {target ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Neuer Tarif</dt>
                <dd className="font-medium">{target.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Monatlich</dt>
                <dd className="tabular">{formatEuro(target.monthlyCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Belege inklusive</dt>
                <dd className="tabular">{target.documents}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Gültig ab</dt>
                <dd className="tabular">01.09.2026</dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitching(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (target) setCurrent(target.id);
                setSwitching(null);
                toast.success("Tarif geändert", {
                  description: "Ab dem 01.09.2026 gilt der neue Tarif.",
                });
              }}
            >
              Wechsel bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
