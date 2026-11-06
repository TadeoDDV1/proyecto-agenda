import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin, parseFeatures } from "@/lib/superadmin";

export default async function SuperadminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  await requireSuperadmin();
  const { q, estado = "todos" } = await searchParams;
  const busqueda = (q || "").trim();

  // Nunca se lista el negocio interno de la plataforma.
  const where = {
    isPlatform: false,
    ...(estado === "activos" ? { isActive: true } : {}),
    ...(estado === "suspendidos" ? { isActive: false } : {}),
    ...(busqueda
      ? {
          OR: [
            { name: { contains: busqueda, mode: "insensitive" as const } },
            { slug: { contains: busqueda, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const ahora = new Date();
  const enSieteDias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [tenants, totales, porEstado, proximasConfirmadas, citasSemana] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, services: true, staff: true } },
      },
    }),
    Promise.all([
      prisma.tenant.count({ where: { isPlatform: false } }),
      prisma.tenant.count({ where: { isPlatform: false, isActive: true } }),
      prisma.user.count({ where: { tenant: { isPlatform: false } } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    ]),
    prisma.appointment.groupBy({ by: ["tenantId", "status"], _count: true }),
    prisma.appointment.groupBy({
      by: ["tenantId"],
      where: { status: "CONFIRMED", startTime: { gte: ahora } },
      _min: { startTime: true },
    }),
    prisma.appointment.count({
      where: { status: "CONFIRMED", startTime: { gte: ahora, lte: enSieteDias } },
    }),
  ]);

  const [nNegocios, nActivos, nUsuarios, nCitas, nConfirmadas] = totales;
  const nSuspendidos = nNegocios - nActivos;

  // Índices por negocio: total, confirmadas, pendientes y próxima cita confirmada.
  const stats = new Map<
    string,
    { total: number; confirmadas: number; pendientes: number; proxima: Date | null }
  >();
  for (const t of tenants) {
    stats.set(t.id, { total: 0, confirmadas: 0, pendientes: 0, proxima: null });
  }
  for (const fila of porEstado) {
    const s = stats.get(fila.tenantId);
    if (!s) continue;
    s.total += fila._count;
    if (fila.status === "CONFIRMED") s.confirmadas += fila._count;
    if (fila.status === "PENDING") s.pendientes += fila._count;
  }
  for (const p of proximasConfirmadas) {
    const s = stats.get(p.tenantId);
    if (s) s.proxima = p._min.startTime ?? null;
  }

  const kpis = [
    { label: "Negocios", value: nNegocios },
    { label: "Activos", value: nActivos },
    { label: "Suspendidos", value: nSuspendidos },
    { label: "Usuarios", value: nUsuarios },
    { label: "Citas totales", value: nCitas },
    { label: "Confirmadas", value: nConfirmadas },
    { label: "Confirmadas 7 días", value: citasSemana },
  ];

  const chip = (key: string, label: string) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    if (key !== "todos") p.set("estado", key);
    const s = p.toString();
    return {
      href: `/superadmin${s ? `?${s}` : ""}`,
      activo: estado === key,
      label,
    };
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-dim">Panel de plataforma</p>
          <h1 className="text-2xl font-display mt-1">Todos los negocios</h1>
          <p className="text-sm text-muted mt-1">
            Altas, planes, límites, funciones, suspensión y actividad de citas por negocio.
          </p>
        </div>
        <Link
          href="/superadmin/citas"
          className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-panel"
        >
          Ver todas las citas →
        </Link>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-panel p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dim">{k.label}</p>
            <p className="text-2xl font-display mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[chip("todos", "Todos"), chip("activos", "Activos"), chip("suspendidos", "Suspendidos")].map(
          (c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                c.activo
                  ? "bg-accent text-accent-fg border-accent"
                  : "border-border text-muted hover:bg-panel"
              }`}
            >
              {c.label}
            </Link>
          )
        )}
      </div>

      <form className="flex gap-2" action="/superadmin">
        {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o identificador…"
          className="flex-1 rounded-lg border border-border bg-base px-3 py-2 text-sm"
        />
        <button className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm">Buscar</button>
        <Link
          href="/superadmin/nuevo"
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-panel"
        >
          + Nuevo negocio
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel text-left text-[11px] uppercase tracking-wider text-dim">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="px-4 py-3">Citas</th>
              <th className="px-4 py-3">Confirmadas</th>
              <th className="px-4 py-3">Próxima confirmada</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const f = parseFeatures(t.features);
              const s = stats.get(t.id)!;
              return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-[11px] text-dim">/b/{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border">
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
                      <span className="text-xs text-success">Activo</span>
                    ) : (
                      <span className="text-xs text-error">Suspendido</span>
                    )}
                    {f.whatsappBot && <span className="ml-2 text-[10px] text-dim">WA</span>}
                  </td>
                  <td className="px-4 py-3">{t._count.users}</td>
                  <td className="px-4 py-3">
                    {s.total > 0 ? (
                      <span>
                        {s.total}
                        {s.pendientes > 0 && (
                          <span className="ml-1 text-[10px] text-accent-warm">
                            ({s.pendientes} pend.)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[11px] text-dim">sin citas</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.confirmadas > 0 ? (
                      <span className="text-success font-medium">{s.confirmadas}</span>
                    ) : (
                      <span className="text-[11px] text-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {s.proxima ? (
                      new Date(s.proxima).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/superadmin/negocios/${t.id}`}
                      className="text-xs text-accent-warm hover:underline"
                    >
                      Administrar →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                  No hay negocios que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
