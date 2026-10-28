/**
 * Punto de entrada del dominio de reservas.
 *
 * Regla de arquitectura: la web, el admin y el bot importan desde acá. Ningún
 * adaptador reimplementa disponibilidad, validación ni creación de citas.
 */

export type {
  AppointmentSummary,
  AvailabilityStaff,
  BookingErrorCode,
  BookingResult,
  BookingSource,
  CreateAppointmentInput,
  DayAvailability,
  Slot,
  UpcomingDay,
} from "./types";

export {
  BOOKABLE_STATUSES,
  buildDaySlots,
  getAlternativeSlots,
  getDayAvailability,
  getUpcomingAvailability,
  isDayClosed,
} from "./availability";

export { createAppointment } from "./create";
export { cancelAppointment, isLateCancellation, rescheduleAppointment } from "./manage";
export { formatDateKeyInZone, formatTimeInZone, zonedToUtc } from "./time";
export { normalizePhone, whatsappUrl } from "./phone";
export { toAppointmentSummary } from "./mapper";
