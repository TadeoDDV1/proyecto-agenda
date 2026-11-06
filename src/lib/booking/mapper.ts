import type { AppointmentSummary, BookingSource } from "./types";
import { formatDateKeyInZone, formatTimeInZone } from "./time";

/** Forma mínima de una cita con sus relaciones, para serializar. */
export interface AppointmentWithRelations {
  id: string;
  confirmationCode: string | null;
  serviceId: string;
  staffId: string;
  customerId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: unknown;
  status: string;
  source: string;
  service: { name: string };
  staff: { displayName: string };
  customer: { fullName: string };
}

export function toAppointmentSummary(
  appointment: AppointmentWithRelations,
  timeZone: string
): AppointmentSummary {
  return {
    id: appointment.id,
    confirmationCode: appointment.confirmationCode,
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    staffId: appointment.staffId,
    staffName: appointment.staff.displayName,
    customerId: appointment.customerId,
    customerName: appointment.customer.fullName,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    localDate: formatDateKeyInZone(appointment.startTime, timeZone),
    localTime: formatTimeInZone(appointment.startTime, timeZone),
    timezone: timeZone,
    totalPrice: Number(appointment.totalPrice),
    status: appointment.status,
    source: appointment.source as BookingSource,
  };
}
