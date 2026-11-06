const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");
const fs = require("fs");

const BASE = "http://127.0.0.1:3100";

async function token(user) {
  const env = fs.readFileSync(".env", "utf8");
  const secret = (env.match(/JWT_SECRET="?([^"\r\n]+)"?/) || [])[1];
  return new SignJWT({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(secret));
}

async function probe(label, path, cookie, expect) {
  const res = await fetch(BASE + path, {
    headers: cookie ? { Cookie: `agenda_session=${cookie}` } : {},
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  const ok = typeof expect === "number" ? res.status === expect : expect(res, body);
  console.log(
    `${ok ? "✅" : "❌"} ${label.padEnd(46)} -> ${res.status}${
      res.status >= 300 && res.status < 400 ? " → " + (res.headers.get("location") || "") : ""
    }`
  );
  return { ok, status: res.status, body };
}

(async () => {
  const prisma = new PrismaClient();
  const sa = await prisma.user.findUnique({ where: { email: "superadmin@agenda.com" } });
  const owner = await prisma.user.findFirst({ where: { role: "OWNER", tenant: { slug: "barberia-vintage" } } });
  const staff = await prisma.user.findFirst({ where: { role: "STAFF", tenant: { slug: "barberia-vintage" } } });
  const t2 = await prisma.tenant.findUnique({ where: { slug: "estetica-bella-vista" } });
  await prisma.$disconnect();

  const tSA = await token(sa);
  const tOW = await token(owner);
  const tST = await token(staff);

  let fallos = 0;
  const check = async (...a) => { const r = await probe(...a); if (!r.ok) fallos++; return r; };

  console.log("\n— Plataforma (superadmin) —");
  await check("/superadmin sin sesión", "/superadmin", null, 307);
  const panel = await check("/superadmin con sesión", "/superadmin", tSA, 200);
  console.log("   oculta 'Plataforma AgendaSaaS':", panel.body.includes("Plataforma AgendaSaaS") ? "❌ NO" : "✅ sí");
  console.log("   lista negocios reales:", panel.body.includes("Barbería") ? "✅ sí" : "❌ no");

  console.log("\n— Redirección y aislamiento —");
  await check("/admin como SUPERADMIN", "/admin", tSA, 307);
  await check("/admin como OWNER", "/admin", tOW, 200);
  await check("/admin/servicios como OWNER", "/admin/servicios", tOW, 200);
  await check("/admin como STAFF", "/admin", tST, 200);
  await check("/superadmin como OWNER", "/superadmin", tOW, 307);

  console.log("\n— Portales públicos —");
  await check("/b/plataforma (interno)", "/b/plataforma", null, (r, b) => r.status === 404 || !b.includes("Reserva tu cita"));
  await check("/b/barberia-vintage", "/b/barberia-vintage", null, 200);
  await check("/b/estetica-bella-vista", "/b/estetica-bella-vista", null, 200);
  await check("/b/no-existe", "/b/no-existe", null, (r, b) => r.status === 404 || !b.includes("Reserva tu cita"));

  console.log("\n— Público general —");
  await check("/", "/", null, 200);
  await check("/login", "/login", null, 200);
  await check("/register", "/register", null, 200);

  const det = await fetch(`${BASE}/superadmin/negocios/${t2.id}`, { headers: { Cookie: `agenda_session=${tSA}` } });
  console.log(`${det.status === 200 ? "✅" : "❌"} Ficha de negocio (ajena al superadmin) -> ${det.status}`);
  if (det.status !== 200) fallos++;

  console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLOS`);
})();
