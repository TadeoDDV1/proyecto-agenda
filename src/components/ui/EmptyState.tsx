import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-10 sm:p-14 text-center rounded-[4px] border border-dashed border-border bg-surface/60",
        className
      )}
    >
      {icon && (
        <div className="w-11 h-11 rounded-[3px] bg-surface-raised border border-border flex items-center justify-center mx-auto mb-4 text-dim">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-medium text-muted">{title}</h4>
      {description && (
        <p className="text-xs text-dim mt-1.5 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
