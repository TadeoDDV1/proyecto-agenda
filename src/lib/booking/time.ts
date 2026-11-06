/**
 * Conversión entre la hora local del tenant y los instantes UTC que guarda la
 * base de datos.
 *
 * Regla: la BD guarda UTC (`timestamptz`); todo lo que ve el usuario está en
 * `Tenant.timezone`. Nunca usar `new Date(year, month - 1, ...)`: eso toma la
 * zona del servidor (en Vercel, UTC).
 */

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** "YYYY-MM-DD" + "HH:mm" en la zona del tenant → instante UTC. */
export function zonedToUtc(dateKey: string, time: string, timeZone: string): Date {
  return fromZonedTime(`${dateKey}T${time}:00`, timeZone);
}

/** Instante UTC → "HH:mm" en la zona del tenant. */
export function formatTimeInZone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "HH:mm");
}

/** Instante UTC → "YYYY-MM-DD" en la zona del tenant. */
export function formatDateKeyInZone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

/** Día de la semana (0 = domingo) de una fecha de calendario, sin TZ. */
export function dayOfWeekFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Suma días a "YYYY-MM-DD" sin pasar por zonas horarias. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Rango UTC que cubre el día local completo.
 *
 * Usa medianoche local → medianoche local del día siguiente, así los días con
 * cambio de horario (23 o 25 horas) quedan bien.
 */
export function dayRangeUtc(dateKey: string, timeZone: string) {
  return {
    start: zonedToUtc(dateKey, "00:00", timeZone),
    end: zonedToUtc(addDaysToDateKey(dateKey, 1), "00:00", timeZone),
  };
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
