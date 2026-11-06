import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { stopImpersonationAction } from "@/app/actions/impersonate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const store = await cookies();
  const impersonando = Boolean(store.get("agenda_super")?.value);

  // Toda la sección /admin exige sesión: sin esto, cualquiera vería el primer negocio.
  if (!session) {
    redirect("/login?next=/admin");
  }

  // El superadministrador de plataforma no opera dentro de un negocio:
  // su panel es /superadmin.
  if (session.role === "SUPERADMIN") {
    redirect("/superadmin");
  }

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { slug: "barberia-vintage" },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst();
  }

  return (
    <div className="min-h-screen bg-base text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-accent-fg focus:text-sm focus:font-medium"
      >
        Saltar al contenido
      </a>

      {tenant && (
        <AdminSidebar
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          userEmail={session?.email}
          userName={session?.fullName}
          userRole={session?.role}
        />
      )}

      {/* Área de contenido desplazada para dejar espacio al Sidebar en desktop */}
      <div
        id="contenido"
        tabIndex={-1}
        className="lg:pl-64 flex flex-col min-h-screen focus:outline-none"
      >
        {impersonando && (
          <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-warning-text">
              Estás viendo el panel como <strong>{tenant?.name}</strong> (modo soporte).
            </span>
            <form action={stopImpersonationAction}>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg border border-warning/40 text-warning-text hover:bg-warning/10"
              >
                Volver al panel de plataforma
              </button>
            </form>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
