import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("w-4 h-4 animate-spin text-accent", className)} />
  );
}

export function LoadingState({
  label = "Cargando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "py-12 flex flex-col items-center justify-center gap-3 text-muted",
        className
      )}
    >
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
