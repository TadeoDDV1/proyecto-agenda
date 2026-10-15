"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  RotateCcw,
  Sparkles,
  Mail,
  FileText,
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
    email?: string | null;
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

  // Drawer de Detalle de Cita
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  // Formulario de Cita Manual (Walk-in)
  const [manualServiceId, setManualServiceId] = useState<string>(servicesList[0]?.id || "");
  const [manualStaffId, setManualStaffId] = useState<string>(staffList[0]?.id || "");
  const [manualTime, setManualTime] = useState<string>("10:00");
  const [manualCustName, setManualCustName] = useState("");
  const [manualCustPhone, setManualCustPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Hora actual para el indicador de tiempo en vivo
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);

  useEffect(() => {
    function updateCurrentTime() {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      setCurrentTimeMinutes(currentH * 60 + currentM);
    }
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const isSelectedDateToday = selectedDate === todayStr;

  // Navegar días
  function handleShiftDay(offset: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split("T")[0]);
  }

  function handleSetToday() {
    setSelectedDate(todayStr);
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
    const res = await updateAppointmentStatusAction(appointmentId, newStatus);
    setActionLoadingId(null);

    if (res.success && selectedAppointment?.id === appointmentId) {
      setSelectedAppointment({
        ...selectedAppointment,
        status: newStatus,
      });
    }
  }

  // Abrir modal de walk-in pre-seleccionando especialista y hora
  function handleQuickSlotClick(staffId: string, hourStr: string) {
    setManualStaffId(staffId);
    setManualTime(hourStr);
    setManualError(null);
    setIsModalOpen(true);
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
      `Hola ${app.customer.fullName}, te saludamos de ${businessName}. Te confirmamos tu cita de *${app.service.name}* para el *${dateFormatted} a las ${timeFormatted} hrs* con ${app.staff.displayName}. ¡Te esperamos puntualmente!`
    );

    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  function getStatusBadge(status: AppointmentStatus) {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "COMPLETED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              isSelectedDateToday
                ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700"
            }`}
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

        {/* Resumen y Cita Manual */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
            <strong className="text-amber-400 font-bold">{dateAppointments.length}</strong> cita(s) programada(s)
          </span>

          <button
            type="button"
            onClick={() => {
              setManualError(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cita en Mostrador</span>
          </button>
        </div>
      </div>

      {/* Rejilla del Calendario Dark Luxe */}
      <div className="bg-zinc-900/40 rounded-3xl border border-zinc-850 backdrop-blur-md shadow-2xl overflow-x-auto relative">
        <div className="min-w-[850px] relative">
          {/* Header de Columnas: Especialistas */}
          <div className="grid grid-cols-12 border-b border-zinc-850 bg-zinc-950/90 text-white sticky top-0 z-20">
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
                  <div className="min-w-0">
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
          <div className="divide-y divide-zinc-850/80 relative">
            {hours.map((hour) => {
              const [hourNum] = hour.split(":").map(Number);

              return (
                <div key={hour} className="grid grid-cols-12 min-h-[96px] relative">
                  {/* Etiqueta de la hora */}
                  <div className="col-span-2 p-3.5 text-xs font-mono font-bold text-zinc-400 border-r border-zinc-850 flex items-start gap-2 bg-zinc-950/40 select-none">
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
                        <div
                          key={st.id}
                          onClick={() => {
                            if (slotApps.length === 0) {
                              handleQuickSlotClick(st.id, hour);
                            }
                          }}
                          className="p-2 space-y-2 relative hover:bg-zinc-850/30 transition cursor-pointer group/cell"
                          title={slotApps.length === 0 ? `Click para agendar con ${st.displayName} a las ${hour}` : ""}
                        >
                          {/* Indicador sutil para agendar al hacer hover en celda vacía */}
                          {slotApps.length === 0 && (
                            <div className="opacity-0 group-hover/cell:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-750 flex items-center gap-1 shadow-sm">
                                <Plus className="w-3 h-3 text-amber-400" />
                                {hour}
                              </span>
                            </div>
                          )}

                          {/* Tarjetas de Citas */}
                          {slotApps.map((app) => {
                            const isCancelled = app.status === "CANCELLED";
                            const isCompleted = app.status === "COMPLETED";

                            return (
                              <div
                                key={app.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(app);
                                }}
                                className={`p-3 rounded-2xl border text-xs transition-all shadow-md relative overflow-hidden cursor-pointer hover:scale-[1.02] ${
                                  isCancelled
                                    ? "bg-red-500/10 border-red-500/30 opacity-60"
                                    : isCompleted
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-zinc-900/95 border-zinc-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
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

                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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

      {/* DRAWER LATERAL DE DETALLE DE CITA (Slide-over Sheet) */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedAppointment(null)}
          />

          {/* Panel Lateral Drawer */}
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 text-white z-10">
            <div>
              {/* Header del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      selectedAppointment.status
                    )}`}
                  >
                    {selectedAppointment.status}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">Ficha de Cita</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Título y Precio */}
              <div className="mt-5 pb-5 border-b border-zinc-850 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {selectedAppointment.service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedAppointment.service.durationMinutes} minutos de sesión</span>
                  </div>
                </div>

                <span className="text-2xl font-black text-amber-400 font-mono">
                  {formatCurrency(selectedAppointment.totalPrice, currency)}
                </span>
              </div>

              {/* Información del Cliente */}
              <div className="mt-6 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Datos del Cliente
                </span>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {selectedAppointment.customer.fullName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Cliente Registrado
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedAppointment.customer.phone}</span>
                    </div>
                    <a
                      href={`tel:${selectedAppointment.customer.phone}`}
                      className="text-amber-400 hover:text-amber-300 font-semibold text-xs"
                    >
                      Llamar
                    </a>
                  </div>

                  {selectedAppointment.customer.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedAppointment.customer.email}</span>
                    </div>
                  )}

                  {selectedAppointment.customerNotes && (
                    <div className="pt-2 border-t border-zinc-800 text-xs">
                      <span className="text-zinc-500 block font-semibold text-[10px] uppercase mb-0.5">
                        Nota del cliente
                      </span>
                      <p className="text-zinc-300 italic">{selectedAppointment.customerNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del Especialista y Horario */}
              <div className="mt-6 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Asignación de Turno
                </span>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedAppointment.staff.colorCode }}
                      />
                      <span className="text-xs font-bold text-white">
                        {selectedAppointment.staff.displayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Especialista</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>
                      {new Date(selectedAppointment.startTime).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      a las{" "}
                      {new Date(selectedAppointment.startTime).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Destacado de WhatsApp */}
              <div className="mt-6">
                <a
                  href={getWhatsAppReminderLink(selectedAppointment)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Recordatorio por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Acciones de Cambio de Estado en el Pie del Drawer */}
            <div className="pt-6 border-t border-zinc-850 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                Actualizar Estado
              </span>

              <div className="grid grid-cols-2 gap-2">
                {selectedAppointment.status !== "COMPLETED" && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "COMPLETED")}
                    className="py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar Atendida</span>
                  </button>
                )}

                {selectedAppointment.status !== "CANCELLED" && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "CANCELLED")}
                    className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancelar Cita</span>
                  </button>
                )}

                {selectedAppointment.status === "CANCELLED" && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "CONFIRMED")}
                    className="col-span-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reactivar Cita</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cita en Mostrador (Walk-in) */}
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
                <p className="text-xs text-zinc-400">Cliente presencial o llamada telefónica</p>
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
