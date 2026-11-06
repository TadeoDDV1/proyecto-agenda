# Plan — Pauta multi-giro + nuevo sistema visual

**Estado:** propuesta para aprobación  
**Fecha:** 3 nov 2026  
**Alcance:** convertir el producto de “agenda para barberías” en una plataforma horizontal de citas para cualquier negocio que opere con agenda, y reemplazar el sistema visual Maison por una identidad propia, operativa y no genérica.

---

## 1. Resumen ejecutivo

Hoy el producto funciona, pero cuenta una sola historia: barbería. Esa historia está en el copy, en el seed, en los colores del equipo, en la portada del portal y en los formularios. Si mañana entra un dentista, tiene que “traducir” la interfaz a mano.

La propuesta tiene dos ejes:

1. **Producto horizontal:** un registro de **giros** (`Vertical`) que define vocabulario, catálogo inicial, roles del equipo, métricas y plantilla de portal. El motor de reservas sigue siendo uno solo.
2. **Identidad visual “Riel”:** papel claro, tinta negra, tipografía grotesca con carácter, monoespaciada para horas y un color señal. Sin terciopelo, sin latón, sin cursivas de salón. La agenda se ve como un tablero de horarios, no como una landing de lujo.

El objetivo no es “soportar todo”: es que **barbería, salón de belleza, dental, spa y clínica** se sientan nativos desde el registro, con datos precargados y sin tocar código.

**Esfuerzo estimado:** 3–4 semanas de un desarrollador para el MVP multi-giro: 14 giros configurados, 2 plantillas de portal (Studio/Clinic) y 4 demos completos.  
**Primer entregable demostrable:** registro con selección de giro + catálogo precargado + portal y admin con vocabulario del giro (~2 semanas).

---

## 2. Diagnóstico: por qué se siente genérico

### 2.1 Diseño

- **Dark boutique + latón + serif itálica** es hoy el default de cualquier SaaS “premium”. No comunica agenda ni operación: comunica restaurante de autor.
- El portal público usa una plantilla editorial pensada para barbería: “la carta”, “el equipo”, “el espacio”, reseñas. Un dentista no tiene “carta” ni “sillón”; tiene tratamientos, doctor, seguro y primera consulta.
- La landing habla de “salón”, “sillas”, “corte”, “barbero” y muestra una agenda de barbería. El visitante de otro giro no se reconoce.
- Los colores de especialistas, el seed y las fotos refuerzan una sola vertical.

### 2.2 Producto

- El modelo de datos es razonablemente genérico (`Tenant`, `StaffProfile`, `Service`, `Appointment`), pero hay supuestos duros:
  - Solo existen personas como recurso agendable; no consultorios, cabinas, sillones ni equipos.
  - Un solo rango de horario por día; no turnos partidos (mañana/tarde) ni múltiples sedes.
  - Sin campos de intake (motivo, alergias, seguro, primera visita).
  - Sin buffers de preparación/limpieza entre citas.
  - Sin roles por giro (barbero, estilista, doctor, higienista, terapeuta).
- El onboarding pide nombre, slug y moneda, pero no pregunta **qué tipo de negocio es**. Por eso no puede precargar nada.
- El portal tiene secciones fijas; no hay variantes por giro.
- El seed crea un solo tenant de barbería. No hay forma de enseñar el producto a un dentista.

---

## 3. Decisión: plataforma horizontal con giros curados

No se trata de un configurador infinito. Se soportan **giros curados** con plantillas mantenidas por el producto. Cada giro declara:

| Pieza | Qué define |
|---|---|
| Vocabulario | “servicio/tratamiento”, “profesional/doctor”, “silla/consultorio”, “cita/consulta”. |
| Catálogo inicial | Categorías y servicios con duración y precio sugeridos. |
| Equipo | Roles y especialidades típicas. |
| Agenda | Duración por defecto, buffers, horario base, recursos. |
| Panel | KPIs relevantes (ocupación, no-show, recall, ticket). |
| Portal | Secciones, orden y copy. |
| Color de giro | Acento secundario para chips, columnas y portal. |

**Giros para v1:**

| ID | Nombre | Acento | Portal |
|---|---|---|---|
| `BARBERSHOP` | Barbería | clay `#C2410C` | Studio |
| `HAIR_SALON` | Salón de belleza | plum `#7C3AED` | Studio |
| `NAILS` | Uñas y estética de manos | rose `#BE123C` | Studio |
| `SPA` | Spa / bienestar | sage `#4D7C5F` | Studio |
| `MASSAGE` | Masajes y terapia corporal | teal `#0F766E` | Studio |
| `DENTAL` | Clínica dental | teal `#0F766E` | Clinic |
| `MEDICAL` | Consultorio médico | blue `#1D4ED8` | Clinic |
| `PHYSIO` | Fisioterapia | cyan `#0E7490` | Clinic |
| `PSYCHOLOGY` | Psicología y terapia | violet `#6D28D9` | Clinic |
| `NUTRITION` | Nutrición | olive `#4D7C0F` | Clinic |
| `OPTOMETRY` | Optometría | sky `#0369A1` | Clinic |
| `TATTOO` | Tatuaje y piercing | amber `#B45309` | Studio |
| `VETERINARY` | Veterinaria | green `#15803D` | Clinic |
| `OTHER` | Otro negocio con agenda | graphite `#52525B` | Studio |

La lista vive en código (`src/lib/verticals/`), no en base de datos. Así se versiona, se testea y se corrige sin migraciones.

### 3.1 “Carga inicial” por giro

Esto es lo que hoy falta y es la clave para que se sienta nativo:

- Al elegir giro en el registro, se precargan:
  - 2–4 categorías.
  - 5–8 servicios con duración y precio de ejemplo editables.
  - 1–3 profesionales de ejemplo o invitación a crear el primero.
  - Horario base y buffers típicos.
  - Campos de intake sugeridos.
- El usuario puede empezar con **“Cargar plantilla”** o con **“Empezar en blanco”**.
- La plantilla se copia a la base del tenant; no queda vinculada. Editable y borrable.
- En el onboarding se muestra una vista previa del portal con el giro elegido.
- Los demos (`/demo`) crean tenants completos por giro para prospectos.

---

## 4. Nuevo sistema visual: “Riel”

### 4.1 Concepto

**La agenda como tablero de horarios.** Riel toma la lógica visual de una estación o un horario impreso: horas alineadas, columnas, líneas finas, etiquetas monoespaciadas y bloques de color que se leen de un vistazo. No es una marca de barbería; es una herramienta de tiempo.

Palabras clave: **precisión, oficio, claridad, horizontalidad**.  
Anti-referencias: lujo oscuro, dorado, serif itálica, degradados, glassmorphism, “boutique”.

### 4.2 Tokens

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#F4F1EA` | Fondo principal |
| `--paper-2` | `#EAE5DA` | Superficies secundarias |
| `--ink` | `#121210` | Texto y bordes fuertes |
| `--ink-2` | `#4A4740` | Texto secundario |
| `--line` | `#CFC8BA` | Hairlines |
| `--signal` | `#1F3BFF` | Acción primaria (ultramar) |
| `--signal-ink` | `#FFFFFF` | Texto sobre señal |
| `--ok` | `#1F7A4D` | Confirmado |
| `--warn` | `#A15C00` | Pendiente |
| `--danger` | `#B42318` | Cancelado |
| `--accent` | por giro | Chips, columnas, portal |

Reglas:
- **Sin sombras.** La jerarquía se construye con líneas, espacio y color.
- **Radios 2–6 px.** Nada de tarjetas de 16 px.
- **Un solo color señal** en el producto (ultramar). El acento del giro solo aparece en identificadores y portal.
- **Tipografía:**
  - Display: `Bricolage Grotesque` (carácter, no genérica).
  - UI: `Instrument Sans`.
  - Datos/horas: `IBM Plex Mono`.
- **Fondos planos.** Sin degradados decorativos. Solo el hero del portal puede tener un patrón de trama o bloque sólido de acento.

### 4.3 Componentes firma

- **Rail de horas:** columna fija monoespaciada, con línea de “ahora” en señal.
- **Bloque de cita:** rectángulo con barra de acento a la izquierda, hora y servicio; sin sombra.
- **Sello de estado:** cuadrado con borde, texto monoespaciado (`CONFIRMADA`, `NO ASISTIÓ`).
- **Chip de giro:** rectángulo pequeño con el acento del giro y su nombre.
- **Command bar:** barra superior con búsqueda, fecha y acción primaria; reemplaza el header decorativo.
- **Tabla de servicios:** filas con precio alineado a la derecha y duración en mono; no tarjetas con foto.
- **Portal “hoja de negocio”:** encabezado con nombre, giro y dirección; tratamientos en lista; barra de reserva fija.

### 4.4 Qué se elimina de Maison

- Fondo espresso y latón.
- Fraunces/itálicas decorativas.
- Tarjetas `rounded-2xl` con sombra.
- Gradientes radiales.
- Copy “salón”, “boutique”, “silla”, “carta”.
- Fotos de barbería como identidad del producto.

---

## 5. Arquitectura multi-giro

### 5.1 Registro de giros

```ts
// src/lib/verticals/types.ts
export type VerticalId =
  | "BARBERSHOP" | "HAIR_SALON" | "DENTAL" | "SPA"
  | "MEDICAL" | "NAILS" | "TATTOO" | "OTHER";

export interface VerticalConfig {
  id: VerticalId;
  label: string;
  shortLabel: string;
  accent: string;
  icon: LucideIcon;
  terms: {
    service: string;        // Servicio / Tratamiento / Consulta
    services: string;
    staff: string;          // Profesional / Doctor / Especialista
    staffPlural: string;
    resource: string;       // Silla / Consultorio / Cabina
    appointment: string;    // Cita / Consulta
    customer: string;       // Cliente / Paciente
  };
  onboarding: {
    categories: string[];
    services: Array<{ name: string; duration: number; price: number; category: string }>;
    staffRoles: string[];
    intakeFields: string[];
  };
  portal: {
    template: "studio" | "clinic";
    sections: Array<"services" | "team" | "reviews" | "space" | "insurance" | "firstVisit">;
  };
  dashboard: {
    kpis: Array<"revenue" | "occupancy" | "noShow" | "recall" | "ticket">;
  };
}
```

- `getVertical(id)` devuelve siempre una configuración válida (`OTHER` como fallback).
- Toda la UI lee términos de aquí; no hay strings “barbero” hardcodeados.
- Tests de snapshot por giro para evitar que un cambio rompa el vocabulario.

### 5.2 Modelo de datos

Cambios mínimos para v1:

```prisma
enum Vertical {
  BARBERSHOP
  HAIR_SALON
  DENTAL
  SPA
  MEDICAL
  NAILS
  TATTOO
  OTHER
}

model Tenant {
  vertical         Vertical @default(OTHER)
  onboardingState  String   @default("PENDING")
  settings         Json     @default("{}")
  // …
}

model Service {
  bufferBefore  Int @default(0)
  bufferAfter   Int @default(0)
  intakeSchema  Json?
  // …
}

model Appointment {
  intake       Json?
  reason       String?
  // …
}
```

Opcional para fase 2 (no bloquea v1):

```prisma
model Resource {
  id        String @id @default(uuid())
  tenantId  String
  name      String        // “Silla 1”, “Consultorio 2”
  kind      String        // chair | room | equipment
  isActive  Boolean @default(true)
}

model Schedule {
  // permitir más de un rango por día
  // o crear ScheduleBlock[]
}
```

### 5.3 Onboarding

Nuevo flujo:

1. **Giro** — tarjetas con icono y acento. Define el resto del formulario.
2. **Negocio** — nombre, slug, moneda, zona horaria.
3. **Carga inicial** — “Usar plantilla de {giro}” o “Empezar en blanco”. Vista previa del catálogo.
4. **Equipo** — roles sugeridos según giro.
5. **Horario** — horario base sugerido, editable.
6. **Listo** — enlace público + checklist de primeros pasos.

El paso 1 no se puede saltar. Si el usuario elige “Otro”, se usa `OTHER` y un onboarding genérico.

### 5.4 Admin

- **Vocabulario dinámico:** `servicios/tratamientos`, `equipo/profesionales`, `clientes/pacientes`.
- **Dashboard por giro:** 
  - Barbería/salón: ingresos, ocupación, próxima cita.
  - Dental/clínica: citas de hoy, no-show, recall (pacientes a reagendar), tratamientos pendientes.
- **Calendario:** recurso por columna (profesional en v1; consultorio/cabina en fase 2). Buffers visibles como franja rayada.
- **Servicio:** campos de buffer, intake y “requiere aprobación” según giro.
- **Portal:** configuración de secciones permitidas por giro.

### 5.5 Portal público

Dos plantillas base, no una por giro:

| Plantilla | Giros | Secciones |
|---|---|---|
| `studio` | barbería, salón, uñas, tattoo, spa | Servicios, equipo, reseñas, espacio, reserva |
| `clinic` | dental, médico | Tratamientos, doctores, primera visita, seguro, ubicación, reserva |

El giro define:
- Acento y wordmark.
- Copy y orden de secciones.
- Campos de servicio (tratamiento vs servicio).
- CTA (“Reservar cita” vs “Pedir consulta”).
- Textos de primera visita.

Los temas claros actuales (Terracotta/Sage/Noir) se retiran o se convierten en variantes de papel; el acento lo pone el giro.

### 5.6 Seeds y demos

Crear 4 tenants de demostración:

| Slug | Giro | Contenido |
|---|---|---|
| `barberia-vintage` | Barbería | Se conserva, adaptado a Riel |
| `salon-lumen` | Salón de belleza | Color, corte, tratamientos capilares |
| `dental-norte` | Dental | Limpieza, ortodoncia, blanqueamiento, primera visita |
| `spa-marea` | Spa | Masajes, faciales, rituales |

- `/demo` muestra los cuatro y permite entrar a su portal o panel.
- Cada seed usa la plantilla del giro; no datos copiados a mano.

---

## 6. Plan por fases

### Fase 0 — Decisiones y auditoría (1–2 días)
- Confirmar giros v1 y prioridad comercial.
- Inventariar strings y supuestos de barbería en código.
- Aprobar Riel (o variante) con prototipo.

**Aceptación:** documento de giros + inventario de copy hardcodeado.

### Fase 1 — Registro de giros y tokens visuales (2–3 días)
- `src/lib/verticals/*` con configs, términos y plantillas.
- Tokens Riel en `globals.css`; tipografías; componentes base (botón, input, panel, sello, rail).
- Tests de config.

**Aceptación:** los componentes no contienen strings de barbería; un test recorre los 14 giros.

### Fase 2 — Onboarding con carga inicial (3–4 días)
- Selector de giro.
- Precarga de categorías, servicios, equipo y horario.
- “Usar plantilla / empezar en blanco”.
- Vista previa del portal.

**Aceptación:** crear un tenant dental desde cero deja 6 tratamientos, 2 doctores y horario listo para reservar en < 2 minutos.

### Fase 3 — Admin multi-giro (4–6 días)
- Vocabulario dinámico en sidebar, páginas, formularios y emails.
- Dashboard por giro.
- Buffers e intake en servicios/citas.
- Calendario con acento de giro.

**Aceptación:** el mismo código muestra “Paciente/Doctor/Tratamiento” en dental y “Cliente/Barbero/Servicio” en barbería, sin condicionales dispersos.

### Fase 4 — Portal por plantilla (4–6 días)
- `studio` y `clinic`.
- Secciones y copy por giro.
- Barra de reserva y deep links.
- SEO/JSON-LD por tipo de negocio.

**Aceptación:** los cuatro demos se ven claramente distintos y cualquier giro reserva contra la misma agenda.

### Fase 5 — Seeds, demos y migración (2–3 días)
- 4 tenants demo.
- Migración del tenant actual: `vertical = BARBERSHOP`, copy intacto.
- Datos existentes: no romper citas, clientes ni servicios.

**Aceptación:** `/demo` con 4 tarjetas; el tenant actual sigue funcionando.

### Fase 6 — QA y accesibilidad (2–3 días)
- E2E de reserva por giro.
- Contraste AA en Riel y en los 8 acentos.
- Responsive 390/768/1440.
- Tests de vocabulario y de plantillas.

**Total:** 18–27 días de desarrollo (~3–4 semanas).

---

## 7. Migración de lo que ya existe

1. Agregar `Tenant.vertical` con default `OTHER`; backfill del tenant actual a `BARBERSHOP`.
2. Agregar buffers e intake como nullable/default 0; no requieren migración de datos.
3. Reemplazar strings de barbería por `verticalConfig.terms` de forma incremental, página por página.
4. Mantener el motor de reservas y la constraint de exclusión intactos.
5. El portal actual pasa a plantilla `studio` con acento de barbería; no se pierde ninguna sección.
6. Los temas Terracotta/Sage/Noir se retiran en fase 4; si se quieren conservar, quedan como “papeles” y el acento lo define el giro.

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Intentar soportar demasiados giros y diluir el producto | 14 giros configurados, 4 con demo completo; `OTHER` genérico; plantillas curadas. |
| Condicionales de giro dispersos por la UI | Un solo registro `verticals` y términos tipados. |
| El portal clínico queda a medias | Plantilla `clinic` con contenido mínimo real: tratamientos, doctores, primera visita, seguro. |
| Datos de demo irreales | Seeds generados desde la config del giro y revisados por alguien del sector. |
| El cambio visual rompe accesibilidad | Tokens con contraste calculado y tests; nada de texto sobre acento sin verificar. |
| Migración de datos del tenant actual | Backfill explícito + smoke de reservas existentes. |

---

## 9. Decisiones tomadas

1. **Nombre del producto:** **Pauta**. Riel queda como nombre del sistema visual.
2. **Dirección visual:** **Riel aprobado** (papel, tinta, ultramar, Bricolage/Instrument/Plex Mono).
3. **Giros v1:** los **14** del registro, incluidos uñas, tatuaje, fisioterapia, psicología, nutrición, optometría y veterinaria.
4. **Recursos:** **sí entran en v1**. `Resource` (silla, consultorio, cabina, equipo) y `Appointment.resourceId` ya están en el esquema; la UI de calendario por recurso se completa en fase 3.
5. **Plantillas:** `Studio` y `Clinic` alcanzan para v1; una tercera variante se evalúa con uso real.
6. **Alcance comercial:** una sola landing horizontal, con el bloque de 14 giros y demos por vertical.

---

## 10. Estado de implementación

Ya está en el working tree:

- Tokens y tipografía Riel aplicados a la app (admin, landing, auth).
- `src/lib/verticals/index.ts` con 14 giros, términos, acentos y catálogos iniciales.
- Registro con selector de giro y **carga inicial** de categorías y servicios.
- `Tenant.vertical`, `Tenant.onboardingState`, `Resource` y `Appointment.resourceId` en Prisma.
- Rebrand a **Pauta** en la interfaz y metadatos.
- Sidebar y páginas de servicios/equipo/clientes usando el vocabulario del giro.

Pendiente para las siguientes fases:

1. Vista de calendario por recurso (consultorio/cabina) y buffers visuales.
2. Plantilla `Clinic` real en el portal público (hoy el portal sigue siendo Studio).
3. Seeds de salón, dental y spa + `/demo`.
4. KPIs por giro y onboarding de varios pasos.
5. Tests de vocabulario y E2E de reserva por giro.

---

## 11. Siguiente paso recomendado

1. Revisar la app en local con el tenant de barbería y crear un tenant de prueba dental para ver la carga inicial.
2. Completar fase 3: calendario por recurso + buffers.
3. Implementar la plantilla `Clinic` y los seeds de los cuatro demos.
4. Cerrar con tests de vocabulario y accesibilidad.
