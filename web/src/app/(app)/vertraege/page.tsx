"use client";

import { CalendarClock } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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
import { formatDate, formatDelta, formatEuro } from "@/lib/format";
import { contracts } from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

export default function VertraegePage() {
  const monthly = contracts.reduce(
    (sum, contract) => sum + contract.monthlyCents,
    0,
  );
  const yearly = monthly * 12;
  const risers = contracts.filter(
    (contract) => contract.changeSinceJanuary >= 0.15,
  );

  return (
    <>
      <PageHeader
        title="Verträge und Abos"
        lead="Nicht eingetippt, sondern erkannt: Rechnungen, die jeden Monat gleich aussehen, sind ein Vertrag. Fixkosten fallen sonst niemandem auf, weil sie einfach abgebucht werden."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard
          label="Monatliche Fixkosten"
          value={formatEuro(monthly)}
          hint="{contracts.length} laufende Verträge"
        />
        <StatCard
          label="Im Jahr"
          value={formatEuro(yearly)}
          hint="Hochgerechnet auf zwölf Monate"
        />
        <Card className={cn(risers.length > 0 && "border-warning/40")}>
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.07em]">Deutlich teurer geworden</CardDescription>
            <CardTitle className="text-warning tabular text-[30px] leading-[39px]">
              {risers.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Über 15 % seit Januar
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden py-0">
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[12rem]">Anbieter</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Kategorie
                  </TableHead>
                  <TableHead className="text-right">Monatlich</TableHead>
                  <TableHead className="text-right">Seit Januar</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Kündigungsfrist
                  </TableHead>
                  <TableHead className="text-right">
                    Nächster Ausstieg
                  </TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className={cn(
                      contract.changeSinceJanuary >= 0.15 &&
                        "bg-warning-muted/40",
                    )}
                  >
                    <TableCell className="font-medium">
                      {contract.vendor}
                      <p className="text-muted-foreground text-xs">
                        aus {contract.detectedFrom} Rechnungen erkannt
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="font-normal">
                        {contract.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatEuro(contract.monthlyCents)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        contract.changeSinceJanuary > 0 && "text-warning font-medium",
                      )}
                    >
                      {contract.changeSinceJanuary === 0
                        ? "unverändert"
                        : formatDelta(contract.changeSinceJanuary, 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-right whitespace-nowrap md:table-cell">
                      {contract.noticePeriod}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatDate(contract.nextCancellation)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <CalendarClock />
                        Erinnern
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 max-w-prose text-sm text-pretty">
        Erinnerungen kommen vier Wochen vor Ablauf der Kündigungsfrist. Ob
        gekündigt wird, entscheiden Sie — wir sagen nur, wann es zu spät wäre.
      </p>
    </>
  );
}
