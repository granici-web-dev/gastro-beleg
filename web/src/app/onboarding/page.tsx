"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { onboardingQuestions } from "@/lib/mock/settings";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const done = step >= onboardingQuestions.length;
  const question = onboardingQuestions[Math.min(step, onboardingQuestions.length - 1)];

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
            GB
          </span>
          <span className="font-semibold">GastroBeleg</span>
        </div>

        {done ? (
          <>
            <span className="bg-primary text-primary-foreground mb-6 flex size-12 items-center justify-center rounded-full">
              <Check className="size-6" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Alles da. Jetzt der erste Beleg.
            </h1>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">
              Am besten gleich der Stapel der letzten Wochen — das Belegdatum
              wird aus dem Beleg gelesen, nicht vom Hochladetag. Damit stimmen
              die Auswertungen ab dem ersten Tag.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/scan">Ersten Beleg erfassen</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/uebersicht">Erst mal umsehen</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <Progress
              value={(step / onboardingQuestions.length) * 100}
              className="mb-6"
            />
            <p className="text-muted-foreground mb-2 text-xs">
              Frage {step + 1} von {onboardingQuestions.length}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {question.question}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">
              {question.hint}
            </p>

            <div className="mt-6 space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option,
                      }));
                      setStep((current) => current + 1);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-accent"
                        : "hover:border-primary/50 hover:bg-accent/50",
                    )}
                  >
                    {option}
                    <ArrowRight className="text-muted-foreground size-4" />
                  </button>
                );
              })}
            </div>

            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-6 -ml-2"
                onClick={() => setStep((current) => current - 1)}
              >
                <ArrowLeft />
                Zurück
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
