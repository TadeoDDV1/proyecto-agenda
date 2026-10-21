import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
