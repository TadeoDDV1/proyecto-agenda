import { prisma } from "@/lib/prisma";
import Link from "next/link";

// La portada muestra métricas en vivo desde la base de datos: se renderiza en
// cada petición. Sin esto, Next intenta prerenderizarla y el build exige una
// base de datos accesible (falla en Docker y en CI).
export const dynamic = "force-dynamic";
import { buttonClasses } from "@/components/ui";
import { ProductPreview } from "@/components/ProductPreview";
import { VERTICALS, VERTICAL_IDS } from "@/lib/verticals";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  ShieldCheck,
  MessageCircle,
  Check,
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-accent/35 bg-accent-soft font-display text-sm text-accent transition group-hover:border-accent/60">
              P
            </span>
            <span className="font-display text-[15px] tracking-tight text-foreground">
              Pauta
            </span>
          </Link>

          <nav
            aria-label="Secciones"
            className="hidden items-center gap-7 text-xs font-medium text-muted md:flex"
          >
            <a href="#producto" className="transition hover:text-foreground">
              Producto
            </a>
            <a href="#giros" className="transition hover:text-foreground">
              Giros
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
                "radial-gradient(60% 80% at 30% 0%, rgba(31,59,255,0.08) 0%, rgba(31,59,255,0) 70%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-12 lg:gap-10 lg:pb-24">
            <div className="lg:col-span-6">
              <p className="mb-5 inline-flex items-center gap-2 rounded-[2px] border border-accent/40 bg-accent-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                Citas · Equipo · WhatsApp
              </p>

              <h1 className="max-w-xl font-display text-[2.9rem] leading-[0.94] tracking-[-0.05em] text-foreground text-balance sm:text-6xl lg:text-[4.5rem]">
                Cualquier oficio.{" "}
                <span className="text-accent">Una sola agenda.</span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                Barberías, salones, clínicas y consultorios. Elige tu giro,
                carga tu catálogo y recibe citas por web, WhatsApp y mostrador
                sobre la misma disponibilidad.
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
                <span>Catálogo precargado</span>
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
                  value: "14 giros",
                  label: "barbería, salón, dental, spa, fisio y más con vocabulario propio",
                },
                {
                  value: "Portal por giro",
                  label: "plantilla Studio o Clinic, con acento y secciones según el negocio",
                },
                {
                  value: "Una sola agenda",
                  label: "web, WhatsApp y mostrador con las mismas reglas",
                },
              ].map((stat) => (
                <div key={stat.value} className="bg-surface px-5 py-7 sm:px-6">
                  <p className="font-display text-xl text-foreground">
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

        {/* ─── Giros ─── */}
        <section id="giros" className="scroll-mt-24 border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Giros</p>
                <h2 className="mt-3 font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                  Si vive de citas, entra.
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Cada giro trae vocabulario, catálogo y portal propios. La agenda,
                los estados y la reserva son los mismos.
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-4">
              {VERTICAL_IDS.map((id) => {
                const vertical = VERTICALS[id];
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2.5 border-b border-r border-border bg-surface px-4 py-3"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0"
                      style={{ backgroundColor: vertical.accent }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {vertical.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
                      {vertical.portal.template}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ─── Funciones ─── */}
        <section
          id="funciones"
          className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24"
        >
          <div className="max-w-xl">
            <p className="eyebrow">
              Diseño &amp; Operación
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground text-balance sm:text-4xl">
              Un sistema.{" "}
              <span className="text-accent">Cualquier oficio.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              La misma agenda para barbería, salón, dental o consultorio. Cambia
              el vocabulario, el catálogo y el acento; no la lógica de reserva.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {/* Calendario */}
            <article className="group flex flex-col rounded-[4px] border border-border bg-surface p-6 transition hover:border-border-strong lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[3px] border border-border bg-surface-raised text-accent">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Agenda por profesional y recurso
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                    Cada profesional con su columna, sus turnos y sus descansos.
                    Consultorios, cabinas o sillones cuando el giro los necesita,
                    con citas de web, WhatsApp y mostrador en la misma rejilla.
                  </p>
                </div>
              </div>

              <div
                className="mt-6 grid grid-cols-3 gap-2"
                aria-hidden="true"
              >
                {[
                  { name: "Mateo", color: "#C2410C", blocks: [58, 34, 22] },
                  { name: "Valentina", color: "#7C3AED", blocks: [26, 62, 40] },
                  { name: "Lucas", color: "#0F766E", blocks: [44, 28, 56] },
                ].map((person) => (
                  <div
                    key={person.name}
                    className="rounded-[3px] border border-border bg-base p-2.5"
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-[10px] font-medium text-muted">
                        {person.name}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {person.blocks.map((height, i) => (
                        <div
                          key={i}
                          className="w-full rounded-[3px] border border-border-subtle bg-surface-raised"
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Portal */}
            <article className="group flex flex-col justify-between rounded-[4px] border border-border bg-surface p-6 transition hover:border-border-strong">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[3px] border border-border bg-surface-raised text-accent">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Portal por giro
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Plantilla Studio para barbería, salón o spa; Clinic para dental,
                  médico o fisio. Tratamientos, equipo, primera visita y barra de
                  reserva persistente. Tus clientes eligen sin app.
                </p>
              </div>

              <div
                className="mt-5 flex items-center gap-2 rounded-[3px] border border-border bg-base px-3 py-2.5 font-mono text-[11px] text-accent"
                aria-hidden="true"
              >
                <span className="text-dim">/b/</span>
                <span className="truncate">dental-norte</span>
              </div>
            </article>

            {/* Solapamientos */}
            <article className="group flex flex-col justify-between rounded-[4px] border border-border bg-surface p-6 transition hover:border-border-strong">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[3px] border border-border bg-surface-raised text-success-text">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Concurrencia blindada
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Zona horaria IANA por tenant, descansos respetados y exclusión en
                  PostgreSQL para garantizar cero citas dobles.
                </p>
              </div>

              <ul className="mt-5 space-y-2" aria-hidden="true">
                {[
                  "Turnos y descansos respetados",
                  "Duración exacta por servicio",
                  "Constraint de exclusión en BD",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[11px] text-muted"
                  >
                    <Check
                      className="h-3.5 w-3.5 flex-shrink-0 text-success-text"
                      strokeWidth={2.5}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            {/* WhatsApp */}
            <article className="group flex flex-col justify-between rounded-[4px] border border-border bg-surface p-6 transition hover:border-border-strong sm:flex-row sm:items-center sm:gap-8 lg:col-span-2">
              <div>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[3px] border border-border bg-surface-raised text-accent">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Bot de WhatsApp con código QR
                </h3>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  Vincula tu número en 30 segundos. El motor determinista atiende
                  a tus clientes día y noche: consulta horarios disponibles, agenda y
                  permite cancelar citas sin intervención humana.
                </p>
              </div>

              <div
                className="mt-5 w-full max-w-[260px] self-start rounded-[4px] border border-border bg-base p-3.5 sm:mt-0 sm:self-center"
                aria-hidden="true"
              >
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-border-subtle">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-[10px] font-medium text-muted">Bot en WhatsApp</span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground">
                  ¡Cita confirmada! Te esperamos hoy a las <strong className="text-accent">10:00</strong> con <span className="underline">Dra. Ríos</span> para tu <span className="font-medium">limpieza dental</span>.
                </p>
                <div className="mt-2.5 flex items-center justify-end gap-1 text-[9px] text-success-text">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Agendada en sistema
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ─── Demo ─── */}
        <section id="demo" className="scroll-mt-24 border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="eyebrow">
                Demostración en vivo
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground text-balance sm:text-4xl">
                Recorre una agenda real en marcha.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Prueba el portal como cliente o entra al panel con los datos
                precargados del negocio de ejemplo.
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
      <footer className="border-t border-border bg-surface/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-accent/35 bg-accent-soft font-display text-xs text-accent">
                A
              </span>
              <span className="font-display text-sm text-foreground">
                Pauta
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Citas para barberías, salones, clínicas y consultorios. Una agenda
              clara para tu equipo y tus clientes.
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
            <p>© {currentYear} Pauta. Todos los derechos reservados.</p>
            <p className="font-mono text-[10px]">
              Next.js · Prisma · PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
