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
    const startTime = new Date(`${input.dateStr}T00:00:00`);
    startTime.setHours(hours, minutes, 0, 0);

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
  } catch (err: any) {
    console.error("Error al registrar cita:", err);
    return {
      success: false,
      error: "Ocurrió un error al procesar tu cita. Intenta de nuevo.",
    };
  }
}
