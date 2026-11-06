import { prisma } from "@/lib/prisma";
import Link from "next/link";

// La portada muestra métricas en vivo desde la base de datos: se renderiza en
// cada petición. Sin esto, Next intenta prerenderizarla y el build exige una
// base de datos accesible (falla en Docker y en CI).
export const dynamic = "force-dynamic";
import { buttonClasses } from "@/components/ui";
import { ProductPreview } from "@/components/ProductPreview";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  ShieldCheck,
  MessageCircle,
  Check,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const demoTenant = await prisma.tenant.findFirst({
    where: { slug: "barberia-vintage" },
  });

  const demoHref = demoTenant ? `/b/${demoTenant.slug}` : "/register";
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-base text-foreground">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-raised font-display text-sm italic text-accent-warm transition group-hover:border-border-strong">
              A
            </span>
            <span className="font-display text-sm italic tracking-wide text-foreground">
              AgendaSaaS
            </span>
          </Link>

          <nav
            aria-label="Secciones"
            className="hidden items-center gap-7 text-xs font-medium text-muted md:flex"
          >
            <a href="#producto" className="transition hover:text-foreground">
              Producto
            </a>
            <a href="#funciones" className="transition hover:text-foreground">
              Funciones
            </a>
            <a href="#demo" className="transition hover:text-foreground">
              Demo
            </a>
          </nav>

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
        {/* ─── Hero ─── */}
        <section id="producto" className="relative scroll-mt-24 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
            style={{
              background:
                "radial-gradient(58% 100% at 30% 0%, rgba(95,98,238,0.14) 0%, rgba(95,98,238,0) 70%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-12 lg:gap-10 lg:pb-24">
            <div className="lg:col-span-6">
              <p className="mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-accent-warm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Gestión de citas para salones, barberías y spas
              </p>

              <h1 className="max-w-xl font-display text-[2.75rem] font-light leading-[1.02] tracking-[-0.02em] text-foreground text-balance sm:text-6xl lg:text-[4.25rem]">
                Tu agenda,{" "}
                <span className="italic text-muted">organizada.</span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                Un panel para tu equipo y un portal de reservas para tus
                clientes. Calendario por especialista, CRM y recordatorios de
                WhatsApp — sin hojas de cálculo.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/register" className={buttonClasses("primary", "lg")}>
                  <span>Abrir mi agenda</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link href={demoHref} className={buttonClasses("secondary", "lg")}>
                  <span>Ver demo en vivo</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-dim">
                <span>Sin tarjeta</span>
                <span aria-hidden="true">·</span>
                <span>Configúralo en minutos</span>
                <span aria-hidden="true">·</span>
                <span>Datos aislados por negocio</span>
              </p>
            </div>

            <div className="lg:col-span-6">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* ─── Franja de datos ─── */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl sm:px-6">
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {[
                {
                  value: "4 pasos",
                  label: "para reservar sin llamadas ni apps",
                },
                {
                  value: "1 enlace",
                  label: "portal propio en /b/tu-negocio",
                },
                {
                  value: "0 solapamientos",
                  label: "validado en el servidor antes de confirmar",
                },
              ].map((stat) => (
                <div key={stat.value} className="bg-surface px-5 py-7 sm:px-6">
                  <p className="font-display text-xl font-light text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Funciones ─── */}
        <section
          id="funciones"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24"
        >
          <div className="max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
              Producto
            </p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-tight text-foreground text-balance sm:text-4xl">
              Menos llamadas.{" "}
              <span className="italic text-muted">Más sillas ocupadas.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Todo lo que pasa en tu negocio, en una sola pantalla. Diseñado
              para operar rápido desde el mostrador o el móvil.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {/* Calendario */}
            <article className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-accent-warm">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    Calendario por especialista
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                    Cada profesional con su columna, sus turnos y sus descansos.
                    Citas en tiempo real y creación directa desde el mostrador.
                  </p>
                </div>
              </div>

              <div
                className="mt-6 grid grid-cols-3 gap-2"
                aria-hidden="true"
              >
                {[
                  { name: "Mateo", color: "#818cf8", blocks: [58, 34, 22] },
                  { name: "Valentina", color: "#f472b6", blocks: [26, 62, 40] },
                  { name: "Lucas", color: "#34d399", blocks: [44, 28, 56] },
                ].map((person) => (
                  <div
                    key={person.name}
                    className="rounded-lg border border-border bg-base p-2"
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-[9px] font-medium text-muted">
                        {person.name}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {person.blocks.map((height, i) => (
                        <div
                          key={i}
                          className="w-full rounded border border-border-subtle bg-surface-raised"
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Portal */}
            <article className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-accent-warm">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Portal propio
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Tus clientes reservan desde un enlace, sin instalar nada ni
                  crear cuenta.
                </p>
              </div>

              <div
                className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-base px-3 py-2 font-mono text-[11px] text-accent-warm"
                aria-hidden="true"
              >
                <span className="text-dim">/b/</span>
                <span className="truncate">tu-negocio</span>
              </div>
            </article>

            {/* Solapamientos */}
            <article className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-success-text">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Cero solapamientos
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Horarios, descansos y duración exacta validados en el servidor
                  antes de confirmar.
                </p>
              </div>

              <ul className="mt-5 space-y-1.5" aria-hidden="true">
                {["Turno del especialista", "Descanso respetado", "Duración exacta"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-[11px] text-muted"
                    >
                      <Check
                        className="h-3 w-3 flex-shrink-0 text-success-text"
                        strokeWidth={3}
                      />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </article>

            {/* WhatsApp */}
            <article className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong sm:flex-row sm:items-center sm:gap-8 lg:col-span-2">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-accent-warm">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Recordatorios por WhatsApp
                </h3>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  Confirma, recuerda y reactiva citas con un mensaje ya
                  redactado. Se abre en el WhatsApp del cliente con un clic.
                </p>
              </div>

              <div
                className="mt-5 w-full max-w-[240px] self-start rounded-xl rounded-bl-sm border border-border bg-base p-3 sm:mt-0 sm:self-center"
                aria-hidden="true"
              >
                <p className="text-[10px] leading-relaxed text-muted">
                  Hola Carlos, te recordamos tu cita de{" "}
                  <span className="text-foreground">Corte clásico</span> hoy a
                  las <span className="text-foreground">10:00</span> con Mateo.
                </p>
                <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-success-text">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Enviado
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ─── Demo ─── */}
        <section id="demo" className="scroll-mt-24 border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
                Demo en vivo
              </p>
              <h2 className="mt-3 font-display text-3xl font-light tracking-tight text-foreground text-balance sm:text-4xl">
                Pruébalo con una agenda real.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Explora el portal de reservas como cliente y el panel de
                administración con los datos del negocio de demostración.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href={demoHref} className={buttonClasses("primary", "lg")}>
                <span>Reservar en la demo</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/admin" className={buttonClasses("secondary", "lg")}>
                Abrir panel
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <span className="font-display text-sm italic text-muted">
              AgendaSaaS
            </span>
            <p className="mt-2 text-xs leading-relaxed text-dim">
              Gestión de citas para salones, barberías y spas. Una agenda clara
              para tu equipo y tus clientes.
            </p>
          </div>

          <div className="flex gap-12 text-xs">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-dim">
                Producto
              </p>
              <ul className="space-y-2 text-muted">
                <li>
                  <a href="#funciones" className="transition hover:text-foreground">
                    Funciones
                  </a>
                </li>
                <li>
                  <Link href={demoHref} className="transition hover:text-foreground">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="transition hover:text-foreground">
                    Panel
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-dim">
                Cuenta
              </p>
              <ul className="space-y-2 text-muted">
                <li>
                  <Link href="/login" className="transition hover:text-foreground">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition hover:text-foreground">
                    Crear cuenta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-4 text-[11px] text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {currentYear} AgendaSaaS. Todos los derechos reservados.</p>
            <p className="font-mono text-[10px]">
              Next.js · Prisma · PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
