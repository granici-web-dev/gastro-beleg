"use client";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatEuro } from "@/lib/format";
import { creditNotes } from "@/lib/mock/phase2";
import { findSupplier } from "@/lib/selectors";
import { cn } from "@/lib/utils";

type State = "offen" | "teilweise" | "vollstaendig";

function stateOf(
  expectedCents: number,
  receivedCents: number | null,
): State {
  if (receivedCents === null) return "offen";
  return receivedCents >= expectedCents ? "vollstaendig" : "teilweise";
}

const stateLabel: Record<State, string> = {
  offen: "Offen",
  teilweise: "Teilgutschrift",
  vollstaendig: "Vollständig",
};

export default function GutschriftenPage() {
  const expected = creditNotes.reduce(
    (sum, note) => sum + note.expectedCents,
    0,
  );
  const received = creditNotes.reduce(
    (sum, note) => sum + (note.receivedCents ?? 0),
    0,
  );
  const open = expected - received;

  return (
    <>
      <PageHeader
        title="Gutschriften"
        lead="Eine Reklamation ist erst erledigt, wenn das Geld zurück ist. Hier steht, was zugesagt und was tatsächlich gutgeschrieben wurde."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard
          label="Zurückgeholt"
          value={formatEuro(received)}
          hint="Eingegangene Gutschriften, laufendes Jahr"
          tone="primary"
        />
        <StatCard
          label="Noch offen"
          value={formatEuro(open)}
          hint="Zugesagt oder reklamiert, nicht eingegangen"
          tone="warning"
        />
        <StatCard
          label="Fälle"
          value={String(creditNotes.length)}
          hint="Seit Jahresbeginn bearbeitet"
        />
      </div>

      <Card className="mt-5 overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grund</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Lieferant
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Beleg
                </TableHead>
                <TableHead className="text-right">Erwartet</TableHead>
                <TableHead className="text-right">Eingegangen</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Angefragt
                </TableHead>
                <TableHead className="text-right">Stand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map((note) => {
                const state = stateOf(note.expectedCents, note.receivedCents);
                return (
                  <TableRow
                    key={note.id}
                    className={cn(state !== "vollstaendig" && "bg-warning-muted/40")}
                  >
                    <TableCell className="max-w-[20rem] font-medium">
                      <span className="block truncate">{note.reason}</span>
                      {note.receivedOn ? (
                        <span className="text-muted-foreground text-xs">
                          Eingegangen am {formatDate(note.receivedOn)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {findSupplier(note.supplierId).name}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">
                      {note.documentNumber ?? "—"}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {formatEuro(note.expectedCents)}
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {note.receivedCents === null
                        ? "—"
                        : formatEuro(note.receivedCents)}
                    </TableCell>
                    <TableCell className="tabular hidden text-right whitespace-nowrap md:table-cell">
                      {formatDate(note.requestedOn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={cn(
                          "font-medium",
                          state === "vollstaendig"
                            ? "bg-success-muted text-primary"
                            : "bg-warning-muted text-warning",
                        )}
                      >
                        {stateLabel[state]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
