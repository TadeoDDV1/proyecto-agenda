"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/app/actions/admin";
import { AppointmentStatus } from "@prisma/client";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  MessageCircle,
  ExternalLink,
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

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    setLoadingId(appointmentId);
    await updateAppointmentStatusAction(appointmentId, newStatus);
    setLoadingId(null);
  }

  function getStatusBadge(status: AppointmentStatus) {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "COMPLETED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "NO_SHOW":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
  }

  function getWhatsAppReminderLink(app: AppointmentItem) {
    const cleanPhone = app.customer.phone.replace(/[^0-9]/g, "");
    const dateFormatted = new Date(app.startTime).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    const timeFormatted = new Date(app.startTime).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = encodeURIComponent(
      `Hola ${app.customer.fullName}, te saludamos de ${businessName}. Te recordamos tu cita de *${app.service.name}* programada para el *${dateFormatted} a las ${timeFormatted} hrs* con ${app.staff.displayName}. ¡Te esperamos con gusto!`
    );

    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  return (
    <div className="space-y-4">
      {/* Filtros de estado Dark Luxe */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 px-2">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>Filtrar citas:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Citas Dark Luxe */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-850">
          <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="font-semibold text-zinc-300 text-sm">No hay citas en este filtro</h4>
          <p className="text-zinc-500 text-xs mt-1">
            Cambia de pestaña o agenda una nueva cita desde el portal de clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((app) => {
            const isLoading = loadingId === app.id;
            const isCancelled = app.status === "CANCELLED";
            const isCompleted = app.status === "COMPLETED";

            return (
              <div
                key={app.id}
                className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-850 hover:border-zinc-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  {/* Indicador de color del profesional */}
                  <div
                    className="w-1.5 h-14 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: app.staff.colorCode }}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-base">
                        {app.customer.fullName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-zinc-400 mt-1 flex items-center gap-2">
                      <span className="text-zinc-200 font-semibold">{app.service.name}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-500">{app.service.durationMinutes} min</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5 text-amber-400 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(app.startTime).toLocaleString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{app.staff.displayName}</span>
                      </span>

                      <a
                        href={`tel:${app.customer.phone}`}
                        className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{app.customer.phone}</span>
                      </a>
                    </div>

                    {app.customerNotes && (
                      <p className="text-xs bg-zinc-950/60 text-zinc-400 rounded-xl p-2.5 mt-2.5 border border-zinc-850">
                        <span className="font-semibold text-zinc-300">Nota del cliente: </span>
                        {app.customerNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones y Precio */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-850">
                  <span className="text-xl font-black text-amber-400">
                    {formatCurrency(app.totalPrice, currency)}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Botón de Recordatorio por WhatsApp */}
                    {app.customer.phone && !isCancelled && (
                      <a
                        href={getWhatsAppReminderLink(app)}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar recordatorio por WhatsApp"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1 text-xs font-semibold"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    {/* Acciones de Estado */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                        title="Marcar como atendida"
                        className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Completar</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CANCELLED")}
                        title="Cancelar cita"
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-700 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CONFIRMED")}
                        title="Reactivar cita"
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
