"use client";

import { useState } from "react";
import { formatCurrency, getWhatsAppUrl } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/app/actions/admin";
import { StatusPill } from "@/components/ui";
import { AppointmentStatus } from "@prisma/client";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Filter,
  MessageCircle,
  RotateCcw,
} from "lucide-react";

interface AppointmentItem {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  customerNotes: string | null;
  service: {
    name: string;
    durationMinutes: number;
  };
  staff: {
    displayName: string;
    colorCode: string;
  };
  customer: {
    fullName: string;
    phone: string;
    email: string | null;
  };
}

interface AppointmentManagerProps {
  appointments: AppointmentItem[];
  currency: string;
  businessName?: string;
}

export function AppointmentManager({
  appointments,
  currency,
  businessName = "Nuestro Negocio",
}: AppointmentManagerProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const counts = {
    ALL: appointments.length,
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  const filteredAppointments = appointments.filter((app) => {
    if (filter === "ALL") return true;
    return app.status === filter;
  });

  async function handleStatusChange(
    appointmentId: string,
    newStatus: AppointmentStatus
  ) {
    setLoadingId(appointmentId);
    await updateAppointmentStatusAction(appointmentId, newStatus);
    setLoadingId(null);
  }

  function getWhatsAppReminderLink(app: AppointmentItem) {
    const dateFormatted = new Date(app.startTime).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    const timeFormatted = new Date(app.startTime).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `Hola ${app.customer.fullName}, te saludamos de ${businessName}. Te recordamos tu cita de *${app.service.name}* programada para el *${dateFormatted} a las ${timeFormatted} hrs* con ${app.staff.displayName}. ¡Te esperamos con gusto!`;

    return getWhatsAppUrl(app.customer.phone, message);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 text-[11px] font-medium px-1 text-dim">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filtrar</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { key: "ALL", label: "Todas" },
            { key: "CONFIRMED", label: "Confirmadas" },
            { key: "COMPLETED", label: "Completadas" },
            { key: "CANCELLED", label: "Canceladas" },
          ].map((st) => {
            const isActive = filter === st.key;
            const count = counts[st.key as keyof typeof counts] || 0;

            return (
              <button
                key={st.key}
                type="button"
                onClick={() => setFilter(st.key)}
                aria-pressed={isActive}
                className={`flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                  isActive
                    ? "bg-accent text-accent-fg border-accent"
                    : "bg-transparent text-muted border-border hover:text-foreground hover:border-border-strong"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive
                      ? "bg-white/20 text-accent-fg"
                      : "bg-surface-raised text-dim"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de citas */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-surface">
          <Calendar className="w-8 h-8 mx-auto mb-3 text-dim" aria-hidden="true" />
          <h4 className="text-sm font-medium mb-1 text-muted">
            Sin citas en este filtro
          </h4>
          <p className="text-xs text-dim">
            Cambia de pestaña o agenda desde el portal de clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAppointments.map((app) => {
            const isLoading = loadingId === app.id;
            const isCancelled = app.status === "CANCELLED";
            const isCompleted = app.status === "COMPLETED";

            return (
              <div
                key={app.id}
                className={`p-4 rounded-xl border border-border bg-surface transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCancelled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Indicador de color del especialista */}
                  <div
                    className="w-1 h-12 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: app.staff.colorCode }}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {app.customer.fullName}
                      </h4>
                      <StatusPill status={app.status} />
                    </div>

                    <p className="text-xs mb-2 text-muted">
                      <span className="text-foreground">{app.service.name}</span>
                      <span className="mx-1.5 text-dim">·</span>
                      <span className="font-mono">{app.service.durationMinutes} min</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5 font-mono text-accent-warm">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {new Date(app.startTime).toLocaleString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-dim" aria-hidden="true" />
                        {app.staff.displayName}
                      </span>

                      <a
                        href={`tel:${app.customer.phone}`}
                        className="flex items-center gap-1.5 transition hover:text-foreground"
                      >
                        <Phone className="w-3 h-3 text-dim" aria-hidden="true" />
                        {app.customer.phone}
                      </a>
                    </div>

                    {app.customerNotes && (
                      <p className="text-xs mt-2 px-3 py-2 rounded-lg border border-border bg-base text-muted">
                        <span className="text-foreground">Nota: </span>
                        {app.customerNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Precio + acciones */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                  <span className="text-base font-light font-display text-foreground">
                    {formatCurrency(app.totalPrice, currency)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    {app.customer.phone && !isCancelled && (
                      <a
                        href={getWhatsAppReminderLink(app)}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar recordatorio WhatsApp"
                        aria-label="Enviar recordatorio por WhatsApp"
                        className="p-1.5 rounded-lg border border-border text-muted transition hover:text-foreground hover:border-border-strong text-xs flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline text-[11px]">WA</span>
                      </a>
                    )}

                    {/* Completar */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                        title="Marcar como completada"
                        aria-label="Marcar como completada"
                        className="p-1.5 rounded-lg border border-border text-muted transition hover:text-foreground hover:border-border-strong flex items-center gap-1 text-[11px] font-medium disabled:opacity-40"
                      >
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Completar</span>
                      </button>
                    )}

                    {/* Cancelar */}
                    {!isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CANCELLED")}
                        title="Cancelar cita"
                        aria-label="Cancelar cita"
                        className="p-1.5 rounded-lg border border-border text-dim transition hover:text-foreground hover:border-border-strong disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}

                    {/* Reactivar */}
                    {isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CONFIRMED")}
                        title="Reactivar cita"
                        aria-label="Reactivar cita"
                        className="px-2.5 py-1.5 rounded-lg border border-border text-muted transition hover:text-foreground hover:border-border-strong text-[11px] font-medium flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        <span>Reactivar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
