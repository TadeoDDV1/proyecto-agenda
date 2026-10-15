import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/components/BookingWizard";
import { MapPin, Phone, Clock, Star, ShieldCheck, Scissors, Sparkles, MessageCircle } from "lucide-react";

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
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  // Serializar datos para el componente cliente
  const serializedServices = tenant.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    categoryId: s.categoryId,
    categoryName: tenant.categories.find((c) => c.id === s.categoryId)?.name || "General",
  }));

  const serializedStaff = tenant.staff.map((st) => ({
    id: st.id,
    displayName: st.displayName,
    colorCode: st.colorCode,
    avatarUrl: st.avatarUrl,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 pb-24">
      {/* Luz ambiental sutil de fondo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/0 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navbar Superior Glassmorphism */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-zinc-100 leading-tight">{tenant.name}</h1>
              <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Portal Oficial de Reservas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>09:00 - 19:00 hrs</span>
            </span>

            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{tenant.phone}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero del Negocio (Dark Luxe) */}
      <section className="border-b border-zinc-850/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
          {tenant.logoUrl ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 to-amber-500/0 rounded-2xl blur opacity-75 group-hover:opacity-100 transition" />
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-zinc-700/80 shadow-2xl bg-zinc-900"
              />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <Scissors className="w-10 h-10" />
            </div>
          )}

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.9 (128 reseñas verificadas)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Negocio Verificado
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">{tenant.name}</h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">{tenant.description}</p>
            
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-400">
              {tenant.address && (
                <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-850">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{tenant.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-850">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Lun - Sáb: 09:00 - 19:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal con Wizard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
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
