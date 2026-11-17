/**
 * Copy y formato del bot (es-MX).
 *
 * Reglas: una idea por mensaje, máximo un emoji, `*negrita*` de WhatsApp y
 * nunca prometer disponibilidad sin consultar la base.
 */

import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { formatDateKeyInZone } from "@/lib/booking";
import type { DayChoice, SlotChoice } from "./types";

export const GREETING = (tenantName: string, botName?: string | null) =>
  `¡Hola! Soy *${botName?.trim() || `el asistente de ${tenantName}`}*.`;

export function menuText(): string {
  return [
    "¿Qué te gustaría hacer?",
    "",
    "1. Reservar una cita",
    "2. Ver mis próximas citas",
    "3. Información y horarios",
    "",
    "Responde con el número de la opción.",
  ].join("\n");
}

export function dayLabel(dateKey: string, timezone: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const todayKey = formatDateKeyInZone(new Date(), timezone);
  const tomorrowKey = formatDateKeyInZone(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
    timezone
  );
  const formatted = formatInTimeZone(date, timezone, "EEE d MMM", {
    locale: es,
  });

  if (dateKey === todayKey) return `Hoy · ${formatted}`;
  if (dateKey === tomorrowKey) return `Mañana · ${formatted}`;

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function dayOptions(days: DayChoice[]): string {
  return days
    .map((day, index) => `${index + 1}. ${day.label} (${day.count})`)
    .join("\n");
}

export function slotOptions(
  slots: SlotChoice[],
  options: { showStaff: boolean; hasMore: boolean }
): string {
  const lines = slots.map((slot, index) => {
    const staff = options.showStaff ? ` · ${slot.staffName}` : "";
    return `${index + 1}. ${slot.time}${staff}`;
  });

  if (options.hasMore) lines.push("9. Ver más horarios");

  return lines.join("\n");
}

export function serviceOptions(
  services: Array<{ name: string; durationMinutes: number; price: number }>,
  currency: string
): string {
  return services
    .map(
      (service, index) =>
        `${index + 1}. ${service.name} · ${service.durationMinutes} min · ${formatMoney(
          service.price,
          currency
        )}`
    )
    .join("\n");
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatAppointmentDate(
  localDate: string,
  localTime: string,
  timezone: string
): string {
  return `${dayLabel(localDate, timezone)} · ${localTime}`;
}

export function infoText(input: {
  tenantName: string;
  address?: string | null;
  phone?: string | null;
  todayHours?: string | null;
}): string {
  const lines = [`*${input.tenantName}*`];

  if (input.address) lines.push(`Dirección: ${input.address}`);
  if (input.phone) lines.push(`Teléfono: ${input.phone}`);
  if (input.todayHours) lines.push(`Hoy: ${input.todayHours}`);

  lines.push("");
  lines.push("Escribe *menú* para volver al inicio.");

  return lines.join("\n");
}

export function confirmationText(input: {
  code: string | null;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  time: string;
  price: number;
  currency: string;
  address?: string | null;
}): string {
  const lines = [
    "✅ *Cita confirmada*",
    "",
    input.code ? `*Código:* ${input.code}` : null,
    `*Servicio:* ${input.serviceName}`,
    `*Profesional:* ${input.staffName}`,
    `*Cuándo:* ${input.dateLabel} · ${input.time}`,
    `*Precio:* ${formatMoney(input.price, input.currency)}`,
    input.address ? `*Dónde:* ${input.address}` : null,
    "",
    "Te esperamos. Si necesitas cancelar, escribe *mis citas*.",
  ];

  return lines.filter((line) => line !== null).join("\n");
}
