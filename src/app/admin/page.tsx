import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
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
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();

  // Si hay sesión activa usamos el tenant del usuario; si no, tenant demo
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
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-xl font-bold">No hay negocios registrados</h2>
          <p className="text-gray-500 mt-2">Ejecuta el comando de sembrado con `npm run db:seed`.</p>
        </div>
      </div>
    );
  }

  // Métricas
  const totalRevenue = tenant.appointments
    .filter((a) => a.status !== "CANCELLED")
    .reduce((acc, app) => acc + Number(app.totalPrice), 0);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AdminNav
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        userEmail={session?.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {!session && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Estás visualizando el negocio demo (<strong>{tenant.name}</strong>). Para gestionar tu propio negocio privado, inicia sesión o regístrate.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
              >
                Crear Mi Negocio
              </Link>
            </div>
          </div>
        )}

        {/* Banner de bienvenida y accesos rápidos */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {session ? `Conectado como ${session.fullName}` : "Modo Administrador"}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agenda y Control de Citas
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Supervisa las reservas en tiempo real y gestiona los estados de cada cita.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/b/${tenant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              <Scissors className="w-4 h-4" />
              Probar Reserva como Cliente
            </Link>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Citas Totales
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {tenant.appointments.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ingresos Estimados
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalRevenue, tenant.currency)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Colaboradores
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {tenant.staff.length} activos
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Servicios Activos
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {tenant.services.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sección Principal con AppointmentManager y Sidebar */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Citas Registradas
            </h3>

            <AppointmentManager
              appointments={serializedAppointments}
              currency={tenant.currency}
            />
          </div>

          {/* Colaboradores & Info del Negocio */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  Equipo de Trabajo
                </h3>
                <Link
                  href="/admin/personal"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  Gestionar
                </Link>
              </div>

              <div className="space-y-3">
                {tenant.staff.map((st) => (
                  <div key={st.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-100"
                        style={{ borderColor: st.colorCode }}
                      >
                        {st.avatarUrl ? (
                          <img
                            src={st.avatarUrl}
                            alt={st.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{st.displayName}</p>
                        <p className="text-xs text-gray-400">{st.phone || "Sin teléfono"}</p>
                      </div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: st.colorCode }}
                      title={`Color: ${st.colorCode}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                Datos del Negocio
              </h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <span className="font-bold text-gray-800">Slug / Enlace:</span>{" "}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">
                    /b/{tenant.slug}
                  </code>
                </div>
                <div>
                  <span className="font-bold text-gray-800">Dirección:</span> {tenant.address || "No configurada"}
                </div>
                <div>
                  <span className="font-bold text-gray-800">Teléfono:</span> {tenant.phone || "No configurado"}
                </div>
                <div>
                  <span className="font-bold text-gray-800">Moneda:</span> {tenant.currency}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
