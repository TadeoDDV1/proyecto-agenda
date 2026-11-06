import { PrismaClient, UserRole, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Contraseña común para todas las cuentas de prueba. */
const PASS = "password123";

const days = (n: number, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  console.log("🌱 Generando datos y credenciales de prueba...\n");

  // ---------- limpieza ----------
  await prisma.appointment.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const hash = await bcrypt.hash(PASS, 10);

  // =========================================================
  // TENANT 1 — Barbería & Spa Vintage
  // =========================================================
  const t1 = await prisma.tenant.create({
    data: {
      name: "Barbería & Spa Vintage",
      slug: "barberia-vintage",
      description:
        "Especialistas en cortes clásicos, degradados modernos y cuidado de barba de alta gama.",
      phone: "+52 55 4123 8899",
      address: "Av. Insurgentes Sur 1205, Col. Del Valle, CDMX",
      currency: "MXN",
    },
  });

  // usuarios de los tres roles
  const owner1 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "admin@barberiavintage.com",
      passwordHash: hash,
      fullName: "Carlos Mendoza (Dueño)",
      role: UserRole.OWNER,
    },
  });
  const admin1 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "gerente@barberiavintage.com",
      passwordHash: hash,
      fullName: "Laura Ríos (Gerente)",
      role: UserRole.ADMIN,
    },
  });
  const staffUser1 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "mateo@barberiavintage.com",
      passwordHash: hash,
      fullName: "Mateo Álvarez (Barbero)",
      role: UserRole.STAFF,
    },
  });
  const staffUser2 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "valentina@barberiavintage.com",
      passwordHash: hash,
      fullName: "Valentina Cruz (Estilista)",
      role: UserRole.STAFF,
    },
  });
  const staffUser3 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "lucas@barberiavintage.com",
      passwordHash: hash,
      fullName: "Lucas Hernández (Colorista)",
      role: UserRole.STAFF,
    },
  });
  // cuenta para probar baja lógica (perfil inactivo)
  const staffUser4 = await prisma.user.create({
    data: {
      tenantId: t1.id,
      email: "inactivo@barberiavintage.com",
      passwordHash: hash,
      fullName: "Diego Soto (Inactivo)",
      role: UserRole.STAFF,
    },
  });

  const s1 = await prisma.staffProfile.create({
    data: {
      tenantId: t1.id,
      userId: staffUser1.id,
      displayName: "Mateo Álvarez",
      phone: "+52 55 1111 2222",
      email: "mateo@barberiavintage.com",
      colorCode: "#3b82f6",
      isActive: true,
    },
  });
  const s2 = await prisma.staffProfile.create({
    data: {
      tenantId: t1.id,
      userId: staffUser2.id,
      displayName: "Valentina Cruz",
      phone: "+52 55 3333 4444",
      email: "valentina@barberiavintage.com",
      colorCode: "#ec4899",
      isActive: true,
    },
  });
  const s3 = await prisma.staffProfile.create({
    data: {
      tenantId: t1.id,
      userId: staffUser3.id,
      displayName: "Lucas Hernández",
      phone: "+52 55 5555 6666",
      email: "lucas@barberiavintage.com",
      colorCode: "#10b981",
      isActive: true,
    },
  });
  // colaborador sin usuario (se agenda, no inicia sesión)
  const s4 = await prisma.staffProfile.create({
    data: {
      tenantId: t1.id,
      displayName: "Rosa Jiménez (sin usuario)",
      phone: "+52 55 7777 8888",
      colorCode: "#f59e0b",
      isActive: true,
    },
  });
  // colaborador inactivo (no debe aparecer en el portal público)
  await prisma.staffProfile.create({
    data: {
      tenantId: t1.id,
      userId: staffUser4.id,
      displayName: "Diego Soto",
      phone: "+52 55 9999 0000",
      colorCode: "#6b7280",
      isActive: false,
    },
  });

  const catCorte = await prisma.category.create({ data: { tenantId: t1.id, name: "Cortes" } });
  const catBarba = await prisma.category.create({ data: { tenantId: t1.id, name: "Barba" } });
  const catSpa = await prisma.category.create({ data: { tenantId: t1.id, name: "Spa" } });

  const sv1 = await prisma.service.create({
    data: {
      tenantId: t1.id,
      categoryId: catCorte.id,
      name: "Corte clásico",
      description: "Corte a tijera con acabado y peinado.",
      durationMinutes: 45,
      price: 250,
    },
  });
  const sv2 = await prisma.service.create({
    data: {
      tenantId: t1.id,
      categoryId: catCorte.id,
      name: "Degradado moderno",
      description: "Fade con máquina y perfilado.",
      durationMinutes: 60,
      price: 320,
    },
  });
  const sv3 = await prisma.service.create({
    data: {
      tenantId: t1.id,
      categoryId: catBarba.id,
      name: "Afeitado con navaja",
      description: "Ritual completo con toalla caliente.",
      durationMinutes: 30,
      price: 180,
    },
  });
  const sv4 = await prisma.service.create({
    data: {
      tenantId: t1.id,
      categoryId: catSpa.id,
      name: "Facial hidratante",
      description: "Limpieza profunda e hidratación.",
      durationMinutes: 90,
      price: 650,
    },
  });
  // servicio desactivado (para probar filtros)
  const sv5 = await prisma.service.create({
    data: {
      tenantId: t1.id,
      categoryId: catSpa.id,
      name: "Masaje relajante (inactivo)",
      durationMinutes: 60,
      price: 500,
      isActive: false,
    },
  });

  // qué servicios ofrece cada colaborador
  for (const sv of [sv1, sv2, sv3]) {
    await prisma.staffService.create({ data: { staffId: s1.id, serviceId: sv.id } });
  }
  for (const sv of [sv1, sv2, sv4]) {
    await prisma.staffService.create({ data: { staffId: s2.id, serviceId: sv.id } });
  }
  for (const sv of [sv1, sv3, sv4]) {
    await prisma.staffService.create({ data: { staffId: s3.id, serviceId: sv.id } });
  }
  for (const sv of [sv1, sv2]) {
    await prisma.staffService.create({ data: { staffId: s4.id, serviceId: sv.id } });
  }

  // horarios: lunes a sábado, con descanso
  for (const st of [s1, s2, s3, s4]) {
    for (let d = 1; d <= 6; d++) {
      await prisma.schedule.create({
        data: {
          staffId: st.id,
          dayOfWeek: d,
          startTime: "09:00",
          endTime: "18:00",
          hasBreak: d !== 6,
          breakStart: d !== 6 ? "14:00" : null,
          breakEnd: d !== 6 ? "15:00" : null,
          isWorkingDay: true,
        },
      });
    }
    // domingo cerrado
    await prisma.schedule.create({
      data: { staffId: st.id, dayOfWeek: 0, startTime: "09:00", endTime: "14:00", isWorkingDay: false },
    });
  }

  const clientes = [];
  const datos = [
    ["Ana López", "+52 55 1000 0001", "ana.lopez@email.com"],
    ["Jorge Ramírez", "+52 55 1000 0002", "jorge.ramirez@email.com"],
    ["María Fernanda Ruiz", "+52 55 1000 0003", "mafer@email.com"],
    ["Luis Torres", "+52 55 1000 0004", null],
    ["Sofía Méndez", "+52 55 1000 0005", "sofia.mendez@email.com"],
  ];
  for (const [fullName, phone, email] of datos) {
    clientes.push(
      await prisma.customer.create({
        data: { tenantId: t1.id, fullName: fullName as string, phone: phone as string, email: email as string | null },
      })
    );
  }

  // citas en todos los estados y en fechas pasadas y futuras
  const citas: Array<[number, typeof s1, typeof sv1, number, AppointmentStatus]> = [
    [0, s1, sv1, -3, AppointmentStatus.COMPLETED],
    [1, s2, sv4, -2, AppointmentStatus.NO_SHOW],
    [2, s3, sv3, -1, AppointmentStatus.CANCELLED],
    [3, s1, sv2, 1, AppointmentStatus.CONFIRMED],
    [4, s2, sv1, 2, AppointmentStatus.PENDING],
    [0, s3, sv4, 3, AppointmentStatus.CONFIRMED],
    [1, s4, sv1, 4, AppointmentStatus.CONFIRMED],
    [2, s1, sv3, 5, AppointmentStatus.PENDING],
  ];
  for (const [i, st, sv, offset, status] of citas) {
    const start = days(offset, 10 + (i % 5), 0);
    const end = new Date(start.getTime() + sv.durationMinutes * 60000);
    await prisma.appointment.create({
      data: {
        tenantId: t1.id,
        staffId: st.id,
        serviceId: sv.id,
        customerId: clientes[i % clientes.length].id,
        startTime: start,
        endTime: end,
        status,
        totalPrice: sv.price,
        customerNotes: i % 2 === 0 ? "Cliente prefiere cita por la mañana." : null,
        internalNotes: i % 3 === 0 ? "Cliente frecuente, aplicar descuento." : null,
      },
    });
  }

  // =========================================================
  // TENANT 2 — para probar aislamiento multi-inquilino
  // =========================================================
  const t2 = await prisma.tenant.create({
    data: {
      name: "Estética Bella Vista",
      slug: "estetica-bella-vista",
      description: "Estética integral: uñas, maquillaje y cuidado facial.",
      phone: "+52 961 123 4567",
      address: "Blvd. Belisario Domínguez 250, Tuxtla Gutiérrez, Chiapas",
      currency: "MXN",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      tenantId: t2.id,
      email: "dueno@bellavista.com",
      passwordHash: hash,
      fullName: "Patricia Núñez (Dueña)",
      role: UserRole.OWNER,
    },
  });
  await prisma.user.create({
    data: {
      tenantId: t2.id,
      email: "recepcion@bellavista.com",
      passwordHash: hash,
      fullName: "Karla Gómez (Recepción)",
      role: UserRole.ADMIN,
    },
  });
  const staff2User = await prisma.user.create({
    data: {
      tenantId: t2.id,
      email: "estilista@bellavista.com",
      passwordHash: hash,
      fullName: "Diana Solís (Estilista)",
      role: UserRole.STAFF,
    },
  });

  const bs1 = await prisma.staffProfile.create({
    data: {
      tenantId: t2.id,
      userId: staff2User.id,
      displayName: "Diana Solís",
      phone: "+52 961 555 0001",
      colorCode: "#8b5cf6",
      isActive: true,
    },
  });

  const catUnas = await prisma.category.create({ data: { tenantId: t2.id, name: "Uñas" } });
  const bsv1 = await prisma.service.create({
    data: {
      tenantId: t2.id,
      categoryId: catUnas.id,
      name: "Manicure gel",
      durationMinutes: 60,
      price: 350,
    },
  });
  const bsv2 = await prisma.service.create({
    data: {
      tenantId: t2.id,
      categoryId: catUnas.id,
      name: "Pedicure spa",
      durationMinutes: 75,
      price: 420,
    },
  });
  await prisma.staffService.create({ data: { staffId: bs1.id, serviceId: bsv1.id } });
  await prisma.staffService.create({ data: { staffId: bs1.id, serviceId: bsv2.id } });
  for (let d = 1; d <= 5; d++) {
    await prisma.schedule.create({
      data: { staffId: bs1.id, dayOfWeek: d, startTime: "10:00", endTime: "19:00" },
    });
  }

  const bc1 = await prisma.customer.create({
    data: { tenantId: t2.id, fullName: "Fernanda López", phone: "+52 961 777 0001" },
  });
  const inicio = days(1, 11, 0);
  await prisma.appointment.create({
    data: {
      tenantId: t2.id,
      staffId: bs1.id,
      serviceId: bsv1.id,
      customerId: bc1.id,
      startTime: inicio,
      endTime: new Date(inicio.getTime() + 60 * 60000),
      status: AppointmentStatus.CONFIRMED,
      totalPrice: bsv1.price,
    },
  });

  console.log("✅ Datos creados\n");
  console.log("Tenants: 2 | Usuarios: 8 | Colaboradores: 5 | Servicios: 7 | Citas: 9\n");
  console.log("CREDENCIALES (contraseña para todas: " + PASS + ")");
  console.log("---------------------------------------------------------------");
  const usuarios = await prisma.user.findMany({
    include: { tenant: true, staffProfile: true },
    orderBy: [{ tenantId: "asc" }, { role: "asc" }],
  });
  for (const u of usuarios) {
    console.log(
      `${u.role.padEnd(6)} | ${u.email.padEnd(34)} | ${u.tenant.slug.padEnd(20)} | ${
        u.staffProfile ? u.staffProfile.displayName : "—"
      }`
    );
  }
  console.log("---------------------------------------------------------------");
  console.log("FIN");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
