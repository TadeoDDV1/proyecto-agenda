import Link from "next/link";
import { requireSuperadmin } from "@/lib/superadmin";
import { NewTenantForm } from "@/components/NewTenantForm";

export default async function NewTenantPage() {
  await requireSuperadmin();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/superadmin" className="text-[11px] text-dim hover:underline">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-display mt-1">Nuevo negocio</h1>
        <p className="text-sm text-muted mt-1">
          Da de alta un negocio y su cuenta de propietario desde la plataforma.
        </p>
      </header>

      <NewTenantForm />
    </div>
  );
}
