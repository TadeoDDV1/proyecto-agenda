import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cargarContexto, responder, obtenerSesion, guardarSesion } from "@/lib/chatbot/engine";

/**
 * Endpoint del simulador y de integraciones propias.
 * POST { tenantSlug, sessionId, mensaje, telefono }
 */
export async function POST(req: Request) {
  let body: {
    tenantSlug?: string;
    tenantId?: string;
    sessionId?: string;
    mensaje?: string;
    telefono?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { tenantSlug, tenantId, mensaje = "", telefono = "demo-000" } = body;
  const sessionId = body.sessionId || "demo";

  if (!tenantSlug && !tenantId) {
    return NextResponse.json({ error: "Falta tenantSlug o tenantId" }, { status: 400 });
  }
  if (!mensaje.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: tenantId ? { id: tenantId } : { slug: tenantSlug },
    select: { id: true, isActive: true, isPlatform: true },
  });

  if (!tenant || tenant.isPlatform || !tenant.isActive) {
    return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
  }

  const ctx = await cargarContexto(tenant.id);
  if (!ctx) return NextResponse.json({ error: "Negocio sin configuración" }, { status: 404 });

  const sesion = obtenerSesion(sessionId);
  const salida = await responder(ctx, sesion, mensaje, telefono);
  guardarSesion(sessionId, salida.sesion);

  return NextResponse.json({
    reply: salida.texto,
    paso: salida.sesion.paso,
    citaCreada: salida.citaCreada ?? null,
  });
}
