import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin, parseFeatures } from "@/lib/superadmin";
import { TenantConfigForm } from "@/components/TenantConfigForm";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";
import { ImpersonateButton } from "@/components/ImpersonateButton";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperadmin();
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { users: true, staff: true, services: true, customers: true, appointments: true } },
    },
  });

  if (!tenant) notFound();

  const citas = await prisma.appointment.groupBy({
    by: ["status"],
    where: { tenantId: id },
    _count: true,
  });

  const proximas = await prisma.appointment.findMany({
    where: { tenantId: id, status: "CONFIRMED", startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    take: 5,
    include: {
      customer: { select: { fullName: true, phone: true } },
      service: { select: { name: true } },
      staff: { select: { displayName: true } },
    },
  });

  const features = parseFeatures(tenant.features);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/superadmin" className="text-[11px] text-dim hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-display mt-1">{tenant.name}</h1>
          <p className="text-sm text-muted">
            /b/{tenant.slug} · Plan {tenant.plan} ·{" "}
            {tenant.isActive ? <span className="text-success">Activo</span> : <span className="text-error">Suspendido</span>}
          </p>
        </div>
        <a
          href={`/b/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-panel"
        >
          Abrir portal público ↗
        </a>
        <ImpersonateButton tenantId={tenant.id} />
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Usuarios", tenant._count.users],
          ["Colaboradores", tenant._count.staff],
          ["Servicios", tenant._count.services],
          ["Clientes", tenant._count.customers],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-panel p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dim">{label}</p>
            <p className="text-2xl font-display mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-panel p-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-dim mb-2">
          Citas ({tenant._count.appointments})
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {citas.length === 0 && <span className="text-muted">Sin citas registradas.</span>}
          {citas.map((c) => (
            <span key={c.status} className="px-2 py-1 rounded-full border border-border">
              {c.status}: <strong>{c._count}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-dim">
            Próximas citas confirmadas
          </p>
          <Link
            href={`/superadmin/citas?negocio=${tenant.id}&estado=CONFIRMED`}
            className="text-[11px] text-accent-warm hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {proximas.length === 0 ? (
          <p className="text-xs text-muted">Sin citas confirmadas próximas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {proximas.map((c) => (
              <li
                key={c.id}
                className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className="font-medium">
                  {new Date(c.startTime).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-muted">
                  {c.customer.fullName} · {c.service.name} · {c.staff.displayName}
                </span>
                <span className="text-dim">${Number(c.totalPrice).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TenantConfigForm
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          currency: tenant.currency,
          isActive: tenant.isActive,
          maxStaff: tenant.maxStaff,
          maxServices: tenant.maxServices,
          suspendedReason: tenant.suspendedReason,
          notes: tenant.notes,
          features,
          isPlatform: tenant.isPlatform,
        }}
      />

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-panel text-[11px] uppercase tracking-wider text-dim">
          Usuarios del negocio ({tenant.users.length})
        </div>
        <table className="w-full text-sm">
          <tbody>
            {tenant.users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2 text-dim">{u.email}</td>
                <td className="px-4 py-2 text-xs">{u.role}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[11px] text-dim">
                      {new Date(u.createdAt).toLocaleDateString("es-MX")}
                    </span>
                    <ResetPasswordButton userId={u.id} email={u.email} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
