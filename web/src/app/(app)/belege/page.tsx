"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from "@/components/domain-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { documentTotals, linesNeedingReview } from "@/lib/domain";
import { formatDate, formatEuro } from "@/lib/format";
import { findSupplier } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";

type Filter = "alle" | "pruefung" | "gebucht" | "exportiert";

const filters: { value: Filter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "pruefung", label: "Zu prüfen" },
  { value: "gebucht", label: "Gebucht" },
  { value: "exportiert", label: "Exportiert" },
];

export default function BelegePage() {
  const { documents } = usePrototype();
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("alle");
  const [query, setQuery] = React.useState("");

  const visible = documents
    .filter((document) => filter === "alle" || document.status === filter)
    .filter((document) => {
      if (!query.trim()) return true;
      const haystack = [
        document.number,
        findSupplier(document.supplierId).name,
        document.type,
        document.fileLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        title="Belege"
        lead="Jeder Beleg liegt im Original unveränderbar im Archiv. Korrekturen laufen über den Prüf-Dialog und landen im Änderungsprotokoll."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList>
            {filters.map((entry) => (
              <TabsTrigger key={entry.value} value={entry.value}>
                {entry.label}
                {entry.value === "pruefung" ? (
                  <span className="tabular ml-1.5 text-xs opacity-70">
                    {
                      documents.filter(
                        (document) => document.status === "pruefung",
                      ).length
                    }
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative sm:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Lieferant oder Belegnummer"
            className="pl-8"
            aria-label="Belege durchsuchen"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Keine Belege in dieser Ansicht</EmptyTitle>
            <EmptyDescription>
              Ändere den Filter oder erfasse einen neuen Beleg — Foto genügt.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/scan">Beleg erfassen</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell sm:w-[6.5rem]">
                    Datum
                  </TableHead>
                  <TableHead>Lieferant</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Belegnummer
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Art</TableHead>
                  <TableHead className="hidden lg:table-cell">Quelle</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((document) => {
                  const totals = documentTotals(document.lines);
                  const open = linesNeedingReview(document.lines).length;
                  return (
                    <TableRow
                      key={document.id}
                      className="row-link"
                      tabIndex={0}
                      role="link"
                      aria-label={`Beleg ${document.number} öffnen`}
                      onClick={() => router.push(`/belege/${document.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/belege/${document.id}`);
                        }
                      }}
                    >
                      <TableCell className="tabular hidden whitespace-nowrap sm:table-cell">
                        {formatDate(document.date)}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {/* No room for a date column on a phone — it rides along here. */}
                        <p className="tabular text-muted-foreground text-xs sm:hidden">
                          {formatDate(document.date)}
                        </p>
                        <Link
                          href={`/belege/${document.id}`}
                          className="font-medium hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {findSupplier(document.supplierId).name}
                        </Link>
                        {open > 0 && document.status === "pruefung" ? (
                          <p className="text-warning text-xs">
                            {open} Position{open === 1 ? "" : "en"} prüfen
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {document.number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <TypeBadge type={document.type} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <SourceBadge source={document.source} />
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {formatEuro(totals.grossCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={document.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
