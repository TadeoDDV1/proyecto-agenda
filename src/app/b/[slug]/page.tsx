import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/components/BookingWizard";
import { MapPin, Phone, Clock, Star, ShieldCheck, Scissors } from "lucide-react";

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
  }));

  const serializedStaff = tenant.staff.map((st) => ({
    id: st.id,
    displayName: st.displayName,
    colorCode: st.colorCode,
    avatarUrl: st.avatarUrl,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Navbar Superior del Portal */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">{tenant.name}</h1>
              <p className="text-[11px] text-gray-500 font-medium">Portal Oficial de Reservas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Abierto Hoy (09:00 - 19:00)
            </span>
            <a
              href={`tel:${tenant.phone}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tenant.phone}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero del Negocio */}
      <section className="bg-slate-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
            />
          )}
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              4.9 (128 reseñas verificadas)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{tenant.name}</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">{tenant.description}</p>
            
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
              {tenant.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{tenant.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Lun - Sáb: 09:00 - 19:00</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Garantía de puntualidad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal con Wizard */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Asistente de Reserva */}
          <div className="lg:col-span-8">
            <BookingWizard
              tenantSlug={tenant.slug}
              currency={tenant.currency}
              services={serializedServices}
              staffMembers={serializedStaff}
            />
          </div>

          {/* Barra Lateral Informativa */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" />
                Nuestro Equipo
              </h3>
              <div className="space-y-3">
                {tenant.staff.map((st) => (
                  <div key={st.id} className="flex items-center gap-3">
                    <img
                      src={st.avatarUrl || ""}
                      alt={st.displayName}
                      className="w-10 h-10 rounded-full object-cover border"
                      style={{ borderColor: st.colorCode }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{st.displayName}</p>
                      <span className="text-[11px] text-gray-500">Disponible hoy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-200/60 rounded-2xl p-6">
              <h4 className="font-bold text-amber-900 text-sm mb-1">
                ¿Tienes dudas o citas especiales?
              </h4>
              <p className="text-xs text-amber-800/80 leading-relaxed mb-4">
                Si requieres un horario fuera de agenda o un servicio a domicilio para eventos, comunícate directamente con nuestro equipo.
              </p>
              <a
                href={`https://wa.me/${tenant.phone?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
