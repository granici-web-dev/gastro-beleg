"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  FileCode2,
  FileText,
  Loader2,
  Mail,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TENANT } from "@/lib/mock/data";
import {
  ocrStages,
  scanSamples,
  structuredStages,
  type ScanSample,
} from "@/lib/mock/scan-samples";
import { usePrototype } from "@/lib/store";
import { cn } from "@/lib/utils";

const TODAY = "2026-08-12";

export default function ScanPage() {
  const router = useRouter();
  const { addDocument } = usePrototype();
  const [running, setRunning] = React.useState<ScanSample | null>(null);
  const [stageIndex, setStageIndex] = React.useState(0);
  const [documentId, setDocumentId] = React.useState<string | null>(null);

  const stages = running?.structured ? structuredStages : ocrStages;

  React.useEffect(() => {
    if (!running) return;
    if (stageIndex >= stages.length) return;
    const timer = window.setTimeout(
      () => setStageIndex((index) => index + 1),
      running.structured ? 420 : 760,
    );
    return () => window.clearTimeout(timer);
  }, [running, stageIndex, stages.length]);

  const start = (sample: ScanSample) => {
    const id = `doc-neu-${Date.now().toString(36)}`;
    addDocument(sample.build(id, TODAY));
    setDocumentId(id);
    setStageIndex(0);
    setRunning(sample);
  };

  const done = running !== null && stageIndex >= stages.length;

  if (running) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader
          title={done ? "Fertig gelesen" : "Beleg wird gelesen"}
          lead={
            done
              ? "Prüf die markierten Positionen, dann ist der Beleg gebucht."
              : running.label
          }
        />

        <Card>
          <CardContent className="space-y-5 pt-6">
            <Progress
              value={Math.min(100, (stageIndex / stages.length) * 100)}
            />
            <ol className="space-y-3">
              {stages.map((stage, index) => {
                const state =
                  index < stageIndex
                    ? "done"
                    : index === stageIndex
                      ? "active"
                      : "waiting";
                return (
                  <li key={stage} className="flex items-start gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                        state === "done" && "bg-primary text-primary-foreground",
                        state === "active" && "bg-muted text-foreground",
                        state === "waiting" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="size-3" />
                      ) : state === "active" ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : null}
                    </span>
                    <span
                      className={
                        state === "waiting"
                          ? "text-muted-foreground"
                          : undefined
                      }
                    >
                      {stage}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                disabled={!done}
                onClick={() => router.push(`/belege/${documentId}`)}
              >
                Positionen prüfen
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRunning(null);
                  setStageIndex(0);
                }}
              >
                Nächsten Beleg erfassen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Beleg erfassen"
        lead="Foto, PDF oder E-Rechnung. Mehrere Lieferscheine auf einem Bild werden automatisch getrennt."
      />

      <Card className="border-primary/30 bg-accent/40 border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full">
            <Camera className="size-7" />
          </span>
          <div>
            <p className="text-lg font-medium">Beleg abfotografieren</p>
            <p className="text-muted-foreground mt-1 text-sm text-pretty">
              Am Telefon öffnet sich die Kamera. Schief halten ist erlaubt.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" onClick={() => start(scanSamples[0])}>
              <Camera />
              Kamera öffnen
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => start(scanSamples[2])}
            >
              <Upload />
              Datei wählen
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Im Prototyp wird statt der Kamera ein Beispielbeleg eingelesen.
          </p>
        </CardContent>
      </Card>

      <h2 className="mt-8 mb-3 text-sm font-medium">Beispielbelege</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {scanSamples.map((sample) => (
          <button
            key={sample.key}
            type="button"
            onClick={() => start(sample)}
            className="hover:border-primary/50 hover:bg-accent/40 flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors"
          >
            <span className="bg-muted flex size-9 items-center justify-center rounded-md">
              {sample.structured ? (
                <FileCode2 className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
            </span>
            <span className="font-medium">{sample.label}</span>
            <span className="text-muted-foreground text-xs text-pretty">
              {sample.hint}
            </span>
          </button>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Belege per E-Mail
          </CardTitle>
          <CardDescription>
            Leite Rechnungen einfach weiter — Anhänge werden automatisch
            eingelesen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
            {TENANT.inboxAddress}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
