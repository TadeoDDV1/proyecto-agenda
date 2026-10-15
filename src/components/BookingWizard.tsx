"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { createBooking, getAvailableSlotsAction } from "@/app/actions/booking";
import { 
  Scissors, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Phone,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  ChevronRight
} from "lucide-react";

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
}

interface BookingWizardProps {
  tenantSlug: string;
  tenantName?: string;
  currency: string;
  services: ServiceItem[];
  staffMembers: StaffItem[];
}

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
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffMembers[0]?.id || "");
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

  // Slots dinámicos
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedStaff = staffMembers.find((st) => st.id === selectedStaffId);

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
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("es-ES", { month: "short" });
    return { dateStr, dayName: dayName.toUpperCase(), dayNum, monthName: monthName.toUpperCase() };
  });

  // Consultar disponibilidad en tiempo real
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

  // Comprobar si puede avanzar de paso
  const canProceed =
    (step === 1 && selectedServiceId) ||
    (step === 2 && selectedStaffId) ||
    (step === 3 && selectedDate && selectedTime) ||
    (step === 4 && customerName && customerPhone);

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* COLUMNA IZQUIERDA: EL ASISTENTE (WIZARD) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Barra de progreso / Stepper Dark Luxe */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {[
              { num: 1, label: "Servicio" },
              { num: 2, label: "Especialista" },
              { num: 3, label: "Horario" },
              { num: 4, label: "Confirmar" },
            ].map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={s.num > step}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-amber-500/10 border border-amber-500/40 text-amber-400 shadow-sm"
                      : isPast
                      ? "text-zinc-300 hover:text-white"
                      : "text-zinc-600 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                      isActive
                        ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                        : isPast
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL DEL PASO ACTUAL */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PASO 1: SELECCIÓN DE SERVICIO */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">1. Selecciona tu Servicio</h3>
                  <span className="text-xs text-zinc-400 font-medium">Paso 1 de 4</span>
                </div>
                <p className="text-xs text-zinc-400">Elige el corte o experiencia que deseas agendar.</p>
              </div>

              {/* Filtro de Categorías en Píldoras Horizontales */}
              {categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                      selectedCategory === "ALL"
                        ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Todos los servicios
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid de Servicios Dark Luxe */}
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredServices.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-900 border-amber-500/60 shadow-lg shadow-amber-500/10"
                          : "bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-905"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">
                          {srv.categoryName}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-400 transition pr-6">
                          {srv.name}
                        </h4>
                        {srv.description && (
                          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-zinc-850 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{srv.durationMinutes} min</span>
                        </div>
                        <span className="text-amber-400 font-black text-base">
                          {formatCurrency(srv.price, currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: SELECCIÓN DE ESPECIALISTA */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">2. Elige a tu Profesional</h3>
                  <span className="text-xs text-zinc-400 font-medium">Paso 2 de 4</span>
                </div>
                <p className="text-xs text-zinc-400">¿Quién te gustaría que realice tu servicio?</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {staffMembers.map((staff) => {
                  const isSelected = selectedStaffId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`text-center p-6 rounded-2xl border transition-all flex flex-col items-center relative group ${
                        isSelected
                          ? "bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-900 border-amber-500/60 shadow-lg shadow-amber-500/10"
                          : "bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-905"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="relative mb-3.5">
                        <div
                          className="w-20 h-20 rounded-full overflow-hidden border-2 shadow-xl bg-zinc-900 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ borderColor: staff.colorCode }}
                        >
                          {staff.avatarUrl ? (
                            <img
                              src={staff.avatarUrl}
                              alt={staff.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-zinc-500" />
                          )}
                        </div>
                        <span
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-zinc-950"
                          style={{ backgroundColor: staff.colorCode }}
                        />
                      </div>

                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition">
                        {staff.displayName}
                      </h4>
                      <span className="text-[11px] text-zinc-400 mt-1 font-medium">
                        Especialista Certificado
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!selectedStaffId}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: FECHA Y HORA CON DISPONIBILIDAD REAL */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">3. Fecha y Horario</h3>
                  <span className="text-xs text-zinc-400 font-medium">Paso 3 de 4</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Horarios calculados en tiempo real para <strong>{selectedStaff?.displayName}</strong>.
                </p>
              </div>

              {/* Carrusel Deslizable de Días (Dark Luxe) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Selecciona la Fecha
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {upcomingDays.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[76px] py-3.5 px-3 rounded-2xl border transition-all text-center flex-shrink-0 ${
                          isSelected
                            ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]"
                            : "bg-zinc-950/70 text-zinc-300 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900"
                        }`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-zinc-950" : "text-zinc-500"}`}>
                          {d.dayName}
                        </span>
                        <span className="text-xl font-black my-1">{d.dayNum}</span>
                        <span className={`text-[9px] font-semibold ${isSelected ? "text-zinc-950" : "text-zinc-400"}`}>
                          {d.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horarios Disponibles */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Turnos Disponibles
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Duración: {selectedService?.durationMinutes} min
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3 bg-zinc-950/50 rounded-2xl border border-zinc-850">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                    <span className="text-xs font-medium">Consultando espacios libres en la agenda...</span>
                  </div>
                ) : slotsMessage && availableSlots.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
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
                          className={`py-3 px-2 rounded-xl border text-xs font-mono font-bold transition ${
                            isSelected
                              ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                              : "bg-zinc-950/70 text-zinc-300 border-zinc-850 hover:border-amber-400/40 hover:bg-zinc-900"
                          }`}
                        >
                          {time} hrs
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: FORMULARIO DE CONFIRMACIÓN */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">4. Datos de Contacto</h3>
                  <span className="text-xs text-zinc-400 font-medium">Paso 4 de 4</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Indícanos a qué nombre y WhatsApp confirmaremos tu reservación.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 55 1234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico (opcional)
                </label>
                <input
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Notas adicionales para el especialista
                </label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de corte, productos alérgicos, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-xl shadow-amber-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar y Asegurar Cita"}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* PASO 5: TICKET DE CONFIRMACIÓN FINAL */}
          {step === 5 && confirmedBooking && (
            <div className="py-6 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-300 text-zinc-950 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">¡Tu cita está asegurada!</h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                  Hemos registrado tu reserva con éxito. Te esperamos puntualmente en sucursal.
                </p>
              </div>

              {/* Recibo Estilizado Dark Luxe */}
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-3 relative overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-850">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider">Negocio</span>
                  <span className="font-bold text-white text-sm">{tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Servicio:</span>
                  <span className="font-bold text-zinc-100">{confirmedBooking.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Atendido por:</span>
                  <span className="font-bold text-zinc-100">{confirmedBooking.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cliente:</span>
                  <span className="font-bold text-zinc-100">{confirmedBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Horario:</span>
                  <span className="font-bold text-amber-400">
                    {new Date(confirmedBooking.startTime).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-zinc-850 text-base font-black">
                  <span className="text-zinc-300">Total en sucursal:</span>
                  <span className="text-amber-400">{formatCurrency(confirmedBooking.totalPrice, currency)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSelectedTime("");
                    setNotes("");
                    setConfirmedBooking(null);
                  }}
                  className="px-6 py-3 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition"
                >
                  Agendar otra cita
                </button>
                <a
                  href="/admin"
                  className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition border border-zinc-700"
                >
                  Ver en Panel de Administración
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA (DESKTOP): RECIBO DE RESERVA EN VIVO (LIVE TICKET) */}
      <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-5">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Header del Ticket */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                Resumen de Cita
              </span>
              <h4 className="font-bold text-white text-base leading-tight mt-0.5">Tu Reservación</h4>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Desglose en Vivo */}
          <div className="py-4 space-y-4 text-xs">
            {/* Servicio seleccionado */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Servicio</span>
                <span className="font-bold text-zinc-100 text-sm">{selectedService?.name || "Sin seleccionar"}</span>
                {selectedService && (
                  <span className="text-zinc-400 block text-[11px] mt-0.5 font-mono">
                    {selectedService.durationMinutes} minutos de atención
                  </span>
                )}
              </div>
              <span className="font-bold text-zinc-200 text-sm whitespace-nowrap">
                {selectedService ? formatCurrency(selectedService.price, currency) : "---"}
              </span>
            </div>

            {/* Profesional seleccionado */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-850">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Profesional</span>
                <span className="font-bold text-zinc-200">{selectedStaff?.displayName || "Cualquiera"}</span>
              </div>
              {selectedStaff?.avatarUrl && (
                <img
                  src={selectedStaff.avatarUrl}
                  alt={selectedStaff.displayName}
                  className="w-8 h-8 rounded-full object-cover border"
                  style={{ borderColor: selectedStaff.colorCode }}
                />
              )}
            </div>

            {/* Fecha y hora */}
            <div className="pt-3 border-t border-zinc-850">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold mb-1">Horario Programado</span>
              {selectedTime ? (
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedDate} a las {selectedTime} hrs</span>
                </div>
              ) : (
                <span className="text-zinc-500 italic">Pendiente de selección</span>
              )}
            </div>
          </div>

          {/* Total & Garantía */}
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-400 text-xs block">Total a pagar</span>
                <span className="text-[10px] text-zinc-500">En sucursal al finalizar</span>
              </div>
              <span className="text-2xl font-black text-amber-400">
                {selectedService ? formatCurrency(selectedService.price, currency) : "$0.00"}
              </span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Reserva garantizada. Sin cargos de cancelación anticipada.</span>
            </div>

            {step < 5 && (
              <button
                type="button"
                disabled={!canProceed}
                onClick={() => {
                  if (step < 4) setStep(step + 1);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-xl shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{step === 4 ? "Listo para confirmar" : "Siguiente Paso"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BARRA STICKY INFERIOR PARA MÓVILES */}
      {step < 5 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Total estimado</span>
            <span className="text-lg font-black text-amber-400 leading-none">
              {selectedService ? formatCurrency(selectedService.price, currency) : "$0.00"}
            </span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={() => {
              if (step < 4) setStep(step + 1);
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>{step === 4 ? "Revisar y enviar" : "Continuar"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
