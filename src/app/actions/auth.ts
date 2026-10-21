"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Por favor ingresa tu correo y contraseña." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user) {
    return { success: false, error: "Credenciales inválidas. Revisa tu correo o regístrate." };
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: "Contraseña incorrecta." };
  }

  await setSessionCookie({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });

  return { success: true };
}

export async function registerTenantAction(formData: FormData) {
  const businessName = (formData.get("businessName") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim().toLowerCase();
  const ownerName = (formData.get("ownerName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const phone = (formData.get("phone") as string)?.trim();
  const currency = (formData.get("currency") as string)?.trim() || "MXN";

  if (!businessName || !ownerName || !email || !password) {
    return { success: false, error: "Todos los campos obligatorios deben ser completados." };
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  // Generar o sanear slug
  const slug = (
    rawSlug ||
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  ) || "negocio-" + Date.now().toString().slice(-4);

  // Verificar disponibilidad de slug y correo
  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return { success: false, error: `El identificador '${slug}' ya está en uso. Por favor elige otro enlace.` };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "El correo electrónico ya se encuentra registrado." };
  }

  const hashedPassword = await hashPassword(password);

  try {
    // Creación atómica de Tenant, Usuario y Datos Iniciales
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
          phone: phone || null,
          currency,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: ownerName,
          email,
          passwordHash: hashedPassword,
          role: UserRole.OWNER,
        },
      });

      // Crear un perfil de colaborador para el dueño por defecto
      const staff = await tx.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          displayName: ownerName,
          email,
          phone,
          colorCode: "#3b82f6",
        },
      });

      // Asignar horarios de Lunes a Sábado de 09:00 a 19:00
      for (let day = 1; day <= 6; day++) {
        await tx.schedule.create({
          data: {
            staffId: staff.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "19:00",
            isWorkingDay: true,
          },
        });
      }

      // Categoría por defecto
      const cat = await tx.category.create({
        data: {
          tenantId: tenant.id,
          name: "Servicios Generales",
        },
      });

      // Servicio inicial de ejemplo
      const service = await tx.service.create({
        data: {
          tenantId: tenant.id,
          categoryId: cat.id,
          name: "Servicio Inicial",
          description: "Servicio estándar de atención personalizada.",
          durationMinutes: 30,
          price: 200,
        },
      });

      await tx.staffService.create({
        data: {
          staffId: staff.id,
          serviceId: service.id,
        },
      });

      return { tenant, user };
    });

    // Iniciar sesión inmediatamente
    await setSessionCookie({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
      fullName: result.user.fullName,
    });

    return { success: true, slug: result.tenant.slug };
  } catch (error) {
    console.error("Error al registrar tenant:", error);
    return { success: false, error: "Ocurrió un error al registrar el negocio. Intenta nuevamente." };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
