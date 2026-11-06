/**
 * Tipos del bot de WhatsApp.
 *
 * El motor no sabe nada de Baileys: recibe texto ya normalizado y devuelve
 * respuestas + el próximo estado. El worker se encarga de enviar y persistir.
 */

import type { ConversationState, Tenant } from "@prisma/client";

export interface SlotChoice {
  time: string;
  staffId: string;
  staffName: string;
}

export interface DayChoice {
  dateKey: string;
  label: string;
  count: number;
}

export interface ServiceChoice {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface StaffChoice {
  id: string;
  name: string;
}

export interface AppointmentChoice {
  id: string;
  label: string;
}

export interface FlowContext {
  services?: ServiceChoice[];
  serviceId?: string;
  serviceName?: string;
  serviceDuration?: number;
  servicePrice?: number;
  staffId?: string | null;
  staffName?: string;
  dateKey?: string;
  dateLabel?: string;
  time?: string;
  slots?: SlotChoice[];
  slotsPage?: number;
  days?: DayChoice[];
  customerName?: string;
  appointments?: AppointmentChoice[];
  appointmentId?: string;
}

export interface EngineInput {
  tenant: Tenant;
  state: ConversationState;
  context: FlowContext;
  /** Teléfono del cliente en E.164. */
  waId: string;
  text: string;
  providerMessageId: string;
  expiresAt?: Date | null;
}

export interface EngineResult {
  state: ConversationState;
  context: FlowContext;
  replies: string[];
  customerId?: string | null;
}
