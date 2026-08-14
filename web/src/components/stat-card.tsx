import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "warning" | "inverse";

const valueTone: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-warning",
  inverse: "text-primary-foreground",
};

/**
 * The KPI tile from the Figma kit: micro-label, 30px figure, one line of context.
 * Padding 24, internal rhythm 12.
 *
 * Below `sm` the tiles sit two to a row, which leaves roughly 137px of content
 * width — a 30px figure would clip on "8.926,00 €", so both the figure and the
 * padding step down there.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <Card
      className={cn(
        "h-full gap-3 transition-[box-shadow,border-color,transform] duration-[var(--duration-fast-02)] ease-[var(--ease-standard)]",
        href && "hover:border-primary/40 hover:shadow-e2 hover:-translate-y-px",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.07em] uppercase",
            tone === "inverse"
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {icon ??
          (href ? (
            <ArrowUpRight
              className={cn(
                "size-4",
                tone === "inverse"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            />
          ) : null)}
      </div>
      <p
        className={cn(
          "tabular px-4 text-[22px] leading-[28px] font-semibold sm:px-6 sm:text-[30px] sm:leading-[39px]",
          valueTone[tone],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            "px-4 text-xs leading-relaxed text-pretty sm:px-6",
            tone === "inverse"
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
