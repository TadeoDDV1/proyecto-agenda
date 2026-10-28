/**
 * Cálculo de disponibilidad. Toda la lógica vive acá y es pura: recibe el
 * profesional, sus horarios y sus citas, y devuelve los huecos.
 *
 * La usan la web, el admin y el bot. No consulta Next ni formatea para una UI.
 */

import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import {
  addDaysToDateKey,
  dayOfWeekFromDateKey,
  dayRangeUtc,
  formatDateKeyInZone,
  minutesToTime,
  timeToMinutes,
  zonedToUtc,
} from "./time";
import type {
  AvailabilityStaff,
  BookingErrorCode,
  BookingResult,
  DayAvailability,
  Slot,
  UpcomingDay,
} from "./types";

export const BOOKABLE_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
] as const;

const STEP_MINUTES = 30;

/** `true` si algún profesional trabaja ese día de la semana. */
export function isDayClosed(staff: AvailabilityStaff[], dateKey: string): boolean {
  const dayOfWeek = dayOfWeekFromDateKey(dateKey);
  return !staff.some((member) => {
    const schedule = member.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    return Boolean(schedule?.isWorkingDay);
  });
}

/**
 * Huecos libres de un día, en la zona horaria del tenant.
 *
 * - Respeta horario y descanso de cada profesional.
 * - Descarta lo que ya pasó y lo que no cumple el lead time.
 * - Si dos profesionales están libres a la misma hora, devuelve un solo slot
 *   (el primero), para no repetir "10:00" tres veces en la lista.
 */
export function buildDaySlots(input: {
  dateKey: string;
  timeZone: string;
  durationMinutes: number;
  staff: AvailabilityStaff[];
  now?: Date;
  leadTimeMinutes?: number;
  stepMinutes?: number;
}): Slot[] {
  const {
    dateKey,
    timeZone,
    durationMinutes,
    staff,
    now = new Date(),
    leadTimeMinutes = 0,
    stepMinutes = STEP_MINUTES,
  } = input;

  if (durationMinutes <= 0) return [];

  const dayOfWeek = dayOfWeekFromDateKey(dateKey);
  const earliest = now.getTime() + leadTimeMinutes * 60_000;
  const byTime = new Map<string, Slot>();

  for (const member of staff) {
    const schedule = member.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule || !schedule.isWorkingDay) continue;

    const workStart = timeToMinutes(schedule.startTime);
    const workEnd = timeToMinutes(schedule.endTime);
    const breakStart =
      schedule.hasBreak && schedule.breakStart ? timeToMinutes(schedule.breakStart) : null;
    const breakEnd =
      schedule.hasBreak && schedule.breakEnd ? timeToMinutes(schedule.breakEnd) : null;

    for (
      let current = workStart;
      current + durationMinutes <= workEnd;
      current += stepMinutes
    ) {
      const slotEndMinutes = current + durationMinutes;

      // Descanso
      if (
        breakStart !== null &&
        breakEnd !== null &&
        current < breakEnd &&
        slotEndMinutes > breakStart
      ) {
        continue;
      }

      const time = minutesToTime(current);
      if (byTime.has(time)) continue;

      const start = zonedToUtc(dateKey, time, timeZone);
      const end = new Date(start.getTime() + durationMinutes * 60_000);

      // Pasado / lead time
      if (start.getTime() < earliest) continue;

      // Solapamiento con citas activas
      const busy = member.appointments.some(
        (appointment) =>
          start.getTime() < appointment.endTime.getTime() &&
          end.getTime() > appointment.startTime.getTime()
      );
      if (busy) continue;

      byTime.set(time, {
        time,
        staffId: member.id,
        staffName: member.displayName,
      });
    }
  }

  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}

interface LoadContextInput {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  from: Date;
  to: Date;
}

async function loadContext({ tenantId, serviceId, staffId, from, to }: LoadContextInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { ok: false as const, error: "TENANT_NOT_FOUND" as const };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, isActive: true },
  });
  if (!service) {
    return { ok: false as const, error: "INVALID_SERVICE" as const };
  }

  const members = await prisma.staffProfile.findMany({
    where: {
      tenantId,
      isActive: true,
      services: { some: { serviceId } },
      ...(staffId ? { id: staffId } : {}),
    },
    include: { schedules: true },
    orderBy: { displayName: "asc" },
  });

  if (members.length === 0) {
    return { ok: false as const, error: "INVALID_STAFF" as const };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      staffId: { in: members.map((m) => m.id) },
      status: { in: [...BOOKABLE_STATUSES] },
      startTime: { lt: to },
      endTime: { gt: from },
    },
    select: { staffId: true, startTime: true, endTime: true },
  });

  const staff: AvailabilityStaff[] = members.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    schedules: member.schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      hasBreak: schedule.hasBreak,
      breakStart: schedule.breakStart,
      breakEnd: schedule.breakEnd,
      isWorkingDay: schedule.isWorkingDay,
    })),
    appointments: appointments
      .filter((appointment) => appointment.staffId === member.id)
      .map(({ startTime, endTime }) => ({ startTime, endTime })),
  }));

  return { ok: true as const, tenant, service, staff };
}

function fail(code: BookingErrorCode, message: string): BookingResult<never> {
  return { ok: false, code, message };
}

const ERROR_MESSAGES: Record<string, string> = {
  TENANT_NOT_FOUND: "Negocio no encontrado.",
  INVALID_SERVICE: "El servicio no está disponible.",
  INVALID_STAFF: "El profesional no ofrece este servicio.",
};

export async function getDayAvailability(input: {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  dateKey: string;
}): Promise<BookingResult<DayAvailability>> {
  const { tenantId, serviceId, staffId, dateKey } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { timezone: true, minLeadTimeMinutes: true },
  });
  if (!tenant) return fail("TENANT_NOT_FOUND", "Negocio no encontrado.");

  const { start, end } = dayRangeUtc(dateKey, tenant.timezone);
  const context = await loadContext({ tenantId, serviceId, staffId, from: start, to: end });
  if (!context.ok) {
    return fail(context.error, ERROR_MESSAGES[context.error]);
  }

  const slots = buildDaySlots({
    dateKey,
    timeZone: context.tenant.timezone,
    durationMinutes: context.service.durationMinutes,
    staff: context.staff,
    leadTimeMinutes: context.tenant.minLeadTimeMinutes,
  });

  return {
    ok: true,
    data: {
      dateKey,
      timezone: context.tenant.timezone,
      isClosed: isDayClosed(context.staff, dateKey),
      slots,
    },
  };
}

/**
 * Disponibilidad de los próximos `days` días en una sola carga.
 * Es lo que alimenta la tira de fechas de Vitrina.
 */
export async function getUpcomingAvailability(input: {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  days?: number;
  fromDateKey?: string;
}): Promise<BookingResult<{ timezone: string; days: UpcomingDay[] }>> {
  const { tenantId, serviceId, staffId, days = 7 } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { timezone: true, minLeadTimeMinutes: true, bookingWindowDays: true },
  });
  if (!tenant) return fail("TENANT_NOT_FOUND", "Negocio no encontrado.");

  const startDateKey =
    input.fromDateKey ?? formatDateKeyInZone(new Date(), tenant.timezone);
  const totalDays = Math.max(1, Math.min(days, tenant.bookingWindowDays));
  const from = dayRangeUtc(startDateKey, tenant.timezone).start;
  const to = dayRangeUtc(
    addDaysToDateKey(startDateKey, totalDays),
    tenant.timezone
  ).start;

  const context = await loadContext({ tenantId, serviceId, staffId, from, to });
  if (!context.ok) {
    return fail(context.error, ERROR_MESSAGES[context.error]);
  }

  const result: UpcomingDay[] = [];
  for (let index = 0; index < totalDays; index++) {
    const dateKey = addDaysToDateKey(startDateKey, index);
    const slots = buildDaySlots({
      dateKey,
      timeZone: context.tenant.timezone,
      durationMinutes: context.service.durationMinutes,
      staff: context.staff,
      leadTimeMinutes: context.tenant.minLeadTimeMinutes,
    });
    result.push({
      dateKey,
      isClosed: isDayClosed(context.staff, dateKey),
      count: slots.length,
      firstSlot: slots[0]?.time ?? null,
    });
  }

  return { ok: true, data: { timezone: context.tenant.timezone, days: result } };
}

/** Huecos alternativos cuando el horario pedido se ocupó. */
export async function getAlternativeSlots(input: {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  dateKey: string;
  limit?: number;
}): Promise<Slot[]> {
  const result = await getDayAvailability(input);
  if (!result.ok) return [];
  return result.data.slots.slice(0, input.limit ?? 3);
}
