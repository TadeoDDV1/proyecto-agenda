import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  maxWidth?: string;
  children: ReactNode;
}

const benefits = [
  "Elige tu giro y arranca con catálogo precargado",
  "Agenda por profesional, consultorio o cabina",
  "Portal y bot de WhatsApp sobre la misma disponibilidad",
];

export function AuthShell({
  eyebrow = "Panel de gestión",
  title,
  description,
  maxWidth = "max-w-md",
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-base lg:grid lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(31,59,255,0.08),transparent_70%)]"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-accent/35 bg-accent-soft font-display text-sm text-accent">
            P
          </span>
          <span className="font-display text-[15px] tracking-tight text-foreground">
            Pauta
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow">
            Citas · Equipo · WhatsApp
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-foreground text-balance xl:text-[2.75rem]">
            Tu oficio,{" "}
            <span className="text-accent">en orden.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Elige tu giro y arranca con catálogo, equipo y horario listos.
            Una sola agenda para la web, WhatsApp y el mostrador.
          </p>

          <ul className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent-warm">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-xs leading-relaxed text-muted">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-t border-border pt-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-dim">
            Demo lista para explorar
          </p>
          <p className="mt-1 text-xs text-muted">
            Entra con la cuenta de ejemplo y recorre el panel con datos reales.
          </p>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border lg:hidden">
          <div className="flex h-14 items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-accent/35 bg-accent-soft font-display text-xs text-accent">
                A
              </span>
              <span className="font-display text-xs tracking-tight text-foreground">
                Pauta
              </span>
            </Link>
            <Link
              href="/"
              className="text-[11px] font-medium text-muted transition hover:text-foreground"
            >
              Volver al inicio
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          <div className={`w-full ${maxWidth}`}>
            <div className="mb-7">
              <p className="eyebrow mb-2">
                {eyebrow}
              </p>
              <h1 className="font-display text-3xl font-light tracking-tight text-foreground text-balance">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              )}
            </div>

            {children}
          </div>
        </main>

        <footer className="px-5 pb-6 text-center text-[11px] text-dim">
          Sesiones JWT HttpOnly · Contraseñas bcrypt
        </footer>
      </div>
    </div>
  );
}
