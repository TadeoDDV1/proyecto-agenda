"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireSuperadmin } from "@/lib/superadmin";
import { registrarAuditoria } from "@/lib/audit";
import { FEATURE_KEYS, parseFeatures, type Plan } from "@/lib/tenant-config";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

function slugify(txt: string) {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Crea un negocio con su dueño y datos mínimos (horarios, categoría y servicio). */
export async function createTenantByAdminAction(formData: FormData) {
  const actor = await requireSuperadmin();

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const ownerName = (formData.get("ownerName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string)?.trim();
  const plan = ((formData.get("plan") as string) || "BASIC") as Plan;
  const currency = (formData.get("currency") as string)?.trim() || "MXN";

  if (!name || !ownerName || !email || !password) {
    return { success: false, error: "Nombre del negocio, dueño, correo y contraseña son obligatorios." };
  }
  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const slug = slugify(rawSlug || name) || `negocio-${Date.now().toString().slice(-5)}`;

  const [existeSlug, existeEmail] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existeSlug) return { success: false, error: `El identificador «${slug}» ya está en uso.` };
  if (existeEmail) return { success: false, error: "Ese correo ya tiene una cuenta." };

  try {
    const hash = await hashPassword(password);
    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name,
          slug,
          currency,
          plan,
          isActive: true,
          features: {
            whatsappBot: plan !== "BASIC",
            publicBooking: true,
            bitacoras: true,
            reportes: plan === "ENTERPRISE",
            multiSucursal: plan === "ENTERPRISE",
          },
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: t.id,
          fullName: ownerName,
          email,
          passwordHash: hash,
          role: UserRole.OWNER,
        },
      });

      const staff = await tx.staffProfile.create({
        data: { tenantId: t.id, userId: user.id, displayName: ownerName, email },
      });

      for (let day = 1; day <= 6; day++) {
        await tx.schedule.create({
          data: { staffId: staff.id, dayOfWeek: day, startTime: "09:00", endTime: "19:00" },
        });
      }

      const cat = await tx.category.create({ data: { tenantId: t.id, name: "Servicios Generales" } });
      const service = await tx.service.create({
        data: {
          tenantId: t.id,
          categoryId: cat.id,
          name: "Servicio Inicial",
          durationMinutes: 30,
          price: 200,
        },
      });
      await tx.staffService.create({ data: { staffId: staff.id, serviceId: service.id } });

      return t;
    });

    await registrarAuditoria({
      actor: actor.email,
      accion: "crear_negocio",
      objetivo: tenant.slug,
      detalle: `${tenant.name} · plan ${tenant.plan}`,
    });

    revalidatePath("/superadmin");
    return { success: true, tenantId: tenant.id, slug: tenant.slug };
  } catch (err) {
    console.error("Error al crear negocio:", err);
    return { success: false, error: "No se pudo crear el negocio." };
  }
}

/** Guarda la configuración completa de un negocio. */
export async function updateTenantByAdminAction(formData: FormData) {
  const actor = await requireSuperadmin();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return { success: false, error: "Falta el identificador del negocio." };

  const name = (formData.get("name") as string)?.trim();
  const slug = slugify((formData.get("slug") as string) || "");
  const plan = ((formData.get("plan") as string) || "BASIC") as Plan;
  const currency = (formData.get("currency") as string)?.trim() || "MXN";
  const isActive = formData.get("isActive") === "on";
  const maxStaff = Number(formData.get("maxStaff") || 10);
  const maxServices = Number(formData.get("maxServices") || 50);
  const suspendedReason = (formData.get("suspendedReason") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !slug) return { success: false, error: "Nombre e identificador son obligatorios." };

  const features = {} as Record<string, boolean>;
  for (const k of FEATURE_KEYS) features[k] = formData.get(`feature_${k}`) === "on";

  try {
    const repetido = await prisma.tenant.findFirst({ where: { slug, NOT: { id } } });
    if (repetido) return { success: false, error: `El identificador «${slug}» ya está en uso.` };

    await prisma.tenant.update({
      where: { id },
      data: {
        name,
        slug,
        plan,
        currency,
        isActive,
        maxStaff: Number.isFinite(maxStaff) ? maxStaff : 10,
        maxServices: Number.isFinite(maxServices) ? maxServices : 50,
        suspendedReason: isActive ? null : suspendedReason,
        notes,
        features,
      },
    });

    await registrarAuditoria({
      actor: actor.email,
      accion: "editar_negocio",
      objetivo: slug,
      detalle: `plan ${plan} · ${isActive ? "activo" : "suspendido"}`,
    });

    revalidatePath("/superadmin");
    revalidatePath(`/superadmin/negocios/${id}`);
    return { success: true };
  } catch (err) {
    console.error("Error al actualizar negocio:", err);
    return { success: false, error: "No se pudo guardar la configuración." };
  }
}

/** Activa o suspende un negocio. */
export async function toggleTenantActiveAction(id: string, isActive: boolean) {
  const actor = await requireSuperadmin();
  try {
    await prisma.tenant.update({
      where: { id },
      data: {
        isActive,
        suspendedReason: isActive ? null : "Suspendido por el administrador de la plataforma",
      },
    });

    await registrarAuditoria({
      actor: actor.email,
      accion: isActive ? "activar_negocio" : "suspender_negocio",
      objetivo: id,
    });
    revalidatePath("/superadmin");
    revalidatePath(`/superadmin/negocios/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo cambiar el estado." };
  }
}

/** Elimina un negocio y todo su contenido (no permite borrar el tenant de plataforma). */
export async function deleteTenantAction(id: string) {
  const actor = await requireSuperadmin();
  try {
    const t = await prisma.tenant.findUnique({ where: { id } });
    if (!t) return { success: false, error: "El negocio no existe." };
    if (t.isPlatform) return { success: false, error: "No se puede eliminar el negocio de plataforma." };

    await prisma.tenant.delete({ where: { id } });

    await registrarAuditoria({
      actor: actor.email,
      accion: "eliminar_negocio",
      objetivo: t.slug,
      detalle: t.name,
    });
    revalidatePath("/superadmin");
    return { success: true };
  } catch (err) {
    console.error("Error al eliminar negocio:", err);
    return { success: false, error: "No se pudo eliminar el negocio." };
  }
}

/** Restablece la contraseña de un usuario del negocio. */
export async function resetUserPasswordAction(userId: string, newPassword: string) {
  const actor = await requireSuperadmin();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await registrarAuditoria({
      actor: actor.email,
      accion: "restablecer_password",
      objetivo: userId,
    });
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo restablecer la contraseña." };
  }
}

/** Crea un usuario adicional dentro de un negocio. */
export async function createUserForTenantAction(formData: FormData) {
  const actor = await requireSuperadmin();
  const tenantId = (formData.get("tenantId") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string)?.trim();
  const role = ((formData.get("role") as string) || "STAFF") as UserRole;

  if (!tenantId || !fullName || !email || !password) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }
  if (password.length < 6) return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) return { success: false, error: "Ese correo ya tiene una cuenta." };

  try {
    await prisma.user.create({
      data: { tenantId, fullName, email, passwordHash: await hashPassword(password), role },
    });
    revalidatePath(`/superadmin/negocios/${tenantId}`);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo crear el usuario." };
  }
}


