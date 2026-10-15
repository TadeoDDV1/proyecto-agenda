"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { updateAppointmentStatusAction, createManualAppointmentAction } from "@/app/actions/admin";
import { AppointmentStatus } from "@prisma/client";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scissors,
  X
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface StaffItem {
  id: string;
  displayName: string;
  colorCode: string;
  avatarUrl: string | null;
}

interface AppointmentItem {
  id: string;
  staffId: string;
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
  };
}

interface InteractiveCalendarProps {
  initialDateStr: string;
  staffList: StaffItem[];
  servicesList: ServiceItem[];
  appointments: AppointmentItem[];
  currency: string;
}

export function InteractiveCalendar({
  initialDateStr,
  staffList,
  servicesList,
  appointments,
  currency,
}: InteractiveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Formulario manual
  const [manualServiceId, setManualServiceId] = useState<string>(servicesList[0]?.id || "");
  const [manualStaffId, setManualStaffId] = useState<string>(staffList[0]?.id || "");
  const [manualTime, setManualTime] = useState<string>("10:00");
  const [manualCustName, setManualCustName] = useState("");
  const [manualCustPhone, setManualCustPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Navegar días
  function handleShiftDay(offset: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split("T")[0]);
  }

  function handleSetToday() {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }

  // Filtrar citas para la fecha seleccionada
  const dateAppointments = appointments.filter((app) => {
    return app.startTime.startsWith(selectedDate);
  });

  // Horas del día (09:00 a 19:00)
  const hours = [
    "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    setActionLoadingId(appointmentId);
    await updateAppointmentStatusAction(appointmentId, newStatus);
    setActionLoadingId(null);
  }

  async function handleCreateManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCustName.trim() || !manualCustPhone.trim()) {
      setManualError("Nombre y teléfono del cliente son requeridos.");
      return;
    }

    setIsSavingManual(true);
    setManualError(null);

    const res = await createManualAppointmentAction({
      serviceId: manualServiceId,
      staffId: manualStaffId,
      customerName: manualCustName,
      customerPhone: manualCustPhone,
      dateStr: selectedDate,
      timeStr: manualTime,
      notes: manualNotes,
    });

    setIsSavingManual(false);

    if (res.success) {
      setIsModalOpen(false);
      setManualCustName("");
      setManualCustPhone("");
      setManualNotes("");
    } else {
      setManualError(res.error || "No fue posible agendar.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Controles de Fecha y Acciones */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selector de Fecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftDay(-1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSetToday}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleShiftDay(1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Botón de Cita Manual */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            {dateAppointments.length} cita(s) este día
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Agendar Cita en Mostrador
          </button>
        </div>
      </div>

      {/* Rejilla del Calendario por Columnas de Staff */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header de Columnas: Staff */}
          <div className="grid grid-cols-12 border-b border-gray-200 bg-slate-900 text-white">
            <div className="col-span-2 p-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-slate-800 flex items-center">
              Horario
            </div>
            <div className="col-span-10 grid" style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}>
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 border-r last:border-r-0 border-slate-800 flex items-center gap-2.5"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden bg-slate-800"
                    style={{ borderColor: st.colorCode }}
                  >
                    {st.avatarUrl ? (
                      <img src={st.avatarUrl} alt={st.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white leading-tight">{st.displayName}</h5>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-semibold text-white inline-block mt-0.5"
                      style={{ backgroundColor: st.colorCode }}
                    >
                      Turno activo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filas de Horas */}
          <div className="divide-y divide-gray-100">
            {hours.map((hour) => {
              const [hourNum] = hour.split(":").map(Number);

              return (
                <div key={hour} className="grid grid-cols-12 min-h-[90px]">
                  {/* Etiqueta de la hora */}
                  <div className="col-span-2 p-3 text-xs font-bold text-gray-500 border-r border-gray-100 flex items-start gap-1.5 bg-slate-50/50">
                    <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    <span>{hour}</span>
                  </div>

                  {/* Celdas por colaborador */}
                  <div
                    className="col-span-10 grid divide-x divide-gray-100"
                    style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}
                  >
                    {staffList.map((st) => {
                      // Citas que caen en este rango horario para este colaborador
                      const slotApps = dateAppointments.filter((app) => {
                        if (app.staffId !== st.id) return false;
                        const appHour = new Date(app.startTime).getHours();
                        return appHour === hourNum;
                      });

                      return (
                        <div key={st.id} className="p-2 space-y-2 relative hover:bg-slate-50/40 transition">
                          {slotApps.map((app) => {
                            const isCancelled = app.status === "CANCELLED";
                            const isCompleted = app.status === "COMPLETED";

                            return (
                              <div
                                key={app.id}
                                className={`p-2.5 rounded-xl border text-xs transition-all shadow-sm ${
                                  isCancelled
                                    ? "bg-red-50/60 border-red-200 opacity-60"
                                    : isCompleted
                                    ? "bg-blue-50/60 border-blue-200"
                                    : "bg-white border-gray-200 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-gray-900 truncate">
                                    {app.customer.fullName}
                                  </span>
                                  <span className="text-[10px] font-black text-amber-600 whitespace-nowrap">
                                    {formatCurrency(app.totalPrice, currency)}
                                  </span>
                                </div>

                                <p className="text-[11px] text-gray-600 font-medium">
                                  {app.service.name} ({app.service.durationMinutes}m)
                                </p>

                                <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-gray-100 text-[10px] text-gray-500">
                                  <span>
                                    {new Date(app.startTime).toLocaleTimeString("es-MX", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* Botones de acción rápida */}
                                  <div className="flex items-center gap-1">
                                    {app.status !== "COMPLETED" && !isCancelled && (
                                      <button
                                        type="button"
                                        disabled={actionLoadingId === app.id}
                                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                                        className="text-emerald-600 hover:text-emerald-800 p-0.5"
                                        title="Marcar como atendida"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {!isCancelled && (
                                      <button
                                        type="button"
                                        disabled={actionLoadingId === app.id}
                                        onClick={() => handleStatusChange(app.id, "CANCELLED")}
                                        className="text-red-500 hover:text-red-700 p-0.5"
                                        title="Cancelar cita"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal para agendar Cita en Mostrador (Walk-in) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Agendar Cita en Mostrador</h3>
                <p className="text-xs text-gray-500">Cliente presencial o llamada telefónica</p>
              </div>
            </div>

            {manualError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Servicio *
                </label>
                <select
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min) - {formatCurrency(s.price, currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Profesional Asignado *
                </label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Hora (HH:mm) *
                  </label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {[
                      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                      "12:00", "12:30", "13:00", "14:00", "14:30", "15:00",
                      "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t} hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mario Silva"
                    value={manualCustName}
                    onChange={(e) => setManualCustName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 55 1234 5678"
                    value={manualCustPhone}
                    onChange={(e) => setManualCustPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Notas de mostrador
                </label>
                <input
                  type="text"
                  placeholder="Cliente en sala de espera, pago en efectivo..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50"
                >
                  {isSavingManual ? "Guardando..." : "Registrar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
