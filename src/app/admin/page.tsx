import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  Phone,
  Store,
  Layers,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Obtenemos el primer tenant activo para este avance
  const tenant = await prisma.tenant.findFirst({
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
  const totalRevenue = tenant.appointments.reduce(
    (acc, app) => acc + Number(app.totalPrice),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Panel de Control
              </span>
              <h1 className="text-sm sm:text-base font-bold leading-none">{tenant.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/b/${tenant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <span>Ver Portal Público</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Banner de bienvenida */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Base de Datos Conectada: PostgreSQL (agenda_db)
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agenda y Reservaciones del Negocio
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Aquí puedes supervisar las citas en tiempo real, colaboradores activos y catálogo de servicios.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/b/${tenant.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-sm transition"
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
                Citas Registradas
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

        {/* Sección de Citas y Colaboradores */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Listado de Citas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Citas Próximas y Recientes
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                Actualizado en tiempo real
              </span>
            </div>

            {tenant.appointments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay citas registradas en la agenda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenant.appointments.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Indicador de color del barbero */}
                      <div
                        className="w-1.5 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: app.staff.colorCode }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-base">
                            {app.customer.fullName}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">
                          {app.service.name} • {app.service.durationMinutes} min
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(app.startTime).toLocaleString("es-MX", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {app.staff.displayName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {app.customer.phone}
                          </span>
                        </div>
                        {app.customerNotes && (
                          <p className="text-xs bg-slate-50 text-slate-600 rounded-lg p-2 mt-2 border border-slate-100">
                            <span className="font-medium text-slate-700">Nota: </span>
                            {app.customerNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-lg font-black text-gray-900">
                        {formatCurrency(app.totalPrice, tenant.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colaboradores & Info del Negocio */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                Equipo de Trabajo
              </h3>
              <div className="space-y-4">
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
                        <p className="text-xs text-gray-400">{st.email || "Sin email"}</p>
                      </div>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: st.colorCode }}
                      title={`Color identificador: ${st.colorCode}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                Información del Tenant
              </h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <span className="font-bold text-gray-800">Identificador (Slug):</span>{" "}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">
                    {tenant.slug}
                  </code>
                </div>
                <div>
                  <span className="font-bold text-gray-800">Dirección:</span> {tenant.address}
                </div>
                <div>
                  <span className="font-bold text-gray-800">Teléfono:</span> {tenant.phone}
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
