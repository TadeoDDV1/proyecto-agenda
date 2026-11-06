/**
 * Cancelar y reprogramar citas. Lo usará el admin y, más adelante, el bot.
 */

import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAlternativeSlots } from "./availability";
import { toAppointmentSummary } from "./mapper";
import {
  addDaysToDateKey,
  formatDateKeyInZone,
  isValidDateKey,
  isValidTime,
  zonedToUtc,
} from "./time";
import type {
  AppointmentSummary,
  BookingErrorCode,
  BookingResult,
  Slot,
} from "./types";

function fail(
  code: BookingErrorCode,
  message: string,
  alternatives?: Slot[]
): BookingResult<never> {
  return { ok: false, code, message, ...(alternatives ? { alternatives } : {}) };
}

function isExclusionViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("appointments_no_overlap") ||
    message.includes("conflicting key value violates exclusion constraint")
  );
}

/** `true` si cancelar ahora queda dentro de la ventana de cortesía. */
export function isLateCancellation(
  startTime: Date,
  cancellationWindowHours: number,
  now: Date = new Date()
): boolean {
  return startTime.getTime() - now.getTime() < cancellationWindowHours * 3_600_000;
}

export interface CancelResult {
  appointment: AppointmentSummary;
  late: boolean;
}

export async function cancelAppointment(input: {
  tenantId: string;
  appointmentId: string;
  reason?: string;
}): Promise<BookingResult<CancelResult>> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, tenantId: input.tenantId },
    include: { service: true, staff: true, customer: true, tenant: true },
  });

  if (!appointment) {
    return fail("NOT_FOUND", "La cita no existe.");
  }

  if (
    appointment.status !== AppointmentStatus.PENDING &&
    appointment.status !== AppointmentStatus.CONFIRMED
  ) {
    return fail("INVALID_INPUT", "Esta cita ya no se puede cancelar.");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: input.reason?.trim() || null,
    },
    include: { service: true, staff: true, customer: true },
  });

  return {
    ok: true,
    data: {
      appointment: toAppointmentSummary(updated, appointment.tenant.timezone),
      late: isLateCancellation(
        appointment.startTime,
        appointment.tenant.cancellationWindowHours
      ),
    },
  };
}

export async function rescheduleAppointment(input: {
  tenantId: string;
  appointmentId: string;
  dateKey: string;
  time: string;
}): Promise<BookingResult<AppointmentSummary>> {
  if (!isValidDateKey(input.dateKey) || !isValidTime(input.time)) {
    return fail("INVALID_INPUT", "La fecha o la hora no son válidas.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, tenantId: input.tenantId },
    include: { service: true, tenant: true },
  });

  if (!appointment) return fail("NOT_FOUND", "La cita no existe.");

  if (
    appointment.status !== AppointmentStatus.PENDING &&
    appointment.status !== AppointmentStatus.CONFIRMED
  ) {
    return fail("INVALID_INPUT", "Esta cita ya no se puede reprogramar.");
  }

  const { tenant, service } = appointment;
  const now = new Date();
  const todayKey = formatDateKeyInZone(now, tenant.timezone);
  if (input.dateKey < todayKey) return fail("PAST", "No se puede reprogramar al pasado.");
  if (input.dateKey > addDaysToDateKey(todayKey, tenant.bookingWindowDays)) {
    return fail("WINDOW_CLOSED", "Esa fecha está fuera de la ventana de reserva.");
  }

  const staff = await prisma.staffProfile.findFirst({
    where: {
      id: appointment.staffId,
      tenantId: tenant.id,
      isActive: true,
      services: { some: { serviceId: service.id } },
    },
    include: { schedules: true },
  });
  if (!staff) return fail("INVALID_STAFF", "El profesional ya no ofrece este servicio.");

  const startTime = zonedToUtc(input.dateKey, input.time, tenant.timezone);
  if (startTime.getTime() < now.getTime() + tenant.minLeadTimeMinutes * 60_000) {
    return fail("LEAD_TIME", "Ese horario ya no cumple la antelación mínima.");
  }

  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);

  // Validación de turno y descanso, igual que en la creación.
  const dayOfWeek = new Date(
    Date.UTC(
      Number(input.dateKey.slice(0, 4)),
      Number(input.dateKey.slice(5, 7)) - 1,
      Number(input.dateKey.slice(8, 10))
    )
  ).getUTCDay();
  const schedule = staff.schedules.find((s) => s.dayOfWeek === dayOfWeek);
  if (!schedule || !schedule.isWorkingDay) {
    return fail("DAY_OFF", "El profesional no trabaja ese día.");
  }

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const startMinutes = toMinutes(input.time);
  const endMinutes = startMinutes + service.durationMinutes;
  if (
    startMinutes < toMinutes(schedule.startTime) ||
    endMinutes > toMinutes(schedule.endTime)
  ) {
    return fail("OUTSIDE_HOURS", "El horario está fuera del turno del profesional.");
  }
  if (
    schedule.hasBreak &&
    schedule.breakStart &&
    schedule.breakEnd &&
    startMinutes < toMinutes(schedule.breakEnd) &&
    endMinutes > toMinutes(schedule.breakStart)
  ) {
    return fail("BREAK", "El horario coincide con el descanso del profesional.");
  }

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const overlap = await tx.appointment.findFirst({
          where: {
            tenantId: tenant.id,
            staffId: staff.id,
            id: { not: appointment.id },
            status: {
              in: [
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
              ],
            },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        });
        if (overlap) throw new Error("appointments_no_overlap");

        return tx.appointment.update({
          where: { id: appointment.id },
          data: { startTime, endTime },
          include: { service: true, staff: true, customer: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return { ok: true, data: toAppointmentSummary(updated, tenant.timezone) };
  } catch (error) {
    if (isExclusionViolation(error)) {
      const alternatives = await getAlternativeSlots({
        tenantId: tenant.id,
        serviceId: service.id,
        staffId: staff.id,
        dateKey: input.dateKey,
        limit: 3,
      });
      return fail("SLOT_TAKEN", "Ese horario se acaba de ocupar.", alternatives);
    }
    console.error("[booking] rescheduleAppointment failed", error);
    return fail("UNKNOWN", "No se pudo reprogramar la cita.");
  }
}
