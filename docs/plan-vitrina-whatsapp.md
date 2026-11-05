# Plan — Vitrina + reservas por WhatsApp

**Estado:** propuesta para revisión  
**Fecha:** 28 oct 2026  
**Alcance:** aplicar la dirección **05 · Vitrina** al portal público y convertir **WhatsApp en el canal principal de reservas**, con un bot que opera sobre el mismo motor de agenda que la web y el admin.

---

## 1. Resumen ejecutivo

La dirección Vitrina no es solo un rediseño: cambia el modelo de adquisición. Hoy el cliente entra a `/b/[slug]`, completa un wizard de cuatro pasos y deja sus datos. Con WhatsApp, el cliente ya está en el canal: escribe, el bot consulta disponibilidad real y crea la cita en la misma base de datos.

La propuesta tiene tres piezas:

1. **Vitrina** reemplaza el portal público actual: micrositio de marca por tenant, claro, editorial y con barra de reserva persistente.
2. **Bot de WhatsApp determinista** (botones y listas, sin LLM en v1) que reserva, consulta, cancela y reprograma contra el dominio de la app.
3. **Un solo motor de reservas** compartido por web, bot y admin. Sin lógica duplicada y sin dos agendas que se desincronizan.

El admin actual (Nocturne, oscuro) **no se restylea en esta fase**. Se le agregan configuración de marca, conexión de WhatsApp, origen de cada cita y una bandeja de conversaciones.

**Esfuerzo estimado:** 6–8 semanas de un desarrollador, en 6 fases.  
**Primer entregable usable:** Vitrina + bot reservando en un tenant piloto al final de la fase 2 (~3 semanas).

---

## 2. Decisiones de producto

| Decisión | Elección | Motivo |
|---|---|---|
| Portal público | Vitrina | Vende la marca y reduce el wizard a una barra de reserva. |
| Canal principal | WhatsApp | Es donde el cliente ya escribe; menos fricción y mejor conversión. |
| Canal secundario | Web (`/b/[slug]`) | Desktop, SEO, clientes sin WhatsApp y fallback si el bot falla. |
| Bot | Determinista (botones/listas) | Predecible, barato, testeable y sin alucinaciones de horarios. |
| LLM | No en v1 | Se evalúa solo como parser de intención en fase 5, nunca para decidir disponibilidad. |
| Multi-tenant | Un número/WABA por salón | La marca del salón manda; el webhook resuelve el tenant por `phone_number_id`. |
| Admin | Se mantiene Nocturne | Vitrina es una vitrina pública; el admin prioriza densidad operativa. |
| Precios/pagos | Fuera de v1 | El bot reserva; el cobro sigue en el salón. Se evalúa anticipo después. |

---

## 3. Estado actual vs. objetivo

| Área | Hoy | Objetivo |
|---|---|---|
| Portal `/b/[slug]` | Dark, wizard 4 pasos, sin marca propia | Vitrina clara, hero de marca, carta, equipo, reseñas y barra de reserva |
| Reserva | Solo web | WhatsApp como CTA principal + web como fallback |
| Motor de reservas | `src/app/actions/booking.ts` (server action) | `src/lib/booking/*` reutilizable por web, bot y admin |
| Zona horaria | Hora local del servidor | `Tenant.timezone` + `timestamptz` |
| Solapamientos | Check-then-insert (condición de carrera) | Transacción serializable + constraint en Postgres |
| Origen de cita | No existe | `BookingSource` (`WEB`, `WHATSAPP`, `ADMIN`, `WALK_IN`) |
| Cliente | Teléfono sin unicidad | `@@unique([tenantId, phone])` + opt-in de WhatsApp |
| Admin | Sin guard de sesión, fallback al tenant demo | `src/proxy.ts` + sesión obligatoria |
| Mensajes | No existen | Conversaciones, mensajes, handoff y recordatorios |

---

## 4. Arquitectura propuesta

```text
Cliente WhatsApp
      │
      ▼
Meta WhatsApp Cloud API
      │  POST /api/whatsapp/webhook  (firma X-Hub-Signature-256)
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Webhook                                                    │
│  1. verifica firma        4. resuelve tenant por phone_id   │
│  2. deduplica message_id  5. carga/crea conversación        │
│  3. normaliza evento      6. enruta a la máquina de estados │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  Bot router (estados)     │
              │  reducer puro + efectos   │
              └───────┬───────────┬───────┘
                      │           │
          ┌───────────▼──┐   ┌────▼─────────────────┐
          │ lib/booking  │   │ WhatsApp client      │
          │ dominio      │   │ sendText/Buttons/List│
          └───────┬──────┘   └──────────────────────┘
                  │
          ┌───────▼────────┐
          │  PostgreSQL    │
          └───────▲────────┘
                  │
     ┌────────────┴─────────────┐
     │                          │
  Vitrina /b/[slug]        Admin /admin
  (misma disponibilidad)   (config, bandeja, métricas)
```

**Responsabilidades:**

| Capa | Archivos | Regla |
|---|---|---|
| Dominio | `src/lib/booking/*` | Sin `"use server"`, sin `revalidatePath`, sin Next. Testeable con Vitest. |
| Adaptador web | `src/app/actions/booking.ts` | Valida sesión/entrada y llama al dominio; revalida rutas. |
| Adaptador WhatsApp | `src/lib/whatsapp/*` | Normaliza eventos, máquina de estados, envío. |
| Webhook | `src/app/api/whatsapp/webhook/route.ts` | Firma, dedupe, tenant, respuesta 200 rápida. |
| Recordatorios | `src/app/api/cron/reminders/route.ts` | Cron protegido, lotes con `FOR UPDATE SKIP LOCKED`. |
| Admin | `src/app/admin/*` | Configuración, bandeja y métricas. |

---

## 5. Fase 0 — fundaciones (obligatoria antes del bot)

### 5.1 Extraer el dominio de reservas

Hoy `createBooking` y `getAvailableSlotsAction` viven dentro de `"use server"` y mezclan validación, persistencia y `revalidatePath`. El bot no debe importar una server action de UI.

Crear:

```text
src/lib/booking/
  types.ts          BookingSource, BookingErrorCode, resultados
  availability.ts   getDayAvailability(), getNextAvailableDays()
  create.ts         createAppointment()
  manage.ts         cancelAppointment(), rescheduleAppointment()
  policy.ts         ventana de reserva, lead time, cancelación
```

Contratos principales:

```ts
// availability.ts
export async function getDayAvailability(input: {
  tenantId: string;
  serviceId: string;
  staffId?: string;      // undefined = "cualquiera"
  dateKey: string;       // YYYY-MM-DD en TZ del tenant
}): Promise<DayAvailability>;

export async function getNextAvailableDays(input: {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  days: number;
}): Promise<Array<{ dateKey: string; slots: number }>>;

// create.ts
export type CreateAppointmentInput = {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  dateKey: string;
  time: string;
  customer: { fullName: string; phone: string; email?: string };
  notes?: string;
  source: BookingSource;
  idempotencyKey?: string;
};

export type BookingResult =
  | { ok: true; appointment: AppointmentSummary }
  | { ok: false; code: BookingErrorCode; message: string; alternatives?: Slot[] };
```

`BookingErrorCode` mínimo: `SLOT_TAKEN`, `OUTSIDE_HOURS`, `DAY_OFF`, `BREAK`, `PAST`, `INVALID_SERVICE`, `INVALID_STAFF`, `LEAD_TIME`, `WINDOW_CLOSED`.

Ventajas:

- El bot recibe `alternatives` y responde “ese horario se acaba de ocupar, quedan 15:30 y 16:15” sin reimplementar la lógica.
- El admin manual y la web usan exactamente las mismas reglas.
- Los tests unitarios no necesitan Next.

### 5.2 Zona horaria

**Problema actual:** `new Date(year, month - 1, day, hours, minutes)` usa la zona del servidor. En Vercel el servidor corre en UTC; una cita de 10:00 en CDMX se guardaría como 10:00 UTC (4 horas desplazada).

**Solución:**

- `Tenant.timezone` (IANA, default `America/Mexico_City`).
- `Appointment.startTime` y `endTime` como `@db.Timestamptz(3)`.
- Agregar `date-fns-tz` (`date-fns` ya está instalado) para convertir en los bordes:
  - `fromZonedTime(`${dateKey}T${time}:00`, tenant.timezone)` al escribir.
  - `formatInTimeZone(date, tenant.timezone, "HH:mm")` al leer.
- El bot y la UI hablan siempre en hora del tenant; la BD guarda UTC.
- Migración de datos existentes: revisar `SHOW timezone` del entorno actual y reinterpretar las filas una sola vez con un script; no asumir que ya están en UTC.

**Tests obligatorios:** CDMX (sin DST desde 2022), Madrid o Santiago (con DST), cita que cruza medianoche, cambio de día en UTC vs. local.

### 5.3 Concurrencia y doble reserva

El chequeo actual (`findFirst` de solapamiento y luego `create`) permite que dos requests simultáneos —web y bot— pasen la validación y creen dos citas.

Tres capas:

1. **Transacción serializable** con reintento en `P2034` (máximo 3).
2. **Constraint de exclusión en Postgres** (defensa final):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));
```

3. **Idempotencia**: `Appointment.idempotencyKey` único por tenant. El bot usa el `waMessageId` del botón “Confirmar”; si Meta reintenta el webhook, no se crea una segunda cita.

Si el staff elegido es “cualquiera”, el dominio prueba candidatos en orden (menos citas ese día, luego `id`) y, si el constraint rechaza uno, intenta el siguiente.

### 5.4 Seguridad del admin

Hoy `/admin/*` no redirige a login: si no hay sesión, muestra el tenant demo. Con reservas reales entrando por WhatsApp eso es un bloqueo de producción.

- `src/proxy.ts` (Next 16 reemplazó `middleware.ts` por `proxy.ts`) con matcher `/admin/:path*`; verifica el JWT de `agenda_session` y redirige a `/login?next=...`.
- `getActiveTenantId()` deja de tener fallback; si no hay sesión, error/redirect. Añadir `requireSession()` y `requireTenant()`.
- Los server actions de admin validan sesión y `tenantId` en cada llamada (hoy algunos solo usan el fallback).

### 5.5 Base de tests

No hay framework de tests instalado. Agregar **Vitest** para dominio y **Playwright** para Vitrina/E2E. Los tests de integración usan una base Postgres efímera (docker compose o schema aparte).

---

## 6. Modelo de datos

### 6.1 Campos nuevos en modelos existentes

| Modelo | Campo | Tipo | Nota |
|---|---|---|---|
| `Tenant` | `timezone` | `String @default("America/Mexico_City")` | IANA |
| `Tenant` | `tagline` | `String?` | Hero de Vitrina |
| `Tenant` | `story` | `String?` | Sección “El espacio” |
| `Tenant` | `instagram` | `String?` | Handle o URL |
| `Tenant` | `coverImageUrl` | `String?` | Hero |
| `Tenant` | `brandTheme` | `BrandTheme @default(TERRACOTTA)` | 3 temas curados |
| `Tenant` | `whatsappNumber` | `String?` | Número visible / CTA |
| `Tenant` | `bookingWindowDays` | `Int @default(30)` | Máximo hacia adelante |
| `Tenant` | `minLeadTimeMinutes` | `Int @default(60)` | Antelación mínima |
| `Tenant` | `cancellationWindowHours` | `Int @default(24)` | Política |
| `Service` | `imageUrl` | `String?` | Tarjeta de Vitrina |
| `StaffProfile` | `bio` | `String?` | Vitrina |
| `StaffProfile` | `specialties` | `String?` | “Color y rubios” |
| `Customer` | `whatsappOptIn` | `Boolean @default(false)` | Consentimiento |
| `Appointment` | `source` | `BookingSource @default(WEB)` | Origen |
| `Appointment` | `confirmationCode` | `String` | Código corto visible |
| `Appointment` | `idempotencyKey` | `String?` | Único por tenant |
| `Appointment` | `reminder24hSentAt` | `DateTime?` | Cron |
| `Appointment` | `reminder2hSentAt` | `DateTime?` | Cron |
| `Appointment` | `cancelledAt` | `DateTime?` | Auditoría |
| `Appointment` | `cancelReason` | `String?` | Auditoría |

Cambios de tipo:

- `Appointment.startTime` / `endTime` → `@db.Timestamptz(3)`.
- `Customer` → `@@unique([tenantId, phone])` (antes de crearlo, script de deduplicación).

### 6.2 Modelos nuevos

```prisma
enum BookingSource {
  WEB
  WHATSAPP
  ADMIN
  WALK_IN
}

enum BrandTheme {
  TERRACOTTA
  SAGE
  NOIR
}

enum WhatsAppAccountStatus {
  PENDING
  CONNECTED
  ERROR
  DISABLED
}

enum ConversationMode {
  BOT
  HUMAN
  PAUSED
}

enum ConversationState {
  IDLE
  MENU
  BOOK_SERVICE
  BOOK_STAFF
  BOOK_DATE
  BOOK_SLOT
  BOOK_NAME
  BOOK_CONFIRM
  MANAGE_LIST
  MANAGE_DETAIL
  CANCEL_CONFIRM
  RESCHEDULE_DATE
  RESCHEDULE_SLOT
  HANDOFF
}

enum WhatsAppDirection {
  INBOUND
  OUTBOUND
}

enum WhatsAppMessageStatus {
  RECEIVED
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}
```

```prisma
model WhatsAppAccount {
  id                 String                @id @default(uuid())
  tenantId           String                @unique
  phoneNumberId      String                @unique
  wabaId             String
  displayPhoneNumber String
  accessTokenEnc     String                // AES-256-GCM, nunca en claro
  status             WhatsAppAccountStatus @default(PENDING)
  botEnabled         Boolean               @default(true)
  createdAt          DateTime              @default(now())
  updatedAt          DateTime              @updatedAt

  tenant        Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  conversations WhatsAppConversation[]

  @@map("whatsapp_accounts")
}

model WhatsAppConversation {
  id            String            @id @default(uuid())
  tenantId      String
  waId          String            // E.164 del cliente
  customerId    String?
  mode          ConversationMode  @default(BOT)
  state         ConversationState @default(IDLE)
  stateVersion  Int               @default(1)
  context       Json              @default("{}")
  lastInboundAt DateTime?
  expiresAt     DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  tenant   Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customer Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  messages WhatsAppMessage[]

  @@unique([tenantId, waId])
  @@index([tenantId, lastInboundAt])
  @@map("whatsapp_conversations")
}

model WhatsAppMessage {
  id                String                @id @default(uuid())
  tenantId          String
  conversationId    String
  providerMessageId String?               // id de Meta; único para dedupe
  direction         WhatsAppDirection
  type              String                // text | interactive | template | status
  body              String?
  payload           Json?
  status            WhatsAppMessageStatus @default(RECEIVED)
  error             String?
  createdAt         DateTime              @default(now())

  conversation WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@unique([tenantId, providerMessageId])
  @@index([conversationId, createdAt])
  @@map("whatsapp_messages")
}

model Testimonial {
  id          String   @id @default(uuid())
  tenantId    String
  authorName  String
  quote       String
  rating      Int      @default(5)
  serviceId   String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  service Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)

  @@index([tenantId, isPublished])
  @@map("testimonials")
}

model BusinessHour {
  id        String  @id @default(uuid())
  tenantId  String
  dayOfWeek Int     // 0 = domingo
  openTime  String  @default("09:00")
  closeTime String  @default("19:00")
  isClosed  Boolean @default(false)

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, dayOfWeek])
  @@map("business_hours")
}
```

Agregar las relaciones inversas que Prisma exige: `Tenant.whatsappAccount`, `Tenant.whatsappConversations`, `Tenant.testimonials`, `Tenant.businessHours`; `Customer.whatsappConversations`; `Service.testimonials`.

### 6.3 Migración

1. Agregar campos nullable y tablas nuevas.
2. **Normalizar teléfonos a E.164** antes de tocar `Customer`: hoy conviven formatos con espacios y `+52`, y el `wa_id` de Meta llega sin `+`. Usar `libphonenumber-js` con región por defecto del tenant; guardar siempre `+<país><número>`.
3. Backfill de `confirmationCode` (código base32 de 6–8 caracteres, único por tenant).
4. Backfill de `timezone` y `BusinessHour` desde `Schedule`.
5. Deduplicar `Customer` por `(tenantId, phone)` normalizado antes del unique.
6. Convertir `startTime/endTime` a `timestamptz` con verificación de offset.
7. Crear la constraint de exclusión en una migración SQL manual (`btree_gist` requiere permisos de extensión en el Postgres gestionado).
8. Recién entonces hacer `confirmationCode` obligatorio.

---

## 7. Vitrina (portal público)

### 7.1 Ruta y estructura

Se mantiene `/b/[slug]` para no romper enlaces. Opcional futuro: `/{slug}` con rewrite.

```text
src/app/b/[slug]/
  page.tsx                 // server: datos + SEO + JSON-LD
  loading.tsx              // skeleton en tono claro (no Nocturne)
src/components/vitrina/
  BookingDock.tsx          // client: sheet + barra fija, 4 pasos
  BookingTrigger.tsx       // botón server-safe que emite vitrina:book
  vitrina.module.css       // tokens y layout aislado de Nocturne
  types.ts                 // tipos públicos de la Vitrina
src/lib/vitrina/theme.ts   // temas curados → variables CSS
```

Las secciones viven en `page.tsx` (server component) y solo el dock es cliente. Las tarjetas de servicio y equipo abren el sheet con `BookingTrigger`, que emite un `CustomEvent` en lugar de convertir toda la página en client component.

La página se envuelve en un contenedor con `color-scheme: light`, fondo papel y tokens del tema. El `body` global sigue siendo oscuro para el admin; Vitrina no hereda sus colores.

### 7.2 Secciones (mapeadas al mockup)

| Sección | Datos | Regla |
|---|---|---|
| Barra de marca | `name`, `logoUrl`, `tagline` | “Con Pauta” discreto |
| Hero | `coverImageUrl`, `story`, rating, años, staff count | Si no hay cover, composición tipográfica |
| Cinta de categorías | `Category` | Scroll horizontal en móvil |
| Carta | `Service` (precio, duración, imagen) | 6 visibles + “Ver todos” |
| Equipo | `StaffProfile` (bio, specialties, avatar) | 3–6; “Reservar con…” |
| Reseñas | `Testimonial` publicados | Si no hay, se oculta |
| Barra de reserva | `whatsappNumber`, disponibilidad | Sticky en móvil, flotante en desktop |

### 7.3 Temas curados

No permitir color libre en v1: cada tenant elige un tema y sube logo/cover. Esto evita el riesgo de contraste que ya detectamos en el mockup.

| Tema | Papel | Tinta | Marca | Acento |
|---|---|---|---|---|
| `TERRACOTTA` | `#FBF7F0` | `#17110F` | `#B3402C` | `#F0B429` |
| `SAGE` | `#F7F5EF` | `#16201A` | `#3F5D45` | `#C9A227` |
| `NOIR` | `#F6F4F1` | `#141414` | `#1F2937` | `#C8A96A` |

Los tokens se inyectan como CSS variables en el wrapper (`--vit-paper`, `--vit-ink`, `--vit-brand`, `--vit-accent`, `--vit-line`). Un test calcula contraste de texto (≥ 4.5:1) y de botones (≥ 3:1) para cada tema.

**Regla de uso del acento:** el acento (`#F0B429`, `#C9A227`, `#C8A96A`) no se usa como fondo de botón con texto blanco ni como texto sobre papel; se reserva para detalles sobre el fondo de marca (hero, cita) o para íconos decorativos. Los botones primarios usan `brand` con texto blanco, que sí cumple contraste.

### 7.4 Reserva web (fallback)

- `BookingBar` abre un **sheet** (bottom sheet en móvil, drawer derecho en desktop), no una página nueva.
- Reutiliza los pasos actuales (servicio → profesional → fecha/hora → datos), pero compactos y con el resumen siempre visible.
- Acepta deep links: `/b/[slug]?reservar=1&servicio=<id>&staff=<id>`.
- Si el tenant tiene WhatsApp conectado, el CTA primario es “Reservar por WhatsApp” y el secundario “Reservar aquí”.
- Si el bot está apagado o el número no está conectado, el CTA de WhatsApp se oculta (no se muestra un enlace muerto).

### 7.5 CTA de WhatsApp

```text
https://wa.me/<numero>?text=Hola%2C%20quiero%20reservar%20<servicio>%20en%20<salon>.
```

Reutilizar `getWhatsAppUrl()` de `src/lib/utils.ts`, corrigiendo el prefijo hardcodeado `521` para que use el número del tenant ya normalizado en E.164 (ver 6.3).

### 7.6 SEO y metadatos

- `generateMetadata`: título `{tenant.name} — Reservar cita`, descripción, canonical, OG con cover.
- `generateViewport` con `themeColor` del tema.
- JSON-LD `HairSalon` / `LocalBusiness` con `address`, `telephone`, `openingHours`, `hasOfferCatalog`.
- `h1` único: el nombre del salón o el titular de marca; el resto en `h2`.

### 7.7 Responsive y accesibilidad

- Validar 390 / 768 / 1440 px, como el mockup.
- Barra sticky con `env(safe-area-inset-bottom)`.
- Foco visible, `prefers-reduced-motion`, imágenes con `alt`, botones con `aria-pressed`.
- Sobrescribir dentro de Vitrina el `--ring` global (índigo de Nocturne) por el color de marca, para que el foco no se vea fuera de paleta.
- El sheet atrapa el foco y cierra con `Escape`.

---

## 8. Bot de WhatsApp

> **Decisión de implementación (v1, ya construida):** el piloto usa **Baileys**
> (WhatsApp Web no oficial) en lugar de Meta Cloud API. Se vincula un número
> dedicado escaneando un QR desde `/admin/whatsapp`; la sesión vive en disco
> (`.wa-auth/<tenantId>`) y un worker Node separado (`npm run bot`) mantiene la
> conexión y responde. No hay webhook, firmas ni templates. El motor
> (`src/lib/whatsapp/*`) es determinista con menús de texto numerado y cubre
> reservar, ver próximas citas y cancelar. El resto de esta sección se conserva
> como referencia del camino oficial (Meta/BSP) si el piloto necesita migrar.

### 8.1 Proveedor y onboarding

**Recomendación:** Meta WhatsApp Cloud API directo para el piloto. Sin markup de BSP, control total y el mismo modelo sirve para varios tenants. La capa `WhatsAppProvider` permite cambiar a Twilio/360dialog después sin tocar la máquina de estados, y un `MockProvider` permite probar flujos en local sin gastar mensajes.

Onboarding por tenant (manual en el piloto):

1. Meta Business verificado (del salón o del proveedor, según el modelo). Cada salón es un negocio distinto: su propia WABA y número; la verificación y el alta son parte del costo operativo del piloto.
2. WABA + número del salón (no puede estar activo en otra app de WhatsApp).
3. System User con token permanente y permisos `whatsapp_business_messaging` + `whatsapp_business_management` (app review de Meta).
4. Registrar número y suscribir el webhook al campo `messages`.
5. Guardar `phoneNumberId`, `wabaId`, `displayPhoneNumber` y token cifrado. El `verifyToken` es **global de la app**, no por tenant: el `GET` de verificación de Meta no envía `phone_number_id`, solo el token.

**Entorno local:** el webhook necesita HTTPS público. Usar `cloudflared tunnel` o `ngrok` y el número de prueba de Meta.

**Variables de entorno:**

```bash
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_VERSION=        # versión vigente de Graph API al implementar
WHATSAPP_TOKEN_ENC_KEY=      # 32 bytes base64 para AES-256-GCM
CRON_SECRET=
```

### 8.2 Webhook

`src/app/api/whatsapp/webhook/route.ts`:

- `GET`: verifica `hub.mode=subscribe`, `hub.verify_token` y devuelve `hub.challenge`.
- `POST`:
  1. Leer **raw body** (`await req.text()`), verificar `X-Hub-Signature-256` con HMAC-SHA256 y comparación en tiempo constante.
  2. Parsear y recorrer `entry[].changes[].value.messages[]` y `statuses[]`. Los `statuses` actualizan `WhatsAppMessage.status` (`sent`, `delivered`, `read`, `failed`); no generan respuesta.
  3. Resolver tenant por `metadata.phone_number_id`; si no existe, log y `200`.
  4. Insertar `WhatsAppMessage` con `providerMessageId`; si viola el unique, es un reintento → `200` sin reprocesar.
  5. Cargar/crear conversación; si `mode !== BOT`, guardar y notificar al admin, sin responder.
  6. Ejecutar el reducer y enviar respuestas.
  7. Devolver `200` siempre (salvo firma inválida → `401`). Meta reintenta si no hay `200`, y un error interno no debe generar bucles.

Responder en menos de 5 segundos. Si el envío o el procesamiento pesado crece, usar `after()` de `next/server` solo para analítica; la respuesta al cliente se envía en línea. Para garantía de entrega, outbox + worker (fase 3).

### 8.3 Máquina de estados

`ConversationState` + `context` JSON. Reducer puro en `src/lib/whatsapp/machine.ts`; efectos (DB, envío) en `router.ts`.

| Estado | Entrada | Siguiente | Efecto |
|---|---|---|---|
| `IDLE` / `MENU` | “hola”, “menú” | `MENU` | Menú principal |
| `MENU` | “Reservar” | `BOOK_SERVICE` | Lista de servicios |
| `BOOK_SERVICE` | servicio | `BOOK_STAFF` | Lista de profesionales |
| `BOOK_STAFF` | staff / “cualquiera” | `BOOK_DATE` | Próximos 7 días con cupo |
| `BOOK_DATE` | fecha | `BOOK_SLOT` | Horarios disponibles |
| `BOOK_SLOT` | hora | `BOOK_NAME` o `BOOK_CONFIRM` | Si el cliente ya existe, salta el nombre |
| `BOOK_NAME` | nombre | `BOOK_CONFIRM` | Resumen |
| `BOOK_CONFIRM` | “Confirmar” | `MENU` | Crea cita idempotente + código |
| `MANAGE_LIST` | “Mis citas” | `MANAGE_DETAIL` | Próximas 3 citas |
| `MANAGE_DETAIL` | cita | `CANCEL_CONFIRM` / `RESCHEDULE_DATE` | Detalle |
| `CANCEL_CONFIRM` | “Sí” | `MENU` | Cancela + notifica |
| `RESCHEDULE_DATE` | fecha | `RESCHEDULE_SLOT` | Igual que reserva |
| `RESCHEDULE_SLOT` | hora | `MANAGE_DETAIL` | Actualiza en transacción |
| `HANDOFF` | “Hablar con alguien” | `HANDOFF` | Modo `HUMAN`, avisa al salón |

Reglas:

- Expiración por inactividad: 30 min → `MENU` (no se pierde la cita ya creada).
- Texto libre no reconocido: respuesta con botones, nunca silencio.
- “cancelar”, “menú”, “atrás” funcionan en cualquier estado.
- El contexto guarda IDs, no precios ni nombres; se revalida todo al confirmar.
- `stateVersion` permite migrar el shape del contexto sin romper conversaciones viejas.

### 8.4 Flujo de reserva (detalle)

1. **Servicio:** lista con secciones por categoría. WhatsApp permite 10 filas por lista; si hay más, “Ver más servicios” pagina de a 9.
2. **Profesional:** “Cualquiera” primero, luego hasta 2 nombres en botones; si hay más, lista. Si el servicio solo lo da una persona, se salta el paso.
3. **Fecha:** próximos 7 días con al menos un hueco, en formato “Hoy · mié 28”, “Mañana · jue 29”. Botón “Ver más fechas”.
4. **Hora:** hasta 9 horarios + “Otros horarios”. Si es “cualquiera”, se muestra el profesional asignado en cada opción.
5. **Nombre:** si el teléfono ya es cliente, se usa su nombre. Si no, se sugiere el `profile.name` de WhatsApp con botones “Sí, soy yo” / “Otro nombre”. El teléfono es el `waId`.
6. **Resumen:** servicio, fecha, hora, profesional, duración, precio, dirección. Botones “Confirmar” / “Cambiar”.
7. **Confirmación:** código (`BV-7K3M`), instrucciones, link a Google Calendar y “Cancelar cita”. Se notifica al salón (push/email/WhatsApp interno).

Si el horario se ocupa entre el resumen y el “Confirmar”, el dominio devuelve `SLOT_TAKEN` con alternativas y el bot responde sin perder el contexto.

### 8.5 Mis citas, cancelar y reprogramar

- “Mis citas” busca por `Customer.phone = waId` y muestra hasta 3 próximas.
- Detalle: fecha, hora, servicio, profesional, estado, código.
- Cancelar: confirma, valida `cancellationWindowHours`, actualiza `status=CANCELLED`, `cancelledAt`, `cancelReason`, libera el slot y avisa al salón. Si es tardía, se permite pero se marca “cancelación tardía”.
- Reprogramar: mismo flujo de fecha/hora, excluyendo la cita actual del chequeo de solapamiento; actualiza en una transacción.
- Citas pasadas: “Ya pasó” + historial; no se pueden cancelar.

### 8.6 Recordatorios

Cron cada 5 minutos (`/api/cron/reminders`, protegido con `CRON_SECRET`):

- Ventana 24 h: citas `CONFIRMED` entre +23 h y +25 h sin `reminder24hSentAt`.
- Ventana 2 h: entre +1 h 45 m y +2 h 15 m sin `reminder2hSentAt`.
- Lote con `FOR UPDATE SKIP LOCKED` para soportar varias instancias.
- Envío con **template aprobado**, categoría **Utility** (fuera de la ventana de 24 h de servicio al cliente).
- Botones rápidos “Confirmar” / “Cancelar”; la respuesta reabre la ventana y entra al flujo normal.

Templates a someter desde el día 1 (es-MX):

```text
recordatorio_cita_24h
Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}}.
Responde SÍ para confirmar o NO para cancelar.

recordatorio_cita_2h
Hola {{1}}, tu cita en {{2}} es hoy a las {{3}}. ¡Te esperamos!
```

La aprobación de templates puede tardar 24–72 h; es la dependencia externa más importante del cronograma.

### 8.7 Handoff humano

- “Hablar con alguien” → `mode=HUMAN`, `state=HANDOFF`, aviso al owner (WhatsApp interno o email).
- En modo `HUMAN` el bot no responde; los mensajes se guardan para la bandeja.
- El admin puede responder desde `/admin/mensajes` (ventana de 24 h; fuera de ella, template).
- Vuelta a `BOT`: manual o por inactividad (30 min).
- Si el bot falla dos veces seguidas (error de envío o estado corrupto), ofrece handoff automático.

### 8.8 Copy y límites de WhatsApp

- Tono es-MX, cercano, sin emojis excesivos (máximo 1 por mensaje). El copy vive en un archivo de textos por tenant/locale (`es-MX` por defecto); no hardcodear frases en la máquina de estados.
- Texto ≤ 4096 caracteres; body de interactivo ≤ 1024; título de botón ≤ 20; fila de lista ≤ 24; descripción ≤ 72; máximo 3 botones y 10 filas.
- Formato WhatsApp: `*negrita*`, `_cursiva_`, saltos de línea. No HTML.
- Nunca prometer disponibilidad sin consultar la BD.
- Incluir “Escribe *menú* para volver” en flujos largos.

### 8.9 Errores y reintentos

| Caso | Respuesta |
|---|---|
| Firma inválida | `401`, log y alerta |
| Tenant desconocido | `200`, log |
| Mensaje duplicado | `200`, no reprocesar |
| Tipo no soportado (audio, imagen) | “Por ahora solo puedo con texto o botones” |
| Envío falla | Reintento con backoff (máx. 2), marcar `FAILED`, alertar |
| Estado corrupto | Reset a `MENU` + mensaje de disculpa |
| Sin cupo | Alternativas o “te avisamos si se libera” (fase 3) |

---

## 9. Admin

### 9.1 Configuración (`/admin/configuracion`)

Agregar al formulario actual:

- Identidad: tema, tagline, story, Instagram, cover.
- Operación: timezone, ventana de reserva, lead time, ventana de cancelación.
- Reseñas: publicar/ocultar `Testimonial` (sin editor rich text en v1).
- WhatsApp: número visible, estado de conexión, `botEnabled`, URL de webhook, último evento.

### 9.2 Bandeja de mensajes (`/admin/mensajes`)

- Lista de conversaciones: nombre, último mensaje, hora, modo (`BOT`/`HUMAN`), tenant.
- Detalle: historial, botón “Tomar control”, input de respuesta, selector de template si la ventana está cerrada.
- Badge de “requiere humano”.
- Filtro por tenant (aunque el admin actual es de un tenant, el diseño debe soportar multi-tenant).

### 9.3 Citas

- Badge de origen en cada cita: WhatsApp / Web / Manual.
- Código de confirmación visible.
- Indicador de “confirmada por el cliente” (respuesta al recordatorio).
- Acción “Reenviar confirmación por WhatsApp” (template si la ventana de 24 h está cerrada).

### 9.4 Métricas

- Reservas por canal (últimos 7/30 días).
- Tasa de finalización del bot (conversaciones que llegan a cita / conversaciones que inician reserva).
- Handoffs y motivos.
- Tiempo medio de respuesta.
- No-shows por canal.

---

## 10. Plan por fases

| Fase | Duración | Entregables | Criterio de aceptación |
|---|---|---|---|
| **0 · Fundaciones** | 3–4 d | Dominio extraído, timezone, constraint de solapamiento, auth de admin, Vitest | Dos reservas concurrentes al mismo slot: una sola gana. Cita de 10:00 CDMX se muestra 10:00. `/admin` sin sesión redirige. |
| **1 · Vitrina** | 6–8 d | Portal de marca, temas, sheet de reserva, SEO/JSON-LD, responsive | Un tenant se ve como el mockup; reserva web funciona; 390/768/1440 sin overflow; contraste AA. |
| **2 · Bot MVP** | 8–10 d | Meta app + webhook + máquina de estados + reserva + confirmación | Un usuario real reserva desde WhatsApp; la cita aparece en admin con origen `WHATSAPP`; reintento del webhook no duplica. |
| **3 · Gestión** | 4–6 d | Mis citas, cancelar, reprogramar, recordatorios 24 h/2 h, templates | Cancelar libera el slot; recordatorio llega y “Sí/No” actualiza; reprogramar no solapa. |
| **4 · Operación** | 4–6 d | Ajustes de marca/WhatsApp, bandeja, takeover, badges y métricas | El salón puede configurar su Vitrina y responder un handoff sin tocar la BD. |
| **5 · Piloto** | 3–5 d | Sandbox, pruebas de carga, runbook, feature flags, rollout | 2 semanas con un tenant; 0 dobles reservas; finalización del bot ≥ 60%; handoff ≤ 20%. |

**Total:** 28–39 días de desarrollo (~6–8 semanas), sin contar tiempos de aprobación de Meta.

**Dependencias externas:** verificación de Meta Business, número de WhatsApp del tenant, aprobación de templates. Iniciar el trámite el día 1, en paralelo con la fase 0.

---

## 11. Testing

| Nivel | Qué | Herramienta |
|---|---|---|
| Unitario | Disponibilidad, breaks, DST, lead time, política de cancelación | Vitest |
| Unitario | Reducer de estados y límites de copy | Vitest |
| Integración | Crear cita, solapamiento, idempotencia, cancelar/reprogramar | Vitest + Postgres efímero |
| Integración | Webhook: firma, dedupe, tenant desconocido, status updates | Vitest + fixtures de Meta |
| E2E | Vitrina y sheet de reserva en 3 anchos | Playwright |
| E2E | Flujo WhatsApp contra sandbox/mock | Playwright + proveedor mock |
| Carga | 50 webhooks concurrentes, 20 reservas simultáneas | k6 o script Node |
| Accesibilidad | axe en Vitrina y admin | Playwright + axe |

Casos críticos que no pueden faltar:

- Dos requests simultáneos al mismo staff/hora → una cita.
- Webhook repetido con el mismo `waMessageId` → un solo mensaje y una sola cita.
- Cliente en CDMX reserva 23:30 del domingo → no se corre al lunes.
- “Cualquiera” con dos staff libres → asigna uno y no duplica el horario en la lista.
- Confirmar después de que el slot se ocupó → alternativa, no error genérico.
- Template de recordatorio con variables vacías → no se envía.

---

## 12. Observabilidad

- Logs estructurados: `tenantId`, `conversationId`, `waMessageId`, `state`, `latencyMs`, `result`.
- Métricas: mensajes inbound/outbound, citas por canal, errores por código, handoffs, recordatorios enviados/fallidos, webhooks rechazados.
- Alertas:
  - 5xx del webhook > 1 % en 5 min.
  - Fallos de envío > 2 % en 15 min.
  - Cron sin correr > 15 min.
  - Picos de firma inválida (posible ataque o secreto mal configurado).
- Panel “Salud de WhatsApp” en admin: último evento, estado del número, templates aprobados, bot on/off.

---

## 13. Seguridad y cumplimiento

- **Firma del webhook** obligatoria; comparación en tiempo constante.
- **Token de Meta cifrado** (AES-256-GCM) con clave fuera de la BD; nunca al cliente.
- **Aislamiento:** el tenant se resuelve por `phone_number_id`, jamás por un campo del payload.
- **Idempotencia** y rate limit por `waId` (p. ej. 20 mensajes/min) para evitar bucles.
- **Admin:** proxy + sesión + validación de `tenantId` en cada action. Eliminar el fallback demo.
- **PII:** no loggear cuerpos de mensajes en producción más allá de la retención definida; política de borrado.
- **Consentimiento:** opt-in explícito, link a privacidad en el pie del bot, cumplimiento de la norma de datos del país del tenant (LFPDPPP en México o equivalente).
- **Ventana de 24 h:** respuestas libres solo dentro de la ventana; fuera, templates aprobados.
- **Contenido:** escapar nombres/notas del cliente; no renderizar HTML.
- **Secretos:** `.env` fuera del repo; rotación de tokens; `CRON_SECRET` distinto por entorno.

---

## 14. Rollout

1. **Feature flags:** `WhatsAppAccount.botEnabled` por tenant y un flag de despliegue para Vitrina (variable de entorno o config de la app, no columna).
2. **Piloto** con un solo salón durante 2 semanas.
3. **Semana 1 en modo acompañado:** el bot reserva, pero el owner recibe cada confirmación y puede corregir.
4. **Kill switch:** apagar bot → respuesta “te contactamos en breve” + aviso al admin; el portal web sigue.
5. **Criterios para expandir:** 0 dobles reservas, finalización ≥ 60 %, handoff ≤ 20 %, sin quejas de tono, tiempos < 5 s.
6. **Onboarding de nuevos tenants:** manual al principio (número, WABA, tokens); self-serve con Embedded Signup en fase posterior.

---

## 15. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Meta tarda en verificar Business/número | Alta | Alto | Iniciar trámite día 1; usar número de prueba para desarrollo |
| Templates rechazados | Media | Medio | Copy simple, es-MX, someter temprano, tener fallback de texto dentro de ventana |
| Doble reserva web + bot | Media | Alto | Serializable + constraint + idempotencia + test de concurrencia |
| Bug de timezone | Alta | Alto | `timestamptz` + TZ por tenant + tests DST + migración verificada |
| Costo por conversación/mensaje | Media | Medio | Medir por tenant; preferir utility templates; revisar tarifa vigente por país |
| Operación multi-número | Media | Alto | Un WABA por tenant; runbook; a futuro Embedded Signup o BSP |
| Bot no entiende texto libre | Alta | Medio | Botones/listas + fallback claro + handoff; LLM recién en fase 5 |
| El salón no adopta la bandeja | Media | Medio | Notificaciones al owner; takeover simple; no obligar a usarla para reservar |
| Scope creep (pagos, fidelidad, IA) | Alta | Medio | Congelar alcance v1; registrar ideas para después |
| Admin sin auth en producción | Alta | Crítico | Fase 0 obligatoria antes de conectar el bot |

---

## 16. Decisiones abiertas

Necesito tu confirmación en estas seis antes de empezar la fase 0:

1. **Proveedor:** Meta Cloud API directo (recomendado) o un BSP (Twilio/360dialog) por velocidad de onboarding.
2. **Número:** ¿cada tenant conecta su propio WhatsApp (recomendado) o usamos un número compartido para el piloto?
3. **Handoff humano:** ¿entra en v1 (fase 4) o lo dejamos para después del piloto?
4. **Cobros/anticipo:** ¿fuera de alcance en v1? (recomendado).
5. **Admin:** ¿se mantiene Nocturne y solo se le agregan módulos, o también querés restylearlo con la estética de Vitrina?
6. **Tenant piloto:** ¿Barbería Vintage del seed o un salón real? Si es real, necesitamos su número, horarios y textos de marca.

---

## 17. Primeros 3 días (si aprobás el plan)

**Día 1**

- Cerrar las decisiones abiertas.
- Crear la app de Meta y el número de prueba; anotar `phoneNumberId`, `wabaId`, token y app secret.
- Definir `Tenant.timezone` y el esquema de migración.

**Día 2**

- Extraer `src/lib/booking/*` y hacer que `actions/booking.ts` sea un wrapper.
- Implementar timezone + tests de DST.
- Agregar la constraint de exclusión y el test de concurrencia.

**Día 3**

- `src/proxy.ts` + `requireSession()`; quitar el fallback demo.
- Esqueleto de Vitrina con tokens de tema y datos reales del seed.
- `GET /api/whatsapp/webhook` verificando el challenge; `POST` con firma y dedupe.

Con eso, la fase 0 queda cerrada y la fase 1 (Vitrina) puede correr en paralelo con el trámite de Meta.

---

## 18. Hallazgos de implementación (fase 0 + Vitrina)

Lo que cambió respecto al plan original al llevarlo al código. Sirve para no repetir los mismos errores cuando se retome el bot.

### 18.1 Turbopack y CSS Modules

`next.config.ts` necesitaba el loader de Tailwind para que las utilidades existieran (Next 16.4.1 no lo aplica solo), pero la regla `"*.css"` se aplicaba a **todos** los CSS, incluidos los `.module.css`. Efecto: el import devolvía `undefined`, las clases salían como `class="undefined"` y Vitrina quedaba sin estilos (sin error de build).

Regla correcta, limitada al CSS global:

```ts
turbopack: {
  rules: {
    "./src/app/globals.css": {
      loaders: ["@tailwindcss/turbopack"],
      as: "*.css",
    },
  },
},
```

Si en el futuro se agrega otro CSS global, hay que sumarlo como entrada propia. Nunca volver a `"*.css"`.

### 18.2 `composes` no es compatible

`vitrina.module.css` usaba `composes: input;` en `.textarea`. Con la configuración de Turbopack del proyecto no se resolvió y dejaba la clase vacía. Se eliminó: los estilos compartidos se repiten o se agrupan con selectores, sin `composes`.

### 18.3 El admin delega en el dominio

`createManualAppointmentAction` ya no calcula fechas con `new Date(year, month - 1, day, ...)`: eso usaba la zona del servidor y en Vercel (UTC) movía las citas. Ahora llama a `createAppointment({ source: "ADMIN" })`, igual que la web, y devuelve `alternatives` cuando el horario se ocupó. `updateAppointmentStatusAction` setea `cancelledAt` al cancelar.

### 18.4 Carga de disponibilidad sin `setState` en efectos

El lint de React (`react-hooks/set-state-in-effect`) rechazaba cargar días y slots desde un `useEffect`. La carga se movió a los handlers (`openAt`, selección de servicio/profesional/fecha), con refs de request para descartar respuestas viejas. El único efecto que queda es el listener de `vitrina:book`, el bloqueo de scroll y `Escape`.

### 18.5 Timezone y concurrencia (verificado)

`scripts/smoke-booking.ts` con `TZ=UTC`:

- 09:00 en `America/Mexico_City` se guarda como `15:00Z`.
- Tres reservas simultáneas al mismo slot → **1 ganadora**, las otras reciben `SLOT_TAKEN` (nunca `UNKNOWN`).

La garantía viene de tres capas: `Serializable` + reintento con backoff, constraint `appointments_no_overlap` y `idempotencyKey`. `prisma db push` **no** crea la constraint: hay que aplicar `prisma/sql/001_booking_constraints.sql` con `psql` (sin `?schema=public` en la URL).

### 18.6 Detalles de runtime

- `Prisma.AppointmentStatus` no existe en runtime: importar `AppointmentStatus` desde `@prisma/client`.
- `Customer.phone` es E.164 único por tenant; web y admin normalizan con `normalizePhone`.
- El CTA de WhatsApp usa `whatsappUrl()` de `src/lib/booking/phone.ts` (sin el prefijo `521` hardcodeado de `getWhatsAppUrl`), y solo se muestra si el número es válido. No hay bot conectado: abre el chat.
- El enlace de WhatsApp no reemplaza la reserva web en esta fase; es un canal secundario.
