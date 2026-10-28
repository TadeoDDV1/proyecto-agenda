/**
 * Tipos del dominio de reservas.
 *
 * Esta carpeta no importa nada de Next.js: la usan la web, el admin y (más
 * adelante) el bot de WhatsApp. Sin `"use server"`, sin `revalidatePath`.
 */

export type BookingSource = "WEB" | "WHATSAPP" | "ADMIN" | "WALK_IN";

export type BookingErrorCode =
  | "INVALID_INPUT"
  | "INVALID_PHONE"
  | "TENANT_NOT_FOUND"
  | "INVALID_SERVICE"
  | "INVALID_STAFF"
  | "STAFF_NOT_AVAILABLE"
  | "OUTSIDE_HOURS"
  | "DAY_OFF"
  | "BREAK"
  | "PAST"
  | "LEAD_TIME"
  | "WINDOW_CLOSED"
  | "SLOT_TAKEN"
  | "NOT_FOUND"
  | "UNKNOWN";

export interface Slot {
  /** "HH:mm" en la zona horaria del tenant. */
  time: string;
  staffId: string;
  staffName: string;
}

export interface DayAvailability {
  /** "YYYY-MM-DD" en la zona horaria del tenant. */
  dateKey: string;
  timezone: string;
  /** `true` cuando ningún profesional trabaja ese día. */
  isClosed: boolean;
  slots: Slot[];
}

export interface UpcomingDay {
  dateKey: string;
  isClosed: boolean;
  /** Cantidad de huecos disponibles. */
  count: number;
  /** Primer hueco del día, útil para el resumen. */
  firstSlot: string | null;
}

export interface AppointmentSummary {
  id: string;
  confirmationCode: string | null;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  customerId: string;
  customerName: string;
  /** ISO 8601 en UTC. */
  startTime: string;
  endTime: string;
  /** "YYYY-MM-DD" en la zona del tenant. */
  localDate: string;
  /** "HH:mm" en la zona del tenant. */
  localTime: string;
  timezone: string;
  totalPrice: number;
  status: string;
  source: BookingSource;
}

export type BookingResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: BookingErrorCode;
      message: string;
      /** Alternativas cuando el horario pedido se ocupó. */
      alternatives?: Slot[];
    };

export interface CreateAppointmentInput {
  tenantId: string;
  serviceId: string;
  /** `undefined` = "cualquiera" (se elige un profesional libre). */
  staffId?: string;
  dateKey: string;
  time: string;
  customer: {
    fullName: string;
    /** Se normaliza a E.164 antes de guardar. */
    phone: string;
    email?: string | null;
  };
  notes?: string | null;
  source: BookingSource;
  idempotencyKey?: string;
}

/** Profesional con lo mínimo para calcular disponibilidad (testeable). */
export interface AvailabilityStaff {
  id: string;
  displayName: string;
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    hasBreak: boolean;
    breakStart: string | null;
    breakEnd: string | null;
    isWorkingDay: boolean;
  }>;
  appointments: Array<{ startTime: Date; endTime: Date }>;
}
