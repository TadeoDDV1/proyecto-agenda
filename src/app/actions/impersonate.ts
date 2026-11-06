"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/superadmin";
import { setSessionCookie, createSessionToken, verifySessionToken } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";

const COOKIE_RESPALDO = "agenda_super";

/**
 * El superadministrador entra al panel de un negocio como su dueño.
 * La sesión original se guarda en una cookie aparte para poder volver.
 */
export async function impersonateTenantAction(tenantId: string) {
  const actor = await requireSuperadmin();

  const owner = await prisma.user.findFirst({
    where: { tenantId, role: "OWNER" },
    include: { tenant: { select: { slug: true, name: true } } },
  });

  if (!owner) {
    return { success: false, error: "El negocio no tiene un usuario dueño." };
  }

  // Respaldo de la sesión de plataforma (1 hora).
  const respaldo = await createSessionToken({
    userId: actor.userId,
    tenantId: actor.tenantId,
    role: actor.role,
    email: actor.email,
    fullName: actor.fullName,
  });

  const store = await cookies();
  store.set(COOKIE_RESPALDO, respaldo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  await setSessionCookie({
    userId: owner.id,
    tenantId: owner.tenantId,
    role: owner.role,
    email: owner.email,
    fullName: owner.fullName,
  });

  await registrarAuditoria({
    actor: actor.email,
    accion: "impersonar_negocio",
    objetivo: owner.tenant.slug,
    detalle: `entró como ${owner.email}`,
  });

  redirect("/admin");
}

/** Vuelve al panel de plataforma con la sesión guardada. */
export async function stopImpersonationAction() {
  const store = await cookies();
  const token = store.get(COOKIE_RESPALDO)?.value;

  if (!token) redirect("/login");

  const payload = await verifySessionToken(token);
  if (!payload) {
    store.delete(COOKIE_RESPALDO);
    redirect("/login");
  }

  await setSessionCookie(payload);
  store.delete(COOKIE_RESPALDO);

  await registrarAuditoria({
    actor: payload.email,
    accion: "fin_impersonacion",
    objetivo: "plataforma",
  });

  redirect("/superadmin");
}
