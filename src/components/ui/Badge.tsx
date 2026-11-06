import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeTone = "default" | "accent" | "success" | "warning" | "error" | "info";

const toneStyles: Record<BadgeTone, string> = {
  default: "text-muted border-border bg-transparent",
  accent: "text-accent border-accent/40 bg-accent-soft",
  success: "text-success-text border-success/30 bg-success/10",
  warning: "text-warning-text border-warning/30 bg-warning/10",
  error: "text-error-text border-error/30 bg-error/10",
  info: "text-info-text border-info/30 bg-info/10",
};

export interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const appointmentStatusMeta: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  CONFIRMED: { label: "Confirmada", tone: "success" },
  COMPLETED: { label: "Completada", tone: "info" },
  CANCELLED: { label: "Cancelada", tone: "error" },
  NO_SHOW: { label: "No asistió", tone: "default" },
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = appointmentStatusMeta[status] ?? {
    label: status,
    tone: "default" as BadgeTone,
  };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}
