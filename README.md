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
```

---

## 🌐 Rutas Principales

- `/`: Portada SaaS con métricas en tiempo real de la base de datos.
- `/b/barberia-vintage`: Portal público de agendamiento para clientes del negocio de demostración.
- `/admin`: Panel de control y agenda del negocio.
