import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("panel", className)} />;
}

export interface CardHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  eyebrow,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-border",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[3px] border border-border bg-surface-raised text-accent-warm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow-plain mb-1">{eyebrow}</p>}
          {title && (
            <h3 className="font-display text-base font-normal text-foreground">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
