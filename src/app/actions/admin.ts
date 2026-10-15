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
