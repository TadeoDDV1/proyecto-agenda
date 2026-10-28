/**
 * Normalización de teléfonos a E.164.
 *
 * Sin esto, el mismo cliente entra como "+52 55 1234 5678", "5512345678" y
 * "5215512345678" y no se puede reconocer cuando vuelve (ni unificar con el
 * `wa_id` de WhatsApp, que llega sin "+").
 *
 * Regla conservadora: si el número no se puede interpretar con seguridad, se
 * rechaza en vez de guardar un formato ambiguo.
 */

export const MX_COUNTRY_CODE = "52";

function normalizeMxDigits(digits: string): string | null {
  // México: 10 dígitos nacionales. Algunos formatos heredados agregan "1"
  // después del 52 (521 + 10 dígitos), que ya no se usa para WhatsApp.
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith(MX_COUNTRY_CODE)) {
    return digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith("521")) {
    // 521 + 10 dígitos (formato heredado de WhatsApp México)
    return digits.slice(3);
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    // 1 + 10 dígitos (formato US-style pegado por error)
    return digits.slice(1);
  }
  return null;
}

/**
 * Devuelve el teléfono en E.164 (`+525512345678`) o `null` si no es válido.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountry: "MX" = "MX"
): string | null {
  if (!raw) return null;

  const value = raw.trim();
  if (!value) return null;

  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (defaultCountry === "MX") {
    const national = normalizeMxDigits(digits);
    if (national) return `+${MX_COUNTRY_CODE}${national}`;
  }

  // Número internacional explícito: 8–15 dígitos (E.164).
  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  // Sin "+", fuera de México: solo aceptamos algo que ya parezca internacional.
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/** "+525512345678" → "+52 55 1234 5678" (solo para mostrar). */
export function formatPhoneForDisplay(phone: string): string {
  const match = /^\+52(\d{10})$/.exec(phone);
  if (!match) return phone;
  const [, national] = match;
  return `+52 ${national.slice(0, 2)} ${national.slice(2, 6)} ${national.slice(6)}`;
}

/**
 * Enlace `wa.me`. El número debe estar ya en E.164; si no, devuelve `null`
 * para que la UI oculte el botón en lugar de mostrar un enlace roto.
 */
export function whatsappUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const digits = normalized.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
