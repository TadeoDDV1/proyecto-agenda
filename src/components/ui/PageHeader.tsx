import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-border",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-light tracking-tight text-foreground font-display text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
