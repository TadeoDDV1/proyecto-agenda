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
