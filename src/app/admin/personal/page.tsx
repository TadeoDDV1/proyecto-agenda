import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { createStaffAction } from "@/app/actions/admin";
import { Users, Plus, User, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

export default async function AdminStaffPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        staff: {
          include: {
            schedules: true,
            appointments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      include: {
        staff: {
          include: {
            schedules: true,
            appointments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  if (!tenant) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AdminNav
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        userEmail={session?.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              Equipo y Colaboradores
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Gestiona a tus barberos, estilistas y especialistas con sus colores de agenda y turnos de atención.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Formulario de Nuevo Colaborador */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              Registrar Nuevo Colaborador
            </h3>

            <form
              action={async (formData) => {
                "use server";
                await createStaffAction(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre Completo / Apodo *
                </label>
                <input
                  type="text"
                  name="displayName"
                  required
                  placeholder="Ej. Marco Barbero"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ej. +52 55 9876 5432"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="colaborador@negocio.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Color Identificador en Agenda
                </label>
                <div className="flex items-center gap-2">
                  {[
                    "#3b82f6", // Azul
                    "#ec4899", // Rosa
                    "#10b981", // Verde
                    "#f59e0b", // Ámbar
                    "#8b5cf6", // Violeta
                    "#ef4444", // Rojo
                  ].map((color) => (
                    <label
                      key={color}
                      className="cursor-pointer relative flex items-center justify-center"
                    >
                      <input
                        type="radio"
                        name="colorCode"
                        value={color}
                        defaultChecked={color === "#3b82f6"}
                        className="sr-only peer"
                      />
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent peer-checked:ring-slate-900 transition"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Se asignará automáticamente horario de Lun a Sáb de 09:00 a 19:00.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Agregar Colaborador
              </button>
            </form>
          </div>

          {/* Listado de Colaboradores */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-base text-gray-900 mb-2">
              Equipo de Trabajo ({tenant.staff.length})
            </h3>

            {tenant.staff.map((st) => (
              <div
                key={st.id}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-100 flex-shrink-0"
                    style={{ borderColor: st.colorCode }}
                  >
                    {st.avatarUrl ? (
                      <img
                        src={st.avatarUrl}
                        alt={st.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-base">{st.displayName}</h4>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: st.colorCode }}
                        title={st.colorCode}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                      {st.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {st.phone}
                        </span>
                      )}
                      {st.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {st.email}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {st.schedules.length} días de turno configurados
                      </span>
                      <span>•</span>
                      <span>{st.appointments.length} citas registradas</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  Disponible
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
