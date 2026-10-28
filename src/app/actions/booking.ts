"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createAppointment,
  getDayAvailability,
  getUpcomingAvailability,
} from "@/lib/booking";

export interface CreateBookingInput {
  tenantSlug: string;
  serviceId: string;
  /** Vacío = "cualquiera". */
  staffId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:mm"
  notes?: string;
}

/**
 * Adaptador web del dominio. Solo traduce slug → tenant y revalida rutas;
 * toda la lógica vive en `src/lib/booking`.
 */
export async function createBooking(input: CreateBookingInput) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return { success: false as const, error: "Negocio no encontrado." };
    }

    const result = await createAppointment({
      tenantId: tenant.id,
      serviceId: input.serviceId,
      staffId: input.staffId || undefined,
      dateKey: input.dateStr,
      time: input.timeStr,
      customer: {
        fullName: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail || null,
      },
      notes: input.notes || null,
      source: "WEB",
    });

    if (!result.ok) {
      return {
        success: false as const,
        error: result.message,
        code: result.code,
        alternatives: result.alternatives ?? [],
      };
    }

    revalidatePath(`/b/${tenant.slug}`);
    revalidatePath(`/admin`);
    revalidatePath(`/admin/calendario`);

    return { success: true as const, appointment: result.data };
  } catch (error) {
    console.error("Error al registrar cita:", error);
    return {
      success: false as const,
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
    if (!input.tenantSlug || !input.serviceId || !input.dateStr) {
      return { success: false as const, slots: [], error: "Parámetros incompletos." };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return { success: false as const, slots: [], error: "Negocio no encontrado." };
    }

    const result = await getDayAvailability({
      tenantId: tenant.id,
      serviceId: input.serviceId,
      staffId: input.staffId || undefined,
      dateKey: input.dateStr,
    });

    if (!result.ok) {
      return { success: false as const, slots: [], error: result.message };
    }

    return {
      success: true as const,
      slots: result.data.slots.map((slot) => slot.time),
      staffBySlot: Object.fromEntries(
        result.data.slots.map((slot) => [slot.time, slot.staffId])
      ),
      isClosed: result.data.isClosed,
      message: result.data.isClosed
        ? "Ese día el salón no atiende."
        : result.data.slots.length === 0
          ? "No quedan horarios libres para esa fecha."
          : undefined,
    };
  } catch (error) {
    console.error("Error calculando slots de disponibilidad:", error);
    return {
      success: false as const,
      slots: [],
      error: "Error al calcular horarios disponibles.",
    };
  }
}

/** Tira de fechas de Vitrina: próximos días con cupo. */
export async function getUpcomingAvailabilityAction(input: {
  tenantSlug: string;
  serviceId: string;
  staffId?: string;
  days?: number;
}) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return { success: false as const, days: [], error: "Negocio no encontrado." };
    }

    const result = await getUpcomingAvailability({
      tenantId: tenant.id,
      serviceId: input.serviceId,
      staffId: input.staffId || undefined,
      days: input.days ?? 7,
    });

    if (!result.ok) {
      return { success: false as const, days: [], error: result.message };
    }

    return {
      success: true as const,
      timezone: result.data.timezone,
      days: result.data.days,
    };
  } catch (error) {
    console.error("Error calculando próximos días:", error);
    return {
      success: false as const,
      days: [],
      error: "Error al calcular la disponibilidad.",
    };
  }
}
