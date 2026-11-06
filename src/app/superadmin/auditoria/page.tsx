import Link from "next/link";
import { requireSuperadmin } from "@/lib/superadmin";
import { leerAuditoria } from "@/lib/audit";

export default async function AuditoriaPage() {
  await requireSuperadmin();
  const registros = await leerAuditoria(300);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/superadmin" className="text-[11px] text-dim hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-display mt-1">Bitácora de auditoría</h1>
          <p className="text-sm text-muted mt-1">
            Acciones administrativas registradas en esta instalación ({registros.length} eventos).
          </p>
        </div>
      </header>

      {registros.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-8 text-center text-sm text-muted">
          Todavía no hay eventos. Se registrarán al crear, editar o eliminar negocios.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-panel text-left text-[11px] uppercase tracking-wider text-dim">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Objetivo</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 text-xs whitespace-nowrap">
                    {new Date(r.fecha).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2 text-xs">{r.actor}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full border border-border">{r.accion}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-dim">{r.objetivo ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted">{r.detalle ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
