"use client";

import { useState, useEffect } from "react";
import { addDaysToDateKey, formatCurrency, getWhatsAppUrl, toDateKey } from "@/lib/utils";
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
  RotateCcw,
  Mail,
} from "lucide-react";
import { Badge, Button, StatusPill } from "@/components/ui";

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

  // Panel de detalle de cita
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  // Formulario de cita manual (walk-in)
  const [manualServiceId, setManualServiceId] = useState<string>(servicesList[0]?.id || "");
  const [manualStaffId, setManualStaffId] = useState<string>(staffList[0]?.id || "");
  const [manualTime, setManualTime] = useState<string>("10:00");
  const [manualCustName, setManualCustName] = useState("");
  const [manualCustPhone, setManualCustPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Hora actual para el indicador en vivo
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);

  useEffect(() => {
    function updateCurrentTime() {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = toDateKey();
  const isSelectedDateToday = selectedDate === todayStr;
  const currentHour = currentTimeMinutes !== null ? Math.floor(currentTimeMinutes / 60) : null;

  function handleShiftDay(offset: number) {
    setSelectedDate(addDaysToDateKey(selectedDate, offset));
  }

  function handleSetToday() {
    setSelectedDate(todayStr);
  }

  const dateAppointments = appointments.filter(
    (app) => toDateKey(new Date(app.startTime)) === selectedDate
  );

  const dayRevenue = dateAppointments
    .filter((app) => app.status !== "CANCELLED")
    .reduce((acc, app) => acc + Number(app.totalPrice), 0);

  const hours = [
    "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  ];

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    setActionLoadingId(appointmentId);
    const res = await updateAppointmentStatusAction(appointmentId, newStatus);
    setActionLoadingId(null);

    if (res.success && selectedAppointment?.id === appointmentId) {
      setSelectedAppointment({ ...selectedAppointment, status: newStatus });
    }
  }

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
    const dateFormatted = new Date(app.startTime).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    const timeFormatted = new Date(app.startTime).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const message = `Hola ${app.customer.fullName}, te saludamos de ${businessName}. Te confirmamos tu cita de *${app.service.name}* para el *${dateFormatted} a las ${timeFormatted} hrs* con ${app.staff.displayName}. ¡Te esperamos puntualmente!`;
    return getWhatsAppUrl(app.customer.phone, message);
  }

  return (
    <div className="space-y-6">
      {/* Controles de fecha */}
      <div className="bg-surface p-4 sm:p-5 rounded-xl border border-border flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftDay(-1)}
            aria-label="Día anterior"
            className="p-2.5 rounded-lg bg-base border border-border hover:border-border-strong text-muted hover:text-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSetToday}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition border ${
              isSelectedDateToday
                ? "bg-accent text-accent-fg border-accent"
                : "bg-base hover:border-border-strong text-muted border-border"
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleShiftDay(1)}
            aria-label="Día siguiente"
            className="p-2.5 rounded-lg bg-base border border-border hover:border-border-strong text-muted hover:text-foreground transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-base border border-border">
            <CalendarIcon className="w-4 h-4 text-accent-hover" aria-hidden="true" />
            <input
              type="date"
              aria-label="Seleccionar fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-medium bg-transparent text-foreground focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-muted font-mono hidden sm:inline whitespace-nowrap">
            <strong className="text-accent-warm font-semibold">{dateAppointments.length}</strong>{" "}
            {dateAppointments.length === 1 ? "cita programada" : "citas programadas"}
          </span>
          <span
            className="hidden md:inline font-mono text-[11px] text-dim"
            aria-label={`Ingresos estimados del día: ${formatCurrency(dayRevenue, currency)}`}
          >
            {formatCurrency(dayRevenue, currency)}
          </span>

          <Button
            type="button"
            onClick={() => {
              setManualError(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full md:w-auto whitespace-nowrap"
          >
            Cita en mostrador
          </Button>
        </div>
      </div>

      {/* Rejilla del calendario */}
      {dateAppointments.length === 0 && (
        <div
          role="status"
          className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <p className="text-xs text-muted flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-accent-warm flex-shrink-0" aria-hidden="true" />
            No hay citas para este día. Registra una cita en mostrador o comparte el portal de reservas.
          </p>
          <button
            type="button"
            onClick={() => {
              setManualError(null);
              setIsModalOpen(true);
            }}
            className="self-start sm:self-auto text-[11px] font-semibold text-accent-warm hover:text-foreground transition"
          >
            + Agendar primera cita
          </button>
        </div>
      )}
      {staffList.length > 1 && (
        <p className="flex items-center justify-end gap-1.5 text-[11px] text-dim xl:hidden">
          Desliza para ver al resto del equipo
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </p>
      )}
      <div className="bg-surface rounded-xl border border-border overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Header: especialistas */}
          <div className="flex border-b border-border bg-surface-raised sticky top-0 z-20">
            <div className="sticky left-0 z-30 w-20 sm:w-[120px] flex-shrink-0 p-2.5 sm:p-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim border-r border-border bg-surface-raised flex items-center">
              <span className="sm:hidden">Hora</span>
              <span className="hidden sm:inline">Línea de tiempo</span>
            </div>
            <div
              className="flex-1 grid"
              style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}
            >
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 border-r last:border-r-0 border-border flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center overflow-hidden bg-base flex-shrink-0"
                    style={{ borderColor: st.colorCode }}
                  >
                    {st.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={st.avatarUrl}
                        alt={st.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-dim" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-xs text-foreground leading-tight truncate">
                      {st.displayName}
                    </h5>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-semibold text-white inline-block mt-1"
                      style={{ backgroundColor: st.colorCode }}
                    >
                      Turno activo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filas de horas */}
          <div className="divide-y divide-border-subtle">
            {hours.map((hour) => {
              const [hourNum] = hour.split(":").map(Number);
              const isCurrentHour = isSelectedDateToday && hourNum === currentHour;

              return (
                <div key={hour} className="flex min-h-[96px]">
                  <div
                    className={`sticky left-0 z-10 w-20 sm:w-[120px] flex-shrink-0 p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-mono font-semibold border-r border-border flex items-start gap-1.5 sm:gap-2 select-none ${
                      isCurrentHour
                        ? "text-accent-warm cal-col-time-now"
                        : "text-muted cal-col-time"
                    }`}
                  >
                    <Clock className="hidden sm:block w-3.5 h-3.5 mt-0.5" />
                    <span className="flex flex-col gap-1 whitespace-nowrap">
                      <span>
                        {hour}
                        <span className="hidden sm:inline"> hrs</span>
                      </span>
                      {isCurrentHour && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em]">
                          <span
                            className="h-1 w-1 rounded-full bg-accent-warm"
                            aria-hidden="true"
                          />
                          Ahora
                        </span>
                      )}
                    </span>
                  </div>

                  <div
                    className="flex-1 grid divide-x divide-border-subtle"
                    style={{ gridTemplateColumns: `repeat(${staffList.length}, minmax(0, 1fr))` }}
                  >
                    {staffList.map((st) => {
                      const slotApps = dateAppointments.filter((app) => {
                        if (app.staffId !== st.id) return false;
                        return new Date(app.startTime).getHours() === hourNum;
                      });

                      return (
                        <div
                          key={st.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (slotApps.length === 0) handleQuickSlotClick(st.id, hour);
                          }}
                          onKeyDown={(e) => {
                            if (slotApps.length !== 0) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleQuickSlotClick(st.id, hour);
                            }
                          }}
                          className="p-2 space-y-2 relative hover:bg-surface-raised/50 transition cursor-pointer group/cell focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
                          title={
                            slotApps.length === 0
                              ? `Click para agendar con ${st.displayName} a las ${hour}`
                              : ""
                          }
                        >
                          {slotApps.length === 0 && (
                            <div className="opacity-0 group-hover/cell:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[10px] font-semibold text-muted bg-surface-raised px-2 py-1 rounded-lg border border-border flex items-center gap-1">
                                <Plus className="w-3 h-3 text-accent-hover" />
                                {hour}
                              </span>
                            </div>
                          )}

                          {slotApps.map((app) => {
                            const isCancelled = app.status === "CANCELLED";
                            const isCompleted = app.status === "COMPLETED";

                            return (
                              <div
                                key={app.id}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(app);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedAppointment(app);
                                  }
                                }}
                                className={`p-3 rounded-xl border text-xs transition-all relative overflow-hidden cursor-pointer hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${
                                  isCancelled
                                    ? "bg-error/10 border-error/25 opacity-60"
                                    : isCompleted
                                    ? "bg-info/10 border-info/25"
                                    : "bg-surface-raised border-border hover:border-accent/50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-semibold text-foreground truncate pr-2">
                                    {app.customer.fullName}
                                  </span>
                                  <span className="text-xs font-semibold text-accent-warm font-mono whitespace-nowrap">
                                    {formatCurrency(app.totalPrice, currency)}
                                  </span>
                                </div>

                                <p className="text-[11px] text-muted truncate">
                                  {app.service.name} ({app.service.durationMinutes}m)
                                </p>

                                <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-border-subtle text-[10px] text-dim">
                                  <span className="font-mono">
                                    {new Date(app.startTime).toLocaleTimeString("es-MX", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  <div
                                    className="flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {app.customer.phone && !isCancelled && (
                                      <a
                                        href={getWhatsAppReminderLink(app)}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="WhatsApp recordatorio"
                                        aria-label="Enviar recordatorio por WhatsApp"
                                        className="text-success-text hover:text-success p-0.5 transition"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    {app.status !== "COMPLETED" && !isCancelled && (
                                      <button
                                        type="button"
                                        disabled={actionLoadingId === app.id}
                                        onClick={() => handleStatusChange(app.id, "COMPLETED")}
                                        className="text-info-text hover:text-info p-0.5 transition"
                                        title="Marcar como atendida"
                                        aria-label="Marcar como atendida"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {!isCancelled && (
                                      <button
                                        type="button"
                                        disabled={actionLoadingId === app.id}
                                        onClick={() => handleStatusChange(app.id, "CANCELLED")}
                                        className="text-dim hover:text-error-text p-0.5 transition"
                                        title="Cancelar cita"
                                        aria-label="Cancelar cita"
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

      {/* Panel lateral de detalle */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar detalle"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedAppointment(null)}
          />

          <div className="relative w-full max-w-md bg-surface border-l border-border p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-slide-in-right z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <StatusPill status={selectedAppointment.status} />
                  <span className="text-xs text-dim font-mono">Ficha de cita</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  aria-label="Cerrar detalle"
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 pb-5 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground leading-tight">
                    {selectedAppointment.service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-accent-hover" />
                    <span>{selectedAppointment.service.durationMinutes} minutos de sesión</span>
                  </div>
                </div>

                <span className="text-2xl font-semibold text-accent-warm font-display">
                  {formatCurrency(selectedAppointment.totalPrice, currency)}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim block">
                  Datos del cliente
                </span>

                <div className="p-4 rounded-xl bg-base border border-border space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {selectedAppointment.customer.fullName}
                    </span>
                    <Badge tone="success">Cliente registrado</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-dim" />
                      <span>{selectedAppointment.customer.phone}</span>
                    </div>
                    <a
                      href={`tel:${selectedAppointment.customer.phone}`}
                      className="text-accent-warm hover:text-accent-hover font-semibold text-xs transition"
                    >
                      Llamar
                    </a>
                  </div>

                  {selectedAppointment.customer.email && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Mail className="w-3.5 h-3.5 text-dim" />
                      <span>{selectedAppointment.customer.email}</span>
                    </div>
                  )}

                  {selectedAppointment.customerNotes && (
                    <div className="pt-2 border-t border-border-subtle text-xs">
                      <span className="text-dim block font-semibold text-[10px] uppercase mb-0.5">
                        Nota del cliente
                      </span>
                      <p className="text-muted italic">{selectedAppointment.customerNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim block">
                  Asignación de turno
                </span>

                <div className="p-4 rounded-xl bg-base border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedAppointment.staff.colorCode }}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {selectedAppointment.staff.displayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-dim font-mono">Especialista</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-accent-warm font-mono font-semibold bg-accent-soft p-2.5 rounded-lg border border-accent/20">
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

              <div className="mt-6">
                <a
                  href={getWhatsAppReminderLink(selectedAppointment)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/15 hover:bg-success/25 text-success-text border border-success/30 font-semibold text-xs uppercase tracking-wider transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar recordatorio por WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim block mb-2">
                Actualizar estado
              </span>

              <div className="grid grid-cols-2 gap-2">
                {selectedAppointment.status !== "COMPLETED" && (
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    loading={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "COMPLETED")}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Marcar atendida
                  </Button>
                )}

                {selectedAppointment.status !== "CANCELLED" && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "CANCELLED")}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Cancelar cita
                  </Button>
                )}

                {selectedAppointment.status === "CANCELLED" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={actionLoadingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "CONFIRMED")}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    className="col-span-2"
                  >
                    Reactivar cita
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cita en mostrador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-border relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Cerrar modal"
              className="absolute top-5 right-5 p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 text-accent-warm flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Agendar cita en mostrador
                </h3>
                <p className="text-xs text-muted">Cliente presencial o llamada telefónica</p>
              </div>
            </div>

            {manualError && (
              <div className="mb-4 p-3.5 rounded-xl bg-error/10 border border-error/25 text-error-text text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label htmlFor="manual-service" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                  Servicio
                </label>
                <select id="manual-service"
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min) - {formatCurrency(s.price, currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="manual-staff" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                  Especialista
                </label>
                <select id="manual-staff"
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manual-date" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Fecha
                  </label>
                  <input id="manual-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 cursor-pointer"
                  />
                </div>

                <div>
                  <label htmlFor="manual-time" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Hora
                  </label>
                  <select id="manual-time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                  >
                    {[
                      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                      "12:00", "12:30", "13:00", "14:00", "14:30", "15:00",
                      "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t} hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manual-name" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Nombre del cliente
                  </label>
                  <input id="manual-name"
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Lara"
                    value={manualCustName}
                    onChange={(e) => setManualCustName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label htmlFor="manual-phone" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input id="manual-phone"
                    type="tel"
                    required
                    placeholder="Ej. 55 9876 5432"
                    value={manualCustPhone}
                    onChange={(e) => setManualCustPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-notes" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                  Notas (opcional)
                </label>
                <input id="manual-notes"
                  type="text"
                  placeholder="Cliente en sala de espera, pago en efectivo..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isSavingManual}>
                  {isSavingManual ? "Guardando..." : "Registrar cita"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
