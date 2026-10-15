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
  X,
  MessageCircle,
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
  businessName?: string;
}

export function InteractiveCalendar({
  initialDateStr,
  staffList,
  servicesList,
  appointments,
  currency,
  businessName = "Nuestro Negocio",
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

  function getWhatsAppReminderLink(app: AppointmentItem) {
    const cleanPhone = app.customer.phone.replace(/[^0-9]/g, "");
    const timeFormatted = new Date(app.startTime).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = encodeURIComponent(
      `Hola ${app.customer.fullName}, te saludamos de ${businessName}. Confirmamos tu cita para hoy a las *${timeFormatted} hrs* con ${app.staff.displayName}. ¡Te esperamos!`
    );

    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  return (
    <div className="space-y-6">
      {/* Barra de Controles de Fecha Dark Luxe */}
      <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-3xl border border-zinc-850 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selector de Fecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftDay(-1)}
            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSetToday}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-200 transition border border-zinc-700"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleShiftDay(1)}
            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-transparent text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
            <strong className="text-amber-400">{dateAppointments.length}</strong> cita(s) en agenda
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cita en Mostrador</span>
          </button>
        </div>
      </div>

      {/* Rejilla del Calendario Dark Luxe */}
      <div className="bg-zinc-900/40 rounded-3xl border border-zinc-850 backdrop-blur-md shadow-2xl overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Header de Columnas: Staff */}
          <div className="grid grid-cols-12 border-b border-zinc-850 bg-zinc-950/90 text-white">
            <div className="col-span-2 p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-r border-zinc-850 flex items-center">
              Línea de Tiempo
            </div>
            <div
              className="col-span-10 grid"
              style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}
            >
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 border-r last:border-r-0 border-zinc-850 flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center overflow-hidden bg-zinc-900 shadow-md flex-shrink-0"
                    style={{ borderColor: st.colorCode }}
                  >
                    {st.avatarUrl ? (
                      <img src={st.avatarUrl} alt={st.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-zinc-100 leading-tight truncate">{st.displayName}</h5>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white inline-block mt-1 shadow-sm"
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
          <div className="divide-y divide-zinc-850/80">
            {hours.map((hour) => {
              const [hourNum] = hour.split(":").map(Number);

              return (
                <div key={hour} className="grid grid-cols-12 min-h-[96px]">
                  {/* Etiqueta de la hora */}
                  <div className="col-span-2 p-3.5 text-xs font-mono font-bold text-zinc-400 border-r border-zinc-850 flex items-start gap-2 bg-zinc-950/40">
                    <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
                    <span>{hour} hrs</span>
                  </div>

                  {/* Celdas por colaborador */}
                  <div
                    className="col-span-10 grid divide-x divide-zinc-850/80"
                    style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}
                  >
                    {staffList.map((st) => {
                      const slotApps = dateAppointments.filter((app) => {
                        if (app.staffId !== st.id) return false;
                        const appHour = new Date(app.startTime).getHours();
                        return appHour === hourNum;
                      });

                      return (
                        <div key={st.id} className="p-2 space-y-2 relative hover:bg-zinc-850/30 transition">
                          {slotApps.map((app) => {
                            const isCancelled = app.status === "CANCELLED";
                            const isCompleted = app.status === "COMPLETED";

                            return (
                              <div
                                key={app.id}
                                className={`p-3 rounded-2xl border text-xs transition-all shadow-md relative overflow-hidden ${
                                  isCancelled
                                    ? "bg-red-500/10 border-red-500/30 opacity-60"
                                    : isCompleted
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-white truncate pr-2">
                                    {app.customer.fullName}
                                  </span>
                                  <span className="text-xs font-black text-amber-400 font-mono whitespace-nowrap">
                                    {formatCurrency(app.totalPrice, currency)}
                                  </span>
                                </div>

                                <p className="text-[11px] text-zinc-400 font-medium truncate">
                                  {app.service.name} ({app.service.durationMinutes}m)
                                </p>

                                <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
                                  <span className="font-mono text-zinc-400">
                                    {new Date(app.startTime).toLocaleTimeString("es-MX", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* Acciones de tarjeta */}
                                  <div className="flex items-center gap-1.5">
                                    {app.customer.phone && !isCancelled && (
                                      <a
                                        href={getWhatsAppReminderLink(app)}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="WhatsApp recordatorio"
                                        className="text-emerald-400 hover:text-emerald-300 p-0.5"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    {app.status !== "COMPLETED" && !isCancelled && (
                                      <button
                                        type="button"
                                        disabled={actionLoadingId === app.id}
                                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                                        className="text-blue-400 hover:text-blue-300 p-0.5"
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
                                        className="text-zinc-500 hover:text-red-400 p-0.5"
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

      {/* Modal Cita en Mostrador (Dark Luxe) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-800 relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Agendar Cita en Mostrador</h3>
                <p className="text-xs text-zinc-400">Para clientes que llegan sin cita o llaman por teléfono</p>
              </div>
            </div>

            {manualError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Servicio Solicitado *
                </label>
                <select
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min) - {formatCurrency(s.price, currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Especialista *
                </label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Horario *
                  </label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Lara"
                    value={manualCustName}
                    onChange={(e) => setManualCustName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    WhatsApp / Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 55 9876 5432"
                    value={manualCustPhone}
                    onChange={(e) => setManualCustPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Notas de mostrador
                </label>
                <input
                  type="text"
                  placeholder="Cliente en sala de espera, pago en efectivo..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
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
