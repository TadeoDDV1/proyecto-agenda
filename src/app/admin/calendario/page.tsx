import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { InteractiveCalendar } from "@/components/InteractiveCalendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { toDateKey } from "@/lib/utils";

export default async function AdminCalendarPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: {
      staff: true,
      services: true,
      appointments: {
        include: {
          service: true,
          staff: true,
          customer: true,
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!tenant) notFound();

  const initialDateStr = toDateKey();

  const serializedStaff = tenant.staff.map((st) => ({
    id: st.id,
    displayName: st.displayName,
    colorCode: st.colorCode,
    avatarUrl: st.avatarUrl,
  }));

  const serializedServices = tenant.services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
  }));

  const serializedAppointments = tenant.appointments.map((a) => ({
    id: a.id,
    staffId: a.staffId,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    totalPrice: Number(a.totalPrice),
    customerNotes: a.customerNotes,
    service: {
      name: a.service.name,
      durationMinutes: a.service.durationMinutes,
    },
    staff: {
      displayName: a.staff.displayName,
      colorCode: a.staff.colorCode,
    },
    customer: {
      fullName: a.customer.fullName,
      phone: a.customer.phone,
    },
  }));

  return (
    <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <div className="pb-5 border-b border-border">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim mb-1.5">
          Administración
        </p>
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground font-display flex items-center gap-2.5">
          <CalendarIcon className="w-6 h-6 text-accent-hover" />
          Calendario de Trabajo
        </h2>
        <p className="text-xs text-muted mt-1.5">
          Visualiza los espacios por profesional en tiempo real y registra citas directas en mostrador.
        </p>
      </div>

      <InteractiveCalendar
        initialDateStr={initialDateStr}
        staffList={serializedStaff}
        servicesList={serializedServices}
        appointments={serializedAppointments}
        currency={tenant.currency}
      />
    </main>
  );
}
