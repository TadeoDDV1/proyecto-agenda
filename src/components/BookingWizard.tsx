"use client";

import { useState, useEffect } from "react";
import { formatCurrency, toDateKey } from "@/lib/utils";
import { createBooking, getAvailableSlotsAction } from "@/app/actions/booking";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button, LoadingState } from "@/components/ui";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  categoryId: string | null;
  categoryName?: string;
}

interface StaffItem {
  id: string;
  displayName: string;
  colorCode: string;
  avatarUrl: string | null;
  serviceIds?: string[];
}

interface ConfirmedBooking {
  serviceName: string;
  staffName: string;
  customerName: string;
  startTime: string;
  totalPrice: number;
}

interface BookingWizardProps {
  tenantSlug: string;
  tenantName?: string;
  currency: string;
  services: ServiceItem[];
  staffMembers: StaffItem[];
}

const STEPS = [
  { num: 1, label: "Servicio" },
  { num: 2, label: "Especialista" },
  { num: 3, label: "Horario" },
  { num: 4, label: "Confirmar" },
];

export function BookingWizard({
  tenantSlug,
  tenantName = "Nuestro Negocio",
  currency,
  services,
  staffMembers,
}: BookingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || "");
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const firstServiceId = services[0]?.id;
    return (
      staffMembers.find((st) => st.serviceIds?.includes(firstServiceId || ""))?.id ||
      staffMembers[0]?.id ||
      ""
    );
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // Slots dinámicos
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Solo los profesionales que ofrecen el servicio seleccionado
  const eligibleStaff = staffMembers.filter(
    (st) => !st.serviceIds || st.serviceIds.includes(selectedServiceId)
  );

  // Si el profesional elegido no ofrece el servicio actual, usar el primero disponible
  const effectiveStaffId = eligibleStaff.some((st) => st.id === selectedStaffId)
    ? selectedStaffId
    : eligibleStaff[0]?.id || "";
  const selectedStaff = staffMembers.find((st) => st.id === effectiveStaffId);

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(services.map((s) => s.categoryName || "General"))
  );

  const filteredServices = services.filter((s) => {
    if (selectedCategory === "ALL") return true;
    return (s.categoryName || "General") === selectedCategory;
  });

  // Generar próximos 10 días para el carrusel de fechas
  const upcomingDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = toDateKey(d);
    const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("es-ES", { month: "short" });
    return { dateStr, dayName: dayName.toUpperCase(), dayNum, monthName: monthName.toUpperCase() };
  });

  // Consultar disponibilidad en tiempo real
  useEffect(() => {
    if (!effectiveStaffId || !selectedServiceId || !selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSlotsMessage(null);
      setSelectedTime("");

      const res = await getAvailableSlotsAction({
        tenantSlug,
        staffId: effectiveStaffId,
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
  }, [tenantSlug, effectiveStaffId, selectedServiceId, selectedDate]);

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
      staffId: effectiveStaffId,
      customerName,
      customerPhone,
      customerEmail,
      dateStr: selectedDate,
      timeStr: selectedTime,
      notes,
    });

    setIsSubmitting(false);

    if (res.success && res.appointment) {
      setConfirmedBooking(res.appointment);
      setStep(5);
    } else {
      setErrorMessage(
        ("error" in res && res.error) || "No se pudo agendar la cita."
      );
    }
  }

  const canProceed =
    (step === 1 && selectedServiceId) ||
    (step === 2 && effectiveStaffId) ||
    (step === 3 && selectedDate && selectedTime) ||
    (step === 4 && customerName && customerPhone);

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Columna izquierda: asistente */}
      <div className="lg:col-span-8 min-w-0 space-y-6">
        {/* Stepper */}
        <div className="bg-surface border border-border rounded-[3px] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {STEPS.map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={s.num > step}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-[3px] text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-accent-soft border border-accent/40 text-accent-warm"
                      : isPast
                      ? "text-muted hover:text-foreground"
                      : "text-dim cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-[2px] flex items-center justify-center text-xs font-bold transition ${
                      isActive
                        ? "bg-accent text-accent-fg"
                        : isPast
                        ? "bg-surface-raised text-muted"
                        : "bg-base text-dim"
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenedor principal del paso */}
        <div className="bg-surface border border-border rounded-[4px] p-6 sm:p-8 relative overflow-hidden">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-[3px] bg-error/10 border border-error/25 text-error-text flex items-center gap-3 text-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PASO 1: SERVICIO */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">
                    1. Selecciona tu Servicio
                  </h3>
                  <span className="text-xs text-dim font-medium">Paso 1 de 4</span>
                </div>
                <p className="text-xs text-muted">
                  Elige el corte o experiencia que deseas agendar.
                </p>
              </div>

              {categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    aria-pressed={selectedCategory === "ALL"}
                    className={`px-3.5 py-1.5 rounded-[3px] text-xs font-semibold transition whitespace-nowrap ${
                      selectedCategory === "ALL"
                        ? "bg-accent text-accent-fg"
                        : "bg-base border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Todos los servicios
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={selectedCategory === cat}
                      className={`px-3.5 py-1.5 rounded-[3px] text-xs font-semibold transition whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-accent text-accent-fg"
                          : "bg-base border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {filteredServices.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      aria-pressed={isSelected}
                      className={`text-left p-5 rounded-[3px] border transition-all flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? "bg-accent-soft border-accent/60"
                          : "bg-base border-border hover:border-border-strong"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-accent-fg flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-dim block mb-1">
                          {srv.categoryName}
                        </span>
                        <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-accent-warm transition pr-6">
                          {srv.name}
                        </h4>
                        {srv.description && (
                          <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                          <Clock className="w-3.5 h-3.5 text-accent-hover" />
                          <span>{srv.durationMinutes} min</span>
                        </div>
                        <span className="text-accent-warm font-semibold text-base">
                          {formatCurrency(srv.price, currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: ESPECIALISTA */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">
                    2. Elige a tu Profesional
                  </h3>
                  <span className="text-xs text-dim font-medium">Paso 2 de 4</span>
                </div>
                <p className="text-xs text-muted">
                  ¿Quién te gustaría que realice tu servicio?
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {eligibleStaff.map((staff) => {
                  const isSelected = effectiveStaffId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSelectedStaffId(staff.id)}
                      aria-pressed={isSelected}
                      className={`text-center p-6 rounded-[3px] border transition-all flex flex-col items-center relative group ${
                        isSelected
                          ? "bg-accent-soft border-accent/60"
                          : "bg-base border-border hover:border-border-strong"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-accent-fg flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="relative mb-3.5">
                        <div
                          className="w-20 h-20 rounded-full overflow-hidden border-2 bg-surface-raised flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ borderColor: staff.colorCode }}
                        >
                          {staff.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={staff.avatarUrl}
                              alt={staff.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span
                              className="text-2xl font-semibold font-display"
                              style={{ color: staff.colorCode }}
                            >
                              {staff.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-surface"
                          style={{ backgroundColor: staff.colorCode }}
                        />
                      </div>

                      <h4 className="font-semibold text-sm text-foreground group-hover:text-accent-warm transition">
                        {staff.displayName}
                      </h4>
                      <span className="text-[11px] text-muted mt-1 font-medium">
                        Especialista certificado
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  disabled={!effectiveStaffId}
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: FECHA Y HORA */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">
                    3. Fecha y Horario
                  </h3>
                  <span className="text-xs text-dim font-medium">Paso 3 de 4</span>
                </div>
                <p className="text-xs text-muted">
                  Horarios calculados en tiempo real para{" "}
                  <strong className="text-foreground">{selectedStaff?.displayName}</strong>.
                </p>
              </div>

              {/* Carrusel de días */}
              <div role="group" aria-labelledby="bk-date-label">
                <span id="bk-date-label" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-2.5">
                  Selecciona la Fecha
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                  {upcomingDays.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(d.dateStr)}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center justify-center min-w-[76px] py-3.5 px-3 rounded-[3px] border transition-all text-center flex-shrink-0 ${
                          isSelected
                            ? "bg-accent text-accent-fg border-accent"
                            : "bg-base text-muted border-border hover:border-border-strong"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? "text-accent-fg/80" : "text-dim"
                          }`}
                        >
                          {d.dayName}
                        </span>
                        <span className="text-xl font-semibold my-1">{d.dayNum}</span>
                        <span
                          className={`text-[9px] font-semibold ${
                            isSelected ? "text-accent-fg/80" : "text-muted"
                          }`}
                        >
                          {d.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horarios */}
              <div role="group" aria-labelledby="bk-slots-label" aria-live="polite">
                <div className="flex items-center justify-between mb-2.5">
                  <span id="bk-slots-label" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em]">
                    Turnos Disponibles
                  </span>
                  <span className="text-[11px] text-dim font-mono">
                    Duración: {selectedService?.durationMinutes} min
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="bg-base rounded-[3px] border border-border">
                    <LoadingState label="Consultando espacios libres en la agenda…" />
                  </div>
                ) : slotsMessage && availableSlots.length === 0 ? (
                  <div className="p-5 rounded-[3px] bg-warning/10 border border-warning/25 text-warning-text text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{slotsMessage}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {availableSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          aria-pressed={isSelected}
                          className={`py-3 px-2 rounded-[3px] border text-xs font-mono font-semibold transition ${
                            isSelected
                              ? "bg-accent text-accent-fg border-accent"
                              : "bg-base text-muted border-border hover:border-accent/40 hover:text-foreground"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(4)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* PASO 4: FORMULARIO */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">
                    4. Datos de Contacto
                  </h3>
                  <span className="text-xs text-dim font-medium">Paso 4 de 4</span>
                </div>
                <p className="text-xs text-muted">
                  Indícanos a qué nombre y WhatsApp confirmaremos tu reservación.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bk-name" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Nombre completo
                  </label>
                  <input id="bk-name"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-[3px] bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition"
                  />
                </div>

                <div>
                  <label htmlFor="bk-phone" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input id="bk-phone"
                    type="tel"
                    required
                    placeholder="Ej. 55 1234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-[3px] bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bk-email" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                  Correo electrónico (opcional)
                </label>
                <input id="bk-email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-[3px] bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition"
                />
              </div>

              <div>
                <label htmlFor="bk-notes" className="block text-[11px] font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                  Notas para tu cita (opcional)
                </label>
                <textarea id="bk-notes"
                  rows={2}
                  placeholder="Preferencias de corte, productos alérgicos, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-[3px] bg-base border border-border text-sm text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(3)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  rightIcon={!isSubmitting ? <CheckCircle2 className="w-4 h-4" /> : undefined}
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar y Asegurar Cita"}
                </Button>
              </div>
            </form>
          )}

          {/* PASO 5: TICKET */}
          {step === 5 && confirmedBooking && (
            <div className="py-6 text-center space-y-6">
              <div className="w-20 h-20 rounded-[4px] bg-success/15 border border-success/30 text-success-text flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-foreground">
                  ¡Tu cita está asegurada!
                </h3>
                <p className="text-sm text-muted mt-1 max-w-md mx-auto">
                  Hemos registrado tu reserva con éxito. Te esperamos puntualmente en sucursal.
                </p>
              </div>

              <div className="max-w-md mx-auto p-6 rounded-[3px] bg-base border border-border text-left text-xs space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
                  <span className="text-dim font-semibold uppercase tracking-wider">
                    Negocio
                  </span>
                  <span className="font-semibold text-foreground text-sm">{tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Servicio:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedBooking.serviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Atendido por:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedBooking.staffName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cliente:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedBooking.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Horario:</span>
                  <span className="font-semibold text-accent-warm">
                    {new Date(confirmedBooking.startTime).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border-subtle text-base font-semibold">
                  <span className="text-muted">Total en sucursal:</span>
                  <span className="text-accent-warm">
                    {formatCurrency(confirmedBooking.totalPrice, currency)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setSelectedTime("");
                    setNotes("");
                    setConfirmedBooking(null);
                  }}
                >
                  Agendar otra cita
                </Button>
                <a
                  href="/admin"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-[3px] bg-surface-raised border border-border text-foreground text-sm font-medium hover:border-border-strong transition"
                >
                  Ver en Panel de Administración
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha: recibo en vivo */}
      <div className="hidden lg:block lg:col-span-4 min-w-0 sticky top-24 space-y-5">
        <div className="bg-surface border border-border rounded-[4px] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-accent-warm block">
                Resumen de Cita
              </span>
              <h4 className="font-semibold text-foreground text-base leading-tight mt-0.5">
                Tu Reservación
              </h4>
            </div>
            <div className="w-8 h-8 rounded-[3px] bg-accent-soft border border-accent/20 text-accent-warm flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="py-4 space-y-4 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-dim block text-[10px] uppercase font-semibold tracking-wider">
                  Servicio
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {selectedService?.name || "Sin seleccionar"}
                </span>
                {selectedService && (
                  <span className="text-muted block text-[11px] mt-0.5 font-mono">
                    {selectedService.durationMinutes} minutos de atención
                  </span>
                )}
              </div>
              <span className="font-semibold text-foreground text-sm whitespace-nowrap">
                {selectedService ? formatCurrency(selectedService.price, currency) : "---"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-subtle">
              <div>
                <span className="text-dim block text-[10px] uppercase font-semibold tracking-wider">
                  Profesional
                </span>
                <span className="font-semibold text-foreground">
                  {selectedStaff?.displayName || "Cualquiera"}
                </span>
              </div>
              {selectedStaff?.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedStaff.avatarUrl}
                  alt={selectedStaff.displayName}
                  className="w-8 h-8 rounded-full object-cover border"
                  style={{ borderColor: selectedStaff.colorCode }}
                />
              )}
            </div>

            <div className="pt-3 border-t border-border-subtle">
              <span className="text-dim block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Horario Programado
              </span>
              {selectedTime ? (
                <div className="flex items-center gap-2 text-accent-warm font-mono text-xs font-semibold bg-accent-soft px-3 py-1.5 rounded-[3px] border border-accent/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {selectedDate} a las {selectedTime} hrs
                  </span>
                </div>
              ) : (
                <span className="text-dim italic">Pendiente de selección</span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted text-xs block">Total a pagar</span>
                <span className="text-[10px] text-dim">En sucursal al finalizar</span>
              </div>
              <span className="text-2xl font-semibold text-accent-warm font-display">
                {selectedService ? formatCurrency(selectedService.price, currency) : "$0.00"}
              </span>
            </div>

            <div className="p-3 bg-base rounded-[3px] border border-border-subtle text-[11px] text-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
              <span>Reserva garantizada. Sin cargos de cancelación anticipada.</span>
            </div>

            {step < 4 && (
              <Button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep(step + 1)}
                className="w-full"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Siguiente Paso
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Barra sticky inferior móvil */}
      {step < 4 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-base/95 backdrop-blur-xl border-t border-border z-50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-dim block uppercase font-semibold tracking-wider">
              Total estimado
            </span>
            <span className="text-lg font-semibold text-accent-warm font-display leading-none">
              {selectedService ? formatCurrency(selectedService.price, currency) : "$0.00"}
            </span>
          </div>

          <Button
            type="button"
            disabled={!canProceed}
            onClick={() => setStep(step + 1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
