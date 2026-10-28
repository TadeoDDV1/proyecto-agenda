import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Devuelve la fecha en formato "YYYY-MM-DD" usando la zona horaria local.
 * Evita el desfase de `toISOString()`, que convierte a UTC y puede devolver
 * el día siguiente en zonas horarias negativas (p. ej. México).
 */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Suma (o resta) días a una fecha local "YYYY-MM-DD" sin desfase de zona. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Interpreta una fecha "YYYY-MM-DD" como medianoche local. */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatCurrency(
  amount: number | string | { toString(): string },
  currency = "USD"
) {
  const numeric = typeof amount === "number" ? amount : parseFloat(amount.toString());
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(numeric);
}

/**
 * Genera un enlace de WhatsApp (wa.me) con mensaje pre-redactado.
 * Normaliza el teléfono y agrega el prefijo de México (521) cuando es un
 * número local de 10 dígitos.
 */
export function getWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone =
    cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
