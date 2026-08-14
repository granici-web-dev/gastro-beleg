"use client";

import { Building2, Download, Eye, MessageSquare } from "lucide-react";

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
import { formatDate } from "@/lib/format";
import { kanzleiClients, kanzleiQuestions } from "@/lib/mock/phase2";
import { cn } from "@/lib/utils";

const statusLabel = {
  bereit: "Stapel bereit",
  abgeholt: "Abgeholt",
  rueckfrage: "Rückfrage offen",
} as const;

const statusTone = {
  bereit: "bg-success-muted text-primary",
  abgeholt: "bg-secondary text-secondary-foreground",
  rueckfrage: "bg-warning-muted text-warning",
} as const;

export default function KanzleiPage() {
  const open = kanzleiQuestions.filter((question) => !question.answered);

  return (
    <>
      <PageHeader
        title="Kanzlei-Portal"
        lead="Die Ansicht des Steuerberaters — hier zur Vorschau. Der Zugang ist kostenlos und ausdrücklich nur lesend."
        actions={
          <Button size="sm" variant="outline">
            <Eye />
            Als Kanzlei ansehen
          </Button>
        }
      />

      <Alert className="mb-5">
        <Building2 />
        <AlertTitle>Nur lesen, nichts ändern</AlertTitle>
        <AlertDescription>
          Die Kanzlei sieht Belege und Stapel und kann Rückfragen stellen. Sie
          kann keinen Beleg korrigieren, nichts buchen und nichts löschen —
          sonst wäre die Zuständigkeit für die Zahlen nicht mehr klar.
        </AlertDescription>
      </Alert>

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Mandanten</CardTitle>
          <CardDescription>
            Eine Kanzlei betreut in der Regel mehrere Betriebe. Sie sehen hier
            nur Ihren eigenen.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Betrieb</TableHead>
                <TableHead className="hidden sm:table-cell">Ort</TableHead>
                <TableHead className="text-right">Offene Belege</TableHead>
                <TableHead className="text-right">Letzter Stapel</TableHead>
                <TableHead className="text-right">Stand</TableHead>
                <TableHead className="w-28 text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kanzleiClients.map((client) => (
                <TableRow
                  key={client.id}
                  className={cn(client.status === "rueckfrage" && "bg-warning-muted/40")}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {client.city}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {client.openDocuments}
                  </TableCell>
                  <TableCell className="tabular text-right whitespace-nowrap">
                    {formatDate(client.lastBatch)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={cn("font-medium", statusTone[client.status])}>
                      {statusLabel[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download />
                      Stapel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4" />
            Rückfragen
            {open.length > 0 ? (
              <Badge className="bg-warning-muted text-warning font-medium">
                {open.length} offen
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Statt Telefonat und Zettel: die Frage hängt am Beleg und die Antwort
            bleibt dokumentiert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {kanzleiQuestions.map((question) => (
            <div
              key={question.id}
              className={cn(
                "rounded-md border p-3",
                !question.answered && "border-warning/30 bg-warning-muted/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-pretty">{question.question}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Beleg {question.documentLabel} — gefragt am{" "}
                    {formatDate(question.askedOn)}
                  </p>
                </div>
                {question.answered ? (
                  <Badge className="bg-success-muted text-primary shrink-0 font-medium">
                    beantwortet
                  </Badge>
                ) : (
                  <Button size="sm" className="shrink-0">
                    Antworten
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
