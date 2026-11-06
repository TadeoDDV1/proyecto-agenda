/**
 * Creación de citas.
 *
 * Tres capas contra la doble reserva:
 *  1. transacción SERIALIZABLE con reintento,
 *  2. constraint de exclusión en Postgres (`appointments_no_overlap`),
 *  3. clave de idempotencia (`idempotencyKey`).
 */

import { randomInt } from "node:crypto";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAlternativeSlots } from "./availability";
import { toAppointmentSummary } from "./mapper";
import { normalizePhone } from "./phone";
import {
  addDaysToDateKey,
  dayOfWeekFromDateKey,
  formatDateKeyInZone,
  isValidDateKey,
  isValidTime,
  minutesToTime,
  timeToMinutes,
  zonedToUtc,
} from "./time";
import type {
  AppointmentSummary,
  BookingErrorCode,
  BookingResult,
  CreateAppointmentInput,
  Slot,
} from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ATTEMPTS = 3;

function generateConfirmationCode(length = 6): string {
  let code = "";
  for (let index = 0; index < length; index++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function fail(
  code: BookingErrorCode,
  message: string,
  alternatives?: Slot[]
): BookingResult<never> {
  return { ok: false, code, message, ...(alternatives ? { alternatives } : {}) };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Prisma no tiene un código dedicado para las constraints de exclusión: el
 * error llega como "unknown request" con el nombre de la constraint.
 */
function isExclusionViolation(error: unknown): boolean {
  const message = errorMessage(error);
  return (
    message.includes("appointments_no_overlap") ||
    message.includes("conflicting key value violates exclusion constraint")
  );
}

function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}

function isUniqueViolation(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    errorMessage(error).includes(field)
  );
}

interface SlotCheckInput {
  dateKey: string;
  time: string;
  timeZone: string;
  durationMinutes: number;
  leadTimeMinutes: number;
  now: Date;
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    hasBreak: boolean;
    breakStart: string | null;
    breakEnd: string | null;
    isWorkingDay: boolean;
  }>;
  appointments: Array<{ startTime: Date; endTime: Date }>;
}

/** Explica por qué un horario no se puede reservar (para dar un buen error). */
function diagnoseSlot(input: SlotCheckInput): BookingErrorCode | null {
  const dayOfWeek = dayOfWeekFromDateKey(input.dateKey);
  const schedule = input.schedules.find((s) => s.dayOfWeek === dayOfWeek);
  if (!schedule || !schedule.isWorkingDay) return "DAY_OFF";

  const startMinutes = timeToMinutes(input.time);
  const endMinutes = startMinutes + input.durationMinutes;
  const workStart = timeToMinutes(schedule.startTime);
  const workEnd = timeToMinutes(schedule.endTime);

  if (startMinutes < workStart || endMinutes > workEnd) return "OUTSIDE_HOURS";

  if (
    schedule.hasBreak &&
    schedule.breakStart &&
    schedule.breakEnd &&
    startMinutes < timeToMinutes(schedule.breakEnd) &&
    endMinutes > timeToMinutes(schedule.breakStart)
  ) {
    return "BREAK";
  }

  const start = zonedToUtc(input.dateKey, input.time, input.timeZone);
  if (start.getTime() < input.now.getTime() + input.leadTimeMinutes * 60_000) {
    return "LEAD_TIME";
  }

  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const busy = input.appointments.some(
    (appointment) =>
      start.getTime() < appointment.endTime.getTime() &&
      end.getTime() > appointment.startTime.getTime()
  );

  return busy ? "SLOT_TAKEN" : null;
}

const ERROR_MESSAGES: Partial<Record<BookingErrorCode, string>> = {
  INVALID_INPUT: "La fecha o la hora no son válidas.",
  INVALID_PHONE: "El teléfono no es válido. Incluye el código de país.",
  TENANT_NOT_FOUND: "Negocio no encontrado.",
  INVALID_SERVICE: "El servicio no está disponible.",
  INVALID_STAFF: "El profesional no ofrece este servicio.",
  DAY_OFF: "El profesional no trabaja ese día.",
  OUTSIDE_HOURS: "El horario está fuera del turno del profesional.",
  BREAK: "El horario coincide con el descanso del profesional.",
  PAST: "No se puede reservar en el pasado.",
  LEAD_TIME: "Ese horario ya no alcanza el tiempo mínimo de antelación.",
  WINDOW_CLOSED: "Esa fecha está fuera de la ventana de reserva.",
  SLOT_TAKEN: "Ese horario se acaba de ocupar. Probá con otro.",
  NOT_FOUND: "La cita no existe.",
  UNKNOWN: "No se pudo completar la reserva. Intentá de nuevo.",
};

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<BookingResult<AppointmentSummary>> {
  if (!isValidDateKey(input.dateKey) || !isValidTime(input.time)) {
    return fail("INVALID_INPUT", ERROR_MESSAGES.INVALID_INPUT!);
  }

  const phone = normalizePhone(input.customer.phone);
  if (!phone) {
    return fail("INVALID_PHONE", ERROR_MESSAGES.INVALID_PHONE!);
  }

  const fullName = input.customer.fullName.trim();
  if (fullName.length < 2) {
    return fail("INVALID_INPUT", "Indicá el nombre del cliente.");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) return fail("TENANT_NOT_FOUND", ERROR_MESSAGES.TENANT_NOT_FOUND!);

  const now = new Date();
  const todayKey = formatDateKeyInZone(now, tenant.timezone);
  const lastBookableKey = addDaysToDateKey(todayKey, tenant.bookingWindowDays);

  if (input.dateKey < todayKey) return fail("PAST", ERROR_MESSAGES.PAST!);
  if (input.dateKey > lastBookableKey) {
    return fail("WINDOW_CLOSED", ERROR_MESSAGES.WINDOW_CLOSED!);
  }

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, tenantId: tenant.id, isActive: true },
  });
  if (!service) return fail("INVALID_SERVICE", ERROR_MESSAGES.INVALID_SERVICE!);

  const members = await prisma.staffProfile.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      services: { some: { serviceId: service.id } },
      ...(input.staffId ? { id: input.staffId } : {}),
    },
    include: { schedules: true },
    orderBy: { id: "asc" },
  });
  if (members.length === 0) {
    return fail("INVALID_STAFF", ERROR_MESSAGES.INVALID_STAFF!);
  }

  // Citas del día (rango local → UTC) para diagnostican solapamientos.
  const dayStart = zonedToUtc(input.dateKey, "00:00", tenant.timezone);
  const dayEnd = zonedToUtc(
    addDaysToDateKey(input.dateKey, 1),
    "00:00",
    tenant.timezone
  );
  const dayAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      staffId: { in: members.map((member) => member.id) },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { staffId: true, startTime: true, endTime: true },
  });

  // Elegir profesional: si el cliente dijo "cualquiera", el primero libre.
  let chosen: (typeof members)[number] | null = null;
  let lastCode: BookingErrorCode = "SLOT_TAKEN";

  for (const member of members) {
    const code = diagnoseSlot({
      dateKey: input.dateKey,
      time: input.time,
      timeZone: tenant.timezone,
      durationMinutes: service.durationMinutes,
      leadTimeMinutes: tenant.minLeadTimeMinutes,
      now,
      schedules: member.schedules,
      appointments: dayAppointments.filter((a) => a.staffId === member.id),
    });

    if (code === null) {
      chosen = member;
      break;
    }
    lastCode = code;
  }

  if (!chosen) {
    const alternatives = await getAlternativeSlots({
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: input.staffId,
      dateKey: input.dateKey,
      limit: 3,
    });
    const message =
      lastCode === "SLOT_TAKEN"
        ? ERROR_MESSAGES.SLOT_TAKEN!
        : ERROR_MESSAGES[lastCode] ?? ERROR_MESSAGES.UNKNOWN!;
    return fail(lastCode, message, alternatives);
  }

  const staff = chosen;
  const startTime = zonedToUtc(input.dateKey, input.time, tenant.timezone);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const confirmationCode = generateConfirmationCode();

    try {
      const summary = await prisma.$transaction(
        async (tx) => {
          // Idempotencia: si el navegador o el webhook reintentan, devolvemos
          // la cita original en vez de crear otra.
          if (input.idempotencyKey) {
            const existing = await tx.appointment.findUnique({
              where: {
                tenantId_idempotencyKey: {
                  tenantId: tenant.id,
                  idempotencyKey: input.idempotencyKey,
                },
              },
              include: { service: true, staff: true, customer: true },
            });
            if (existing) {
              return toAppointmentSummary(existing, tenant.timezone);
            }
          }

          const customer = await tx.customer.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone } },
            update: {
              fullName,
              ...(input.customer.email ? { email: input.customer.email } : {}),
            },
            create: {
              tenantId: tenant.id,
              fullName,
              phone,
              email: input.customer.email ?? null,
              whatsappOptIn: false,
            },
          });

          const appointment = await tx.appointment.create({
            data: {
              tenantId: tenant.id,
              serviceId: service.id,
              staffId: staff.id,
              customerId: customer.id,
              startTime,
              endTime,
              totalPrice: service.price,
              customerNotes: input.notes?.trim() || null,
              status: AppointmentStatus.CONFIRMED,
              source: input.source,
              confirmationCode,
              idempotencyKey: input.idempotencyKey ?? null,
            },
            include: { service: true, staff: true, customer: true },
          });

          return toAppointmentSummary(appointment, tenant.timezone);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10_000,
        }
      );

      return { ok: true, data: summary };
    } catch (error) {
      if (isExclusionViolation(error)) {
        const alternatives = await getAlternativeSlots({
          tenantId: tenant.id,
          serviceId: service.id,
          staffId: input.staffId,
          dateKey: input.dateKey,
          limit: 3,
        });
        return fail("SLOT_TAKEN", ERROR_MESSAGES.SLOT_TAKEN!, alternatives);
      }

      if (input.idempotencyKey && isUniqueViolation(error, "idempotencyKey")) {
        const existing = await prisma.appointment.findUnique({
          where: {
            tenantId_idempotencyKey: {
              tenantId: tenant.id,
              idempotencyKey: input.idempotencyKey,
            },
          },
          include: { service: true, staff: true, customer: true },
        });
        if (existing) {
          return { ok: true, data: toAppointmentSummary(existing, tenant.timezone) };
        }
      }

      // Choque de código de confirmación: generamos otro.
      if (isUniqueViolation(error, "confirmationCode")) continue;

      // Serialización: reintentamos la transacción completa con un pequeño
      // backoff. Si aun así falla, lo más probable es que el horario se haya
      // ocupado en paralelo: devolvemos alternativas en vez de un error opaco.
      if (isSerializationFailure(error)) {
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
          continue;
        }

        const alternatives = await getAlternativeSlots({
          tenantId: tenant.id,
          serviceId: service.id,
          staffId: input.staffId,
          dateKey: input.dateKey,
          limit: 3,
        });
        return fail("SLOT_TAKEN", ERROR_MESSAGES.SLOT_TAKEN!, alternatives);
      }

      console.error("[booking] createAppointment failed", error);
      return fail("UNKNOWN", ERROR_MESSAGES.UNKNOWN!);
    }
  }

  return fail("UNKNOWN", ERROR_MESSAGES.UNKNOWN!);
}

/** Reexport para tests y para el adaptador web. */
export { diagnoseSlot, generateConfirmationCode, minutesToTime };
