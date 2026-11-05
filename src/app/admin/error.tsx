"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-12 h-12 rounded-[4px] bg-error/10 border border-error/25 text-error-text flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <p className="eyebrow-plain mb-2">
            Error inesperado
          </p>
          <h1 className="font-display text-2xl font-light tracking-tight text-foreground">
            No pudimos cargar esta sección
          </h1>
          <p className="text-sm text-muted mt-2">
            Intenta de nuevo. Si el problema continúa, revisa la conexión con la
            base de datos.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-dim mt-3">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => retry()}
            leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
          >
            Reintentar
          </Button>
          <Link href="/admin" className={buttonClasses("secondary", "md")}>
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
