# AgendaSaaS - Plataforma de Reservas para Salones y Barberías

Plataforma SaaS multi-inquilino (multi-tenant) desarrollada con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **Prisma ORM** con base de datos **PostgreSQL**.

---

## 🚀 Características del Primer Avance

- **Arquitectura Multi-tenant:** Aislamiento lógico de negocios mediante `tenantId`.
- **Base de Datos PostgreSQL:** Modelado completo en Prisma para:
  - `Tenant`: Negocios independientes (con slug para portal público).
  - `User` y `StaffProfile`: Equipo de trabajo (barberos, estilistas, coloristas) con colores identificadores y horarios semanales.
  - `Category` y `Service`: Catálogo de servicios con precios y duraciones exactas en minutos.
  - `Customer` y `Appointment`: Gestión de clientes y reservas con prevención de solapamientos en tiempo real.
- **Portal de Reserva Público (`/b/[slug]`):**
  - Flujo de reserva interactivo en 4 pasos (Servicio $\rightarrow$ Profesional $\rightarrow$ Fecha/Hora $\rightarrow$ Datos de contacto).
  - Confirmación instantánea y registro directo en base de datos.
- **Panel de Administración (`/admin`):**
  - Métricas de ingresos estimados, citas activas y colaboradores.
  - Lista de citas en vivo con estados (`CONFIRMED`, `PENDING`, etc.).
  - Acceso directo al portal del cliente.

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 3000)
npm run dev

# Sincronizar esquema de Prisma con PostgreSQL
npm run db:push

# Poblar datos de prueba (Tenant Barbería & Spa Vintage, staff y citas)
npm run db:seed

# Compilar para producción
npm run build

# Worker del bot de WhatsApp (proceso aparte, mantenerlo corriendo)
npm run bot

# Prueba de humo del bot: reserva, consulta y cancela contra la base real
npm run bot:smoke
```

---

## 🤖 Bot de WhatsApp

El bot usa **Baileys** (WhatsApp Web no oficial) desde un worker Node separado de Next:

- Se vincula un **número dedicado** escaneando un QR desde `/admin/whatsapp`.
- Las credenciales quedan en `.wa-auth/<tenantId>` (ignorado por git). La base
  guarda solo el estado visible: QR, número, errores y actividad.
- El motor vive en `src/lib/whatsapp/*` y usa el mismo dominio de reservas que
  la web y el admin. En v1 puede **reservar, ver próximas citas y cancelar**.
- Los menús son de texto numerado (sin botones ni listas nativas).
- Si el worker se apaga, el panel lo avisa: la conexión de WhatsApp no vive
  dentro de Next.

> Baileys no es la API oficial: un uso intensivo puede provocar bloqueos. Por
> eso conviene un número exclusivo para el bot, nunca el principal del salón.


---

## 🌐 Rutas Principales

- `/`: Portada SaaS con métricas en tiempo real de la base de datos.
- `/b/barberia-vintage`: Portal público de agendamiento para clientes del negocio de demostración.
- `/admin`: Panel de control y agenda del negocio.
- `/admin/whatsapp`: Conexión del bot, QR y actividad reciente del canal.

---

## 📐 Plan de evolución

- [Vitrina + reservas por WhatsApp](docs/plan-vitrina-whatsapp.md): plan de producto y arquitectura para el portal de marca y el bot de WhatsApp.
- [Exploraciones de diseño](design/README.md): mockups estáticos de las direcciones evaluadas.

