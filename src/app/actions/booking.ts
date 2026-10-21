"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateBookingInput {
  tenantSlug: string;
  serviceId: string;
  staffId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:mm"
  notes?: string;
}

export async function createBooking(input: CreateBookingInput) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Negocio no encontrado." };
    }

    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      return { success: false, error: "Servicio no válido." };
    }

    // Calcular hora de inicio y fin
    const [hours, minutes] = input.timeStr.split(":").map(Number);
    const [year, month, day] = input.dateStr.split("-").map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);

    // Verificar si el staff ya tiene una cita solapada
    const overlapping = await prisma.appointment.findFirst({
      where: {
        staffId: input.staffId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (overlapping) {
      return {
        success: false,
        error: "El profesional seleccionado ya cuenta con una cita en ese horario. Por favor selecciona otro horario.",
      };
    }

    // Buscar o registrar cliente
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        phone: input.customerPhone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          fullName: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail || null,
        },
      });
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        serviceId: service.id,
        staffId: input.staffId,
        customerId: customer.id,
        startTime,
        endTime,
        totalPrice: service.price,
        customerNotes: input.notes || null,
        status: "CONFIRMED",
      },
      include: {
        service: true,
        staff: true,
        customer: true,
      },
    });

    revalidatePath(`/b/${input.tenantSlug}`);
    revalidatePath(`/admin`);
    revalidatePath(`/admin/calendario`);

    return {
      success: true,
      appointment: {
        id: appointment.id,
        serviceName: appointment.service.name,
        staffName: appointment.staff.displayName,
        customerName: appointment.customer.fullName,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        totalPrice: Number(appointment.totalPrice),
      },
    };
  } catch (err) {
    console.error("Error al registrar cita:", err);
    return {
      success: false,
      error: "Ocurrió un error al procesar tu cita. Intenta de nuevo.",
    };
  }
}

export interface GetAvailableSlotsInput {
  tenantSlug: string;
  staffId: string;
  serviceId: string;
  dateStr: string; // "YYYY-MM-DD"
}

export async function getAvailableSlotsAction(input: GetAvailableSlotsInput) {
  try {
    const { tenantSlug, staffId, serviceId, dateStr } = input;
    if (!tenantSlug || !staffId || !serviceId || !dateStr) {
      return { success: false, slots: [], error: "Parámetros incompletos." };
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return { success: false, slots: [], error: "Servicio no encontrado." };
    }

    // Parse date sin desviación de zona horaria
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

    // Buscar horario laboral del staff para este día
    const schedule = await prisma.schedule.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isWorkingDay) {
      return {
        success: true,
        slots: [],
        message: "El profesional no tiene turnos programados para este día.",
      };
    }

    // Rango del día para buscar citas existentes
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId,
        status: { in: ["CONFIRMED", "PENDING"] },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Helper: convertir "HH:mm" a minutos
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (totalMinutes: number) => {
      const h = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
      const m = (totalMinutes % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    const workStartMinutes = timeToMinutes(schedule.startTime);
    const workEndMinutes = timeToMinutes(schedule.endTime);
    const breakStartMinutes = schedule.hasBreak && schedule.breakStart ? timeToMinutes(schedule.breakStart) : null;
    const breakEndMinutes = schedule.hasBreak && schedule.breakEnd ? timeToMinutes(schedule.breakEnd) : null;

    const duration = service.durationMinutes;
    const step = 30; // intervalo entre slots candidatos

    const availableSlots: string[] = [];
    const now = new Date();

    for (let currentMinutes = workStartMinutes; currentMinutes + duration <= workEndMinutes; currentMinutes += step) {
      const slotEndMinutes = currentMinutes + duration;

      // 1. Descanso / Almuerzo
      if (
        breakStartMinutes !== null &&
        breakEndMinutes !== null &&
        currentMinutes < breakEndMinutes &&
        slotEndMinutes > breakStartMinutes
      ) {
        continue;
      }

      // 2. Objetos Date para verificar citas existentes y tiempo pasado
      const slotStartDate = new Date(year, month - 1, day, Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      const slotEndDate = new Date(year, month - 1, day, Math.floor(slotEndMinutes / 60), slotEndMinutes % 60, 0, 0);

      // Si es hoy, ignorar horarios pasados
      const isToday =
        now.getFullYear() === year &&
        now.getMonth() === month - 1 &&
        now.getDate() === day;

      if (isToday && slotStartDate.getTime() <= now.getTime()) {
        continue;
      }

      // 3. Verificar colisión con citas agendadas
      const hasConflict = existingAppointments.some((app) => {
        const appStart = new Date(app.startTime).getTime();
        const appEnd = new Date(app.endTime).getTime();
        const sStart = slotStartDate.getTime();
        const sEnd = slotEndDate.getTime();

        return sStart < appEnd && sEnd > appStart;
      });

      if (!hasConflict) {
        availableSlots.push(minutesToTime(currentMinutes));
      }
    }

    return {
      success: true,
      slots: availableSlots,
    };
  } catch (error) {
    console.error("Error calculando slots de disponibilidad:", error);
    return {
      success: false,
      slots: [],
      error: "Error al calcular horarios disponibles.",
    };
  }
}
