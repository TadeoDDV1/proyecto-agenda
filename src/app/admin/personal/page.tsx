import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createStaffAction } from "@/app/actions/admin";
import { Plus, User, Phone, Mail, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
} from "@/components/ui";

const staffColors = [
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

export default async function AdminStaffPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: {
      staff: {
        include: {
          schedules: true,
          appointments: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tenant) notFound();

  return (
    <main className="p-5 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        eyebrow="Administración"
        title="Equipo & Colaboradores"
        description="Gestiona barberos, estilistas y especialistas con sus colores y turnos."
        action={<Badge>{tenant.staff.length} especialistas</Badge>}
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Formulario */}
        <Card className="lg:col-span-5 p-6">
          <CardHeader
            icon={<Plus className="w-3.5 h-3.5" />}
            title="Nuevo especialista"
            className="pb-5 mb-5"
          />

          <form
            action={async (formData) => {
              "use server";
              await createStaffAction(formData);
            }}
            className="space-y-4"
          >
            <Field label="Nombre / Apodo" required htmlFor="staff-name">
              <Input type="text" name="displayName" required placeholder="Ej. Mateo Silva" id="staff-name" />
            </Field>

            <Field label="Teléfono / WhatsApp" htmlFor="staff-phone">
              <Input type="tel" name="phone" placeholder="+52 55 9876 5432" id="staff-phone" />
            </Field>

            <Field label="Correo electrónico" htmlFor="staff-email">
              <Input
                type="email"
                name="email"
                placeholder="especialista@negocio.com"
              id="staff-email"
              />
            </Field>

            {/* Selector de color */}
            <div>
              <span id="staff-color-label" className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted mb-2">
                Color en agenda
              </span>
              <div role="group" aria-labelledby="staff-color-label" className="flex items-center gap-2 pt-1">
                {staffColors.map((color) => (
                  <label
                    key={color}
                    className="cursor-pointer relative flex items-center justify-center"
                  >
                    <input
                      type="radio"
                      name="colorCode"
                      value={color}
                      defaultChecked={color === staffColors[0]}
                      className="sr-only peer"
                    />
                    <div
                      className="w-7 h-7 rounded-full border-2 border-border-strong ring-2 ring-transparent peer-checked:ring-accent peer-checked:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs text-dim bg-base">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Se asignarán turnos Lun – Sáb de 09:00 a 19:00 automáticamente.</span>
            </div>

            <Button type="submit" className="w-full">
              Agregar especialista
            </Button>
          </form>
        </Card>

        {/* Listado */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Equipo actual
            </h3>
            <span className="text-[11px] font-mono text-dim">
              Disponibles en calendario
            </span>
          </div>

          {tenant.staff.map((st) => (
            <Card
              key={st.id}
              className="p-4 transition flex items-center justify-between gap-4 hover:border-border-strong"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Monograma */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 font-display"
                  style={{
                    background: `${st.colorCode}18`,
                    border: `1px solid ${st.colorCode}40`,
                    color: st.colorCode,
                  }}
                >
                  {st.displayName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-medium text-foreground">
                      {st.displayName}
                    </h4>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: st.colorCode }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    {st.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-dim" />
                        {st.phone}
                      </span>
                    )}
                    {st.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-dim" />
                        {st.email}
                      </span>
                    )}
                    <span className="font-mono text-dim">
                      {st.schedules.length} turnos · {st.appointments.length} citas
                    </span>
                  </div>
                </div>
              </div>

              <Badge tone="success" className="flex-shrink-0">
                Activo
              </Badge>
            </Card>
          ))}

          {tenant.staff.length === 0 && (
            <EmptyState
              icon={<User className="w-5 h-5" />}
              title="Sin especialistas"
              description="Agrega a tu primer colaborador para empezar a agendar."
            />
          )}
        </div>
      </div>
    </main>
  );
}
