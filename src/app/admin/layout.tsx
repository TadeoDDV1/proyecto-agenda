import { requireTenant } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, tenant } = await requireTenant();

  return (
    <div className="min-h-screen bg-base text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-accent-fg focus:text-sm focus:font-medium"
      >
        Saltar al contenido
      </a>

      <AdminSidebar
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        userEmail={session.email}
        userName={session.fullName}
        userRole={session.role}
      />

      {/* Área de contenido desplazada para dejar espacio al Sidebar en desktop */}
      <div
        id="contenido"
        tabIndex={-1}
        className="lg:pl-64 flex flex-col min-h-screen focus:outline-none"
      >
        {children}
      </div>
    </div>
  );
}
