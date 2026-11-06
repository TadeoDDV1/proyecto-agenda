const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");
const fs = require("fs");
const BASE = "http://127.0.0.1:3100";
(async () => {
  const p = new PrismaClient();
  const u = async (role, slug) => p.user.findFirst({ where: { role, tenant: { slug } } });
  const owner = await u("OWNER", "barberia-vintage");
  const staff = await u("STAFF", "barberia-vintage");
  const sa = await p.user.findUnique({ where: { email: "superadmin@agenda.com" } });
  await p.$disconnect();
  const secret = (fs.readFileSync(".env","utf8").match(/JWT_SECRET="?([^"\r\n]+)"?/)||[])[1];
  const tok = (x) => new SignJWT({ userId:x.id, tenantId:x.tenantId, role:x.role, email:x.email, fullName:x.fullName })
    .setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));
  const tOW = await tok(owner), tST = await tok(staff), tSA = await tok(sa);
  const probar = async (etiqueta, ruta, cookie, esperado) => {
    const r = await fetch(BASE + ruta, { headers: cookie ? { Cookie: `agenda_session=${cookie}` } : {}, redirect: "manual" });
    const ok = r.status === esperado;
    console.log(`${ok ? "✅" : "❌"} ${etiqueta.padEnd(48)} ${r.status} (esperado ${esperado})`);
    return ok;
  };
  let f = 0;
  f += (await probar("OWNER /admin", "/admin", tOW, 200)) ? 0 : 1;
  f += (await probar("OWNER /admin/configuracion", "/admin/configuracion", tOW, 200)) ? 0 : 1;
  f += (await probar("STAFF /admin", "/admin", tST, 200)) ? 0 : 1;
  f += (await probar("STAFF /admin/configuracion (bloqueado)", "/admin/configuracion", tST, 307)) ? 0 : 1;
  f += (await probar("STAFF /admin/servicios", "/admin/servicios", tST, 200)) ? 0 : 1;
  f += (await probar("SUPERADMIN /admin (redirige)", "/admin", tSA, 307)) ? 0 : 1;
  f += (await probar("SUPERADMIN /superadmin", "/superadmin", tSA, 200)) ? 0 : 1;
  f += (await probar("SUPERADMIN /superadmin/auditoria", "/superadmin/auditoria", tSA, 200)) ? 0 : 1;
  f += (await probar("ANÓNIMO /admin (bloqueado)", "/admin", null, 307)) ? 0 : 1;
  f += (await probar("ANÓNIMO /superadmin (bloqueado)", "/superadmin", null, 307)) ? 0 : 1;
  f += (await probar("PÚBLICO portal", "/b/barberia-vintage", null, 200)) ? 0 : 1;
  console.log(f === 0 ? "\nMATRIZ DE ROLES: TODO OK" : `\n${f} FALLOS`);
})();
