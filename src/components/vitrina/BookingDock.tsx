"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import {
  createBooking,
  getAvailableSlotsAction,
  getUpcomingAvailabilityAction,
} from "@/app/actions/booking";
import { formatCurrency } from "@/lib/utils";
import type { AppointmentSummary } from "@/lib/booking/types";
import styles from "./vitrina.module.css";
import {
  VITRINA_BOOK_EVENT,
  type BookingEventDetail,
} from "./BookingTrigger";
import type { BookingTenant, PublicDay, PublicService, PublicStaff } from "./types";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function dayLabel(dateKey: string, todayKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  if (dateKey === todayKey) return `Hoy · ${weekday} ${day}`;
  return `${weekday} ${day} ${MONTHS[month - 1]}`;
}

function longDate(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} de ${MONTHS[month - 1]} de ${year}`;
}

type Step = 1 | 2 | 3 | 4;

export function BookingDock({
  tenant,
  services,
  staff,
  todayKey,
}: {
  tenant: BookingTenant;
  services: PublicService[];
  staff: PublicStaff[];
  todayKey: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffChoice, setStaffChoice] = useState("any");
  const [dateKey, setDateKey] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState<PublicDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsStaff, setSlotsStaff] = useState<Record<string, string>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AppointmentSummary | null>(null);

  const selectedService = services.find((item) => item.id === serviceId) ?? services[0];
  const eligibleStaff = staff.filter((member) =>
    member.serviceIds.includes(serviceId)
  );
  const selectedStaff =
    staffChoice === "any"
      ? null
      : eligibleStaff.find((member) => member.id === staffChoice) ?? null;

  // Si el cliente eligió "cualquiera", el motor asigna un profesional al
  // horario. Mostramos ese nombre en vez de un genérico.
  const assignedStaff =
    time && slotsStaff[time]
      ? staff.find((member) => member.id === slotsStaff[time]) ?? null
      : null;
  const displayStaff = selectedStaff ?? assignedStaff;

  const dateKeyRef = useRef("");
  const daysRequest = useRef(0);
  const slotsRequest = useRef(0);

  const pickDate = useCallback((next: string) => {
    dateKeyRef.current = next;
    setDateKey(next);
  }, []);

  const loadSlots = useCallback(
    async (svcId: string, staffId: string, day: string) => {
      if (!svcId || !day) return;

      const request = ++slotsRequest.current;
      setLoadingSlots(true);

      const response = await getAvailableSlotsAction({
        tenantSlug: tenant.slug,
        serviceId: svcId,
        staffId: staffId === "any" ? "" : staffId,
        dateStr: day,
      });

      if (request !== slotsRequest.current) return;
      setLoadingSlots(false);

      if (!response.success) {
        setSlots([]);
        setSlotsStaff({});
        setError(response.error ?? "No se pudo consultar la disponibilidad.");
        return;
      }

      setSlots(response.slots);
      setSlotsStaff(response.staffBySlot ?? {});
      setTime((current) => (response.slots.includes(current) ? current : ""));
    },
    [tenant.slug]
  );

  const loadDays = useCallback(
    async (svcId: string, staffId: string) => {
      if (!svcId) return;

      const request = ++daysRequest.current;
      setLoadingDays(true);

      const response = await getUpcomingAvailabilityAction({
        tenantSlug: tenant.slug,
        serviceId: svcId,
        staffId: staffId === "any" ? undefined : staffId,
        days: 7,
      });

      if (request !== daysRequest.current) return;
      setLoadingDays(false);

      if (!response.success) {
        setDays([]);
        setError(response.error ?? "No se pudo consultar la disponibilidad.");
        return;
      }

      const nextDays: PublicDay[] = response.days.map((day) => ({
        dateKey: day.dateKey,
        isClosed: day.isClosed,
        count: day.count,
        firstSlot: day.firstSlot,
      }));
      setDays(nextDays);

      const current = dateKeyRef.current;
      const next =
        current && nextDays.some((day) => day.dateKey === current && day.count > 0)
          ? current
          : nextDays.find((day) => day.count > 0)?.dateKey ??
            nextDays[0]?.dateKey ??
            "";

      pickDate(next);
      await loadSlots(svcId, staffId, next);
    },
    [tenant.slug, pickDate, loadSlots]
  );

  const resetForNewBooking = useCallback(() => {
    setResult(null);
    setError(null);
    setTime("");
  }, []);

  const openAt = useCallback(
    (nextStep: Step) => {
      resetForNewBooking();
      setStep(nextStep);
      setOpen(true);
      void loadDays(serviceId, staffChoice);
    },
    [resetForNewBooking, loadDays, serviceId, staffChoice]
  );

  const close = useCallback(() => {
    setOpen(false);
    setResult(null);
    setError(null);
  }, []);

  // Las tarjetas de servicio y equipo abren el sheet con su contexto.
  useEffect(() => {
    function handleBook(event: Event) {
      const detail = (event as CustomEvent<BookingEventDetail>).detail ?? {};
      const nextService = detail.serviceId ?? serviceId;

      let nextStaff = detail.staffId ?? "any";
      const eligible = staff.some(
        (member) =>
          member.id === nextStaff && member.serviceIds.includes(nextService)
      );
      if (!eligible) nextStaff = "any";

      setServiceId(nextService);
      setStaffChoice(nextStaff);
      resetForNewBooking();
      setStep(detail.staffId ? 3 : detail.serviceId ? 2 : 1);
      setOpen(true);
      void loadDays(nextService, nextStaff);
    }

    window.addEventListener(VITRINA_BOOK_EVENT, handleBook);
    return () => window.removeEventListener(VITRINA_BOOK_EVENT, handleBook);
  }, [resetForNewBooking, loadDays, serviceId, staff]);

  // Bloqueo de scroll y cierre con Escape.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      setError("Necesitamos tu nombre y un teléfono de contacto.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await createBooking({
      tenantSlug: tenant.slug,
      serviceId,
      staffId: staffChoice === "any" ? "" : staffChoice,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      dateStr: dateKey,
      timeStr: time,
      notes: notes || undefined,
    });

    setSubmitting(false);

    if (response.success) {
      setResult(response.appointment);
      setTime("");
      return;
    }

    setError(response.error);
    if (response.alternatives?.length) {
      setSlots(response.alternatives.map((slot) => slot.time));
      setSlotsStaff(
        Object.fromEntries(
          response.alternatives.map((slot) => [slot.time, slot.staffId])
        )
      );
    }
  }

  const canContinue =
    (step === 1 && Boolean(serviceId)) ||
    (step === 2 && Boolean(staffChoice)) ||
    (step === 3 && Boolean(time)) ||
    step === 4;

  return (
    <>
      <div className={styles.dock}>
        <div className={`${styles.shell} ${styles.dockInner}`}>
          <button
            type="button"
            className={styles.dockField}
            onClick={() => openAt(1)}
          >
            <span className={styles.dockLabel}>Servicio</span>
            <span className={styles.dockValue}>
              {selectedService?.name ?? "Elegí un servicio"}
            </span>
          </button>

          <button
            type="button"
            className={styles.dockField}
            onClick={() => openAt(3)}
          >
            <span className={styles.dockLabel}>Fecha</span>
            <span className={styles.dockValue}>
              {dateKey ? dayLabel(dateKey, todayKey) : "Elegí fecha"}
            </span>
          </button>

          <button
            type="button"
            className={styles.dockField}
            onClick={() => openAt(3)}
          >
            <span className={styles.dockLabel}>Hora</span>
            <span className={styles.dockValue}>{time || "Elegí hora"}</span>
          </button>

          <button
            type="button"
            className={styles.dockCta}
            onClick={() => openAt(1)}
          >
            Reservar
          </button>
        </div>
      </div>

      {open && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vitrina-sheet-title"
          >
            <div className={styles.sheetHead}>
              <div>
                <p className={styles.sheetKicker}>
                  {result ? "Reserva confirmada" : "Reservar en " + tenant.name}
                </p>
                <h2 id="vitrina-sheet-title" className={styles.sheetTitle}>
                  {result
                    ? "Nos vemos pronto"
                    : step === 1
                      ? "Elegí tu servicio"
                      : step === 2
                        ? "¿Con quién?"
                        : step === 3
                          ? "Fecha y hora"
                          : "Tus datos"}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                onClick={close}
                aria-label="Cerrar reserva"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.sheetBody}>
              {!result && (
                <div className={styles.steps} aria-hidden="true">
                  {[1, 2, 3, 4].map((value) => (
                    <span
                      key={value}
                      className={`${styles.stepDot} ${
                        value <= step ? styles.stepDotActive : ""
                      }`}
                    />
                  ))}
                </div>
              )}

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              {result ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>
                    <Check size={30} />
                  </div>
                  <h3 className={styles.successTitle}>Cita confirmada</h3>
                  <p className={styles.successText}>
                    Te esperamos en {tenant.name}. Guardá este código para
                    identificarte en el salón.
                  </p>
                  <span className={styles.code}>{result.confirmationCode}</span>

                  <div className={styles.ticket}>
                    <div className={styles.summaryRow}>
                      <span>Servicio</span>
                      <span>{result.serviceName}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Profesional</span>
                      <span>{result.staffName}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Fecha</span>
                      <span>{longDate(result.localDate)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Hora</span>
                      <span>{result.localTime} h</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                      <span>Total en el salón</span>
                      <span>{formatCurrency(result.totalPrice, tenant.currency)}</span>
                    </div>
                  </div>
                </div>
              ) : step === 1 ? (
                <div>
                  <p className={styles.stepLabel}>Servicios disponibles</p>
                  <div className={styles.optionList}>
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        className={`${styles.option} ${
                          service.id === serviceId ? styles.optionSelected : ""
                        }`}
                        onClick={() => {
                          const nextStaff =
                            staffChoice !== "any" &&
                            !service.staffIds.includes(staffChoice)
                              ? "any"
                              : staffChoice;
                          setServiceId(service.id);
                          setStaffChoice(nextStaff);
                          setTime("");
                          setStep(2);
                          void loadDays(service.id, nextStaff);
                        }}
                      >
                        <span className={styles.optionMain}>
                          <span className={styles.optionName}>{service.name}</span>
                          <span className={styles.optionMeta}>
                            {service.categoryName} · {service.durationMinutes} min
                          </span>
                        </span>
                        <span className={styles.optionPrice}>
                          {formatCurrency(service.price, tenant.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === 2 ? (
                <div>
                  <p className={styles.stepLabel}>
                    {selectedService?.name ?? "Servicio"}
                  </p>
                  <div className={styles.optionList}>
                    <button
                      type="button"
                      className={`${styles.option} ${
                        staffChoice === "any" ? styles.optionSelected : ""
                      }`}
                      onClick={() => {
                        setStaffChoice("any");
                        void loadDays(serviceId, "any");
                      }}
                    >
                      <span className={styles.optionMain}>
                        <span className={styles.optionName}>Cualquiera disponible</span>
                        <span className={styles.optionMeta}>
                          Te asignamos al primero con lugar
                        </span>
                      </span>
                      {staffChoice === "any" && <Check size={18} />}
                    </button>
                  </div>

                  <p className={styles.stepLabel} style={{ marginTop: 18 }}>
                    O elegí a alguien
                  </p>
                  <div className={styles.staffGrid}>
                    {eligibleStaff.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className={`${styles.staffCard} ${
                          staffChoice === member.id ? styles.optionSelected : ""
                        }`}
                        onClick={() => {
                          setStaffChoice(member.id);
                          void loadDays(serviceId, member.id);
                        }}
                      >
                        <span className={styles.staffAvatar}>
                          {member.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.avatarUrl} alt="" />
                          ) : (
                            member.displayName.charAt(0)
                          )}
                        </span>
                        <span>
                          <span className={styles.staffName}>{member.displayName}</span>
                          <span className={styles.staffRole}>
                            {member.specialties || "Especialista"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === 3 ? (
                <div>
                  <p className={styles.stepLabel}>Próximos 7 días</p>
                  <div className={styles.dayStrip}>
                    {loadingDays && days.length === 0 && (
                      <span className={styles.empty}>Consultando agenda…</span>
                    )}
                    {days.map((day) => (
                      <button
                        key={day.dateKey}
                        type="button"
                        disabled={day.count === 0}
                        aria-pressed={day.dateKey === dateKey}
                        className={`${styles.day} ${
                          day.dateKey === dateKey ? styles.daySelected : ""
                        }`}
                        onClick={() => {
                          pickDate(day.dateKey);
                          setTime("");
                          void loadSlots(serviceId, staffChoice, day.dateKey);
                        }}
                      >
                        <span className={styles.dayName}>
                          {WEEKDAYS[
                            new Date(
                              Date.UTC(
                                Number(day.dateKey.slice(0, 4)),
                                Number(day.dateKey.slice(5, 7)) - 1,
                                Number(day.dateKey.slice(8, 10))
                              )
                            ).getUTCDay()
                          ]}
                        </span>
                        <span className={styles.dayNum}>
                          {Number(day.dateKey.slice(8, 10))}
                        </span>
                        <span className={styles.dayCount}>
                          {day.isClosed ? "cerrado" : day.count > 0 ? `${day.count} libres` : "sin cupo"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className={styles.stepLabel}>
                    {dateKey ? longDate(dateKey) : "Elegí un día"}
                  </p>

                  {loadingSlots || loadingDays ? (
                    <p className={styles.empty}>Buscando horarios…</p>
                  ) : slots.length === 0 ? (
                    <p className={styles.empty}>
                      No quedan horarios para ese día. Probá con otra fecha.
                    </p>
                  ) : (
                    <div className={styles.slotGrid}>
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={slot === time}
                          className={`${styles.slot} ${
                            slot === time ? styles.slotSelected : ""
                          }`}
                          onClick={() => setTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className={styles.stepLabel} style={{ marginTop: 20 }}>
                    Profesional
                  </p>
                  <p className={styles.optionMeta}>
                    {displayStaff
                      ? `${displayStaff.displayName}${selectedStaff ? "" : " (asignado)"}`
                      : "Cualquiera disponible"}
                  </p>
                </div>
              ) : (
                <div>
                  <label className={styles.field}>
                    <span className={styles.label}>Nombre completo</span>
                    <input
                      className={styles.input}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Ej. Juan Pérez"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Teléfono / WhatsApp</span>
                    <input
                      className={styles.input}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+52 55 1234 5678"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Correo (opcional)</span>
                    <input
                      className={styles.input}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      type="email"
                      placeholder="tu@correo.com"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Notas (opcional)</span>
                    <textarea
                      className={`${styles.input} ${styles.textarea}`}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={3}
                      placeholder="Preferencias, alergias, referencias…"
                    />
                  </label>

                  <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                      <span>Servicio</span>
                      <span>{selectedService?.name}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Profesional</span>
                      <span>{displayStaff?.displayName ?? "Cualquiera disponible"}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Fecha</span>
                      <span>{dateKey ? longDate(dateKey) : "—"}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Hora</span>
                      <span>{time ? `${time} h` : "—"}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Duración</span>
                      <span>
                        {selectedService ? `${selectedService.durationMinutes} min` : "—"}
                      </span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                      <span>Total</span>
                      <span>
                        {selectedService
                          ? formatCurrency(selectedService.price, tenant.currency)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sheetFoot}>
              {result ? (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={close}
                  style={{ width: "100%" }}
                >
                  Listo
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.back}
                    onClick={() => {
                      setError(null);
                      setStep((current) => (current > 1 ? ((current - 1) as Step) : 1));
                    }}
                    disabled={step === 1}
                    style={{ visibility: step === 1 ? "hidden" : "visible" }}
                  >
                    <ArrowLeft size={15} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Atrás
                  </button>

                  {step < 4 ? (
                    <button
                      type="button"
                      className={styles.primary}
                      disabled={!canContinue}
                      onClick={() => setStep((current) => (current + 1) as Step)}
                    >
                      Continuar
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.primary}
                      disabled={submitting}
                      onClick={submit}
                    >
                      {submitting ? "Confirmando…" : "Confirmar cita"}
                      {!submitting && <Check size={16} />}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
