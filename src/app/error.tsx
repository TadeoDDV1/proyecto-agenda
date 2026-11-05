"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui";

export default function GlobalError({
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
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-12 h-12 rounded-[4px] bg-error/10 border border-error/25 text-error-text flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <p className="eyebrow-plain mb-2">
            Error inesperado
          </p>
          <h1 className="font-display text-2xl font-light tracking-tight text-foreground">
            Algo no salió como esperábamos
          </h1>
          <p className="text-sm text-muted mt-2">
            Vuelve a intentarlo. Si el problema persiste, contacta al
            administrador del sistema.
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
          <Link href="/" className={buttonClasses("secondary", "md")}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
