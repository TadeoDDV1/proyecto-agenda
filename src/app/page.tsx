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
  Clock,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-500/3 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-40 right-10 w-96 h-96 bg-amber-600/5 blur-3xl pointer-events-none rounded-full" />

      {/* Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Agenda<span className="text-amber-400">SaaS</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 tracking-wide">
                Dark Luxe
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-lg transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white hover:bg-zinc-800 hover:border-zinc-700 transition"
            >
              Crear Negocio
            </Link>
            {demoTenant && (
              <Link
                href={`/b/${demoTenant.slug}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-md shadow-amber-500/20"
              >
                <span>Demo Barbería</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex-1 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-amber-400 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>La nueva generación de agendamiento para salones, barberías y spas</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl text-balance leading-tight text-white">
          La plataforma de reservas inteligente para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            profesionales de la belleza
          </span>
        </h1>

        <p className="mt-6 text-zinc-400 text-sm sm:text-lg max-w-2xl leading-relaxed text-balance">
          Arquitectura multi-inquilino de alto rendimiento en Next.js y PostgreSQL. Cada negocio cuenta con su propio portal de reservas responsive, calendario de colaboradores y prevención automática de solapamientos.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {demoTenant && (
            <Link
              href={`/b/${demoTenant.slug}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition group active:scale-[0.99]"
            >
              <span>Ver Portal de Cliente (Demo)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 font-semibold text-sm transition active:scale-[0.99]"
          >
            <span>Explorar Panel de Administración</span>
          </Link>
        </div>

        {/* Telemetría en Vivo de la Base de Datos */}
        <div className="mt-16 w-full max-w-4xl bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Base de Datos PostgreSQL Activa</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado vía Prisma ORM
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block">
                Negocios (Tenants)
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {tenantsCount}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block">
                Colaboradores (Staff)
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {staffCount}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block">
                Servicios en Catálogo
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {servicesCount}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 transition">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block">
                Citas Registradas
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {appointmentsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Pilares Técnicos y Funcionalidades */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left max-w-4xl w-full">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Arquitectura Multi-tenant</h3>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Aislamiento lógico por negocio mediante <code className="text-amber-300 font-mono">tenant_id</code>. Cada salón opera de forma autónoma con su catálogo, personal y horarios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Booking Wizard Fluido</h3>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Experiencia móvil y desktop en <code className="text-amber-300 font-mono">/b/[slug]</code> con carrusel de fechas, slots dinámicos y ticket de reserva en vivo.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Cero Solapamientos</h3>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Validación server-side con Prisma que impide reservas cruzadas y respeta la duración exacta en minutos de cada servicio.
            </p>
          </div>
        </div>

        {/* Mención especial a las nuevas herramientas del Avance 2 */}
        <div className="mt-8 grid sm:grid-cols-2 gap-6 text-left max-w-4xl w-full">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Recordatorios con 1 Click a WhatsApp</h4>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                El admin puede notificar al cliente al instante con plantillas de confirmación pre-redactadas vía WhatsApp web o móvil.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Calendario Interactivo con Drawer Lateral</h4>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Agenda visual dividida por especialista. Permite crear walk-ins en huecos libres y actualizar estados en tiempo real con un slide-over.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">AgendaSaaS</span>
            <span>•</span>
            <span>Diseño Dark Luxe (Linear / Cal.com Style)</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Next.js 16</span>
            <span>React 19</span>
            <span>Tailwind v4</span>
            <span>Prisma ORM</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
