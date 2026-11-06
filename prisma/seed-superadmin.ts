import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = "superadmin@agenda.com";
const SUPERADMIN_PASS = "SuperAdmin123";

async function main() {
  const hash = await bcrypt.hash(SUPERADMIN_PASS, 10);

  // Tenant interno que aloja a los administradores de la plataforma.
  const platform = await prisma.tenant.upsert({
    where: { slug: "plataforma" },
    update: { isPlatform: true, isActive: true, name: "Plataforma AgendaSaaS" },
    create: {
      name: "Plataforma AgendaSaaS",
      slug: "plataforma",
      description: "Negocio interno: no aparece en el portal público.",
      currency: "MXN",
      plan: "ENTERPRISE",
      isPlatform: true,
      isActive: true,
      features: {
        whatsappBot: true,
        publicBooking: false,
        bitacoras: true,
        reportes: true,
        multiSucursal: true,
      },
    },
  });

  const superadmin = await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: { role: UserRole.SUPERADMIN, tenantId: platform.id, passwordHash: hash },
    create: {
      tenantId: platform.id,
      email: SUPERADMIN_EMAIL,
      passwordHash: hash,
      fullName: "Administrador de Plataforma",
      role: UserRole.SUPERADMIN,
    },
  });

  // Marca como no-plataforma a los negocios existentes (por si acaso).
  await prisma.tenant.updateMany({
    where: { slug: { not: "plataforma" } },
    data: { isPlatform: false },
  });

  console.log("✅ Superadmin listo");
  console.log("   email:   ", superadmin.email);
  console.log("   password:", SUPERADMIN_PASS);
  console.log("   tenant:  ", platform.slug, platform.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
