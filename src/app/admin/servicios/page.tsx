import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { createServiceAction } from "@/app/actions/admin";
import { Layers, Plus, Clock, Scissors, Check, Tag } from "lucide-react";

export default async function AdminServicesPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        categories: true,
        services: {
          include: { category: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      include: {
        categories: true,
        services: {
          include: { category: true },
          orderBy: { createdAt: "desc" },
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
            <Layers className="w-6 h-6 text-amber-400" />
            Catálogo de Servicios
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configura los servicios, duraciones y precios disponibles para reservar en tu portal.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
          Total: <span className="text-amber-400 font-bold">{tenant.services.length}</span> activos
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Formulario de Nuevo Servicio (Dark Luxe) */}
        <div className="lg:col-span-5 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-850 backdrop-blur-md shadow-2xl">
          <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Crear Nuevo Servicio
          </h3>

          <form
            action={async (formData) => {
              "use server";
              await createServiceAction(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej. Fade & Diseño con Navaja"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Duración (min) *
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  required
                  min={5}
                  step={5}
                  defaultValue={30}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Precio ({tenant.currency}) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min={0}
                  step={1}
                  defaultValue={250}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <input
                type="text"
                name="categoryName"
                placeholder="Ej. Cortes, Barba, Faciales"
                defaultValue="Cortes de Cabello"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Detalla lo que incluye el servicio..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
            >
              Guardar Servicio
            </button>
          </form>
        </div>

        {/* Listado de Servicios Actuales (Dark Luxe) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="font-bold text-sm text-white mb-2 flex items-center justify-between">
            <span>Servicios Configurados</span>
            <span className="text-xs text-zinc-500 font-mono font-normal">Disponibles para reserva</span>
          </h3>

          <div className="space-y-3">
            {tenant.services.map((srv) => (
              <div
                key={srv.id}
                className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-850 hover:border-zinc-700 transition flex items-start justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-base group-hover:text-amber-400 transition">
                      {srv.name}
                    </h4>
                    {srv.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {srv.category.name}
                      </span>
                    )}
                  </div>
                  {srv.description && (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{srv.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {srv.durationMinutes} minutos
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-black text-sm">
                      {formatCurrency(srv.price, tenant.currency)}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    srv.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {srv.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
