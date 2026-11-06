import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { CustomerManager } from "@/components/CustomerManager";
import { PageHeader } from "@/components/ui";
import { getVertical } from "@/lib/verticals";

export default async function AdminClientesPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
  });

  if (!tenant) notFound();
  const vertical = getVertical(tenant.vertical);

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
        eyebrow={vertical.terms.customers}
        title={`Directorio de ${vertical.terms.customers.toLowerCase()}`}
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
