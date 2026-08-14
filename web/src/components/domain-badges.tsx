import { Badge } from "@/components/ui/badge";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  DOCUMENT_SOURCE_LABEL,
  DOCUMENT_STATUS_LABEL,
  type DocumentSource,
  type DocumentStatus,
  type DocumentType,
  type VatRate,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const tone: Record<DocumentStatus, string> = {
    verarbeitung: "bg-muted text-muted-foreground",
    pruefung: "bg-warning-muted text-warning",
    gebucht: "bg-success-muted text-primary",
    exportiert: "bg-secondary text-secondary-foreground",
  };
  return (
    <Badge className={cn("font-medium", tone[status])}>
      {DOCUMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: DocumentType }) {
  return (
    <Badge variant="outline" className="font-normal">
      {type}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: DocumentSource }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        source === "erechnung" && "border-primary/30 text-primary",
      )}
    >
      {DOCUMENT_SOURCE_LABEL[source]}
    </Badge>
  );
}

export function VatBadge({ rate }: { rate: VatRate }) {
  return (
    <span className="text-muted-foreground tabular text-xs">{rate} %</span>
  );
}

export function PfandBadge() {
  return (
    <Badge className="bg-lime text-lime-foreground font-medium">Pfand</Badge>
  );
}

export function ConfidenceDot({ confidence }: { confidence: number }) {
  const needsReview = confidence < CONFIDENCE_REVIEW_THRESHOLD;
  return (
    <span
      role="img"
      aria-label={`Erkennungssicherheit ${Math.round(confidence * 100)} Prozent`}
      title={`Erkennungssicherheit ${Math.round(confidence * 100)} %`}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        needsReview ? "bg-warning" : "bg-primary/40",
      )}
    />
  );
}
