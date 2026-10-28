/**
 * Smoke test del dominio contra la base local.
 *
 *   npx tsx scripts/smoke-booking.ts
 *
 * Verifica zona horaria, disponibilidad, creación, doble reserva concurrente
 * y cancelación. No forma parte del build.
 */

import { prisma } from "../src/lib/prisma";
import {
  cancelAppointment,
  createAppointment,
  getDayAvailability,
  getUpcomingAvailability,
} from "../src/lib/booking";
import { addDaysToDateKey, formatDateKeyInZone } from "../src/lib/booking/time";

async function main() {
  const tenant = await prisma.tenant.findFirstOrThrow({
    where: { slug: "barberia-vintage" },
  });
  const service = await prisma.service.findFirstOrThrow({
    where: { tenantId: tenant.id, name: { contains: "Clásico" } },
  });

  console.log("TZ:", tenant.timezone);
  console.log(
    "Hoy en el tenant:",
    formatDateKeyInZone(new Date(), tenant.timezone),
    "| servidor:",
    formatDateKeyInZone(new Date(), "UTC"),
    "UTC"
  );

  const dateKey = addDaysToDateKey(
    formatDateKeyInZone(new Date(), tenant.timezone),
    1
  );

  const days = await getUpcomingAvailability({
    tenantId: tenant.id,
    serviceId: service.id,
    days: 3,
  });
  if (!days.ok) throw new Error(days.message);
  console.log("Próximos días:", days.data.days);

  const day = await getDayAvailability({
    tenantId: tenant.id,
    serviceId: service.id,
    dateKey,
  });
  if (!day.ok) throw new Error(day.message);
  console.log(`Slots ${dateKey}:`, day.data.slots.map((s) => s.time).join(", "));

  const slot = day.data.slots[0];
  if (!slot) {
    console.log("Sin slots libres; nada que probar.");
    return;
  }

  // Dos reservas simultáneas al mismo horario: solo una debe ganar.
  const [first, second] = await Promise.all([
    createAppointment({
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: slot.staffId,
      dateKey,
      time: slot.time,
      customer: { fullName: "Prueba Concurrente A", phone: "55 0000 0001" },
      source: "WEB",
    }),
    createAppointment({
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: slot.staffId,
      dateKey,
      time: slot.time,
      customer: { fullName: "Prueba Concurrente B", phone: "55 0000 0002" },
      source: "WEB",
    }),
  ]);

  const wins = [first, second].filter((result) => result.ok);
  console.log(
    `Concurrencia: ${wins.length} ganadora(s), códigos:`,
    [first, second]
      .filter((result) => !result.ok)
      .map((result) => (!result.ok ? result.code : ""))
  );

  if (wins.length !== 1) {
    throw new Error(`Se esperaba exactamente 1 cita, hubo ${wins.length}`);
  }

  const created = wins[0];
  if (!created.ok) return;

  console.log("Cita creada:", {
    code: created.data.confirmationCode,
    local: `${created.data.localDate} ${created.data.localTime}`,
    utc: created.data.startTime,
    staff: created.data.staffName,
  });

  const cancelled = await cancelAppointment({
    tenantId: tenant.id,
    appointmentId: created.data.id,
    reason: "smoke test",
  });
  console.log("Cancelada:", cancelled.ok, cancelled.ok ? cancelled.data.late : cancelled);

  // Limpieza de clientes de prueba
  await prisma.customer.deleteMany({
    where: { tenantId: tenant.id, fullName: { startsWith: "Prueba Concurrente" } },
  });
}

main()
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
