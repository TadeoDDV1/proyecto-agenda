import { Check, MessageCircle } from "lucide-react";

/**
 * Mockup estático del panel. Es decorativo: representa la agenda real
 * (calendario por especialista + métricas del día) sin depender de la BD.
 */
export function ProductPreview() {
  const staff = [
    { name: "Mateo", color: "#818cf8" },
    { name: "Valentina", color: "#f472b6" },
    { name: "Lucas", color: "#34d399" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none" aria-hidden="true">
      {/* Halo */}
      <div className="pointer-events-none absolute -inset-10 rounded-[2rem] bg-[radial-gradient(55%_55%_at_50%_35%,rgba(95,98,238,0.22),transparent_72%)] blur-2xl" />

      {/* Marco */}
      <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        {/* Barra superior */}
        <div className="flex h-11 items-center justify-between border-b border-border bg-surface-raised px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent-soft font-display text-[10px] italic text-accent-warm">
              B
            </span>
            <span className="truncate text-[11px] font-medium text-foreground">
              Barbería &amp; Spa Vintage
            </span>
          </div>
          <span className="flex-shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-dim">
            Hoy · 3 citas
          </span>
        </div>

        {/* Cabecera de especialistas */}
        <div className="grid grid-cols-[42px_repeat(3,minmax(0,1fr))] border-b border-border bg-base/40">
          <div className="border-r border-border" />
          {staff.map((s) => (
            <div
              key={s.name}
              className="flex min-w-0 items-center gap-1.5 border-r border-border px-2 py-2 last:border-r-0"
            >
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-[9px] font-semibold text-muted">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        <div className="divide-y divide-border-subtle">
          {/* 09:00 */}
          <div className="grid min-h-[58px] grid-cols-[42px_repeat(3,minmax(0,1fr))]">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] text-dim">09:00</div>
            <div className="border-r border-border p-1.5">
              <div className="rounded-md border border-accent/30 bg-accent-soft px-1.5 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Corte clásico
                </p>
                <p className="truncate text-[8px] leading-tight text-muted">30 min · $250</p>
              </div>
            </div>
            <div className="border-r border-border p-1.5" />
            <div className="p-1.5">
              <div className="rounded-md border border-border bg-surface-raised px-1.5 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Tinte completo
                </p>
                <p className="truncate text-[8px] leading-tight text-muted">60 min · $480</p>
              </div>
            </div>
          </div>

          {/* 10:00 */}
          <div className="grid min-h-[58px] grid-cols-[42px_repeat(3,minmax(0,1fr))] bg-surface-raised/30">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] text-accent-warm">
              10:00
            </div>
            <div className="border-r border-border p-1.5" />
            <div className="border-r border-border p-1.5">
              <div className="rounded-md border border-border bg-surface-raised px-1.5 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Fade / Degradado
                </p>
                <p className="truncate text-[8px] leading-tight text-muted">40 min · $300</p>
              </div>
            </div>
            <div className="p-1.5" />
          </div>

          {/* 11:00 */}
          <div className="grid min-h-[58px] grid-cols-[42px_repeat(3,minmax(0,1fr))]">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] text-dim">11:00</div>
            <div className="border-r border-border p-1.5" />
            <div className="border-r border-border p-1.5" />
            <div className="p-1.5">
              <div className="rounded-md border border-border bg-surface-raised px-1.5 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Barba + toalla
                </p>
                <p className="truncate text-[8px] leading-tight text-muted">35 min · $220</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas del día */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-surface-raised/60">
          {[
            { label: "Ingresos hoy", value: "$1,030" },
            { label: "Ocupación", value: "78%" },
            { label: "Próxima", value: "10:00" },
          ].map((m) => (
            <div key={m.label} className="px-3 py-2.5">
              <p className="text-[8px] uppercase tracking-[0.1em] text-dim">{m.label}</p>
              <p className="mt-0.5 font-display text-sm font-light text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insignias flotantes */}
      <div className="absolute -right-3 top-14 hidden items-center gap-1.5 rounded-full border border-success/25 bg-surface px-2.5 py-1 shadow-lg shadow-black/40 sm:flex">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success/15 text-success-text">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
        <span className="text-[9px] font-semibold text-success-text">Sin solapamientos</span>
      </div>

      <div className="absolute -left-3 -bottom-4 hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 shadow-lg shadow-black/40 sm:flex">
        <MessageCircle className="h-3 w-3 text-accent-warm" />
        <span className="text-[9px] font-medium text-muted">Recordatorio enviado</span>
      </div>
    </div>
  );
}
