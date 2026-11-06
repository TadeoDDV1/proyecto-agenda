import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cargarContexto, responder, obtenerSesion, guardarSesion } from "@/lib/chatbot/engine";

/**
 * Webhook para WhatsApp Cloud API (Meta).
 *
 * Variables de entorno opcionales:
 *   WA_VERIFY_TOKEN  cadena que se compara en la verificación GET
 *   WA_PHONE_MAP     JSON { "<phone_number_id>": "<slug del negocio>" }
 *   WA_TOKEN         token de acceso para responder por Graph API
 *
 * Sin WA_TOKEN el bot no envía mensajes: solo responde en el log (modo dev).
 */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === (process.env.WA_VERIFY_TOKEN ?? "agenda-verify")) {
    return new NextResponse(challenge ?? "ok", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

function tenantSlugDesdePhoneId(phoneNumberId: string): string | null {
  try {
    const mapa = JSON.parse(process.env.WA_PHONE_MAP ?? "{}");
    return mapa[phoneNumberId] ?? null;
  } catch {
    return null;
  }
}

async function enviar(phoneNumberId: string, to: string, texto: string) {
  const token = process.env.WA_TOKEN;
  if (!token) {
    console.log("[chatbot] respuesta simulada →", to, ":", texto.slice(0, 120));
    return;
  }
  await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto },
    }),
  }).catch((e) => console.error("Error enviando a WhatsApp:", e));
}

export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cambio = payload?.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId: string | undefined = cambio?.metadata?.phone_number_id;
  const mensajes: any[] = cambio?.messages ?? [];

  if (!phoneNumberId || mensajes.length === 0) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  // El negocio se resuelve por el número que recibió el mensaje.
  // Orden: mapa phone_number_id → slug · ?tenant= · WA_DEFAULT_TENANT
  const slug =
    tenantSlugDesdePhoneId(phoneNumberId) ??
    new URL(req.url).searchParams.get("tenant") ??
    process.env.WA_DEFAULT_TENANT ??
    null;
  if (!slug) {
    console.warn("[chatbot] número sin negocio asociado:", phoneNumberId);
    return NextResponse.json({ ok: true, sinNegocio: true });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, isActive: true, isPlatform: true, features: true },
  });

  if (!tenant || tenant.isPlatform || !tenant.isActive) {
    return NextResponse.json({ ok: true, inactivo: true });
  }

  const ctx = await cargarContexto(tenant.id);
  if (!ctx) return NextResponse.json({ ok: true, sinContexto: true });

  for (const m of mensajes) {
    const from = m?.from as string;
    const texto = m?.text?.body ?? "";
    if (!from || !texto) continue;

    const sesion = obtenerSesion(`wa:${from}`);
    const salida = await responder(ctx, sesion, texto, from);
    guardarSesion(`wa:${from}`, salida.sesion);
    await enviar(phoneNumberId, from, salida.texto);
  }

  // Meta exige 200 rápido.
  return NextResponse.json({ ok: true });
}
