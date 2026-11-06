import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader, Card, Badge } from "@/components/ui";
import { RevokeSessionsButton } from "@/components/RevokeSessionsButton";
import { ShieldCheck } from "lucide-react";

const ETIQUETA: Record<string, string> = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  STAFF: "Colaborador",
  SUPERADMIN: "Plataforma",
};

export default async function SesionesPage() {
  const session = await requireSession();

  // Solo dueño y administrador pueden gestionar el acceso del equipo.
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    redirect("/admin");
  }

  const usuarios = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      lastLoginAt: true,
      tokenVersion: true,
    },
  });

  const activos = usuarios.filter((u) => u.lastLoginAt).length;

  return (
    <main className="p-5 sm:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
      <PageHeader
        eyebrow="Seguridad"
        title="Sesiones del equipo"
        description="Consulta el último acceso de cada usuario y cierra sus sesiones cuando deje de trabajar contigo."
        action={<Badge>{activos} con acceso registrado</Badge>}
      />

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-[11px] uppercase tracking-wider text-dim">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3 text-right">Sesiones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-[11px] text-dim">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-border">
                    {ETIQUETA[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Nunca ha entrado"}
                </td>
                <td className="px-4 py-3 text-right">
                  <RevokeSessionsButton
                    userId={u.id}
                    email={u.email}
                    activo={Boolean(u.lastLoginAt)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-start gap-2 text-xs text-muted">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Cerrar sesiones invalida de inmediato todos los dispositivos donde ese usuario tenía la
          sesión abierta. Volverá a entrar con su correo y contraseña.
        </p>
      </div>
    </main>
  );
}
