import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AppointmentManager } from "@/components/AppointmentManager";
import { PageHeader, buttonClasses } from "@/components/ui";
import {
  Calendar,
  User,
  TrendingUp,
  Store,
  Clock,
  ExternalLink,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
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

  if (!tenant) notFound();

  const activeAppointments = tenant.appointments.filter(
    (a) => a.status !== "CANCELLED"
  );

  // ─── Métricas del periodo (solo lectura, sin tocar la lógica de datos) ───
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAppointments = activeAppointments.filter(
    (a) => a.startTime >= monthStart
  );
  const monthRevenue = monthAppointments.reduce(
    (acc, app) => acc + Number(app.totalPrice),
    0
  );
  const monthCompleted = monthAppointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;

  // Actividad de los últimos 14 días, agrupada por día local.
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - i))
    );
    return { date, key: dayKey(date), revenue: 0, count: 0 };
  });
  const dayIndex = new Map(days.map((d) => [d.key, d]));

  for (const app of activeAppointments) {
    const entry = dayIndex.get(dayKey(new Date(app.startTime)));
    if (entry) {
      entry.revenue += Number(app.totalPrice);
      entry.count += 1;
    }
  }

  const chartTotal = days.reduce((acc, d) => acc + d.revenue, 0);
  const maxDayRevenue = Math.max(1, ...days.map((d) => d.revenue));
  const todayEntry = days[days.length - 1];
  const todayAppointments = activeAppointments.filter(
    (a) => dayKey(new Date(a.startTime)) === todayEntry.key
  );

  // La lista ya viene ordenada por startTime ascendente.
  const nextAppointment = activeAppointments.find(
    (a) => a.startTime > now && a.status === "CONFIRMED"
  );

  const serializedAppointments = tenant.appointments.map((a) => ({
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    totalPrice: Number(a.totalPrice),
    customerNotes: a.customerNotes,
    service: {
      name: a.service.name,
      durationMinutes: a.service.durationMinutes,
    },
    staff: {
      displayName: a.staff.displayName,
      colorCode: a.staff.colorCode,
    },
    customer: {
      fullName: a.customer.fullName,
      phone: a.customer.phone,
      email: a.customer.email,
    },
  }));

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="p-5 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
      {/* Header */}
      <PageHeader
        eyebrow={todayFormatted}
        title={tenant.name}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/b/${tenant.slug}`}
              target="_blank"
              className={buttonClasses("secondary", "sm")}
            >
              <span>Portal público</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/admin/calendario"
              className={buttonClasses("primary", "sm")}
            >
              <Calendar className="w-3 h-3" />
              <span>Ver calendario</span>
            </Link>
          </div>
        }
      />

      {/* Resumen — jerarquía: dinero del mes, actividad y equipo */}
      <div className="grid gap-3 lg:grid-cols-12">
        {/* Ingresos del mes */}
        <section className="panel relative flex flex-col overflow-hidden p-6 lg:col-span-5">
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center justify-between">
              <p className="eyebrow-plain">
                Ingresos de este mes
              </p>
              <TrendingUp className="h-3.5 w-3.5 text-accent-warm" aria-hidden="true" />
            </div>

            <p className="metric mt-4 text-4xl">
              {formatCurrency(monthRevenue, tenant.currency)}
            </p>

            <p className="mt-2 text-[11px] text-muted">
              {monthAppointments.length}{" "}
              {monthAppointments.length === 1 ? "cita" : "citas"} este mes ·{" "}
              {monthCompleted} {monthCompleted === 1 ? "completada" : "completadas"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="panel-inset px-3 py-2.5">
                <span className="block text-[10px] uppercase tracking-[0.1em] text-dim">
                  Ticket promedio
                </span>
                <span className="mt-1 block font-mono text-sm text-foreground">
                  {formatCurrency(
                    monthAppointments.length > 0
                      ? monthRevenue / monthAppointments.length
                      : 0,
                    tenant.currency
                  )}
                </span>
              </div>
              <div className="panel-inset px-3 py-2.5">
                <span className="block text-[10px] uppercase tracking-[0.1em] text-dim">
                  Completadas
                </span>
                <span className="mt-1 block font-mono text-sm text-foreground">
                  {monthCompleted}
                  <span className="text-dim"> / {monthAppointments.length}</span>
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-3 text-[11px]">
              <span className="text-dim">Hoy</span>
              <span className="font-mono text-muted">
                <strong className="font-semibold text-foreground">
                  {todayAppointments.length}
                </strong>{" "}
                {todayAppointments.length === 1 ? "cita" : "citas"} ·{" "}
                <span className="text-accent-warm">
                  {formatCurrency(todayEntry.revenue, tenant.currency)}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* Actividad de los últimos 14 días */}
        <section className="panel flex flex-col p-5 lg:col-span-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="eyebrow-plain">
              Últimos 14 días
            </h2>
            <span className="font-mono text-[11px] text-muted">
              {formatCurrency(chartTotal, tenant.currency)}
            </span>
          </div>

          <div
            role="img"
            aria-label={`Ingresos de los últimos 14 días: ${formatCurrency(
              chartTotal,
              tenant.currency
            )} en total. Hoy: ${todayAppointments.length} ${
              todayAppointments.length === 1 ? "cita" : "citas"
            } y ${formatCurrency(todayEntry.revenue, tenant.currency)}.`}
            className="mt-5 flex flex-1 flex-col justify-end"
          >
            <div className="flex items-end gap-1 sm:gap-1.5">
              {days.map((day, i) => {
                const isToday = i === days.length - 1;
                const height = Math.round((day.revenue / maxDayRevenue) * 100);

                return (
                  <div
                    key={day.key}
                    aria-hidden="true"
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-32 w-full items-end border-b border-border/70 sm:h-40">
                      <div
                        title={`${day.date.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}: ${formatCurrency(day.revenue, tenant.currency)} · ${
                          day.count
                        } ${day.count === 1 ? "cita" : "citas"}`}
                        className={`w-full rounded-t-[3px] transition-colors ${
                          isToday
                            ? "bg-accent"
                            : day.revenue > 0
                            ? "bg-accent/35 hover:bg-accent/55"
                            : "bg-border/50"
                        }`}
                        style={{
                          height: `${day.revenue > 0 ? Math.max(8, height) : 4}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-[9px] ${
                        isToday ? "font-semibold text-accent-warm" : "text-dim"
                      } ${i % 2 === 0 || isToday ? "" : "invisible"}`}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Próxima cita + reglas de operación */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
          <section className="panel flex flex-col p-4">
            <p className="eyebrow-plain">
              Próxima cita
            </p>

            {nextAppointment ? (
              <>
                <p className="metric mt-2 text-2xl">
                  {nextAppointment.startTime.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="ml-1.5 font-sans text-[10px] uppercase tracking-wide text-dim">
                    {dayKey(nextAppointment.startTime) === todayEntry.key
                      ? "hoy"
                      : nextAppointment.startTime.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                  </span>
                </p>
                <p className="mt-1 truncate text-[11px] text-muted">
                  {nextAppointment.customer.fullName}
                </p>
                <p className="truncate text-[10px] text-dim">
                  {nextAppointment.staff.displayName} ·{" "}
                  {nextAppointment.service.name}
                </p>
                <Link
                  href="/admin/calendario"
                  className="mt-3 inline-flex items-center gap-1 border-t border-border-subtle pt-3 text-[11px] font-semibold text-accent-warm transition hover:text-foreground"
                >
                  Ver calendario
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Sin citas próximas.
                </p>
                <Link
                  href={`/b/${tenant.slug}`}
                  className="mt-3 inline-flex items-center gap-1 border-t border-border-subtle pt-3 text-[11px] font-semibold text-accent-warm transition hover:text-foreground"
                >
                  Compartir portal
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </>
            )}
          </section>

          <section className="panel flex flex-col p-4">
            <p className="eyebrow-plain flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
              Reglas
            </p>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-dim">Zona horaria</dt>
                <dd
                  className="truncate font-mono text-muted"
                  title={tenant.timezone}
                >
                  {tenant.timezone.split("/").pop()?.replaceAll("_", " ") ??
                    tenant.timezone}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-dim">Ventana</dt>
                <dd className="font-mono text-muted">
                  {tenant.bookingWindowDays} días
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-dim">Antelación</dt>
                <dd className="font-mono text-muted">
                  {tenant.minLeadTimeMinutes} min
                </dd>
              </div>
            </dl>
            <Link
              href="/admin/configuracion"
              className="mt-3 inline-flex items-center gap-1 border-t border-border-subtle pt-3 text-[11px] font-semibold text-accent-warm transition hover:text-foreground"
            >
              Ajustar operación
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Gestión de citas */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted" />
              Agenda y citas
            </h2>
            <span className="flex items-center gap-1.5 text-[11px] text-dim font-mono">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              En vivo
            </span>
          </div>

          <AppointmentManager
            appointments={serializedAppointments}
            currency={tenant.currency}
            businessName={tenant.name}
          />
        </div>

        {/* Sidebar informativo */}
        <div className="lg:col-span-4 min-w-0 space-y-4">
          {/* Equipo */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="eyebrow-plain flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-accent-warm" />
                Equipo
              </h3>
              <Link
                href="/admin/personal"
                className="text-[11px] text-muted hover:text-foreground underline underline-offset-2 transition"
              >
                Gestionar
              </Link>
            </div>

            <div className="space-y-2">
              {tenant.staff.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 font-display bg-surface-raised"
                      style={{
                        border: `1px solid ${st.colorCode}40`,
                        color: st.colorCode,
                      }}
                    >
                      {st.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-foreground block leading-tight">
                        {st.displayName}
                      </span>
                      <span className="text-[10px] text-dim block leading-tight">
                        {st.phone || "—"}
                      </span>
                    </div>
                  </div>
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: st.colorCode }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Datos del negocio */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="eyebrow-plain flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-accent-warm" />
                Local
              </h3>
              <Link
                href="/admin/configuracion"
                className="text-[11px] text-muted hover:text-foreground underline underline-offset-2 transition"
              >
                Editar
              </Link>
            </div>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-dim mb-1">
                  Enlace público
                </dt>
                <dd className="font-mono text-accent-warm">
                  /b/{tenant.slug}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-dim mb-1">
                  Dirección
                </dt>
                <dd className="text-muted">
                  {tenant.address || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-dim mb-1">
                  Teléfono
                </dt>
                <dd className="text-muted">
                  {tenant.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-dim mb-1">
                  Moneda
                </dt>
                <dd className="text-muted">{tenant.currency}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
