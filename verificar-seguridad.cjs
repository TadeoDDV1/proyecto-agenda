const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");
const fs = require("fs");
const BASE = "http://127.0.0.1:3100";

(async () => {
  const prisma = new PrismaClient();
  const sa = await prisma.user.findUnique({ where: { email: "superadmin@agenda.com" } });
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  await prisma.$disconnect();

  const secret = (fs.readFileSync(".env", "utf8").match(/JWT_SECRET="?([^"\r\n]+)"?/) || [])[1];
  const tok = (u) =>
    new SignJWT({ userId: u.id, tenantId: u.tenantId, role: u.role, email: u.email, fullName: u.fullName })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

  const tSA = await tok(sa);
  const tOW = await tok(owner);
  let fallos = 0;
  const ok = (c, m) => { console.log(`${c ? "✅" : "❌"} ${m}`); if (!c) fallos++; };

  // --- exportación CSV ---
  const sin = await fetch(`${BASE}/api/superadmin/exportar?tipo=negocios`, { redirect: "manual" });
  ok(sin.status === 401, "CSV sin sesión → 401");

  const conOwner = await fetch(`${BASE}/api/superadmin/exportar?tipo=negocios`, {
    headers: { Cookie: `agenda_session=${tOW}` }, redirect: "manual",
  });
  ok(conOwner.status === 401, "CSV con OWNER → 401 (solo plataforma)");

  const neg = await fetch(`${BASE}/api/superadmin/exportar?tipo=negocios`, { headers: { Cookie: `agenda_session=${tSA}` } });
  const negTxt = await neg.text();
  ok(neg.status === 200 && negTxt.includes("Negocio"), "CSV de negocios con superadmin → 200");
  ok((negTxt.match(/\r\n/g) || []).length >= 2, "CSV de negocios trae filas de datos");

  const cit = await fetch(`${BASE}/api/superadmin/exportar?tipo=citas`, { headers: { Cookie: `agenda_session=${tSA}` } });
  const citTxt = await cit.text();
  ok(cit.status === 200 && citTxt.includes("Servicio"), "CSV de citas con superadmin → 200");

  // --- chatbot sigue respondiendo ---
  const bot = await fetch(`${BASE}/api/chatbot`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantSlug: "barberia-vintage", sessionId: "seg-test", mensaje: "servicios" }),
  });
  const botJson = await bot.json();
  ok(bot.status === 200 && /Corte/i.test(botJson.reply || ""), "chatbot responde el catálogo");

  // --- webhook no acepta token inválido ---
  const wb = await fetch(`${BASE}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1`);
  ok(wb.status === 403, "webhook rechaza token inválido");

  console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLOS`);
})();
