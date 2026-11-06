/**
 * Motor de conversación del bot de WhatsApp (v1, determinista).
 *
 * Sin IA: el cliente elige con números, así que el flujo es predecible y
 * testeable. Este módulo hace las lecturas/escrituras de negocio; el worker
 * (`src/bot/*`) solo se encarga del transporte, la persistencia del estado y
 * el envío.
 *
 * Flujos cubiertos: reservar, ver próximas citas y cancelar.
 */

import { AppointmentStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import {
  cancelAppointment,
  createAppointment,
  getDayAvailability,
  getUpcomingAvailability,
  toAppointmentSummary,
} from "@/lib/booking";
import {
  GREETING,
  confirmationText,
  dayLabel,
  dayOptions,
  formatAppointmentDate,
  formatMoney,
  infoText,
  menuText,
  serviceOptions,
  slotOptions,
} from "./texts";
import type {
  AppointmentChoice,
  EngineInput,
  EngineResult,
  FlowContext,
  ServiceChoice,
} from "./types";

const SLOTS_PER_PAGE = 8;

/* ─── Entrada y utilidades ─── */

export async function handleInbound(input: EngineInput): Promise<EngineResult> {
  const text = normalize(input.text);
  const expired =
    input.expiresAt instanceof Date && input.expiresAt.getTime() < Date.now();

  // Inactividad: la cita ya creada no se pierde, solo el contexto del flujo.
  if (expired) {
    return {
      state: "MENU",
      context: {},
      replies: [`${GREETING(input.tenant.name)}\n\n${menuText()}`],
    };
  }

  if (isReset(text)) {
    return { state: "MENU", context: {}, replies: [menuText()] };
  }

  if (isGreeting(text)) {
    return {
      state: "MENU",
      context: {},
      replies: [`${GREETING(input.tenant.name)}\n\n${menuText()}`],
    };
  }

  const ctx: FlowContext = { ...input.context };

  switch (input.state) {
    case "BOOK_SERVICE":
      return servicesStep(input, ctx, text);
    case "BOOK_STAFF":
      return staffStep(input, ctx, text);
    case "BOOK_DATE":
      return dateStep(input, ctx, text);
    case "BOOK_SLOT":
      return slotStep(input, ctx, text);
    case "BOOK_NAME":
      return nameStep(input, ctx, input.text);
    case "BOOK_CONFIRM":
      return confirmStep(input, ctx, text);
    case "MANAGE_LIST":
      return manageListStep(input, ctx, text);
    case "MANAGE_DETAIL":
      return manageDetailStep(input, ctx, text);
    case "CANCEL_CONFIRM":
      return cancelConfirmStep(input, ctx, text);
    default:
      return menuStep(input, text);
  }
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isReset(text: string): boolean {
  return ["menu", "inicio", "salir", "volver", "0"].includes(text);
}

function isGreeting(text: string): boolean {
  return /^(hola|buenas|buen dia|buenas tardes|buenas noches|que tal|hey|holi)\b/.test(
    text
  );
}

function choice(text: string, max: number): number | null {
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= max ? value : null;
}

/** Une líneas conservando los saltos vacíos intencionales. */
function message(...lines: Array<string | null | undefined>): string {
  return lines.filter((line): line is string => line != null).join("\n");
}

/* ─── Menú principal ─── */

async function menuStep(
  input: EngineInput,
  text: string
): Promise<EngineResult> {
  if (["1", "reservar", "reserva", "cita", "agendar"].includes(text)) {
    return startBooking(input);
  }

  if (["2", "mis citas", "citas", "mi cita"].includes(text)) {
    return showAppointments(input);
  }

  if (
    ["3", "info", "informacion", "direccion", "horario", "horarios", "donde"].includes(
      text
    )
  ) {
    return showInfo(input);
  }

  return {
    state: "MENU",
    context: {},
    replies: [
      "No entendí esa opción. Responde con un número del menú.",
      "",
      menuText(),
    ],
  };
}

/* ─── Reserva ─── */

async function startBooking(input: EngineInput): Promise<EngineResult> {
  const services = await prisma.service.findMany({
    where: { tenantId: input.tenant.id, isActive: true },
    orderBy: { name: "asc" },
  });

  if (services.length === 0) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "Por ahora no hay servicios disponibles para reservar.",
        "",
        "Escribe *menú* para volver.",
      ],
    };
  }

  const list: ServiceChoice[] = services.slice(0, 9).map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    price: Number(service.price),
  }));

  return {
    state: "BOOK_SERVICE",
    context: { services: list },
    replies: [message(
      "¿Qué servicio quieres reservar?",
      "",
      serviceOptions(list, input.tenant.currency),
      "",
      "0. Volver al menú",
    )],
  };
}

async function servicesStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  const services = ctx.services ?? [];
  if (services.length === 0) return startBooking(input);

  const index = choice(text, services.length);
  const service =
    index !== null
      ? services[index - 1]
      : services.find((item) => {
          const name = normalize(item.name);
          return name.includes(text) || text.includes(name);
        });

  if (!service || (index === null && text.length < 2)) {
    return {
      state: "BOOK_SERVICE",
      context: ctx,
      replies: [message(
        `Responde con un número del 1 al ${services.length}.`,
        "",
        serviceOptions(services, input.tenant.currency),
      )],
    };
  }

  const staff = await prisma.staffProfile.findMany({
    where: {
      tenantId: input.tenant.id,
      isActive: true,
      services: { some: { serviceId: service.id } },
    },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });

  const base: FlowContext = {
    serviceId: service.id,
    serviceName: service.name,
    serviceDuration: service.durationMinutes,
    servicePrice: service.price,
    staffId: null,
  };

  if (staff.length === 0) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "Ese servicio no tiene profesionales disponibles por ahora.",
        "",
        "Escribe *menú* para elegir otro.",
      ],
    };
  }

  if (staff.length === 1) {
    return showDates(input, {
      ...base,
      staffId: staff[0].id,
      staffName: staff[0].displayName,
    });
  }

  return showStaff(input, base, staff);
}

function showStaff(
  input: EngineInput,
  ctx: FlowContext,
  staff: Array<{ id: string; displayName: string }>
): EngineResult {
  const lines = [
    "¿Con quién quieres tu cita?",
    "",
    "1. Cualquiera",
    ...staff.map(
      (member, index) => `${index + 2}. ${member.displayName}`
    ),
    "",
    "0. Volver al menú",
  ];

  return {
    state: "BOOK_STAFF",
    context: ctx,
    replies: [lines.join("\n")],
  };
}

async function staffStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  const staff = await prisma.staffProfile.findMany({
    where: {
      tenantId: input.tenant.id,
      isActive: true,
      services: { some: { serviceId: ctx.serviceId } },
    },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });

  if (["cualquiera", "cualquiera sea", "el que sea", "sin preferencia"].includes(text)) {
    return showDates(input, { ...ctx, staffId: null, staffName: undefined });
  }

  const index = choice(text, staff.length + 1);

  if (index === 1) {
    return showDates(input, { ...ctx, staffId: null, staffName: undefined });
  }

  const member = index !== null ? staff[index - 2] : null;
  if (!member) {
    return {
      state: "BOOK_STAFF",
      context: ctx,
      replies: [
        `Responde *1* para cualquiera o un número del 2 al ${staff.length + 1}.`,
      ],
    };
  }

  return showDates(input, {
    ...ctx,
    staffId: member.id,
    staffName: member.displayName,
  });
}

async function showDates(
  input: EngineInput,
  ctx: FlowContext
): Promise<EngineResult> {
  const result = await getUpcomingAvailability({
    tenantId: input.tenant.id,
    serviceId: ctx.serviceId!,
    staffId: ctx.staffId ?? undefined,
    days: 7,
  });

  if (!result.ok) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "No pude consultar la disponibilidad. Intenta de nuevo en un momento.",
        "",
        "Escribe *menú* para volver.",
      ],
    };
  }

  const days = result.data.days
    .filter((day) => !day.isClosed && day.count > 0)
    .map((day) => ({
      dateKey: day.dateKey,
      label: dayLabel(day.dateKey, result.data.timezone),
      count: day.count,
    }));

  if (days.length === 0) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "No hay horarios disponibles en los próximos 7 días.",
        "",
        "Puedes escribirnos más tarde o reservar desde la web del salón.",
      ],
    };
  }

  return {
    state: "BOOK_DATE",
    context: { ...ctx, days, slots: [], slotsPage: 0 },
    replies: [message(
      `¿Qué día te queda mejor?${ctx.staffName ? `\nCon ${ctx.staffName}.` : ""}`,
      "",
      dayOptions(days),
      "",
      "0. Volver al menú",
    )],
  };
}

async function dateStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  const days = ctx.days ?? [];
  const index = choice(text, days.length);

  if (index === null) {
    return {
      state: "BOOK_DATE",
      context: ctx,
      replies: [message(
        `Responde con un número del 1 al ${days.length}.`,
        "",
        dayOptions(days),
      )],
    };
  }

  const day = days[index - 1];
  return showSlots(
    input,
    {
      ...ctx,
      dateKey: day.dateKey,
      dateLabel: day.label,
      slotsPage: 0,
    },
    0
  );
}

async function showSlots(
  input: EngineInput,
  ctx: FlowContext,
  page: number
): Promise<EngineResult> {
  const result = await getDayAvailability({
    tenantId: input.tenant.id,
    serviceId: ctx.serviceId!,
    staffId: ctx.staffId ?? undefined,
    dateKey: ctx.dateKey!,
  });

  if (!result.ok) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "No pude consultar los horarios. Intenta de nuevo en un momento.",
        "",
        "Escribe *menú* para volver.",
      ],
    };
  }

  const slots = result.data.slots;
  if (slots.length === 0) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "Ese día se acaba de llenar.",
        "",
        "Escribe *menú* para elegir otro día.",
      ],
    };
  }

  const start = page * SLOTS_PER_PAGE;
  const visible = slots.slice(start, start + SLOTS_PER_PAGE);
  const hasMore = slots.length > start + SLOTS_PER_PAGE;

  return {
    state: "BOOK_SLOT",
    context: {
      ...ctx,
      slots,
      slotsPage: page,
      dateLabel: dayLabel(ctx.dateKey!, result.data.timezone),
    },
    replies: [message(
      `Horarios para *${dayLabel(ctx.dateKey!, result.data.timezone)}*:`,
      "",
      slotOptions(visible, {
        showStaff: !ctx.staffId,
        hasMore,
      }),
      "",
      hasMore ? "9. Ver más horarios" : null,
      "0. Volver al menú",
    )],
  };
}

async function slotStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  const slots = ctx.slots ?? [];
  const page = ctx.slotsPage ?? 0;
  const start = page * SLOTS_PER_PAGE;
  const visible = slots.slice(start, start + SLOTS_PER_PAGE);
  const hasMore = slots.length > start + SLOTS_PER_PAGE;

  if ((text === "9" || text === "mas" || text === "más") && hasMore) {
    return showSlots(input, ctx, page + 1);
  }

  const index = choice(text, visible.length);
  if (index === null) {
    return {
      state: "BOOK_SLOT",
      context: ctx,
      replies: [
        `Responde con un número del 1 al ${visible.length}${
          hasMore ? " o *9* para ver más" : ""
        }.`,
      ],
    };
  }

  const slot = visible[index - 1];
  const customer = await prisma.customer.findUnique({
    where: { tenantId_phone: { tenantId: input.tenant.id, phone: input.waId } },
    select: { id: true, fullName: true },
  });

  const next: FlowContext = {
    ...ctx,
    time: slot.time,
    staffId: slot.staffId,
    staffName: slot.staffName,
    customerName: customer?.fullName,
  };

  if (!customer) {
    return {
      state: "BOOK_NAME",
      context: next,
      replies: [message(
        `Perfecto: *${dayLabel(ctx.dateKey!, input.tenant.timezone)}* a las *${slot.time}*.`,
        "",
        "¿A nombre de quién agendo la cita? Escribe tu nombre completo.",
        "",
        "0. Volver al menú",
      )],
    };
  }

  return showConfirm(input, next, customer.id);
}

function nameStep(
  input: EngineInput,
  ctx: FlowContext,
  rawText: string
): EngineResult {
  const name = rawText
    .trim()
    .replace(/^(me llamo|mi nombre es|soy)\s+/i, "")
    .replace(/\s+/g, " ");

  if (name.length < 2 || name.length > 80 || /^\d+$/.test(name)) {
    return {
      state: "BOOK_NAME",
      context: ctx,
      replies: [
        "Escribe tu nombre completo (mínimo 2 letras) o *menú* para salir.",
      ],
    };
  }

  return showConfirm(input, { ...ctx, customerName: name }, null);
}

function showConfirm(
  input: EngineInput,
  ctx: FlowContext,
  customerId: string | null
): EngineResult {
  return {
    state: "BOOK_CONFIRM",
    context: ctx,
    ...(customerId ? { customerId } : {}),
    replies: [message(
      "*Revisa tu cita*",
      "",
      `*Servicio:* ${ctx.serviceName}`,
      `*Profesional:* ${ctx.staffName ?? "Cualquiera disponible"}`,
      `*Cuándo:* ${ctx.dateLabel ?? ""} · ${ctx.time}`,
      `*Duración:* ${ctx.serviceDuration} min`,
      `*Precio:* ${formatMoney(ctx.servicePrice ?? 0, input.tenant.currency)}`,
      `*A nombre de:* ${ctx.customerName}`,
      "",
      "1. Confirmar",
      "2. Elegir otro horario",
      "0. Menú",
    )],
  };
}

async function confirmStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  if (text === "2" || text === "cambiar" || text === "otro horario") {
    return showSlots(input, { ...ctx, slotsPage: 0 }, 0);
  }

  if (!["1", "confirmar", "si", "sí", "dale", "ok"].includes(text)) {
    return showConfirm(input, ctx, null);
  }

  const result = await createAppointment({
    tenantId: input.tenant.id,
    serviceId: ctx.serviceId!,
    staffId: ctx.staffId ?? undefined,
    dateKey: ctx.dateKey!,
    time: ctx.time!,
    customer: {
      fullName: ctx.customerName!,
      phone: input.waId,
    },
    source: "WHATSAPP",
    idempotencyKey: `wa:${input.providerMessageId}`,
  });

  if (result.ok) {
    const appointment = result.data;
    return {
      state: "MENU",
      context: { customerName: appointment.customerName },
      customerId: appointment.customerId,
      replies: [
        confirmationText({
          code: appointment.confirmationCode,
          serviceName: appointment.serviceName,
          staffName: appointment.staffName,
          dateLabel: dayLabel(appointment.localDate, input.tenant.timezone),
          time: appointment.localTime,
          price: appointment.totalPrice,
          currency: input.tenant.currency,
          address: input.tenant.address,
        }),
      ],
    };
  }

  if (result.code === "SLOT_TAKEN") {
    const alternatives = result.alternatives ?? [];

    if (alternatives.length > 0) {
      return {
        state: "BOOK_SLOT",
        context: {
          ...ctx,
          slots: alternatives,
          slotsPage: 0,
        },
        replies: [message(
          "Ese horario se acaba de ocupar. Estos siguen libres:",
          "",
          slotOptions(alternatives.slice(0, SLOTS_PER_PAGE), {
            showStaff: !ctx.staffId,
            hasMore: alternatives.length > SLOTS_PER_PAGE,
          }),
          "",
          "0. Menú",
        )],
      };
    }

    return {
      state: "MENU",
      context: {},
      replies: [
        "Ese horario se acaba de ocupar y no quedan alternativas ese día.",
        "",
        "Escribe *menú* para elegir otro día.",
      ],
    };
  }

  return {
    state: "MENU",
    context: {},
    replies: [
      `No pude confirmar la cita: ${result.message}`,
      "",
      "Escribe *menú* para intentar de nuevo.",
    ],
  };
}

/* ─── Mis citas ─── */

async function showAppointments(input: EngineInput): Promise<EngineResult> {
  const customer = await prisma.customer.findUnique({
    where: { tenantId_phone: { tenantId: input.tenant.id, phone: input.waId } },
    select: { id: true, fullName: true },
  });

  if (!customer) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "No encontré citas con este número. ¿Quieres reservar una?",
        "",
        "1. Reservar",
        "0. Menú",
      ],
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: input.tenant.id,
      customerId: customer.id,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      startTime: { gte: new Date() },
    },
    include: { service: true, staff: true, customer: true },
    orderBy: { startTime: "asc" },
    take: 3,
  });

  if (appointments.length === 0) {
    return {
      state: "MENU",
      context: { customerName: customer.fullName },
      customerId: customer.id,
      replies: [
        "No tienes citas próximas.",
        "",
        "¿Quieres reservar una?",
        "",
        "1. Reservar",
        "0. Menú",
      ],
    };
  }

  const choices: AppointmentChoice[] = appointments.map((appointment) => {
    const summary = toAppointmentSummary(appointment, input.tenant.timezone);
    return {
      id: appointment.id,
      label: `${dayLabel(summary.localDate, input.tenant.timezone)} · ${
        summary.localTime
      } · ${summary.serviceName}`,
    };
  });

  const lines = [
    `Tus próximas citas, ${customer.fullName.split(" ")[0]}:`,
    "",
    ...choices.map((item, index) => `${index + 1}. ${item.label}`),
    "",
    "Responde el número para ver el detalle o *0* para el menú.",
  ];

  return {
    state: "MANAGE_LIST",
    context: { appointments: choices, customerName: customer.fullName },
    customerId: customer.id,
    replies: [lines.join("\n")],
  };
}

async function manageListStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  const appointments = ctx.appointments ?? [];

  const index = choice(text, appointments.length);
  if (index === null) {
    return {
      state: "MANAGE_LIST",
      context: ctx,
      replies: [
        `Responde con un número del 1 al ${appointments.length} o *0* para el menú.`,
      ],
    };
  }

  return showAppointmentDetail(input, ctx, appointments[index - 1].id);
}

async function showAppointmentDetail(
  input: EngineInput,
  ctx: FlowContext,
  appointmentId: string
): Promise<EngineResult> {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: input.tenant.id,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    include: { service: true, staff: true, customer: true },
  });

  if (!appointment) {
    return {
      state: "MENU",
      context: {},
      replies: [
        "Esa cita ya no está activa.",
        "",
        "Escribe *menú* para volver.",
      ],
    };
  }

  const summary = toAppointmentSummary(appointment, input.tenant.timezone);

  return {
    state: "MANAGE_DETAIL",
    context: { ...ctx, appointmentId: appointment.id },
    customerId: appointment.customerId,
    replies: [message(
      `*${summary.serviceName}*`,
      formatAppointmentDate(
        summary.localDate,
        summary.localTime,
        input.tenant.timezone
      ),
      `Profesional: ${summary.staffName}`,
      summary.confirmationCode ? `Código: ${summary.confirmationCode}` : null,
      "",
      "1. Cancelar esta cita",
      "0. Menú",
    )],
  };
}

async function manageDetailStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  if (text === "1" || text === "cancelar") {
    return {
      state: "CANCEL_CONFIRM",
      context: ctx,
      replies: [message(
        "¿Seguro que quieres cancelar esta cita?",
        "",
        "1. Sí, cancelar",
        "2. No, volver",
      )],
    };
  }

  return showAppointmentDetail(input, ctx, ctx.appointmentId!);
}

async function cancelConfirmStep(
  input: EngineInput,
  ctx: FlowContext,
  text: string
): Promise<EngineResult> {
  if (text === "2" || text === "no") {
    return showAppointmentDetail(input, ctx, ctx.appointmentId!);
  }

  if (!["1", "si", "sí", "cancelar"].includes(text)) {
    return {
      state: "CANCEL_CONFIRM",
      context: ctx,
      replies: ["Responde *1* para cancelar o *2* para volver."],
    };
  }

  const result = await cancelAppointment({
    tenantId: input.tenant.id,
    appointmentId: ctx.appointmentId!,
    reason: "Cancelada por el cliente por WhatsApp",
  });

  if (!result.ok) {
    return {
      state: "MENU",
      context: {},
      replies: [
        `No pude cancelar la cita: ${result.message}`,
        "",
        "Escribe *menú* para volver.",
      ],
    };
  }

  return {
    state: "MENU",
    context: {},
    customerId: result.data.appointment.customerId,
    replies: [message(
      "Listo, tu cita quedó cancelada.",
      result.data.late
        ? "Quedó registrada como cancelación tardía."
        : "El horario ya está libre para otra persona.",
      "",
      "Escribe *menú* si quieres reservar de nuevo.",
    )],
  };
}

/* ─── Información ─── */

async function showInfo(input: EngineInput): Promise<EngineResult> {
  const isoWeekday = Number(
    formatInTimeZone(new Date(), input.tenant.timezone, "i")
  );
  const dayOfWeek = isoWeekday === 7 ? 0 : isoWeekday;
  const hours = await prisma.businessHour.findUnique({
    where: {
      tenantId_dayOfWeek: {
        tenantId: input.tenant.id,
        dayOfWeek,
      },
    },
  });

  const todayHours = hours
    ? hours.isClosed
      ? "cerrado"
      : `${hours.openTime} a ${hours.closeTime}`
    : null;

  return {
    state: "MENU",
    context: {},
    replies: [
      infoText({
        tenantName: input.tenant.name,
        address: input.tenant.address,
        phone: input.tenant.phone,
        todayHours,
      }),
    ],
  };
}
