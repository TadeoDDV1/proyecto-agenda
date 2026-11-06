const { PrismaClient } = require("@prisma/client");
const BASE = "http://127.0.0.1:3100";

async function nuevoTurno(slug, sessionId, mensaje) {
  const r = await fetch(`${BASE}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantSlug: slug, sessionId, mensaje, telefono: `demo-${slug}` }),
  });
  const d = await r.json();
  return { status: r.status, ...d };
}

function primerasHoras(texto) {
  const m = texto.match(/\b(\d{2}:\d{2})\b/g);
  return m ? [...new Set(m)] : [];
}

async function conversacion(slug, servicioTexto) {
  const sid = `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`\n=== ${slug} :: pidiendo "${servicioTexto}"`);
  let r = await nuevoTurno(slug, sid, "hola");
  console.log("cliente: hola\nbot:", r.reply.replace(/\n/g, " | "));

  r = await nuevoTurno(slug, sid, servicioTexto);
  console.log(`cliente: ${servicioTexto}\nbot:`, r.reply.replace(/\n/g, " | "));

  if (r.paso === "eligiendo_staff") {
    r = await nuevoTurno(slug, sid, "1");
    console.log("cliente: 1 (primer colaborador)\nbot:", r.reply.replace(/\n/g, " | "));
  }

  r = await nuevoTurno(slug, sid, "mañana");
  const horas = primerasHoras(r.reply);
  console.log("cliente: mañana\nbot:", r.reply.replace(/\n/g, " | "));
  if (horas.length === 0) return { ok: false, motivo: "sin horarios" };

  const hora = horas[0];
  r = await nuevoTurno(slug, sid, hora);
  console.log(`cliente: ${hora}\nbot:`, r.reply.replace(/\n/g, " | "));

  r = await nuevoTurno(slug, sid, "Cliente Prueba Bot");
  console.log("cliente: Cliente Prueba Bot\nbot:", r.reply.replace(/\n/g, " | "));

  r = await nuevoTurno(slug, sid, "si");
  console.log("cliente: si\nbot:", r.reply.replace(/\n/g, " | "));
  return { ok: Boolean(r.citaCreada), cita: r.citaCreada ?? null, hora };
}

(async () => {
  const prisma = new PrismaClient();
  const antes = await prisma.appointment.count();

  // verificación del webhook
  const ok = await fetch(`${BASE}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=agenda-verify&hub.challenge=12345`);
  const mal = await fetch(`${BASE}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=12345`);
  console.log(`webhook verify correcto -> ${ok.status} "${await ok.text()}" | token inválido -> ${mal.status}`);

  const barberia = await conversacion("barberia-vintage", "quiero un corte");
  const estetica = await conversacion("estetica-bella-vista", "manicure");

  const despues = await prisma.appointment.count();
  const nuevas = await prisma.appointment.findMany({
    where: { customerNotes: "Cita creada por el chatbot" },
    include: { tenant: { select: { slug: true } }, service: { select: { name: true } } },
  });
  await prisma.$disconnect();

  console.log(`\nCitas antes: ${antes} → después: ${despues}`);
  console.log("Citas creadas por el bot:");
  for (const n of nuevas) console.log(`  · ${n.tenant.slug} | ${n.service.name} | ${n.startTime.toISOString()} | ${n.status}`);
  console.log(`\nBarbería: ${barberia.ok ? "✅" : "❌"} | Estética: ${estetica.ok ? "✅" : "❌"}`);
})();
