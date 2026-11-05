/**
 * Vista previa del panel para la portada. Es decorativa y no consume datos:
 * muestra un giro clínico para dejar claro que el producto no es solo barbería.
 */
export function ProductPreview() {
  const staff = [
    { name: "Dra. Ríos", color: "#0F766E" },
    { name: "Dr. Mena", color: "#1F3BFF" },
    { name: "Dra. Lozano", color: "#7C3AED" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none" aria-hidden="true">
      {/* Halo señal */}
      <div className="pointer-events-none absolute -inset-10 rounded-[8px] bg-[radial-gradient(55%_55%_at_50%_35%,rgba(31,59,255,0.10),transparent_72%)] blur-2xl" />

      {/* Marco */}
      <div className="relative overflow-hidden rounded-[4px] border border-border-strong bg-surface">
        {/* Barra superior */}
        <div className="flex h-11 items-center justify-between border-b border-border bg-surface-raised px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[2px] border border-accent/40 bg-accent-soft font-mono text-[9px] font-semibold text-accent">
              DN
            </span>
            <span className="truncate text-[11px] font-semibold text-foreground">
              Clínica Dental Norte
            </span>
          </div>
          <span className="flex flex-shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Hoy · 4 citas
          </span>
        </div>

        {/* Cabecera de especialistas */}
        <div className="grid grid-cols-[44px_repeat(3,minmax(0,1fr))] border-b border-border bg-base/60">
          <div className="border-r border-border" />
          {staff.map((s) => (
            <div
              key={s.name}
              className="flex min-w-0 items-center gap-1.5 border-r border-border px-2.5 py-2 last:border-r-0"
            >
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-[10px] font-medium text-muted">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        <div className="divide-y divide-border-subtle">
          {/* 09:00 */}
          <div className="grid min-h-[58px] grid-cols-[44px_repeat(3,minmax(0,1fr))]">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] text-dim">09:00</div>
            <div className="border-r border-border p-1.5">
              <div className="rounded-[2px] border-l-2 border-success bg-success/10 px-2 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Limpieza dental
                </p>
                <p className="truncate text-[8px] leading-tight text-success-text">45 min · $850</p>
              </div>
            </div>
            <div className="border-r border-border p-1.5" />
            <div className="p-1.5">
              <div className="rounded-[2px] border border-border bg-surface-raised px-2 py-1">
                <p className="truncate text-[9px] font-medium leading-tight text-foreground">
                  Blanqueamiento
                </p>
                <p className="truncate text-[8px] leading-tight text-muted">60 min · $2,400</p>
              </div>
            </div>
          </div>

          {/* 10:00 */}
          <div className="grid min-h-[58px] grid-cols-[44px_repeat(3,minmax(0,1fr))] bg-surface-raised/40">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] font-semibold text-accent">
              10:00
            </div>
            <div className="border-r border-border p-1.5" />
            <div className="border-r border-border p-1.5">
              <div className="rounded-[2px] border-l-2 border-accent bg-accent-soft px-2 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Ortodoncia · control
                </p>
                <p className="truncate text-[8px] leading-tight text-accent">30 min · $700</p>
              </div>
            </div>
            <div className="p-1.5" />
          </div>

          {/* 11:00 */}
          <div className="grid min-h-[58px] grid-cols-[44px_repeat(3,minmax(0,1fr))]">
            <div className="border-r border-border px-2 py-2 font-mono text-[8px] text-dim">11:00</div>
            <div className="border-r border-border p-1.5" />
            <div className="border-r border-border p-1.5" />
            <div className="p-1.5">
              <div className="rounded-[2px] border-l-2 border-error bg-error/10 px-2 py-1">
                <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                  Primera visita
                </p>
                <p className="truncate text-[8px] leading-tight text-error-text">40 min · $500</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas del día */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-surface-raised/60">
          {[
            { label: "Ingresos hoy", value: "$4,850" },
            { label: "Ocupación", value: "72%" },
            { label: "Próxima llegada", value: "10:00" },
          ].map((m) => (
            <div key={m.label} className="px-3 py-2.5">
              <p className="text-[8px] uppercase tracking-[0.1em] text-dim">{m.label}</p>
              <p className="mt-0.5 font-display text-sm text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
