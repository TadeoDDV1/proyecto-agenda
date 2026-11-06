import { requireTenant } from "@/lib/auth";
import { TenantSettingsForm } from "@/components/TenantSettingsForm";
import { PageHeader } from "@/components/ui";

export default async function AdminConfiguracionPage() {
  const { tenant } = await requireTenant();

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
