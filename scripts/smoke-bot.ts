/**
 * Smoke test del motor del bot, sin WhatsApp.
 *
 * Simula una conversación completa contra la base real: reservar, ver la cita
 * y cancelarla. Crea un cliente temporal y lo borra al final (con sus citas).
 *
 *   npm run bot:smoke
 */

import { prisma } from "@/lib/prisma";
import { handleInbound } from "@/lib/whatsapp/engine";
import type { FlowContext } from "@/lib/whatsapp/types";
import type { ConversationState } from "@prisma/client";

const TEST_PHONE = "+525500000001";
const TEST_NAME = "Cliente de Prueba Bot";
const MAX_TURNS = 20;

function chooseReply(state: ConversationState): string {
  switch (state) {
    case "BOOK_SERVICE":
    case "BOOK_STAFF":
    case "BOOK_DATE":
    case "BOOK_SLOT":
    case "BOOK_CONFIRM":
    case "MANAGE_LIST":
    case "MANAGE_DETAIL":
    case "CANCEL_CONFIRM":
      return "1";
    case "BOOK_NAME":
      return TEST_NAME;
    default:
      return "1";
  }
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "barberia-vintage" },
  });

  if (!tenant) {
    throw new Error("No existe el tenant de prueba (barberia-vintage).");
  }

  console.log(`\n▸ Tenant: ${tenant.name} (${tenant.timezone})`);
  console.log(`▸ Teléfono de prueba: ${TEST_PHONE}\n`);

  // Limpieza de una corrida anterior que haya quedado a medias.
  await prisma.customer.deleteMany({
    where: { tenantId: tenant.id, phone: TEST_PHONE },
  });

  let state: ConversationState = "MENU";
  let context: FlowContext = {};
  let text = "hola";
  let lastReplies: string[] = [];

  console.log(`👤 ${text}`);

  for (let turn = 0; turn < MAX_TURNS; turn += 1) {
    const result = await handleInbound({
      tenant,
      state,
      context,
      waId: TEST_PHONE,
      text,
      providerMessageId: `smoke-${Date.now()}-${turn}`,
      expiresAt: null,
    });

    lastReplies = result.replies;
    for (const reply of result.replies) {
      console.log(`🤖 ${reply.replace(/\n/g, "\n   ")}\n`);
    }

    state = result.state;
    context = result.context;

    // La reserva terminó: el motor vuelve al menú y ya hay cita.
    if (state === "MENU" && turn > 0) break;

    text = chooseReply(state);
    console.log(`👤 ${text}`);
  }

  const customer = await prisma.customer.findUnique({
    where: { tenantId_phone: { tenantId: tenant.id, phone: TEST_PHONE } },
    include: { appointments: true },
  });

  if (!customer) {
    throw new Error(
      `No se creó el cliente. Última respuesta:\n${lastReplies.join("\n---\n")}`
    );
  }

  const created = customer.appointments[0];
  if (!created) {
    throw new Error(
      `No se creó la cita. Última respuesta:\n${lastReplies.join("\n---\n")}`
    );
  }

  console.log(
    `✔ Cita creada: ${created.confirmationCode} · ${created.startTime.toISOString()}`
  );

  // Ahora "mis citas" → detalle → cancelar.
  state = "MENU";
  context = { customerName: customer.fullName };
  text = "mis citas";
  console.log(`\n👤 ${text}`);

  for (let turn = 0; turn < 6; turn += 1) {
    const result = await handleInbound({
      tenant,
      state,
      context,
      waId: TEST_PHONE,
      text,
      providerMessageId: `smoke-cancel-${Date.now()}-${turn}`,
      expiresAt: null,
    });

    for (const reply of result.replies) {
      console.log(`🤖 ${reply.replace(/\n/g, "\n   ")}\n`);
    }

    state = result.state;
    context = result.context;

    if (state === "MENU") break;

    text = chooseReply(state);
    console.log(`👤 ${text}`);
  }

  const cancelled = await prisma.appointment.findUnique({
    where: { id: created.id },
    select: { status: true, cancelledAt: true },
  });

  if (cancelled?.status !== "CANCELLED" || !cancelled.cancelledAt) {
    throw new Error(`La cita no quedó cancelada (estado: ${cancelled?.status}).`);
  }

  console.log("✔ Cita cancelada correctamente.");

  await prisma.customer.delete({ where: { id: customer.id } });
  console.log("✔ Datos de prueba eliminados.\n");
}

main()
  .catch(async (error) => {
    console.error("\n✖ Smoke test falló:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
