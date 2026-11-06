import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TenantSettingsForm } from "@/components/TenantSettingsForm";
import { PageHeader } from "@/components/ui";

export default async function AdminConfiguracionPage() {
  const session = await getSession();

  // Solo dueño o administrador pueden ver la configuración del negocio.
  if (!session || !["OWNER", "ADMIN"].includes(session.role)) {
    redirect("/admin");
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

  if (!tenant) return null;

  return (
    <main className="p-5 sm:p-8 space-y-6 flex-1 max-w-4xl w-full mx-auto">
      <PageHeader
        eyebrow="Administración"
        title="Configuración del Salón"
        description={`Administra el perfil público y datos de contacto de ${tenant.name}.`}
      />

      <TenantSettingsForm tenant={tenant} />
    </main>
  );
}
