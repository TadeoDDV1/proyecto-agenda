import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { AdminNav } from "@/components/AdminNav";
import { createServiceAction, toggleServiceStatusAction } from "@/app/actions/admin";
import { Layers, Plus, Clock, Tag, Check, AlertCircle } from "lucide-react";

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
              <Layers className="w-6 h-6 text-amber-500" />
              Catálogo de Servicios
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Configura los cortes, tratamientos y paquetes disponibles para reserva en tu portal.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Formulario de Nuevo Servicio */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              Agregar Nuevo Servicio
            </h3>

            <form
              action={async (formData) => {
                "use server";
                await createServiceAction(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Limpieza Facial Profunda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    required
                    min={5}
                    step={5}
                    defaultValue={30}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Precio ({tenant.currency}) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    step={1}
                    defaultValue={200}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  name="categoryName"
                  placeholder="Ej. Tratamientos, Barbería, Estilo"
                  defaultValue="General"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Qué incluye el servicio, productos utilizados, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Guardar Servicio
              </button>
            </form>
          </div>

          {/* Listado de Servicios Actuales */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-base text-gray-900 mb-2">
              Servicios en Catálogo ({tenant.services.length})
            </h3>

            {tenant.services.map((srv) => (
              <div
                key={srv.id}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-base">{srv.name}</h4>
                    {srv.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {srv.category.name}
                      </span>
                    )}
                  </div>
                  {srv.description && (
                    <p className="text-xs text-gray-500 mt-1">{srv.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {srv.durationMinutes} minutos
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      {formatCurrency(srv.price, tenant.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      srv.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {srv.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
