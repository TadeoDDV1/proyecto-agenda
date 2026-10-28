import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/components/BookingWizard";
import { MapPin, Phone, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          services: {
            where: { isActive: true },
          },
        },
      },
      services: {
        where: { isActive: true },
      },
      staff: {
        where: { isActive: true },
        include: {
          services: {
            select: { serviceId: true },
          },
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const serializedServices = tenant.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    categoryId: s.categoryId,
    categoryName:
      tenant.categories.find((c) => c.id === s.categoryId)?.name || "General",
  }));

  const serializedStaff = tenant.staff.map((st) => ({
    id: st.id,
    displayName: st.displayName,
    colorCode: st.colorCode,
    avatarUrl: st.avatarUrl,
    serviceIds: st.services.map((svc) => svc.serviceId),
  }));

  return (
    <div className="min-h-screen pb-24 bg-base text-foreground">
      {/* Header limpio */}
      <header className="sticky top-0 z-40 border-b border-border bg-base/85 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-surface-raised border border-border text-accent-warm font-display">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-medium leading-tight truncate text-foreground">
                {tenant.name}
              </h1>
              <p className="text-[11px] text-dim">Reservas en línea</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-border text-muted">
              <Clock className="w-3 h-3" />
              <span>09:00 – 19:00</span>
            </span>
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                aria-label={`Llamar a ${tenant.phone}`}
                className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border text-muted transition hover:text-foreground hover:border-border-strong"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">{tenant.phone}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero editorial del negocio */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] mb-3 text-accent-warm">
            Portal de reservas
          </p>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight leading-tight font-display text-foreground text-balance">
            {tenant.name}
          </h2>

          {tenant.description && (
            <p className="mt-3 text-sm leading-relaxed max-w-xl text-muted">
              {tenant.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {tenant.address && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {tenant.address}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted">
              <Clock className="w-3 h-3 flex-shrink-0" />
              Lun – Sáb, 09:00 – 19:00
            </span>
          </div>
        </div>
      </section>

      {/* Wizard de reservas */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <BookingWizard
          tenantSlug={tenant.slug}
          tenantName={tenant.name}
          currency={tenant.currency}
          services={serializedServices}
          staffMembers={serializedStaff}
        />
      </main>
    </div>
  );
}
