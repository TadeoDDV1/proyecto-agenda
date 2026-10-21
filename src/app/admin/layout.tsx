import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

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
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
