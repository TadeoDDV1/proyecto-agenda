import { PrismaClient, UserRole, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando sembrado de datos...");

  // 1. Limpiar datos existentes en caso de re-ejecución
  await prisma.appointment.deleteMany();
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
      description: "Especialistas en cortes clásicos, degradados modernos y cuidado de barba de alta gama.",
      phone: "+52 55 4123 8899",
      address: "Av. Insurgentes Sur 1205, Col. Del Valle, CDMX",
      currency: "MXN",
      logoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=60",
    },
  });

  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.slug})`);

  // 3. Crear Usuario Administrador/Dueño
  const ownerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@barberiavintage.com",
      passwordHash: "hash_demo_12345", // En fases siguientes se integrará bcrypt/argon2
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
      phone: "+52 55 1111 2222",
      colorCode: "#3b82f6", // Azul
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const staffValentina = await prisma.staffProfile.create({
    data: {
      tenantId: tenant.id,
      displayName: "Valentina Ríos",
      email: "valentina@barberiavintage.com",
      phone: "+52 55 3333 4444",
      colorCode: "#ec4899", // Rosa
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const staffLucas = await prisma.staffProfile.create({
    data: {
      tenantId: tenant.id,
      displayName: "Lucas Gómez",
      email: "lucas@barberiavintage.com",
      phone: "+52 55 5555 6666",
      colorCode: "#10b981", // Verde
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Colaboradores creados (3)");

  // 5. Configurar Horarios Semanales (Lunes a Sábado, 09:00 - 19:00, Almuerzo 13:00 - 14:00)
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

  console.log("✅ Horarios laborales asignados para todo el equipo");

  // 6. Crear Categorías
  const catCortes = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Cortes de Cabello",
    },
  });

  const catBarba = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Barbería Tradicional",
    },
  });

  const catCombos = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Paquetes & Experiencias",
    },
  });

  // 7. Crear Servicios
  const servCorteClasico = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCortes.id,
      name: "Corte de Cabello Clásico",
      description: "Lavado previo, corte a tijera y máquina, terminado con navaja y peinado profesional.",
      durationMinutes: 30,
      price: 250.0,
    },
  });

  const servFade = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCortes.id,
      name: "Fade / Degradado Moderno",
      description: "Skin fade milimétrico, diseño y aplicación de pomada de fijación.",
      durationMinutes: 40,
      price: 300.0,
    },
  });

  const servBarba = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catBarba.id,
      name: "Perfilado y Cuidado de Barba",
      description: "Recorte simétrico, perfilado al filo de navaja y aplicación de aceites hidratantes.",
      durationMinutes: 25,
      price: 200.0,
    },
  });

  const servToallaCaliente = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catBarba.id,
      name: "Afeitado con Toalla Caliente",
      description: "Ritual completo de toallas calientes, espuma templada, afeitado profundo y bálsamo anti-irritación.",
      durationMinutes: 35,
      price: 260.0,
    },
  });

  const servComboImperial = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCombos.id,
      name: "Combo Imperial (Corte + Barba + Mascarilla)",
      description: "La experiencia completa: corte premium, arreglo de barba y mascarilla purificante de puntos negros.",
      durationMinutes: 60,
      price: 480.0,
    },
  });

  console.log("✅ Catálogo de servicios creado (5 servicios en 3 categorías)");

  // 8. Asignar servicios a colaboradores
  // Mateo y Lucas hacen cortes y barbas; Valentina hace cortes y combos
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

  // 9. Crear Clientes de Prueba
  const cliente1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      fullName: "Carlos Mendoza",
      phone: "+52 55 1234 5678",
      email: "carlos.mendoza@email.com",
    },
  });

  const cliente2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      fullName: "Andrés Navarro",
      phone: "+52 55 8765 4321",
      email: "andres.navarro@email.com",
    },
  });

  // 10. Crear Citas de Prueba para hoy y mañana
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const endToday = new Date(today);
  endToday.setMinutes(endToday.getMinutes() + 40);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      staffId: staffMateo.id,
      serviceId: servFade.id,
      customerId: cliente1.id,
      startTime: today,
      endTime: endToday,
      status: AppointmentStatus.CONFIRMED,
      totalPrice: 300.0,
      customerNotes: "Cliente frecuente. Prefiere desvanecido medio.",
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(16, 0, 0, 0);
  const endTomorrow = new Date(tomorrow);
  endTomorrow.setMinutes(endTomorrow.getMinutes() + 60);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      staffId: staffValentina.id,
      serviceId: servComboImperial.id,
      customerId: cliente2.id,
      startTime: tomorrow,
      endTime: endTomorrow,
      status: AppointmentStatus.CONFIRMED,
      totalPrice: 480.0,
      customerNotes: "Reserva agendada desde el portal web.",
    },
  });

  console.log("✅ Citas de prueba registradas");
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
