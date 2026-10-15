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
}

export function AppointmentManager({ appointments, currency }: AppointmentManagerProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLETED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros de estado */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filtrar por estado:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === st
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" && "Todas"}
              {st === "CONFIRMED" && "Confirmadas"}
              {st === "COMPLETED" && "Completadas"}
              {st === "CANCELLED" && "Canceladas"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Citas */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-700 text-sm">No hay citas en este filtro</h4>
          <p className="text-gray-400 text-xs mt-1">
            Cambia el filtro o agenda una nueva cita desde el portal público.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((app) => {
            const isLoading = loadingId === app.id;
            return (
              <div
                key={app.id}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-1.5 h-14 rounded-full flex-shrink-0"
                    style={{ backgroundColor: app.staff.colorCode }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-base">
                        {app.customer.fullName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-gray-600 mt-0.5">
                      {app.service.name} • {app.service.durationMinutes} minutos
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {new Date(app.startTime).toLocaleString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {app.staff.displayName}
                      </span>
                      <a
                        href={`tel:${app.customer.phone}`}
                        className="flex items-center gap-1 text-slate-700 hover:text-amber-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {app.customer.phone}
                      </a>
                    </div>

                    {app.customerNotes && (
                      <p className="text-xs bg-slate-50 text-slate-600 rounded-lg p-2 mt-2 border border-slate-100">
                        <span className="font-medium text-slate-700">Nota: </span>
                        {app.customerNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <span className="text-lg font-black text-gray-900">
                    {formatCurrency(app.totalPrice, currency)}
                  </span>

                  {/* Acciones de cambio de estado */}
                  <div className="flex items-center gap-1.5">
                    {app.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                        title="Marcar como atendida / completada"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completar</span>
                      </button>
                    )}

                    {app.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CANCELLED")}
                        title="Cancelar cita"
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}

                    {app.status === "CANCELLED" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(app.id, "CONFIRMED")}
                        title="Reactivar cita"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                      >
                        Reactivar
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
