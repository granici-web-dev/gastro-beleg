"use client";

import * as React from "react";
import { CheckCircle2, Link2 } from "lucide-react";

import { MapProductDialog } from "@/components/map-product-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro, formatQuantity } from "@/lib/format";
import { catalogItems } from "@/lib/mock/data";
import { findSupplier } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";

interface OpenMapping {
  supplierId: string;
  rawString: string;
  articleNo: string | null;
  occurrences: number;
  lastUnitPriceCents: number;
  unit: string;
}

export default function KatalogPage() {
  const { documents, mappings } = usePrototype();
  const [target, setTarget] = React.useState<OpenMapping | null>(null);
  const [query, setQuery] = React.useState("");

  const open = new Map<string, OpenMapping>();
  for (const document of documents) {
    for (const line of document.lines) {
      if (line.isPfand || line.catalogItemId) continue;
      const key = `${document.supplierId}|${line.rawDescription}`;
      const existing = open.get(key);
      open.set(key, {
        supplierId: document.supplierId,
        rawString: line.rawDescription,
        articleNo: line.articleNo,
        occurrences: (existing?.occurrences ?? 0) + 1,
        lastUnitPriceCents: line.unitPriceCents,
        unit: line.unit,
      });
    }
  }
  const openList = [...open.values()].sort(
    (a, b) => b.occurrences - a.occurrences,
  );

  const filteredCatalog = catalogItems.filter((item) =>
    query.trim()
      ? item.name.toLowerCase().includes(query.trim().toLowerCase())
      : true,
  );

  return (
    <>
      <PageHeader
        title="Katalog"
        lead="Jede Lieferantenbezeichnung wird einmal zugeordnet. Danach erkennt GastroBeleg sie automatisch — samt Umrechnung auf die Basiseinheit."
      />

      <Tabs defaultValue="offen">
        <TabsList className="mb-5">
          <TabsTrigger value="offen">
            Offene Zuordnungen
            {openList.length > 0 ? (
              <span className="tabular ml-1.5 text-xs opacity-70">
                {openList.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="katalog">Artikel</TabsTrigger>
        </TabsList>

        <TabsContent value="offen">
          {openList.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 />
                </EmptyMedia>
                <EmptyTitle>Alles zugeordnet</EmptyTitle>
                <EmptyDescription>
                  Jede Position auf jedem Beleg hängt an einem Katalogartikel.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card className="overflow-hidden py-0">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bezeichnung auf dem Beleg</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Lieferant
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Artikelnr.
                      </TableHead>
                      <TableHead className="text-right">Belege</TableHead>
                      <TableHead className="text-right">
                        Letzter Preis
                      </TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openList.map((entry) => (
                      <TableRow key={`${entry.supplierId}|${entry.rawString}`}>
                        <TableCell className="font-medium">
                          {entry.rawString}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {findSupplier(entry.supplierId).name}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular hidden md:table-cell">
                          {entry.articleNo ?? "—"}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {entry.occurrences}
                        </TableCell>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {formatEuro(entry.lastUnitPriceCents)} / {entry.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTarget(entry)}
                          >
                            <Link2 />
                            Zuordnen
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="katalog">
          <div className="mb-5 sm:w-72">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Artikel suchen"
              aria-label="Katalog durchsuchen"
            />
          </div>
          <Card className="overflow-hidden py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Kategorie
                    </TableHead>
                    <TableHead>Basiseinheit</TableHead>
                    <TableHead>Zuordnungen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCatalog.map((item) => {
                    const linked = mappings.filter(
                      (mapping) => mapping.catalogItemId === item.id,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.baseUnit}
                        </TableCell>
                        <TableCell>
                          {linked.length === 0 ? (
                            <span className="text-muted-foreground text-sm">
                              noch keine
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {linked.map((mapping) => (
                                <Badge
                                  key={`${mapping.supplierId}|${mapping.rawString}`}
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {findSupplier(mapping.supplierId).name}
                                  <span className="text-muted-foreground ml-1">
                                    ×{formatQuantity(mapping.conversionFactor)}{" "}
                                    {item.baseUnit}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {target ? (
        <MapProductDialog
          open={target !== null}
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          supplierId={target.supplierId}
          rawString={target.rawString}
          articleNo={target.articleNo}
        />
      ) : null}
    </>
  );
}
