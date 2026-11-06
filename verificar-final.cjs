const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose"); const bcrypt = require("bcryptjs"); const fs = require("fs");
const BASE = "http://127.0.0.1:3100";
(async () => {
  const p = new PrismaClient();
  const users = await p.user.findMany({ include: { tenant: { select: { slug: true } } }, orderBy: [{ tenantId: "asc" }, { role: "asc" }] });
  const secret = (fs.readFileSync(".env","utf8").match(/JWT_SECRET="?([^"\r\n]+)"?/)||[])[1];
  const tok = (u) => new SignJWT({ userId:u.id, tenantId:u.tenantId, role:u.role, email:u.email, fullName:u.fullName })
    .setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));

  console.log("=== USUARIOS (" + users.length + ") ===");
  let okPass = 0;
  for (const u of users) {
    const valida = await bcrypt.compare("password123", u.passwordHash) || await bcrypt.compare("SuperAdmin123", u.passwordHash);
    if (valida) okPass++;
    console.log(`${valida ? "✅" : "❌"} ${u.role.padEnd(10)} ${u.email.padEnd(34)} ${u.tenant.slug}`);
  }
  console.log(`contraseñas válidas: ${okPass}/${users.length}`);

  const owner = users.find(u => u.role === "OWNER" && u.tenant.slug === "barberia-vintage");
  const staff = users.find(u => u.role === "STAFF" && u.tenant.slug === "barberia-vintage");
  const sa = users.find(u => u.role === "SUPERADMIN");

  const chk = async (etq, ruta, cookie, fn) => {
    const r = await fetch(BASE + ruta, { headers: cookie ? { Cookie: `agenda_session=${cookie}` } : {}, redirect: "manual" });
    const body = r.status === 200 ? await r.text() : "";
    const ok = fn(r.status, body);
    console.log(`${ok ? "✅" : "❌"} ${etq.padEnd(46)} ${r.status}`);
    return ok;
  };
  let f = 0; const n = (x) => { if (!x) f++; };

  n(await chk("OWNER /admin", "/admin", await tok(owner), s => s === 200));
  n(await chk("OWNER /admin/configuracion (formulario)", "/admin/configuracion", await tok(owner), (s,b) => s === 200 && b.includes("Configuración del Salón")));
  n(await chk("STAFF /admin", "/admin", await tok(staff), s => s === 200));
  n(await chk("STAFF no ve configuración", "/admin/configuracion", await tok(staff), (s,b) => !b.includes("Configuración del Salón")));
  n(await chk("SUPERADMIN /superadmin", "/superadmin", await tok(sa), s => s === 200));
  n(await chk("SUPERADMIN /superadmin/citas", "/superadmin/citas", await tok(sa), s => s === 200));
  n(await chk("SUPERADMIN /superadmin/auditoria", "/superadmin/auditoria", await tok(sa), s => s === 200));
  n(await chk("ficha con botón impersonar", `/superadmin/negocios/${owner.tenantId}`, await tok(sa), (s,b) => s === 200 && b.includes("Entrar como el negocio")));
  n(await chk("ANÓNIMO /admin", "/admin", null, s => s === 307));
  console.log(f === 0 ? "\nTODO OK" : `\n${f} FALLOS`);
  await p.$disconnect();
})();
