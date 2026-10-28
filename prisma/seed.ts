import { PrismaClient, UserRole, AppointmentStatus, BrandTheme } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizePhone } from "../src/lib/booking/phone";
import {
  addDaysToDateKey,
  formatDateKeyInZone,
  zonedToUtc,
} from "../src/lib/booking/time";

const prisma = new PrismaClient();

const TIMEZONE = "America/Mexico_City";

async function main() {
  console.log("🌱 Iniciando sembrado de datos...");

  // 1. Limpiar datos existentes en caso de re-ejecución
  await prisma.appointment.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Crear Tenant (Negocio de ejemplo)
  const tenant = await prisma.tenant.create({
    data: {
      name: "Barbería & Spa Vintage",
      slug: "barberia-vintage",
      description:
        "Especialistas en cortes clásicos, degradados modernos y cuidado de barba de alta gama.",
      tagline: "El oficio de siempre, con la precisión de hoy.",
      story:
        "Abrimos en 2014 con dos sillas y una idea simple: que cada corte tenga tiempo. Hoy somos tres barberos, un ritual de toalla caliente y café de olla para quien espera.",
      phone: "+525541238899",
      whatsappNumber: "+525541238899",
      address: "Av. Insurgentes Sur 1205, Col. Del Valle, CDMX",
      currency: "MXN",
      logoUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=60",
      coverImageUrl:
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1400&auto=format&fit=crop&q=70",
      instagram: "barberiavintage",
      brandTheme: BrandTheme.TERRACOTTA,
      timezone: TIMEZONE,
      bookingWindowDays: 45,
      minLeadTimeMinutes: 60,
      cancellationWindowHours: 24,
    },
  });

  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.slug})`);

  // 3. Crear Usuario Administrador/Dueño (contraseña: password123)
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@barberiavintage.com",
      passwordHash: passwordHash,
      fullName: "Roberto Palacios",
      role: UserRole.OWNER,
    },
  });

  // 4. Crear Colaboradores (Staff)
  const staffMateo = await prisma.staffProfile.create({
    data: {
      tenantId: tenant.id,
      displayName: "Mateo Silva",
      email: "mateo@barberiavintage.com",
      phone: "+525511112222",
      colorCode: "#3b82f6",
      bio: "Cortes clásicos y degradados a máquina. Diez años detrás de la silla.",
      specialties: "Fade, cortes clásicos",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const staffValentina = await prisma.staffProfile.create({
    data: {
      tenantId: tenant.id,
      displayName: "Valentina Ríos",
      email: "valentina@barberiavintage.com",
      phone: "+525533334444",
      colorCode: "#ec4899",
      bio: "Color, textura y combos largos. Le gusta explicar el porqué de cada producto.",
      specialties: "Color, tratamientos",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const staffLucas = await prisma.staffProfile.create({
    data: {
      tenantId: tenant.id,
      displayName: "Lucas Gómez",
      email: "lucas@barberiavintage.com",
      phone: "+525555556666",
      colorCode: "#10b981",
      bio: "Barba y navaja. El ritual de toalla caliente es su especialidad.",
      specialties: "Barba, afeitado",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Colaboradores creados (3)");

  // 5. Horarios semanales (lunes a sábado, 09:00–19:00, descanso 13:00–14:00)
  const allStaff = [staffMateo, staffValentina, staffLucas];
  for (const staff of allStaff) {
    for (let day = 1; day <= 6; day++) {
      await prisma.schedule.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "19:00",
          hasBreak: true,
          breakStart: "13:00",
          breakEnd: "14:00",
          isWorkingDay: true,
        },
      });
    }
  }

  // Horario general del negocio (se muestra en Vitrina)
  for (let day = 0; day <= 6; day++) {
    await prisma.businessHour.create({
      data: {
        tenantId: tenant.id,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "19:00",
        isClosed: day === 0,
      },
    });
  }

  console.log("✅ Horarios laborales y del negocio asignados");

  // 6. Categorías
  const catCortes = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Cortes de Cabello" },
  });

  const catBarba = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Barbería Tradicional" },
  });

  const catCombos = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Paquetes & Experiencias" },
  });

  // 7. Servicios
  const servCorteClasico = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCortes.id,
      name: "Corte de Cabello Clásico",
      description:
        "Lavado previo, corte a tijera y máquina, terminado con navaja y peinado profesional.",
      imageUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=70",
      durationMinutes: 30,
      price: 250.0,
    },
  });

  const servFade = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCortes.id,
      name: "Fade / Degradado Moderno",
      description:
        "Skin fade milimétrico, diseño y aplicación de pomada de fijación.",
      imageUrl:
        "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=70",
      durationMinutes: 40,
      price: 300.0,
    },
  });

  const servBarba = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catBarba.id,
      name: "Perfilado y Cuidado de Barba",
      description:
        "Recorte simétrico, perfilado al filo de navaja y aplicación de aceites hidratantes.",
      imageUrl:
        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=70",
      durationMinutes: 25,
      price: 200.0,
    },
  });

  const servToallaCaliente = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catBarba.id,
      name: "Afeitado con Toalla Caliente",
      description:
        "Ritual completo de toallas calientes, espuma templada, afeitado profundo y bálsamo anti-irritación.",
      imageUrl:
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=70",
      durationMinutes: 35,
      price: 260.0,
    },
  });

  const servComboImperial = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCombos.id,
      name: "Combo Imperial (Corte + Barba + Mascarilla)",
      description:
        "La experiencia completa: corte premium, arreglo de barba y mascarilla purificante de puntos negros.",
      imageUrl:
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=70",
      durationMinutes: 60,
      price: 480.0,
    },
  });

  console.log("✅ Catálogo de servicios creado (5 servicios en 3 categorías)");

  // 8. Servicios por colaborador
  await prisma.staffService.createMany({
    data: [
      { staffId: staffMateo.id, serviceId: servCorteClasico.id },
      { staffId: staffMateo.id, serviceId: servFade.id },
      { staffId: staffMateo.id, serviceId: servBarba.id },
      { staffId: staffMateo.id, serviceId: servToallaCaliente.id },
      { staffId: staffMateo.id, serviceId: servComboImperial.id },

      { staffId: staffLucas.id, serviceId: servCorteClasico.id },
      { staffId: staffLucas.id, serviceId: servFade.id },
      { staffId: staffLucas.id, serviceId: servBarba.id },

      { staffId: staffValentina.id, serviceId: servCorteClasico.id },
      { staffId: staffValentina.id, serviceId: servFade.id },
      { staffId: staffValentina.id, serviceId: servComboImperial.id },
    ],
  });

  // 9. Clientes de prueba (teléfonos normalizados a E.164)
  const cliente1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      fullName: "Carlos Mendoza",
      phone: normalizePhone("55 1234 5678")!,
      email: "carlos.mendoza@email.com",
      whatsappOptIn: true,
    },
  });

  const cliente2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      fullName: "Andrés Navarro",
      phone: normalizePhone("+52 55 8765 4321")!,
      email: "andres.navarro@email.com",
      whatsappOptIn: true,
    },
  });

  // 10. Citas de prueba para hoy y mañana, en la zona del tenant
  const now = new Date();
  const todayKey = formatDateKeyInZone(now, TIMEZONE);
  const tomorrowKey = addDaysToDateKey(todayKey, 1);

  const todayStart = zonedToUtc(todayKey, "10:00", TIMEZONE);
  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      staffId: staffMateo.id,
      serviceId: servFade.id,
      customerId: cliente1.id,
      startTime: todayStart,
      endTime: new Date(todayStart.getTime() + 40 * 60_000),
      status: AppointmentStatus.CONFIRMED,
      totalPrice: 300.0,
      customerNotes: "Cliente frecuente. Prefiere desvanecido medio.",
      source: "ADMIN",
      confirmationCode: "H7K2M9",
    },
  });

  const tomorrowStart = zonedToUtc(tomorrowKey, "16:00", TIMEZONE);
  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      staffId: staffValentina.id,
      serviceId: servComboImperial.id,
      customerId: cliente2.id,
      startTime: tomorrowStart,
      endTime: new Date(tomorrowStart.getTime() + 60 * 60_000),
      status: AppointmentStatus.CONFIRMED,
      totalPrice: 480.0,
      customerNotes: "Reserva agendada desde el portal web.",
      source: "WEB",
      confirmationCode: "P4R8T2",
    },
  });

  // 11. Reseñas publicadas para Vitrina
  await prisma.testimonial.createMany({
    data: [
      {
        tenantId: tenant.id,
        authorName: "Lucía M.",
        quote:
          "Vine por una recomendación y me quedé por cómo me explicaron qué hacer con mi barba. Salí con un plan, no solo con un corte.",
        rating: 5,
        serviceId: servToallaCaliente.id,
        isPublished: true,
      },
      {
        tenantId: tenant.id,
        authorName: "Diego R.",
        quote:
          "El degradado aguantó tres semanas impecable. Y el café de olla mientras esperás no tiene precio.",
        rating: 5,
        serviceId: servFade.id,
        isPublished: true,
      },
      {
        tenantId: tenant.id,
        authorName: "Mariana T.",
        quote:
          "Pedí un cambio de último momento y me lo resolvieron sin drama. Se nota que la agenda la manejan bien.",
        rating: 4,
        serviceId: servComboImperial.id,
        isPublished: true,
      },
    ],
  });

  console.log("✅ Citas de prueba y reseñas registradas");
  console.log("🎉 Sembrado completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en sembrado:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
