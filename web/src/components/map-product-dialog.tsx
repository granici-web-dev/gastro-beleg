"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { catalogItems } from "@/lib/mock/data";
import { findSupplier } from "@/lib/selectors";
import { usePrototype } from "@/lib/store";
import { cn } from "@/lib/utils";
import { parseQuantity } from "@/lib/format";

/** Cheap token overlap — good enough to put the obvious candidate on top. */
function similarity(rawString: string, candidate: string): number {
  const normalise = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-zäöüß0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter((token) => token.length > 2);
  const left = new Set(normalise(rawString));
  const right = normalise(candidate);
  if (left.size === 0 || right.length === 0) return 0;
  const hits = right.filter((token) =>
    [...left].some((other) => other.startsWith(token.slice(0, 4)) || token.startsWith(other.slice(0, 4))),
  ).length;
  return hits / right.length;
}

function bestGuess(rawString: string): string | null {
  return (
    [...catalogItems]
      .sort(
        (a, b) => similarity(rawString, b.name) - similarity(rawString, a.name),
      )
      .filter((item) => similarity(rawString, item.name) > 0)[0]?.id ?? null
  );
}

/** Mount this only while a mapping is in progress — it starts from a fresh guess. */
export function MapProductDialog({
  open,
  onOpenChange,
  supplierId,
  rawString,
  articleNo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  rawString: string;
  articleNo: string | null;
}) {
  const { mapProduct } = usePrototype();
  const [query, setQuery] = React.useState("");
  const [factor, setFactor] = React.useState("1");
  const [selected, setSelected] = React.useState<string | null>(() =>
    bestGuess(rawString),
  );

  const ranked = [...catalogItems]
    .filter((item) =>
      query.trim()
        ? item.name.toLowerCase().includes(query.trim().toLowerCase())
        : true,
    )
    .sort((a, b) => similarity(rawString, b.name) - similarity(rawString, a.name));

  const chosen = catalogItems.find((item) => item.id === selected) ?? null;
  const parsedFactor = parseQuantity(factor);

  const save = () => {
    if (!chosen || parsedFactor === null || parsedFactor <= 0) return;
    mapProduct({
      supplierId,
      rawString,
      articleNo,
      catalogItemId: chosen.id,
      conversionFactor: parsedFactor,
    });
    toast.success("Zuordnung gemerkt", {
      description: `„${rawString}" von ${findSupplier(supplierId).name} wird ab jetzt automatisch als ${chosen.name} erkannt.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Produkt zuordnen</DialogTitle>
          <DialogDescription>
            Einmal zuordnen — GastroBeleg erkennt diese Bezeichnung bei{" "}
            {findSupplier(supplierId).name} danach von allein.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-md px-3 py-2">
            <p className="text-muted-foreground text-xs">Auf dem Beleg steht</p>
            <p className="font-medium">{rawString}</p>
            {articleNo ? (
              <p className="text-muted-foreground text-xs">
                Artikelnummer {articleNo}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog-search">Katalogartikel</Label>
            <Input
              id="catalog-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Suchen, z. B. Parmesan"
            />
            <ScrollArea className="h-56 rounded-md border">
              <div className="p-1">
                {ranked.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm",
                      selected === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        selected === item.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.category} — {item.baseUnit}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion">
              Umrechnung in {chosen ? chosen.baseUnit : "Basiseinheit"}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                1 Gebinde vom Lieferanten =
              </span>
              <Input
                id="conversion"
                value={factor}
                onChange={(event) => setFactor(event.target.value)}
                className="tabular w-24"
                inputMode="decimal"
              />
              <span className="text-muted-foreground text-sm">
                {chosen?.baseUnit ?? ""}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Beispiel: eine Kiste mit 24 Flaschen à 0,33 l sind 7,92 l.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={save}
            disabled={!chosen || parsedFactor === null || parsedFactor <= 0}
          >
            Zuordnung merken
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
