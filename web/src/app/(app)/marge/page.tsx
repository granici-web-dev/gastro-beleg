"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

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
import { formatEuro, formatPercent, formatQuantity } from "@/lib/format";
import { dishes, recipe } from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

/** Menu Engineering: hoher Deckungsbeitrag × häufig verkauft. */
function classify(
  contributionCents: number,
  sold: number,
  medianContribution: number,
  medianSold: number,
): { label: string; tone: string } {
  const high = contributionCents >= medianContribution;
  const popular = sold >= medianSold;
  if (high && popular) return { label: "Star", tone: "bg-success-muted text-primary" };
  if (high) return { label: "Chance", tone: "bg-lime text-lime-foreground" };
  if (popular)
    return { label: "Zugpferd", tone: "bg-secondary text-secondary-foreground" };
  return { label: "Prüfen", tone: "bg-warning-muted text-warning" };
}

export default function MargePage() {
  const rows = dishes.map((dish) => ({
    ...dish,
    contributionCents: dish.priceCents - dish.foodCostCents,
    ratio: dish.foodCostCents / dish.priceCents,
  }));

  const medianContribution = [...rows].sort(
    (a, b) => a.contributionCents - b.contributionCents,
  )[Math.floor(rows.length / 2)].contributionCents;
  const medianSold = [...rows].sort((a, b) => a.soldLastMonth - b.soldLastMonth)[
    Math.floor(rows.length / 2)
  ].soldLastMonth;

  const problem = [...rows].sort((a, b) => b.ratio - a.ratio)[0];
  const recipeCost = recipe.reduce((sum, line) => sum + line.costCents, 0);
  const carbonara = rows.find((row) => row.name.includes("Carbonara"));

  const suggestedPrice = Math.ceil((problem.foodCostCents / 0.3) / 10) * 10;

  return (
    <>
      <PageHeader
        title="Marge je Gericht"
        lead="Die Rezeptur zu den Preisen von heute, nicht zu denen vom Tag der Kalkulation. Genau da entsteht die Lücke."
      />

      <Alert className="border-warning/30 bg-warning-muted text-warning [&>svg]:text-warning mb-4">
        <TrendingUp />
        <AlertTitle>
          {problem.name} liegt bei {formatPercent(problem.ratio, 0)} Wareneinsatz
        </AlertTitle>
        <AlertDescription className="text-warning/90">
          Bei {formatEuro(problem.priceCents)} Verkaufspreis bleiben{" "}
          {formatEuro(problem.contributionCents)} Deckungsbeitrag. Für 30 %
          Quote wäre ein Preis von {formatEuro(suggestedPrice)} nötig. Der
          Vorschlag ersetzt keine Entscheidung — der Gast entscheidet mit.
        </AlertDescription>
      </Alert>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden py-0 lg:order-1">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Alle Gerichte</CardTitle>
            <CardDescription>
              Deckungsbeitrag ist Preis minus Wareneinsatz — ohne Personal und
              Miete.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[12rem]">Gericht</TableHead>
                    <TableHead className="text-right">Preis</TableHead>
                    <TableHead className="text-right">Einsatz</TableHead>
                    <TableHead className="text-right">Deckungsbeitrag</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Verkauft
                    </TableHead>
                    <TableHead className="text-right">Einordnung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const badge = classify(
                      row.contributionCents,
                      row.soldLastMonth,
                      medianContribution,
                      medianSold,
                    );
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {formatEuro(row.priceCents)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabular text-right whitespace-nowrap",
                            row.ratio > 0.35 && "text-warning font-medium",
                          )}
                        >
                          {formatEuro(row.foodCostCents)}
                        </TableCell>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {formatEuro(row.contributionCents)}
                        </TableCell>
                        <TableCell className="tabular hidden text-right sm:table-cell">
                          {row.soldLastMonth}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("font-medium", badge.tone)}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Rezeptur — Spaghetti Carbonara
              </CardTitle>
              <CardDescription>
                Bewertet mit dem zuletzt bezahlten Einkaufspreis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recipe.map((line) => (
                <div
                  key={line.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="min-w-0 truncate">
                    {line.label}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {formatQuantity(line.quantity)} {line.unit}
                    </span>
                  </span>
                  <span className="tabular shrink-0">
                    {formatEuro(line.costCents)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t pt-2 font-medium">
                <span>Wareneinsatz</span>
                <span className="tabular">{formatEuro(recipeCost)}</span>
              </div>
              {carbonara ? (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">Verkaufspreis</span>
                  <span className="tabular">
                    {formatEuro(carbonara.priceCents)}
                  </span>
                </div>
              ) : null}
              <Button variant="outline" size="sm" className="w-full">
                Rezeptur bearbeiten
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wie zu lesen</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                <span className="text-foreground font-medium">Star</span> — viel
                verkauft und guter Deckungsbeitrag. Nicht anfassen.
              </p>
              <p>
                <span className="text-foreground font-medium">Chance</span> —
                verdient gut, verkauft sich zu selten. Besser platzieren.
              </p>
              <p>
                <span className="text-foreground font-medium">Zugpferd</span> —
                läuft gut, verdient wenig. Rezeptur oder Preis prüfen.
              </p>
              <p>
                <span className="text-foreground font-medium">Prüfen</span> —
                weder das eine noch das andere. Kandidat zum Streichen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
