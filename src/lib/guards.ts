import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";

export const ROLES_GESTION = ["OWNER", "ADMIN"] as const;
export const ROLES_PLATAFORMA = ["SUPERADMIN"] as const;

/** Exige sesión válida; si no hay, manda al login recordando el destino. */
export async function requireSession(next = "/admin"): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

/** Exige sesión de un negocio (no de plataforma). */
export async function requireTenantSession(next = "/admin"): Promise<SessionPayload> {
  const session = await requireSession(next);
  if (session.role === "SUPERADMIN") redirect("/superadmin");
  if (!session.tenantId) redirect("/login?next=/admin");
  return session;
}

/** Exige rol de gestión (OWNER o ADMIN) para cambios de configuración. */
export async function requireManager(next = "/admin"): Promise<SessionPayload> {
  const session = await requireTenantSession(next);
  if (!ROLES_GESTION.includes(session.role as (typeof ROLES_GESTION)[number])) {
    throw new Error("SIN_PERMISO: se requiere rol de dueño o administrador.");
  }
  return session;
}

export function esGestor(role?: string | null): boolean {
  return ROLES_GESTION.includes((role ?? "") as (typeof ROLES_GESTION)[number]);
}
