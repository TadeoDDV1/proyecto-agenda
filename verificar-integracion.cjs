const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose"); const fs = require("fs");
const BASE = "http://127.0.0.1:3100";
(async () => {
  const p = new PrismaClient();
  const owner = await p.user.findFirst({ where: { role: "OWNER", tenant: { slug: "barberia-vintage" } } });
  const staff = await p.user.findFirst({ where: { role: "STAFF", tenant: { slug: "barberia-vintage" } } });
  const sa = await p.user.findUnique({ where: { email: "superadmin@agenda.com" } });
  await p.$disconnect();
  const secret = (fs.readFileSync(".env","utf8").match(/JWT_SECRET="?([^"\r\n]+)"?/)||[])[1];
  const tok = async (x) => new SignJWT({ userId:x.id, tenantId:x.tenantId, role:x.role, email:x.email, fullName:x.fullName, v:x.tokenVersion })
    .setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));
  const tOW = await tok(owner), tST = await tok(staff), tSA = await tok(sa);
  const chk = async (etq, ruta, cookie, esperado) => {
    const r = await fetch(BASE + ruta, { headers: cookie ? { Cookie: `agenda_session=${cookie}` } : {}, redirect: "manual" });
    const ok = r.status === esperado;
    console.log(`${ok ? "✅" : "❌"} ${etq.padEnd(42)} ${r.status} (esperado ${esperado})`);
    return ok ? 0 : 1;
  };
  let f = 0;
  f += await chk("portada", "/", null, 200);
  f += await chk("login", "/login", null, 200);
  f += await chk("portal público", "/b/barberia-vintage", null, 200);
  f += await chk("OWNER /admin", "/admin", tOW, 200);
  f += await chk("OWNER /admin/sesiones", "/admin/sesiones", tOW, 200);
  f += await chk("STAFF /admin/sesiones (redirige)", "/admin/sesiones", tST, 307);
  f += await chk("SUPERADMIN /superadmin", "/superadmin", tSA, 200);
  f += await chk("SUPERADMIN /superadmin/citas", "/superadmin/citas", tSA, 200);
  f += await chk("anónimo /admin", "/admin", null, 307);
  console.log(f === 0 ? "\nTODO OK" : `\n${f} FALLOS`);
})();
