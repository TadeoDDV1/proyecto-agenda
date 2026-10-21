import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CustomerManager } from "@/components/CustomerManager";
import { PageHeader } from "@/components/ui";

export default async function AdminClientesPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    });
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { slug: "barberia-vintage" },
    });
  }

  if (!tenant) return null;

  const rawCustomers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    include: {
      appointments: {
        include: {
          service: true,
          staff: true,
        },
        orderBy: { startTime: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialización segura para Server Component -> Client Component
  const customers = rawCustomers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    appointments: c.appointments.map((a) => ({
      id: a.id,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      totalPrice: Number(a.totalPrice),
      service: {
        id: a.service.id,
        name: a.service.name,
        durationMinutes: a.service.durationMinutes,
      },
      staff: {
        id: a.staff.id,
        displayName: a.staff.displayName,
        colorCode: a.staff.colorCode,
      },
    })),
  }));

  return (
    <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        eyebrow="Relación con clientes"
        title="Directorio & CRM"
        description={`Historial de visitas, fidelidad y contacto directo por WhatsApp para ${tenant.name}.`}
      />

      <CustomerManager
        initialCustomers={customers}
        tenantCurrency={tenant.currency}
        tenantName={tenant.name}
      />
    </main>
  );
}
