import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Exportación CSV para el panel de plataforma.
 * GET /api/superadmin/exportar?tipo=negocios|citas
 */
function csv(filas: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM para que Excel respete los acentos
  return "\uFEFF" + filas.map((f) => f.map(escape).join(",")).join("\r\n");
}

export async function GET(req: Request) {
  const session = await getSession();
  if (session?.role !== "SUPERADMIN") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const tipo = new URL(req.url).searchParams.get("tipo") ?? "negocios";
  const fecha = new Date().toISOString().slice(0, 10);

  if (tipo === "citas") {
    const citas = await prisma.appointment.findMany({
      orderBy: { startTime: "desc" },
      take: 5000,
      include: {
        tenant: { select: { name: true, slug: true } },
        customer: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
        staff: { select: { displayName: true } },
      },
    });

    const filas: (string | number | null)[][] = [
      ["Fecha", "Hora", "Negocio", "Cliente", "Teléfono", "Servicio", "Colaborador", "Estado", "Total"],
      ...citas.map((c) => [
        c.startTime.toISOString().slice(0, 10),
        c.startTime.toISOString().slice(11, 16),
        c.tenant.name,
        c.customer.fullName,
        c.customer.phone,
        c.service.name,
        c.staff.displayName,
        c.status,
        Number(c.totalPrice).toFixed(2),
      ]),
    ];

    return new NextResponse(csv(filas), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="citas-${fecha}.csv"`,
      },
    });
  }

  const tenants = await prisma.tenant.findMany({
    where: { isPlatform: false },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, staff: true, services: true, appointments: true } } },
  });

  const filas: (string | number | null)[][] = [
    ["Negocio", "Identificador", "Plan", "Activo", "Moneda", "Usuarios", "Colaboradores", "Servicios", "Citas", "Alta"],
    ...tenants.map((t) => [
      t.name,
      t.slug,
      t.plan,
      t.isActive ? "Sí" : "No",
      t.currency,
      t._count.users,
      t._count.staff,
      t._count.services,
      t._count.appointments,
      t.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  return new NextResponse(csv(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="negocios-${fecha}.csv"`,
    },
  });
}
