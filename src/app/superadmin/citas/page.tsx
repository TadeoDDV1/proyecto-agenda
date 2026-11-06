import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/superadmin";
import { AppointmentStatus } from "@prisma/client";

const ESTADOS: { key: string; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "CONFIRMED", label: "Confirmadas" },
  { key: "PENDING", label: "Pendientes" },
  { key: "COMPLETED", label: "Completadas" },
  { key: "CANCELLED", label: "Canceladas" },
  { key: "NO_SHOW", label: "No asistió" },
];

const COLOR: Record<string, string> = {
  CONFIRMED: "text-success",
  PENDING: "text-accent-warm",
  COMPLETED: "text-muted",
  CANCELLED: "text-error",
  NO_SHOW: "text-dim",
};

export default async function SuperadminCitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; negocio?: string; page?: string }>;
}) {
  await requireSuperadmin();
  const { estado = "ALL", negocio = "", page } = await searchParams;
  const POR_PAGINA = 25;
  const pagina = Math.max(1, Number(page) || 1);
  const salto = (pagina - 1) * POR_PAGINA;

  const tenants = await prisma.tenant.findMany({
    where: { isPlatform: false },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const filtroEstado =
    estado !== "ALL" && (Object.values(AppointmentStatus) as string[]).includes(estado)
      ? { status: estado as AppointmentStatus }
      : {};

  const filtroNegocio = negocio ? { tenantId: negocio } : {};

  const [citas, porEstado, totalFiltrado] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...filtroEstado, ...filtroNegocio },
      orderBy: { startTime: "desc" },
      take: POR_PAGINA,
      skip: salto,
      include: {
        tenant: { select: { name: true, slug: true } },
        customer: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
        staff: { select: { displayName: true } },
      },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: filtroNegocio,
      _count: true,
    }),
    prisma.appointment.count({ where: { ...filtroEstado, ...filtroNegocio } }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / POR_PAGINA));

  const total = porEstado.reduce((acc, e) => acc + e._count, 0);
  const confirmadas = porEstado.find((e) => e.status === "CONFIRMED")?._count ?? 0;

  const qs = (nuevo: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = { estado, negocio, page: "", ...nuevo };
    if (merged.estado && merged.estado !== "ALL") p.set("estado", merged.estado);
    if (merged.negocio) p.set("negocio", merged.negocio);
    if (merged.page) p.set("page", merged.page);
    const s = p.toString();
    return `/superadmin/citas${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/superadmin" className="text-[11px] text-dim hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-display mt-1">Citas de todos los negocios</h1>
          <p className="text-sm text-muted mt-1">
            {total} citas registradas · <span className="text-success">{confirmadas} confirmadas</span>
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const activo = estado === e.key;
          return (
            <Link
              key={e.key}
              href={qs({ estado: e.key })}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                activo
                  ? "bg-accent text-accent-fg border-accent"
                  : "border-border text-muted hover:bg-panel"
              }`}
            >
              {e.label}
            </Link>
          );
        })}
      </div>

      {tenants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={qs({ negocio: "" })}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              !negocio ? "bg-panel border-accent text-foreground" : "border-border text-muted hover:bg-panel"
            }`}
          >
            Todos los negocios
          </Link>
          {tenants.map((t) => (
            <Link
              key={t.id}
              href={qs({ negocio: t.id })}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                negocio === t.id
                  ? "bg-panel border-accent text-foreground"
                  : "border-border text-muted hover:bg-panel"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel text-left text-[11px] uppercase tracking-wider text-dim">
            <tr>
              <th className="px-4 py-3">Fecha y hora</th>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {new Date(c.startTime).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/superadmin/negocios/${c.tenantId}`}
                    className="hover:underline text-xs"
                  >
                    {c.tenant.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-xs">
                  <div>{c.customer.fullName}</div>
                  <div className="text-dim">{c.customer.phone}</div>
                </td>
                <td className="px-4 py-2 text-xs">{c.service.name}</td>
                <td className="px-4 py-2 text-xs">{c.staff.displayName}</td>
                <td className={`px-4 py-2 text-xs font-medium ${COLOR[c.status] ?? ""}`}>
                  {c.status}
                </td>
                <td className="px-4 py-2 text-xs text-right">${Number(c.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
            {citas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  No hay citas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-dim">
          Página {pagina} de {totalPaginas} · {totalFiltrado} citas
        </span>
        <div className="flex gap-2">
          {pagina > 1 && (
            <Link href={qs({ page: String(pagina - 1) })} className="px-3 py-1.5 rounded-lg border border-border hover:bg-panel">
              ← Anterior
            </Link>
          )}
          {pagina < totalPaginas && (
            <Link href={qs({ page: String(pagina + 1) })} className="px-3 py-1.5 rounded-lg border border-border hover:bg-panel">
              Siguiente →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
