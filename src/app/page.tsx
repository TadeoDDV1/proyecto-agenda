import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonClasses } from "@/components/ui";
import {
  ArrowRight,
  Calendar,
  Building2,
  ShieldCheck,
  MessageCircle,
  Clock,
} from "lucide-react";

export default async function HomePage() {
  const tenantsCount = await prisma.tenant.count();
  const staffCount = await prisma.staffProfile.count();
  const servicesCount = await prisma.service.count();
  const appointmentsCount = await prisma.appointment.count();

  const demoTenant = await prisma.tenant.findFirst({
    where: { slug: "barberia-vintage" },
  });

  const features = [
    {
      index: "01",
      icon: Building2,
      title: "Multi-tenant",
      body: "Cada negocio opera de forma autónoma con su catálogo, equipo y horarios. Aislamiento lógico por tenant_id.",
    },
    {
      index: "02",
      icon: Calendar,
      title: "Booking Wizard",
      body: "Portal de reservas en /b/[slug] con carrusel de fechas, slots dinámicos y ticket de confirmación.",
    },
    {
      index: "03",
      icon: ShieldCheck,
      title: "Sin solapamientos",
      body: "Validación server-side con Prisma que impide reservas cruzadas y respeta la duración exacta de cada servicio.",
    },
    {
      index: "04",
      icon: MessageCircle,
      title: "WhatsApp directo",
      body: "Notifica al cliente con un clic usando plantillas de confirmación pre-redactadas.",
    },
    {
      index: "05",
      icon: Clock,
      title: "Calendario visual",
      body: "Agenda dividida por especialista con panel lateral para crear walk-ins y actualizar estados.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-base text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground font-display italic">
            AgendaSaaS
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonClasses("ghost", "sm", "text-muted")}
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className={buttonClasses("primary", "sm")}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 0%, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0) 70%)",
            }}
          />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-20 pb-16 sm:pt-28">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent-warm mb-6">
              Plataforma de gestión de citas
            </p>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight leading-[1.06] max-w-3xl font-display text-foreground">
              Tu agenda,{" "}
              <span className="italic text-muted">organizada.</span>
            </h1>

            <p className="mt-6 text-base leading-relaxed max-w-xl text-muted">
              Plataforma multi-tenant para salones, barberías y spas. Portal de
              reservas, calendario visual, CRM y recordatorios WhatsApp — sin
              complicaciones.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonClasses("primary", "lg")}>
                <span>Abrir mi agenda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {demoTenant && (
                <Link
                  href={`/b/${demoTenant.slug}`}
                  className={buttonClasses("secondary", "lg")}
                >
                  <span>Ver demo de cliente</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link href="/admin" className={buttonClasses("ghost", "lg")}>
                Explorar panel admin
              </Link>
            </div>
          </div>
        </section>

        {/* Métricas en vivo */}
        <section className="border-y border-border bg-surface">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
                Base de datos en vivo — PostgreSQL + Prisma
              </p>
              <span className="text-[10px] font-mono flex items-center gap-1.5 text-success-text">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Conectado
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Negocios", value: tenantsCount },
                { label: "Colaboradores", value: staffCount },
                { label: "Servicios", value: servicesCount },
                { label: "Citas", value: appointmentsCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 border border-border bg-base"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim mb-2">
                    {label}
                  </p>
                  <p className="text-2xl font-light font-display text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 py-20">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim mb-10">
            Funcionalidades
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ index, icon: Icon, title, body }) => (
              <div
                key={index}
                className="p-5 rounded-xl border border-border bg-surface transition hover:border-border-strong group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="num-label">{index}</span>
                  <Icon className="w-4 h-4 text-dim group-hover:text-accent-hover transition" />
                </div>
                <h3 className="text-sm font-medium mb-2 text-foreground">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-display italic text-dim">
            AgendaSaaS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-dim">
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
