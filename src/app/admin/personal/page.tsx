import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
    <main className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            Equipo & Colaboradores
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestiona a tus barberos, estilistas y especialistas con sus colores identificadores y turnos de trabajo.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
          Total: <span className="text-amber-400 font-bold">{tenant.staff.length}</span> especialistas
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Formulario de Nuevo Colaborador (Dark Luxe) */}
        <div className="lg:col-span-5 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-850 backdrop-blur-md shadow-2xl">
          <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Registrar Nuevo Especialista
          </h3>

          <form
            action={async (formData) => {
              "use server";
              await createStaffAction(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nombre Completo / Apodo *
              </label>
              <input
                type="text"
                name="displayName"
                required
                placeholder="Ej. Mateo Silva (Master Barber)"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Ej. +52 55 9876 5432"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                placeholder="especialista@negocio.com"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Color Identificador en Agenda
              </label>
              <div className="flex items-center gap-2.5 pt-1">
                {[
                  "#3b82f6", // Azul
                  "#ec4899", // Rosa
                  "#10b981", // Esmeralda
                  "#f59e0b", // Ámbar
                  "#8b5cf6", // Violeta
                  "#ef4444", // Rojo
                ].map((color) => (
                  <label
                    key={color}
                    className="cursor-pointer relative flex items-center justify-center group"
                  >
                    <input
                      type="radio"
                      name="colorCode"
                      value={color}
                      defaultChecked={color === "#3b82f6"}
                      className="sr-only peer"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-zinc-900 shadow-md ring-2 ring-transparent peer-checked:ring-amber-400 peer-checked:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Se asignarán turnos semanales automáticos de Lun a Sáb (09:00 - 19:00).</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
            >
              Agregar Especialista
            </button>
          </form>
        </div>

        {/* Listado de Colaboradores (Dark Luxe) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="font-bold text-sm text-white mb-2 flex items-center justify-between">
            <span>Equipo Actual</span>
            <span className="text-xs text-zinc-500 font-mono font-normal">Disponibles en el calendario</span>
          </h3>

          <div className="space-y-3">
            {tenant.staff.map((st) => (
              <div
                key={st.id}
                className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-850 hover:border-zinc-700 transition flex items-start justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center bg-zinc-950 flex-shrink-0 shadow-lg"
                    style={{ borderColor: st.colorCode }}
                  >
                    {st.avatarUrl ? (
                      <img
                        src={st.avatarUrl}
                        alt={st.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base group-hover:text-amber-400 transition">
                        {st.displayName}
                      </h4>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: st.colorCode }}
                        title={st.colorCode}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                      {st.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{st.phone}</span>
                        </span>
                      )}
                      {st.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{st.email}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 font-mono">
                      <span>{st.schedules.length} días de turno</span>
                      <span>•</span>
                      <span>{st.appointments.length} citas atendidas</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                  Activo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
