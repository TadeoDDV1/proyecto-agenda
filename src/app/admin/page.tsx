import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AppointmentManager } from "@/components/AppointmentManager";
import { PageHeader, buttonClasses } from "@/components/ui";
import {
  Calendar,
  User,
  TrendingUp,
  Store,
  Layers,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();

  let tenant = null;

  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
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
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
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
  }

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-[var(--text-muted)]">
        <div>
          <h2 className="text-xl font-light text-[var(--text)] font-display">
            No hay negocios registrados
          </h2>
          <p className="text-sm mt-2">
            Ejecuta <code className="font-mono text-xs">npm run db:seed</code> para sembrar datos de demostración.
          </p>
        </div>
      </div>
    );
  }

  const confirmedOrCompleted = tenant.appointments.filter(
    (a) => a.status !== "CANCELLED"
  );
  const totalRevenue = confirmedOrCompleted.reduce(
    (acc, app) => acc + Number(app.totalPrice),
    0
  );
  const completedCount = tenant.appointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;

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
      {/* Banner demo */}
      {!session && (
        <div className="px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Modo demostración — negocio{" "}
              <strong className="text-[var(--text)]">{tenant.name}</strong>.{" "}
              <Link href="/login" className="underline underline-offset-2 hover:text-[var(--text)] transition">
                Inicia sesión
              </Link>{" "}
              para gestionar tu negocio.
            </span>
          </div>
          <Link
            href="/register"
            className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            Crear cuenta
          </Link>
        </div>
      )}

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

      {/* Métricas — informe financiero sobrio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ingresos */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
              Ingresos estimados
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </div>
          <p className="text-xl font-light text-[var(--text)] font-display">
            {formatCurrency(totalRevenue, tenant.currency)}
          </p>
          <p className="text-[11px] text-[var(--text-dim)] mt-1">
            {confirmedOrCompleted.length} cita(s) activas
          </p>
        </div>

        {/* Citas */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
              Citas registradas
            </span>
            <Calendar className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </div>
          <p className="text-xl font-light text-[var(--text)] font-display">
            {tenant.appointments.length}
          </p>
          <p className="text-[11px] text-[var(--text-dim)] mt-1">
            {completedCount} completadas
          </p>
        </div>

        {/* Equipo */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
              Especialistas
            </span>
            <User className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </div>
          <p className="text-xl font-light text-[var(--text)] font-display">
            {tenant.staff.length}
          </p>
          <p className="text-[11px] text-[var(--text-dim)] mt-1">
            Turnos semanales asignados
          </p>
        </div>

        {/* Servicios */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
              Servicios
            </span>
            <Layers className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </div>
          <p className="text-xl font-light text-[var(--text)] font-display">
            {tenant.services.length}
          </p>
          <p className="text-[11px] text-[var(--text-dim)] mt-1">
            Disponibles en portal web
          </p>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Gestión de citas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              Agenda y citas
            </h2>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">
              Sincronizado
            </span>
          </div>

          <AppointmentManager
            appointments={serializedAppointments}
            currency={tenant.currency}
            businessName={tenant.name}
          />
        </div>

        {/* Sidebar informativo */}
        <div className="lg:col-span-4 space-y-4">
          {/* Equipo */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-[var(--text)] flex items-center gap-2 uppercase tracking-widest">
                <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Equipo
              </h3>
              <Link
                href="/admin/personal"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 transition"
              >
                Gestionar
              </Link>
            </div>

            <div className="space-y-2">
              {tenant.staff.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 font-display"
                      style={{
                        background: "var(--surface-raised)",
                        border: `1px solid ${st.colorCode}40`,
                        color: st.colorCode,
                      }}
                    >
                      {st.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[var(--text)] block leading-tight">
                        {st.displayName}
                      </span>
                      <span className="text-[10px] text-[var(--text-dim)] block leading-tight">
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
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-[var(--text)] flex items-center gap-2 uppercase tracking-widest">
                <Store className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Local
              </h3>
              <Link
                href="/admin/configuracion"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 transition"
              >
                Editar
              </Link>
            </div>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] mb-0.5">
                  Enlace público
                </dt>
                <dd className="font-mono text-[var(--accent-warm)]">
                  /b/{tenant.slug}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] mb-0.5">
                  Dirección
                </dt>
                <dd className="text-[var(--text-muted)]">
                  {tenant.address || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] mb-0.5">
                  Teléfono
                </dt>
                <dd className="text-[var(--text-muted)]">
                  {tenant.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] mb-0.5">
                  Moneda
                </dt>
                <dd className="text-[var(--text-muted)]">{tenant.currency}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
