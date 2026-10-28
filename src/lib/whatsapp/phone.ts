/**
 * Normalización de identificadores de WhatsApp.
 *
 * Baileys entrega JIDs (`5215512345678@s.whatsapp.net`) y México arrastra el
 * prefijo heredado `1`. Todo el bot habla E.164 (`+525512345678`) para que el
 * cliente que vuelve desde la web se reconozca igual.
 */

import { normalizePhone } from "@/lib/booking";

/** Extrae el teléfono E.164 de un JID. Devuelve null si no es un número usable. */
export function jidToWaId(jid: string | null | undefined): string | null {
  if (!jid) return null;

  // Ignorar grupos, canales y estados.
  if (
    jid.endsWith("@g.us") ||
    jid.endsWith("@broadcast") ||
    jid.endsWith("@newsletter") ||
    jid === "status@broadcast"
  ) {
    return null;
  }

  const user = jid.split("@")[0]?.split(":")[0];
  if (!user) return null;

  return normalizePhone(user);
}

/** Teléfono E.164 → JID de WhatsApp. Solo para mensajes proactivos. */
export function waIdToJid(waId: string): string {
  return `${waId.replace(/\D/g, "")}@s.whatsapp.net`;
}
