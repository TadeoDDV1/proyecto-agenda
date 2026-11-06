/** Constantes de configuración de negocios.
 *  Este módulo NO importa nada de servidor (next/headers), por lo que puede
 *  usarse tanto en componentes de cliente como en acciones del servidor.
 */

export const FEATURE_KEYS = [
  "whatsappBot",
  "publicBooking",
  "bitacoras",
  "reportes",
  "multiSucursal",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  whatsappBot: "Chatbot de WhatsApp",
  publicBooking: "Portal público de reservas",
  bitacoras: "Bitácoras e historial de clientes",
  reportes: "Reportes y exportación",
  multiSucursal: "Múltiples sucursales",
};

export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  whatsappBot: false,
  publicBooking: true,
  bitacoras: true,
  reportes: false,
  multiSucursal: false,
};

export const PLANS = ["BASIC", "PRO", "ENTERPRISE"] as const;
export type Plan = (typeof PLANS)[number];

/** Normaliza el JSON de features guardado en la base. */
export function parseFeatures(raw: unknown): Record<FeatureKey, boolean> {
  const base = { ...DEFAULT_FEATURES };
  if (raw && typeof raw === "object") {
    for (const k of FEATURE_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "boolean") base[k] = v;
    }
  }
  return base;
}
