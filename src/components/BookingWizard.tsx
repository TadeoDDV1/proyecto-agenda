"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { createBooking, getAvailableSlotsAction } from "@/app/actions/booking";
import { 
  Scissors, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Phone,
  AlertCircle,
  Loader2
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | string;
  categoryId: string | null;
}

interface StaffItem {
  id: string;
  displayName: string;
  colorCode: string;
  avatarUrl: string | null;
}

interface BookingWizardProps {
  tenantSlug: string;
  currency: string;
  services: ServiceItem[];
  staffMembers: StaffItem[];
}

export function BookingWizard({
  tenantSlug,
  currency,
  services,
  staffMembers,
}: BookingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Slots dinámicos calculados por el motor de disponibilidad
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedStaff = staffMembers.find((st) => st.id === selectedStaffId);

  // Generar próximos 7 días disponibles
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("es-ES", { month: "short" });
    return { dateStr, label: `${dayName.toUpperCase()} ${dayNum} ${monthName}` };
  });

  // Consultar disponibilidad real cuando cambian profesional, servicio o fecha
  useEffect(() => {
    if (!selectedStaffId || !selectedServiceId || !selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSlotsMessage(null);
      setSelectedTime("");

      const res = await getAvailableSlotsAction({
        tenantSlug,
        staffId: selectedStaffId,
        serviceId: selectedServiceId,
        dateStr: selectedDate,
      });

      if (isMounted) {
        setLoadingSlots(false);
        if (res.success) {
          setAvailableSlots(res.slots);
          if (res.slots.length === 0) {
            setSlotsMessage(res.message || "No hay horarios disponibles para esta fecha.");
          }
        } else {
          setSlotsMessage(res.error || "No se pudieron calcular los horarios.");
        }
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, selectedStaffId, selectedServiceId, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Por favor ingresa tu nombre y número telefónico.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createBooking({
      tenantSlug,
      serviceId: selectedServiceId,
      staffId: selectedStaffId,
      customerName,
      customerPhone,
      customerEmail,
      dateStr: selectedDate,
      timeStr: selectedTime,
      notes,
    });

    setIsSubmitting(false);

    if (res.success) {
      setConfirmedBooking(res.appointment);
      setStep(5);
    } else {
      setErrorMessage(res.error || "No se pudo agendar la cita.");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header con pasos */}
      <div className="bg-slate-900 text-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Reserva en Línea
          </span>
          <span className="text-xs text-slate-400">
            {step < 5 ? `Paso ${step} de 4` : "Cita confirmada"}
          </span>
        </div>

        <h2 className="text-2xl font-bold">
          {step === 1 && "1. Elige tu Servicio"}
          {step === 2 && "2. Selecciona a tu Profesional"}
          {step === 3 && "3. Fecha y Horario Disponible"}
          {step === 4 && "4. Datos de Contacto"}
          {step === 5 && "¡Cita Confirmada con Éxito!"}
        </h2>
        <p className="text-slate-300 text-sm mt-1">
          {step === 1 && "Selecciona el tratamiento o corte que deseas realizarte."}
          {step === 2 && "¿Quién te gustaría que te atienda hoy?"}
          {step === 3 && "Disponibilidad calculada en tiempo real según el turno del profesional."}
          {step === 4 && "Indícanos a qué número confirmaremos tu reservación."}
          {step === 5 && "Tu espacio está asegurado en nuestra agenda."}
        </p>

        {/* Barra de progreso */}
        {step < 5 && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PASO 1: SERVICIOS */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900">{srv.name}</h4>
                        <span className="text-amber-600 font-bold text-base whitespace-nowrap">
                          {formatCurrency(srv.price, currency)}
                        </span>
                      </div>
                      {srv.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {srv.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{srv.durationMinutes} minutos</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: STAFF */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {staffMembers.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`text-center p-5 rounded-xl border-2 transition-all flex flex-col items-center ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden border-2 mb-3 shadow-inner bg-slate-100 flex items-center justify-center"
                      style={{ borderColor: staff.colorCode }}
                    >
                      {staff.avatarUrl ? (
                        <img
                          src={staff.avatarUrl}
                          alt={staff.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {staff.displayName}
                    </h4>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-medium text-white"
                      style={{ backgroundColor: staff.colorCode }}
                    >
                      Especialista
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={!selectedStaffId}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: FECHA Y HORA CON DISPONIBILIDAD EN TIEMPO REAL */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                1. Selecciona la Fecha
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {upcomingDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition ${
                      selectedDate === d.dateStr
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  2. Horarios Libres para {selectedStaff?.displayName}
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  Duración: {selectedService?.durationMinutes} min
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs">Consultando agenda disponible en tiempo real...</span>
                </div>
              ) : slotsMessage && availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{slotsMessage}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition ${
                        selectedTime === time
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: FORMULARIO DEL CLIENTE */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Resumen del agendamiento */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Servicio:</span>
                <span className="font-semibold text-slate-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Profesional:</span>
                <span className="font-semibold text-slate-900">{selectedStaff?.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Fecha y Hora:</span>
                <span className="font-semibold text-slate-900">
                  {selectedDate} a las {selectedTime} hrs
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Total a pagar en sucursal:</span>
                <span className="font-bold text-amber-600">
                  {selectedService && formatCurrency(selectedService.price, currency)}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 55 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo Electrónico (opcional)
              </label>
              <input
                type="email"
                placeholder="juan@ejemplo.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notas adicionales para el barbero/estilista
              </label>
              <textarea
                rows={2}
                placeholder="Indícanos si tienes alguna preferencia o requerimiento especial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50 transition shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? "Confirmando..." : "Confirmar Reservación"}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 5: CONFIRMACIÓN EXITOSA */}
        {step === 5 && confirmedBooking && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">
                ¡Tu cita ha quedado registrada!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Hemos enviado un recordatorio. Te esperamos puntualmente en el local.
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Atendido por:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha y Hora:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(confirmedBooking.startTime).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base">
                <span>Precio Total:</span>
                <span className="text-amber-600">
                  {formatCurrency(confirmedBooking.totalPrice, currency)}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedServiceId("");
                  setSelectedStaffId("");
                  setSelectedTime("");
                  setNotes("");
                  setConfirmedBooking(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Agendar otra cita
              </button>
              <a
                href={`/admin`}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Ver en Panel de Administración
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
