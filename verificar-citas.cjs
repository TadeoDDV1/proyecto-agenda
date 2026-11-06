const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");
const fs = require("fs");

const BASE = "http://127.0.0.1:3100";
(async () => {
  const prisma = new PrismaClient();
  const sa = await prisma.user.findUnique({ where: { email: "superadmin@agenda.com" } });
  const barberia = await prisma.tenant.findUnique({ where: { slug: "barberia-vintage" } });
  const confirmadas = await prisma.appointment.count({
    where: { tenantId: barberia.id, status: "CONFIRMED" },
  });
  const total = await prisma.appointment.count({ where: { tenantId: barberia.id } });
  await prisma.$disconnect();

  const secret = (fs.readFileSync(".env", "utf8").match(/JWT_SECRET="?([^"\r\n]+)"?/) || [])[1];
  const token = await new SignJWT({
    userId: sa.id, tenantId: sa.tenantId, role: "SUPERADMIN", email: sa.email, fullName: sa.fullName,
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h")
    .sign(new TextEncoder().encode(secret));

  const get = (p) => fetch(BASE + p, { headers: { Cookie: `agenda_session=${token}` } }).then(async (r) => ({ s: r.status, h: await r.text() }));

  let fallos = 0;
  const ok = (cond, msg) => { console.log(`${cond ? "✅" : "❌"} ${msg}`); if (!cond) fallos++; };

  const panel = await get("/superadmin");
  ok(panel.s === 200, "panel /superadmin responde 200");
  ok(panel.h.includes("Confirmadas"), "panel muestra columna 'Confirmadas'");
  ok(panel.h.includes("Próxima confirmada"), "panel muestra 'Próxima confirmada'");
  ok(panel.h.includes("Confirmadas 7 días"), "KPI de confirmadas en 7 días");

  const citas = await get("/superadmin/citas");
  ok(citas.s === 200, "/superadmin/citas responde 200");
  ok(citas.h.includes("Citas de todos los negocios"), "titulo de la vista de citas");
  ok(citas.h.includes("confirmadas"), "resumen de confirmadas");
  ok(citas.h.includes("Barbería"), "aparecen citas de Barbería");

  const filtro = await get(`/superadmin/citas?estado=CONFIRMED&negocio=${barberia.id}`);
  ok(filtro.s === 200, "filtro por estado + negocio responde 200");

  const detalle = await get(`/superadmin/negocios/${barberia.id}`);
  ok(detalle.s === 200, "ficha del negocio responde 200");
  ok(detalle.h.includes("Próximas citas confirmadas"), "ficha muestra próximas confirmadas");

  const sinSesion = await fetch(BASE + "/superadmin/citas", { redirect: "manual" });
  ok(sinSesion.status === 307, "citas exige sesión (307)");

  console.log(`\nDatos reales: Barbería tiene ${total} citas, ${confirmadas} confirmadas`);
  console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLOS`);
})();
