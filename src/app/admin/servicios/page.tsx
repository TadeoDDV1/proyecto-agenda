import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { createServiceAction } from "@/app/actions/admin";
import { Layers, Plus, Clock } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";

export default async function AdminServicesPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        categories: true,
        services: {
          include: { category: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      include: {
        categories: true,
        services: {
          include: { category: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!tenant) return null;

  return (
    <main className="p-5 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        eyebrow="Administración"
        title="Catálogo de Servicios"
        description="Configura servicios, duraciones y precios para tu portal de reservas."
        action={<Badge>{tenant.services.length} servicios</Badge>}
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Formulario */}
        <Card className="lg:col-span-5 p-6">
          <CardHeader
            icon={<Plus className="w-3.5 h-3.5" />}
            title="Nuevo servicio"
            className="pb-5 mb-5"
          />

          <form
            action={async (formData) => {
              "use server";
              await createServiceAction(formData);
            }}
            className="space-y-4"
          >
            <Field label="Nombre del servicio" required htmlFor="service-name">
              <Input
                type="text"
                name="name"
                required
                placeholder="Ej. Fade & Diseño con Navaja"
              id="service-name"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duración (min)" required htmlFor="service-duration">
                <Input
                  type="number"
                  name="durationMinutes"
                  required
                  min={5}
                  step={5}
                  defaultValue={30}
                id="service-duration"
                />
              </Field>
              <Field label={`Precio (${tenant.currency})`} required htmlFor="service-price">
                <Input
                  type="number"
                  name="price"
                  required
                  min={0}
                  step={1}
                  defaultValue={250}
                id="service-price"
                />
              </Field>
            </div>

            <Field label="Categoría" htmlFor="service-category">
              <Input
                type="text"
                name="categoryName"
                placeholder="Cortes, Barba, Faciales..."
                defaultValue="Cortes de Cabello"
              id="service-category"
              />
            </Field>

            <Field label="Descripción (opcional)" htmlFor="service-description">
              <Textarea name="description" rows={2} placeholder="Qué incluye el servicio..." id="service-description" />
            </Field>

            <Button type="submit" className="w-full">
              Guardar servicio
            </Button>
          </form>
        </Card>

        {/* Listado */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Servicios configurados
            </h3>
            <span className="text-[11px] font-mono text-dim">
              Disponibles para reserva
            </span>
          </div>

          {tenant.services.map((srv) => (
            <Card
              key={srv.id}
              className="p-4 transition flex items-start justify-between gap-4 hover:border-border-strong"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground">{srv.name}</h4>
                  {srv.category && <Badge>{srv.category.name}</Badge>}
                </div>
                {srv.description && (
                  <p className="text-xs mb-2 leading-relaxed text-muted">
                    {srv.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-dim" />
                    {srv.durationMinutes} min
                  </span>
                  <span className="font-mono font-medium text-accent-warm">
                    {formatCurrency(Number(srv.price), tenant.currency)}
                  </span>
                </div>
              </div>

              <Badge tone={srv.isActive ? "success" : "default"} className="flex-shrink-0">
                {srv.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </Card>
          ))}

          {tenant.services.length === 0 && (
            <EmptyState
              icon={<Layers className="w-5 h-5" />}
              title="Sin servicios configurados"
              description="Crea tu primer servicio para que tus clientes puedan reservar."
            />
          )}
        </div>
      </div>
    </main>
  );
}
