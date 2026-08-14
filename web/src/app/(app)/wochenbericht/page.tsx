"use client";

import * as React from "react";
import { Mail, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatDelta, formatEuro } from "@/lib/format";
import { weeklyDigest } from "@/lib/mock/phase2";

export default function WochenberichtPage() {
  const [blocks, setBlocks] = React.useState(weeklyDigest.blocks);

  return (
    <>
      <PageHeader
        title="Wochenbericht"
        lead="Einmal pro Woche eine Mail. Wer sie liest, muss die App nicht öffnen — und öffnet sie trotzdem, wenn eine Zahl auffällt."
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              Vorschau — Woche {weeklyDigest.week}
            </CardTitle>
            <CardDescription>
              Versendet am {formatDate(weeklyDigest.sentOn)} an{" "}
              {weeklyDigest.recipients.length} Empfänger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg border p-5">
              <p className="text-sm font-medium">
                Ihre Woche in Zahlen — Trattoria Bellavista
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                An: {weeklyDigest.recipients.join(", ")}
              </p>

              <Separator className="my-4" />

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Wareneinsatz der Woche
                  </p>
                  <p className="tabular text-2xl font-semibold">
                    {formatEuro(weeklyDigest.summary.goodsCents)}
                  </p>
                  <p className="text-warning flex items-center gap-1 text-xs">
                    <TrendingUp className="size-3" />
                    {formatDelta(weeklyDigest.summary.changeToPreviousWeek)}{" "}
                    gegenüber der Vorwoche
                  </p>
                </div>

                <ul className="space-y-2">
                  <li className="flex justify-between gap-3">
                    <span>Preissprünge über 5 %</span>
                    <span className="tabular font-medium">
                      {weeklyDigest.summary.priceJumps}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Offene Abweichungen</span>
                    <span className="tabular font-medium">
                      {weeklyDigest.summary.openDeviations}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Skonto, das diese Woche verfällt</span>
                    <span className="tabular text-warning font-medium">
                      {formatEuro(weeklyDigest.summary.skontoAtRiskCents)}
                    </span>
                  </li>
                </ul>

                <Button size="sm">Details ansehen</Button>

                <p className="text-muted-foreground text-xs text-pretty">
                  Sie erhalten diese Mail, weil Sie den Wochenbericht
                  abonniert haben. Abbestellen mit einem Klick.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="day">Wochentag</Label>
                <Select defaultValue="montag">
                  <SelectTrigger id="day" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="montag">Montag, 8 Uhr</SelectItem>
                    <SelectItem value="sonntag">Sonntag, 18 Uhr</SelectItem>
                    <SelectItem value="freitag">Freitag, 16 Uhr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipients">Empfänger</Label>
                <Input
                  id="recipients"
                  defaultValue={weeklyDigest.recipients.join(", ")}
                />
                <p className="text-muted-foreground text-xs">
                  Mehrere Adressen mit Komma trennen.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inhalte</CardTitle>
              <CardDescription>
                Was nicht drinsteht, wird auch nicht gelesen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between gap-3"
                >
                  <Label htmlFor={block.id} className="font-normal">
                    {block.label}
                  </Label>
                  <Switch
                    id={block.id}
                    checked={block.enabled}
                    onCheckedChange={(enabled) =>
                      setBlocks((current) =>
                        current.map((entry) =>
                          entry.id === block.id ? { ...entry, enabled } : entry,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
