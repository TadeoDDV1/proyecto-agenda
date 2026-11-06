/**
 * Motor del chatbot de AgendaSaaS.
 *
 * Reglas de diseño:
 *  - No depende del giro del negocio: todo se deriva de la base de datos
 *    (servicios, categorías, colaboradores, horarios y moneda del tenant).
 *  - No depende de WhatsApp: el canal es solo un transporte. El webhook y el
 *    simulador usan exactamente la misma función `responder()`.
 *  - Sin estado en la base: la sesión viaja en un Map con expiración; el canal
 *    solo debe devolver la sesión que recibe.
 */

import { prisma } from "@/lib/prisma";

export type Paso =
  | "inicio"
  | "eligiendo_servicio"
  | "eligiendo_staff"
  | "eligiendo_fecha"
  | "eligiendo_hora"
  | "pidiendo_nombre"
  | "confirmando";

export interface Sesion {
  paso: Paso;
  servicioId?: string;
  staffId?: string;
  fecha?: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  nombre?: string;
  telefono?: string;
  actualizado: number;
}

const TTL_MS = 30 * 60 * 1000;
const sesiones = new Map<string, Sesion>();

export function obtenerSesion(id: string): Sesion {
  const s = sesiones.get(id);
  if (!s || Date.now() - s.actualizado > TTL_MS) {
    return { paso: "inicio", actualizado: Date.now() };
  }
  return s;
}

export function guardarSesion(id: string, s: Sesion) {
  sesiones.set(id, { ...s, actualizado: Date.now() });
}

/* ------------------------------------------------------------------ */
/* Utilidades de texto y fecha                                        */
/* ------------------------------------------------------------------ */

const normaliza = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s:./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function fechaISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Interpreta "hoy", "mañana", "lunes", "25/12", "2026-12-25". */
export function interpretarFecha(texto: string): string | null {
  const t = normaliza(texto);
  const hoy = new Date();

  if (/(^|\s)hoy(\s|$)/.test(t)) return fechaISO(hoy);
  if (/pasado manana/.test(t)) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 2);
    return fechaISO(d);
  }
  if (/manana/.test(t)) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 1);
    return fechaISO(d);
  }

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  const dmy = t.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
  if (dmy) {
    const d = new Date(hoy.getFullYear(), Number(dmy[2]) - 1, Number(dmy[1]));
    if (d.getMonth() === Number(dmy[2]) - 1) return fechaISO(d);
  }

  const diaSemana = DIAS.findIndex((d) => t.includes(d));
  if (diaSemana >= 0) {
    const d = new Date(hoy);
    const delta = (diaSemana - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + delta);
    return fechaISO(d);
  }

  return null;
}

/** Interpreta "10:30", "a las 5", "5 pm", "17". */
export function interpretarHora(texto: string): string | null {
  const t = normaliza(texto);
  const hm = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h < 24 && m < 60) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const suelta = t.match(/\b(\d{1,2})\s*(am|pm|hrs?|horas?)?\b/);
  if (suelta) {
    let h = Number(suelta[1]);
    const sufijo = suelta[2];
    if (sufijo === "pm" && h < 12) h += 12;
    if (h >= 0 && h < 24 && /\b(\d{1,2})\s*(am|pm|hrs?|horas?|:)/.test(t)) {
      return `${String(h).padStart(2, "0")}:00`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Datos del negocio                                                  */
/* ------------------------------------------------------------------ */

export interface Contexto {
  tenant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    address: string | null;
    phone: string | null;
  };
  servicios: { id: string; nombre: string; precio: number; duracion: number }[];
  staff: { id: string; nombre: string; servicios: string[] }[];
  horario: string;
}

export async function cargarContexto(tenantId: string): Promise<Contexto | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      services: { where: { isActive: true }, orderBy: { name: "asc" } },
      staff: {
        where: { isActive: true },
        include: { services: { select: { serviceId: true } } },
      },
    },
  });
  if (!tenant) return null;

  // Resumen de horario legible, calculado de la tabla schedules.
  const horarios = await prisma.schedule.findMany({
    where: { staff: { tenantId, isActive: true }, isWorkingDay: true },
    orderBy: { dayOfWeek: "asc" },
  });
  const porDia = new Map<number, { inicio: string; fin: string }>();
  for (const h of horarios) {
    if (!porDia.has(h.dayOfWeek)) porDia.set(h.dayOfWeek, { inicio: h.startTime, fin: h.endTime });
  }
  const horario = [...porDia.entries()]
    .map(([d, v]) => `${DIAS[d]} ${v.inicio}–${v.fin}`)
    .join(" · ");

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      currency: tenant.currency,
      address: tenant.address,
      phone: tenant.phone,
    },
    servicios: tenant.services.map((s) => ({
      id: s.id,
      nombre: s.name,
      precio: Number(s.price),
      duracion: s.durationMinutes,
    })),
    staff: tenant.staff.map((s) => ({
      id: s.id,
      nombre: s.displayName,
      servicios: s.services.map((x) => x.serviceId),
    })),
    horario: horario || "consulta directa con el negocio",
  };
}

/* ------------------------------------------------------------------ */
/* Horarios disponibles                                               */
/* ------------------------------------------------------------------ */

export async function horariosDisponibles(
  ctx: Contexto,
  staffId: string,
  fecha: string,
  servicioId: string
): Promise<string[]> {
  const servicio = ctx.servicios.find((s) => s.id === servicioId);
  if (!servicio) return [];

  const [y, m, d] = fecha.split("-").map(Number);
  const dia = new Date(y, m - 1, d);
  const dow = dia.getDay();

  const horario = await prisma.schedule.findFirst({
    where: { staffId, dayOfWeek: dow, isWorkingDay: true },
  });
  if (!horario) return [];

  const ocupadas = await prisma.appointment.findMany({
    where: {
      staffId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { gte: new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()) },
      endTime: { lt: new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1) },
    },
    select: { startTime: true, endTime: true },
  });

  const aMin = (hhmm: string) => {
    const [h, mi] = hhmm.split(":").map(Number);
    return h * 60 + mi;
  };
  const aHora = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  const inicio = aMin(horario.startTime);
  const fin = aMin(horario.endTime);
  const descansoIni = horario.hasBreak && horario.breakStart ? aMin(horario.breakStart) : -1;
  const descansoFin = horario.hasBreak && horario.breakEnd ? aMin(horario.breakEnd) : -1;

  const ahora = new Date();
  const esHoy = fechaISO(ahora) === fecha;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const libres: string[] = [];
  for (let t = inicio; t + servicio.duracion <= fin; t += 30) {
    const termina = t + servicio.duracion;
    if (descansoIni >= 0 && t < descansoFin && termina > descansoIni) continue;
    if (esHoy && t <= minutosAhora + 30) continue;

    const solapa = ocupadas.some((o) => {
      const oi = o.startTime.getHours() * 60 + o.startTime.getMinutes();
      const of = o.endTime.getHours() * 60 + o.endTime.getMinutes();
      return t < of && termina > oi;
    });
    if (!solapa) libres.push(aHora(t));
  }
  return libres;
}

/* ------------------------------------------------------------------ */
/* Respuestas                                                         */
/* ------------------------------------------------------------------ */

const dinero = (n: number, moneda: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda, maximumFractionDigits: 2 })
    .format(n);

function listaServicios(ctx: Contexto) {
  return ctx.servicios
    .map((s, i) => `${i + 1}. ${s.nombre} — ${dinero(s.precio, ctx.tenant.currency)} (${s.duracion} min)`)
    .join("\n");
}

/** Coincidencia difusa por palabras: sirve para cualquier giro. */
function buscarServicio(ctx: Contexto, texto: string) {
  const t = normaliza(texto);
  const porNumero = t.match(/^\s*(\d{1,2})\s*$/);
  if (porNumero) {
    const idx = Number(porNumero[1]) - 1;
    if (ctx.servicios[idx]) return ctx.servicios[idx];
  }
  let mejor: { s: (typeof ctx.servicios)[number]; score: number } | null = null;
  for (const s of ctx.servicios) {
    const nombre = normaliza(s.nombre);
    let score = 0;
    if (t.includes(nombre) || nombre.includes(t)) score += 10;
    for (const palabra of nombre.split(" ")) {
      if (palabra.length > 3 && t.includes(palabra)) score += 3;
    }
    if (score > 0 && (!mejor || score > mejor.score)) mejor = { s, score };
  }
  return mejor?.s ?? null;
}

export interface Respuesta {
  texto: string;
  sesion: Sesion;
  citaCreada?: { id: string; inicio: string };
}

export async function responder(
  ctx: Contexto,
  sesion: Sesion,
  mensaje: string,
  telefono: string
): Promise<Respuesta> {
  const t = normaliza(mensaje);
  const s: Sesion = { ...sesion, telefono: telefono || sesion.telefono };
  const nombreBot = process.env.BOT_NAME || `el asistente de ${ctx.tenant.name}`;

  const saludo = /^(hola|buen(os|as)|que tal|hey|hi)\b/.test(t);
  const pideHumano = /(humano|persona|asesor|agente|hablar con alguien)/.test(t);
  const pideServicios = /(servicio|precio|cuanto|cuesta|catalogo|que ofrecen)/.test(t);
  const pideHorario = /(horario|abren|cierran|a que hora)/.test(t);
  const pideUbicacion = /(donde|ubicacion|direccion|sucursal)/.test(t);
  const quiereAgendar = /(agendar|cita|reservar|apartar|turno)/.test(t);
  const pideConsultar = /(mis citas|consultar|ver mi cita|cuando es)/.test(t);
  const cancela = /(cancelar|anular)/.test(t);
  const pideMenu = /^(menu|opciones|ayuda|inicio|0|empezar|que puedes hacer)$/.test(t);
  const reinicia = /^(atras|volver|cancelar|salir|reiniciar|empezar de nuevo)$/.test(t);

  const MENU =
    `Puedo ayudarte con:\n1. Ver servicios y precios\n2. Agendar una cita\n3. Horarios\n4. Ubicación\n5. Hablar con una persona\n\n¿Qué necesitas?`;

  // ---- reinicio explícito del flujo ----
  if (reinicia) {
    return { sesion: { paso: "inicio", actualizado: Date.now() }, texto: `Listo, empezamos de nuevo.\n\n${MENU}` };
  }
  if (pideMenu) {
    return { sesion: { ...s, paso: "inicio" }, texto: MENU };
  }

  // ---- precio de un servicio concreto ----
  if (/(cuanto|cuánto|cuesta|precio|vale)/.test(t)) {
    const srv = buscarServicio(ctx, mensaje);
    if (srv) {
      return {
        sesion: { ...s, paso: "inicio" },
        texto: `*${srv.nombre}* cuesta ${dinero(srv.precio, ctx.tenant.currency)} y dura ${srv.duracion} minutos. ¿Quieres agendarlo? Escribe *agendar*.`,
      };
    }
  }

  // ---- salidas globales ----
  if (pideHumano) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: `Claro, te conecto con una persona de ${ctx.tenant.name}. Escríbenos al ${
        ctx.tenant.phone ?? "número del negocio"
      } y te atendemos en horario de oficina.`,
    };
  }

  if (pideUbicacion) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: `${ctx.tenant.name} está en ${ctx.tenant.address ?? "dirección no registrada"}.${
        ctx.tenant.phone ? `\nTeléfono: ${ctx.tenant.phone}.` : ""
      }`,
    };
  }

  if (pideHorario && !quiereAgendar) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: `Nuestro horario de atención es:\n${ctx.horario}`,
    };
  }

  if (pideServicios && s.paso === "inicio") {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: `Estos son nuestros servicios:\n${listaServicios(ctx)}\n\n¿Quieres agendar alguno? Escribe *agendar*.`,
    };
  }

  if (cancela) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: "Para cancelar o reprogramar, indícanos tu nombre y la fecha de tu cita y una persona del equipo lo confirma contigo.",
    };
  }

  if (pideConsultar) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: "Escríbenos el nombre con el que agendaste y la fecha aproximada; con eso localizamos tu cita.",
    };
  }

  // ---- flujo de agendado ----
  // También se entra al flujo si el mensaje nombra un servicio ("quiero un corte"),
  // sin exigir la palabra "cita".
  const servicioDetectado = buscarServicio(ctx, mensaje);
  if (quiereAgendar || servicioDetectado || s.paso !== "inicio") {
    if (s.paso === "inicio" || s.paso === "eligiendo_servicio") {
      const elegido = servicioDetectado;
      if (elegido) {
        s.servicioId = elegido.id;
        const posibles = ctx.staff.filter((st) => st.servicios.includes(elegido.id));
        if (posibles.length <= 1) {
          s.staffId = posibles[0]?.id;
          s.paso = "eligiendo_fecha";
          return {
            sesion: s,
            texto: `Perfecto: *${elegido.nombre}* (${dinero(elegido.precio, ctx.tenant.currency)}).\n¿Para qué día? Puedes decir *hoy*, *mañana* o una fecha como 25/12.`,
          };
        }
        s.paso = "eligiendo_staff";
        return {
          sesion: s,
          texto: `Perfecto: *${elegido.nombre}*.\n¿Con quién quieres tu cita?\n${posibles
            .map((p, i) => `${i + 1}. ${p.nombre}`)
            .join("\n")}\n\nEscribe el número o *cualquiera*.`,
        };
      }
      s.paso = "eligiendo_servicio";
      return {
        sesion: s,
        texto: `Con gusto te agendo. ¿Qué servicio necesitas?\n${listaServicios(ctx)}\n\nEscribe el número o el nombre.`,
      };
    }

    if (s.paso === "eligiendo_staff") {
      const posibles = ctx.staff.filter((st) => st.servicios.includes(s.servicioId!));
      let elegido = posibles.find((p) => normaliza(p.nombre).includes(t) || t.includes(normaliza(p.nombre)));
      const num = t.match(/^(\d{1,2})$/);
      if (!elegido && num) elegido = posibles[Number(num[1]) - 1];
      if (!elegido && /(cualquiera|el que sea|me da igual|indiferente)/.test(t)) elegido = posibles[0];

      if (!elegido) {
        return {
          sesion: s,
          texto: `Elige un colaborador:\n${posibles.map((p, i) => `${i + 1}. ${p.nombre}`).join("\n")}`,
        };
      }
      s.staffId = elegido.id;
      s.paso = "eligiendo_fecha";
      return {
        sesion: s,
        texto: `Listo, con *${elegido.nombre}*.\n¿Qué día te acomoda? (*hoy*, *mañana* o 25/12)`,
      };
    }

    if (s.paso === "eligiendo_fecha") {
      const fecha = interpretarFecha(mensaje);
      if (!fecha) {
        return {
          sesion: s,
          texto: "No entendí la fecha. Dime *hoy*, *mañana*, un día de la semana o una fecha como 25/12.",
        };
      }
      const libres = await horariosDisponibles(ctx, s.staffId!, fecha, s.servicioId!);
      if (libres.length === 0) {
        return {
          sesion: s,
          texto: "Ese día no tengo espacios disponibles. ¿Probamos con otra fecha?",
        };
      }
      s.fecha = fecha;
      s.paso = "eligiendo_hora";
      return {
        sesion: s,
        texto: `Horarios libres el ${fecha}:\n${libres.slice(0, 10).join(" · ")}${
          libres.length > 10 ? "\n(y más…)" : ""
        }\n\nEscribe la hora que prefieras.`,
      };
    }

    if (s.paso === "eligiendo_hora") {
      const hora = interpretarHora(mensaje);
      if (!hora) {
        return { sesion: s, texto: "Indícame una hora, por ejemplo 10:30 o 17:00." };
      }
      const libres = await horariosDisponibles(ctx, s.staffId!, s.fecha!, s.servicioId!);
      if (!libres.includes(hora)) {
        return {
          sesion: s,
          texto: `La hora ${hora} no está disponible. Opciones: ${libres.slice(0, 8).join(" · ")}`,
        };
      }
      s.hora = hora;
      s.paso = "pidiendo_nombre";
      return { sesion: s, texto: "¿A nombre de quién agendo la cita?" };
    }

    if (s.paso === "pidiendo_nombre") {
      s.nombre = mensaje.trim();
      s.paso = "confirmando";
      const servicio = ctx.servicios.find((x) => x.id === s.servicioId);
      const staff = ctx.staff.find((x) => x.id === s.staffId);
      return {
        sesion: s,
        texto: `Confirma tu cita:\n• Servicio: ${servicio?.nombre}\n• Con: ${staff?.nombre}\n• Fecha: ${s.fecha} a las ${s.hora}\n• A nombre de: ${s.nombre}\n\nResponde *sí* para confirmar.`,
      };
    }

    if (s.paso === "confirmando") {
      if (!/^(si|sí|ok|confirmo|confirmar|va|de acuerdo)/.test(t)) {
        return {
          sesion: { ...s, paso: "inicio" },
          texto: "Sin problema, cancelé el proceso. Si quieres empezar de nuevo escribe *agendar*.",
        };
      }

      const servicio = ctx.servicios.find((x) => x.id === s.servicioId)!;
      const [y, m, d] = s.fecha!.split("-").map(Number);
      const [h, mi] = s.hora!.split(":").map(Number);
      const inicio = new Date(y, m - 1, d, h, mi, 0, 0);
      const fin = new Date(inicio.getTime() + servicio.duracion * 60000);

      const solapa = await prisma.appointment.findFirst({
        where: {
          staffId: s.staffId!,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { lt: fin },
          endTime: { gt: inicio },
        },
      });
      if (solapa) {
        return {
          sesion: { ...s, paso: "eligiendo_hora" },
          texto: "Ese horario acaba de ocuparse. Elige otra hora, por favor.",
        };
      }

      let cliente = await prisma.customer.findFirst({
        where: { tenantId: ctx.tenant.id, phone: telefono },
      });
      if (!cliente) {
        cliente = await prisma.customer.create({
          data: { tenantId: ctx.tenant.id, fullName: s.nombre!, phone: telefono },
        });
      }

      const cita = await prisma.appointment.create({
        data: {
          tenantId: ctx.tenant.id,
          staffId: s.staffId!,
          serviceId: s.servicioId!,
          customerId: cliente.id,
          startTime: inicio,
          endTime: fin,
          status: "CONFIRMED",
          totalPrice: servicio.precio,
          customerNotes: "Cita creada por el chatbot",
        },
      });

      return {
        sesion: { paso: "inicio", actualizado: Date.now() },
        citaCreada: { id: cita.id, inicio: inicio.toISOString() },
        texto: `¡Listo, ${s.nombre}! Tu cita de *${servicio.nombre}* quedó confirmada para el ${s.fecha} a las ${s.hora} con ${ctx.staff.find((x) => x.id === s.staffId)?.nombre}.\n\nTe esperamos en ${ctx.tenant.name}.`,
      };
    }
  }

  if (saludo) {
    return {
      sesion: { ...s, paso: "inicio" },
      texto: `¡Hola! Soy ${nombreBot}.\n${MENU}`,
    };
  }

  // Si estábamos a media conversación, se repite la pregunta en vez de
  // responder con el mensaje de "no entendí".
  const REINTENTO: Record<string, string> = {
    eligiendo_servicio: "¿Qué servicio necesitas? Escribe el número de la lista o su nombre.",
    eligiendo_staff: "¿Con qué colaborador quieres tu cita? Escribe el número.",
    eligiendo_fecha: "¿Qué día te acomoda? Puedes decir *hoy*, *mañana* o 25/12.",
    eligiendo_hora: "¿Qué hora prefieres? Escríbela como 10:30.",
    pidiendo_nombre: "¿A nombre de quién agendo la cita?",
    confirmando: "Responde *sí* para confirmar o *cancelar* para salir.",
  };
  if (REINTENTO[s.paso]) {
    return { sesion: s, texto: `No te entendí. ${REINTENTO[s.paso]}` };
  }

  return {
    sesion: s,
    texto: `No estoy seguro de haber entendido. Escribe *menú* para ver las opciones.`,
  };
}
