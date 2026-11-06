"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, BrandTheme } from "@prisma/client";
import { createAppointment } from "@/lib/booking";
import { normalizePhone } from "@/lib/booking/phone";
import { VITRINA_THEME_NAMES } from "@/lib/vitrina/theme";

// Helper para validar tenant activo. Sin sesión válida no hay tenant:
// el fallback al negocio de demostración permitía ver datos ajenos.
async function getActiveTenantId() {
  const session = await getSession();
  return session?.tenantId ?? null;
}

// Cambios de configuración: solo dueño o administrador del negocio.
async function getManagerTenantId() {
  const session = await getSession();
  if (!session?.tenantId) return null;
  if (!["OWNER", "ADMIN"].includes(session.role)) return null;
  return session.tenantId;
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
        ...(newStatus === AppointmentStatus.CANCELLED
          ? { cancelledAt: new Date() }
          : {}),
      },
    });

    revalidatePath("/admin");
    return { success: true, updated };
  } catch (err) {
    console.error("Error al actualizar cita:", err);
    return { success: false, error: "No se pudo actualizar el estado de la cita." };
  }
}

export async function createServiceAction(formData: FormData) {
  const tenantId = await getManagerTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  // Límite del plan configurado por el superadmin
  const limite = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxServices: true },
  });
  const actuales = await prisma.service.count({ where: { tenantId } });
  if (limite && actuales >= limite.maxServices) {
    return {
      success: false,
      error: `Tu plan permite hasta ${limite.maxServices} servicios. Elimina uno o amplía el plan.`,
    };
  }

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
  } catch (err) {
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
  } catch {
    return { success: false, error: "Error al actualizar servicio." };
  }
}

export async function createStaffAction(formData: FormData) {
  const tenantId = await getManagerTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  // Límite del plan configurado por el superadmin
  const limite = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxStaff: true },
  });
  const actuales = await prisma.staffProfile.count({ where: { tenantId } });
  if (limite && actuales >= limite.maxStaff) {
    return {
      success: false,
      error: `Tu plan permite hasta ${limite.maxStaff} colaboradores. Elimina uno o amplía el plan.`,
    };
  }

  const displayName = (formData.get("displayName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const colorCode = (formData.get("colorCode") as string)?.trim() || "#3b82f6";
  const specialties = (formData.get("specialties") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();

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
        specialties: specialties || null,
        bio: bio || null,
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
  } catch (err) {
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
    // Misma ruta que la web: normaliza el teléfono, valida horario/descanso y
    // crea la cita en una transacción Serializable. No reimplementar fechas acá:
    // `new Date(year, month - 1, ...)` usa la zona del servidor (UTC en Vercel).
    const result = await createAppointment({
      tenantId,
      serviceId,
      staffId,
      dateKey: dateStr,
      time: timeStr,
      customer: {
        fullName: customerName,
        phone: customerPhone,
        email: customerEmail ?? null,
      },
      notes: notes ?? null,
      source: "ADMIN",
    });

    if (!result.ok) {
      return {
        success: false,
        error: result.message,
        alternatives: result.alternatives ?? [],
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/calendario");
    revalidatePath("/b");

    return { success: true, appointmentId: result.data.id, code: result.data.confirmationCode };
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error("Error al actualizar notas:", error);
    return { success: false, error: "No se pudieron guardar las notas del cliente." };
  }
}

const BRAND_THEMES = new Set<string>(VITRINA_THEME_NAMES);

function clampNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function updateTenantSettingsAction(formData: FormData) {
  const tenantId = await getManagerTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const name = (formData.get("name") as string)?.trim();
  const phoneRaw = (formData.get("phone") as string)?.trim() || "";
  const address = (formData.get("address") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const currency = (formData.get("currency") as string)?.trim() || "MXN";

  // Vitrina
  const tagline = (formData.get("tagline") as string)?.trim() || null;
  const story = (formData.get("story") as string)?.trim() || null;
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const coverImageUrl = (formData.get("coverImageUrl") as string)?.trim() || null;
  const instagramRaw = (formData.get("instagram") as string)?.trim() || "";
  const instagram = instagramRaw
    ? instagramRaw
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "")
    : null;
  const brandThemeRaw = (formData.get("brandTheme") as string)?.trim() ?? "";

  // Operación
  const timezone = (formData.get("timezone") as string)?.trim() || "America/Mexico_City";
  const bookingWindowDays = clampNumber(formData.get("bookingWindowDays"), 30, 1, 365);
  const minLeadTimeMinutes = clampNumber(formData.get("minLeadTimeMinutes"), 60, 0, 1440);
  const cancellationWindowHours = clampNumber(
    formData.get("cancellationWindowHours"),
    24,
    0,
    168
  );

  if (!name) {
    return { success: false, error: "El nombre del salón es obligatorio." };
  }

  if (!isValidTimeZone(timezone)) {
    return { success: false, error: "La zona horaria seleccionada no es válida." };
  }

  if (brandThemeRaw && !BRAND_THEMES.has(brandThemeRaw)) {
    return { success: false, error: "El tema seleccionado no existe." };
  }

  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) {
    return {
      success: false,
      error: "El teléfono no es válido. Usa el formato +52 55 1234 5678.",
    };
  }

  const whatsappRaw = (formData.get("whatsappNumber") as string)?.trim() || "";
  const whatsappNumber = whatsappRaw ? normalizePhone(whatsappRaw) : null;
  if (whatsappRaw && !whatsappNumber) {
    return {
      success: false,
      error: "El número de WhatsApp no es válido. Incluye el código de país.",
    };
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
        tagline,
        story,
        logoUrl,
        coverImageUrl,
        instagram,
        whatsappNumber,
        timezone,
        bookingWindowDays,
        minLeadTimeMinutes,
        cancellationWindowHours,
        ...(brandThemeRaw ? { brandTheme: brandThemeRaw as BrandTheme } : {}),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/configuracion");
    revalidatePath(`/b/${updated.slug}`);
    return { success: true, tenant: updated };
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return { success: false, error: "No se pudo actualizar la configuración del salón." };
  }
}

/**
 * Cierra todas las sesiones abiertas de un usuario del negocio.
 * Incrementa tokenVersion: cualquier JWT emitido antes deja de valer.
 */
export async function revokeUserSessionsAction(userId: string) {
  const tenantId = await getManagerTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  const objetivo = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, email: true },
  });
  if (!objetivo) return { success: false, error: "Usuario no encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

  revalidatePath("/admin/sesiones");
  return { success: true, email: objetivo.email };
}