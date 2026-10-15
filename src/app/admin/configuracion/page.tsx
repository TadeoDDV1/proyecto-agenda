import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TenantSettingsForm } from "@/components/TenantSettingsForm";
import { Settings } from "lucide-react";

export default async function AdminConfiguracionPage() {
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

  if (!tenant) return null;

  return (
    <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-amber-400" />
            Configuración del Salón
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Administra el perfil público, datos de contacto y moneda de {tenant.name}
          </p>
        </div>
      </div>

      <TenantSettingsForm tenant={tenant} />
    </main>
  );
}
