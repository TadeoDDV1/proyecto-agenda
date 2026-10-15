import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AppointmentManager } from "@/components/AppointmentManager";
import {
  Calendar,
  User,
  Scissors,
  TrendingUp,
  Store,
  Layers,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();

  let tenant = null;

  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        staff: true,
        services: true,
        appointments: {
          include: {
            service: true,
            staff: true,
            customer: true,
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });
  }

  // Fallback al tenant demo si no hay sesión
  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      include: {
        staff: true,
        services: true,
        appointments: {
          include: {
            service: true,
            staff: true,
            customer: true,
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });
  }

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-zinc-400">
        <div>
          <h2 className="text-xl font-bold text-white">No hay negocios registrados</h2>
          <p className="text-sm mt-2">Ejecuta el comando de sembrado con `npm run db:seed`.</p>
        </div>
      </div>
    );
  }

  // Métricas
  const confirmedOrCompleted = tenant.appointments.filter((a) => a.status !== "CANCELLED");
  const totalRevenue = confirmedOrCompleted.reduce((acc, app) => acc + Number(app.totalPrice), 0);
  const completedCount = tenant.appointments.filter((a) => a.status === "COMPLETED").length;

  // Serialización para AppointmentManager (Client Component)
  const serializedAppointments = tenant.appointments.map((a) => ({
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    totalPrice: Number(a.totalPrice),
    customerNotes: a.customerNotes,
    service: {
      name: a.service.name,
      durationMinutes: a.service.durationMinutes,
    },
    staff: {
      displayName: a.staff.displayName,
      colorCode: a.staff.colorCode,
    },
    customer: {
      fullName: a.customer.fullName,
      phone: a.customer.phone,
      email: a.customer.email,
    },
  }));

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
      {/* Banner de Modo Demo si no hay sesión */}
      {!session && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Estás visualizando el negocio de demostración (<strong>{tenant.name}</strong>). Para gestionar tu propio negocio privado, inicia sesión o crea una cuenta.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-700 transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-md shadow-amber-500/20"
            >
              Crear Mi Negocio
            </Link>
          </div>
        </div>
      )}

      {/* Header Principal del Dashboard (Dark Luxe) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 capitalize mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{todayFormatted}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Resumen Operativo
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Supervisa reservaciones, ingresos estimados y la actividad de tu equipo en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/calendario"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-800 transition"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Ver Calendario Diario</span>
          </Link>

          <Link
            href={`/b/${tenant.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Scissors className="w-4 h-4" />
            <span>Probar Reserva como Cliente</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Dark Luxe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 transition-all backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ingresos Estimados
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 group-hover:text-emerald-400 transition-colors">
            {formatCurrency(totalRevenue, tenant.currency)}
          </h3>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {confirmedOrCompleted.length} cita(s) activas
          </span>
        </div>

        {/* Citas Totales */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Citas Registradas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 group-hover:text-amber-400 transition-colors">
            {tenant.appointments.length}
          </h3>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
            {completedCount} completadas
          </span>
        </div>

        {/* Especialistas Activos */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Especialistas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 group-hover:text-blue-400 transition-colors">
            {tenant.staff.length}
          </h3>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Turnos semanales asignados
          </span>
        </div>

        {/* Servicios */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 transition-all backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Servicios en Catálogo
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 group-hover:text-purple-400 transition-colors">
            {tenant.services.length}
          </h3>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Disponibles en el portal web
          </span>
        </div>
      </div>

      {/* Grid Principal: AppointmentManager + Sidebar de Detalles */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Columna de Citas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Gestión de Agenda & Citas
            </h3>
            <span className="text-xs text-zinc-500 font-medium font-mono">
              Sincronizado en tiempo real
            </span>
          </div>

          <AppointmentManager
            appointments={serializedAppointments}
            currency={tenant.currency}
            businessName={tenant.name}
          />
        </div>

        {/* Columna Lateral Informativa (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tarjeta de Equipo */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-850 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Equipo de Especialistas
              </h4>
              <Link
                href="/admin/personal"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
              >
                Gestionar
              </Link>
            </div>

            <div className="space-y-3">
              {tenant.staff.map((st) => (
                <div key={st.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-850/50 transition">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center bg-zinc-950 flex-shrink-0"
                      style={{ borderColor: st.colorCode }}
                    >
                      {st.avatarUrl ? (
                        <img
                          src={st.avatarUrl}
                          alt={st.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block leading-tight">
                        {st.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">
                        {st.phone || "Sin teléfono"}
                      </span>
                    </div>
                  </div>

                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: st.colorCode }}
                    title={`Color: ${st.colorCode}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Datos del Negocio */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-850 backdrop-blur-md text-xs space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-amber-400" />
              Configuración de Local
            </h4>

            <div>
              <span className="text-zinc-500 block uppercase font-semibold text-[10px]">Identificador Único</span>
              <code className="text-amber-400 font-mono text-xs mt-0.5 block">/b/{tenant.slug}</code>
            </div>

            <div>
              <span className="text-zinc-500 block uppercase font-semibold text-[10px]">Dirección</span>
              <span className="text-zinc-300 mt-0.5 block">{tenant.address || "No configurada"}</span>
            </div>

            <div>
              <span className="text-zinc-500 block uppercase font-semibold text-[10px]">Teléfono de contacto</span>
              <span className="text-zinc-300 mt-0.5 block">{tenant.phone || "No configurado"}</span>
            </div>

            <div>
              <span className="text-zinc-500 block uppercase font-semibold text-[10px]">Moneda configurada</span>
              <span className="text-zinc-300 mt-0.5 block">{tenant.currency}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
