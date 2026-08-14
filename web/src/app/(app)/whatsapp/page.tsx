"use client";

import { Image as ImageIcon, Plus } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  whatsappLanguages,
  whatsappNumbers,
  whatsappThread,
} from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

export default function WhatsAppPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp-Eingang"
        lead="Die Küche fotografiert ohnehin schon alles in den Gruppenchat. Hier landet dasselbe Foto direkt als Beleg — ohne App, ohne Passwort."
        actions={
          <Button size="sm" variant="outline">
            <Plus />
            Nummer freischalten
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[24rem_1fr]">
        <Card className="lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">Verlauf</CardTitle>
            <CardDescription>
              +49 221 55512345 — die Nummer des Betriebs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 space-y-2 rounded-lg p-3">
              {whatsappThread.map((message) => {
                const fromKitchen = message.from === "kitchen";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      fromKitchen ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        fromKitchen
                          ? "bg-lime text-lime-foreground"
                          : "bg-background border",
                      )}
                    >
                      {message.kind === "image" ? (
                        <span className="flex items-center gap-2">
                          <ImageIcon className="size-4 shrink-0" />
                          {message.body}
                        </span>
                      ) : (
                        <span className="text-pretty">{message.body}</span>
                      )}
                      <span
                        className={cn(
                          "mt-1 block text-right text-[11px]",
                          fromKitchen
                            ? "text-lime-foreground/60"
                            : "text-muted-foreground",
                        )}
                      >
                        {message.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:order-2">
          <Card className="overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">
                Freigeschaltete Nummern
              </CardTitle>
              <CardDescription>
                Nur diese Nummern werden angenommen. Alles andere wird
                verworfen.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">Rechte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whatsappNumbers.map((entry) => (
                    <TableRow key={entry.number}>
                      <TableCell className="tabular font-medium whitespace-nowrap">
                        {entry.number}
                      </TableCell>
                      <TableCell>{entry.label}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-normal">
                          {entry.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sprachen</CardTitle>
              <CardDescription>
                Die Antwort kommt in der Sprache, in der gefragt wurde. In
                deutschen Küchen ist das selten Deutsch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {whatsappLanguages.map((language) => (
                  <Badge
                    key={language}
                    className="bg-secondary text-secondary-foreground font-normal"
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Was der Chat kann</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                Foto senden — der Beleg wird gelesen und landet in der
                Prüfliste.
              </p>
              <p>
                Nachfragen stellen — Ausgaben, Preise, offene Belege. Antwort in
                Sekunden.
              </p>
              <p>
                Korrigieren geht nicht im Chat. Das passiert am Rechner, mit dem
                Original daneben.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
