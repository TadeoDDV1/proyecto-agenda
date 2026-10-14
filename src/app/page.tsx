import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Database,
  Building2,
  Sparkles,
  Layers,
} from "lucide-react";

export default async function HomePage() {
  const tenantsCount = await prisma.tenant.count();
  const staffCount = await prisma.staffProfile.count();
  const servicesCount = await prisma.service.count();
  const appointmentsCount = await prisma.appointment.count();

  const demoTenant = await prisma.tenant.findFirst({
    where: { slug: "barberia-vintage" },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">AgendaSaaS</span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-semibold border border-amber-400/20">
                Primer Avance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg transition"
            >
              Panel Admin
            </Link>
            {demoTenant && (
              <Link
                href={`/b/${demoTenant.slug}`}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
              >
                Portal Público
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex-1 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          SaaS Multi-tenant para Salones de Belleza, Estilistas y Barberías
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl text-balance leading-tight">
          La plataforma de agendamiento inteligente para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            profesionales de la belleza
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed text-balance">
          Diseñado con arquitectura multi-inquilino en Next.js y PostgreSQL. Cada negocio cuenta con su propio portal de reservas personalizado, gestión de colaboradores y prevención automática de solapamientos.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {demoTenant && (
            <Link
              href={`/b/${demoTenant.slug}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition group"
            >
              <span>Ver Portal de Reserva del Cliente</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 font-semibold text-sm transition"
          >
            <span>Explorar Panel de Administración</span>
          </Link>
        </div>

        {/* Estado en Vivo de la Base de Datos */}
        <div className="mt-16 w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Base de Datos PostgreSQL Activa</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado vía Prisma ORM
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Negocios (Tenants)
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {tenantsCount}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Colaboradores (Staff)
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {staffCount}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Servicios en Catálogo
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {servicesCount}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Citas Registradas
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {appointmentsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Pilares Técnicos del Primer Avance */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left max-w-4xl w-full">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Arquitectura Multi-tenant</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Aislamiento lógico por negocio mediante <code className="text-amber-300">tenant_id</code>. Cada salón opera de manera independiente con su propio catálogo y empleados.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Reserva Sin Fricción</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Portal en <code className="text-amber-300">/b/[slug]</code> optimizado para móviles donde el cliente elige servicio, barbero y horario en 4 simples pasos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Cero Solapamientos</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Validación en el servidor (Server Actions) que bloquea duplicación de turnos por colaborador y respeta la duración en minutos de cada servicio.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Proyecto Agenda SaaS • Primer Avance completado exitosamente.</p>
      </footer>
    </div>
  );
}
