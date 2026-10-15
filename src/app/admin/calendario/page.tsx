import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { InteractiveCalendar } from "@/components/InteractiveCalendar";
import { Calendar as CalendarIcon } from "lucide-react";

export default async function AdminCalendarPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({
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
  }

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
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
  }

  if (!tenant) return null;

  const initialDateStr = new Date().toISOString().split("T")[0];

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
      <div className="pb-2 border-b border-zinc-850">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <CalendarIcon className="w-6 h-6 text-amber-400" />
          Calendario de Trabajo
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
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
