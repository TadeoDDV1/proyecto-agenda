import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { buttonClasses } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-12 h-12 rounded-[4px] bg-surface-raised border border-border text-accent-warm flex items-center justify-center mx-auto">
          <Compass className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <p className="eyebrow-plain mb-2">
            Error 404
          </p>
          <h1 className="font-display text-3xl font-light tracking-tight text-foreground">
            Página no encontrada
          </h1>
          <p className="text-sm text-muted mt-2">
            El enlace que buscas no existe o el negocio ya no está disponible.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={buttonClasses("primary", "md")}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <Link href="/login" className={buttonClasses("secondary", "md")}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
