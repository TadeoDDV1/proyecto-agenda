"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";

// Helper para validar tenant activo
async function getActiveTenantId() {
  const session = await getSession();
  if (session?.tenantId) {
    return session.tenantId;
  }
  // Fallback al tenant de prueba para agilidad
  const demoTenant = await prisma.tenant.findFirst({
    where: { slug: "barberia-vintage" },
  });
  return demoTenant?.id || null;
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: AppointmentStatus
) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    const updated = await prisma.appointment.update({
      where: {
        id: appointmentId,
        tenantId, // Garantizar aislamiento multi-inquilino
      },
      data: {
        status: newStatus,
      },
    });

    revalidatePath("/admin");
    return { success: true, updated };
  } catch (err: any) {
    console.error("Error al actualizar cita:", err);
    return { success: false, error: "No se pudo actualizar el estado de la cita." };
  }
}

export async function createServiceAction(formData: FormData) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
  const price = parseFloat(formData.get("price") as string);
  const categoryName = (formData.get("categoryName") as string)?.trim() || "General";

  if (!name || isNaN(durationMinutes) || isNaN(price)) {
    return { success: false, error: "Por favor completa todos los campos del servicio." };
  }

  try {
    // Buscar o crear categoría
    let category = await prisma.category.findFirst({
      where: { tenantId, name: categoryName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { tenantId, name: categoryName },
      });
    }

    const newService = await prisma.service.create({
      data: {
        tenantId,
        categoryId: category.id,
        name,
        description: description || null,
        durationMinutes,
        price,
      },
    });

    // Asignar automáticamente a todos los colaboradores del tenant
    const staffProfiles = await prisma.staffProfile.findMany({
      where: { tenantId },
    });

    if (staffProfiles.length > 0) {
      await prisma.staffService.createMany({
        data: staffProfiles.map((s) => ({
          staffId: s.id,
          serviceId: newService.id,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/servicios");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al crear servicio:", err);
    return { success: false, error: "No se pudo crear el servicio." };
  }
}

export async function toggleServiceStatusAction(serviceId: string, isActive: boolean) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    await prisma.service.update({
      where: { id: serviceId, tenantId },
      data: { isActive },
    });

    revalidatePath("/admin/servicios");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Error al actualizar servicio." };
  }
}

export async function createStaffAction(formData: FormData) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const displayName = (formData.get("displayName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const colorCode = (formData.get("colorCode") as string)?.trim() || "#3b82f6";

  if (!displayName) {
    return { success: false, error: "El nombre del colaborador es requerido." };
  }

  try {
    const staff = await prisma.staffProfile.create({
      data: {
        tenantId,
        displayName,
        email: email || null,
        phone: phone || null,
        colorCode,
      },
    });

    // Configurar horarios por defecto (Lun-Sáb de 09:00 a 19:00)
    for (let day = 1; day <= 6; day++) {
      await prisma.schedule.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "19:00",
          isWorkingDay: true,
        },
      });
    }

    // Asignar todos los servicios del tenant
    const services = await prisma.service.findMany({ where: { tenantId } });
    if (services.length > 0) {
      await prisma.staffService.createMany({
        data: services.map((srv) => ({
          staffId: staff.id,
          serviceId: srv.id,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/personal");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al crear colaborador:", err);
    return { success: false, error: "No se pudo registrar el colaborador." };
  }
}

export interface CreateManualAppointmentInput {
  serviceId: string;
  staffId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  dateStr: string;
  timeStr: string;
  notes?: string;
}

export async function createManualAppointmentAction(input: CreateManualAppointmentInput) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const { serviceId, staffId, customerName, customerPhone, customerEmail, dateStr, timeStr, notes } = input;
  if (!serviceId || !staffId || !customerName || !customerPhone || !dateStr || !timeStr) {
    return { success: false, error: "Por favor completa todos los campos requeridos." };
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId, tenantId },
    });
    if (!service) return { success: false, error: "Servicio no válido." };

    const [hours, minutes] = timeStr.split(":").map(Number);
    const [year, month, day] = dateStr.split("-").map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);

    // Buscar o registrar cliente
    let customer = await prisma.customer.findFirst({
      where: { tenantId, phone: customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId,
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail || null,
        },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        serviceId: service.id,
        staffId,
        customerId: customer.id,
        startTime,
        endTime,
        totalPrice: service.price,
        customerNotes: notes || null,
        status: "CONFIRMED",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/calendario");
    return { success: true, appointmentId: appointment.id };
  } catch (error: any) {
    console.error("Error al agendar cita manual:", error);
    return { success: false, error: "No se pudo registrar la cita manual." };
  }
}

export async function createCustomerAction(formData: FormData) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!fullName || !phone) {
    return { success: false, error: "Nombre completo y teléfono son obligatorios." };
  }

  try {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, phone },
    });

    if (existing) {
      return { success: false, error: "Ya existe un cliente registrado con ese número de teléfono." };
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        fullName,
        phone,
        email,
        notes,
      },
    });

    revalidatePath("/admin/clientes");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error al crear cliente:", error);
    return { success: false, error: "No se pudo registrar al cliente." };
  }
}

export async function updateCustomerNotesAction(customerId: string, notes: string) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    await prisma.customer.update({
      where: { id: customerId, tenantId },
      data: { notes: notes.trim() || null },
    });

    revalidatePath("/admin/clientes");
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar notas:", error);
    return { success: false, error: "No se pudieron guardar las notas del cliente." };
  }
}

export async function updateTenantSettingsAction(formData: FormData) {
  const tenantId = await getActiveTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const currency = (formData.get("currency") as string)?.trim() || "MXN";

  if (!name) {
    return { success: false, error: "El nombre del salón es obligatorio." };
  }

  try {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        phone,
        address,
        description,
        currency,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/configuracion");
    return { success: true, tenant: updated };
  } catch (error: any) {
    console.error("Error al actualizar configuración:", error);
    return { success: false, error: "No se pudo actualizar la configuración del salón." };
  }
}

