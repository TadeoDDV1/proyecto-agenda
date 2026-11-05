import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { AtSign, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { dayOfWeekFromDateKey, formatDateKeyInZone } from "@/lib/booking/time";
import {
  formatPhoneForDisplay,
  whatsappUrl,
} from "@/lib/booking/phone";
import { resolveTheme, themeToCssVars } from "@/lib/vitrina/theme";
import { BookingDock } from "@/components/vitrina/BookingDock";
import { BookingTrigger } from "@/components/vitrina/BookingTrigger";
import type { PublicService, PublicStaff } from "@/components/vitrina/types";
import styles from "@/components/vitrina/vitrina.module.css";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getTenant = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        include: { category: true },
        orderBy: { price: "asc" },
      },
      staff: {
        where: { isActive: true },
        include: { services: { select: { serviceId: true } } },
        orderBy: { displayName: "asc" },
      },
      testimonials: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
    },
  });
});

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return { title: "Salón no encontrado" };

  const description =
    tenant.tagline ?? tenant.description ?? `Reservá tu cita en ${tenant.name}.`;

  return {
    title: `${tenant.name} — Reservar cita`,
    description,
    alternates: { canonical: `/b/${tenant.slug}` },
    openGraph: {
      title: tenant.name,
      description,
      type: "website",
      url: `/b/${tenant.slug}`,
      images: tenant.coverImageUrl ? [{ url: tenant.coverImageUrl }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export async function generateViewport({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  const theme = resolveTheme(tenant?.brandTheme);
  return { themeColor: theme.paper };
}

function emphasizeLastWord(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return text;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em>{last}</em>
    </>
  );
}

export default async function VitrinaPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getTenant(slug);

  if (!tenant) notFound();

  const theme = resolveTheme(tenant.brandTheme);
  const cssVars = themeToCssVars(theme);

  const staff: PublicStaff[] = tenant.staff.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    colorCode: member.colorCode,
    bio: member.bio,
    specialties: member.specialties,
    serviceIds: member.services.map((item) => item.serviceId),
  }));

  const services: PublicService[] = tenant.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: Number(service.price),
    categoryName: service.category?.name ?? "General",
    imageUrl: service.imageUrl,
    staffIds: staff
      .filter((member) => member.serviceIds.includes(service.id))
      .map((member) => member.id),
  }));

  const categories = [
    ...new Map(
      services.map((service) => [service.categoryName, service.categoryName])
    ).values(),
  ];

  const ratings = tenant.testimonials.map((item) => item.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null;
  const featured = tenant.testimonials[0] ?? null;

  const now = new Date();
  const todayKey = formatDateKeyInZone(now, tenant.timezone);
  const todayDow = dayOfWeekFromDateKey(todayKey);
  const currentMinutes =
    Number(formatInTimeZone(now, tenant.timezone, "HH")) * 60 +
    Number(formatInTimeZone(now, tenant.timezone, "mm"));
  const todayHours = tenant.businessHours.find((row) => row.dayOfWeek === todayDow);
  const isOpenNow = Boolean(
    todayHours &&
      !todayHours.isClosed &&
      currentMinutes >=
        Number(todayHours.openTime.slice(0, 2)) * 60 +
          Number(todayHours.openTime.slice(3, 5)) &&
      currentMinutes <
        Number(todayHours.closeTime.slice(0, 2)) * 60 +
          Number(todayHours.closeTime.slice(3, 5))
  );

  const phone = tenant.phone ? formatPhoneForDisplay(tenant.phone) : null;
  const waHref = tenant.whatsappNumber
    ? whatsappUrl(
        tenant.whatsappNumber,
        `Hola, quiero reservar una cita en ${tenant.name}.`
      )
    : null;
  const instagramHandle = tenant.instagram
    ? tenant.instagram.replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, "")
    : null;
  const instagramHref = tenant.instagram
    ? tenant.instagram.startsWith("http")
      ? tenant.instagram
      : `https://instagram.com/${instagramHandle}`
    : null;
  const mapHref = tenant.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: tenant.name,
    description: tenant.tagline ?? tenant.description ?? undefined,
    image: tenant.coverImageUrl ?? tenant.logoUrl ?? undefined,
    telephone: tenant.phone ?? undefined,
    address: tenant.address
      ? { "@type": "PostalAddress", streetAddress: tenant.address }
      : undefined,
    priceRange: "$$",
    url: `/b/${tenant.slug}`,
    openingHoursSpecification: tenant.businessHours
      .filter((row) => !row.isClosed)
      .map((row) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[row.dayOfWeek],
        opens: row.openTime,
        closes: row.closeTime,
      })),
    ...(averageRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: tenant.testimonials.length,
          },
        }
      : {}),
  };

  return (
    <div className={styles.vitrina} style={cssVars as React.CSSProperties}>
      <a className={styles.skip} href="#contenido">
        Saltar al contenido
      </a>

      <header className={styles.bar}>
        <div className={`${styles.shell} ${styles.barInner}`}>
          <a className={styles.logo} href="#inicio" aria-label={tenant.name}>
            <span className={styles.logoMark}>
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logoUrl} alt="" />
              ) : (
                tenant.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className={styles.logoText}>
              <span className={styles.logoName}>{tenant.name}</span>
              <span className={styles.logoTag}>
                {tenant.tagline ?? "Reservas en línea"}
              </span>
            </span>
          </a>

          <nav className={styles.nav} aria-label="Secciones">
            <a href="#servicios">Servicios</a>
            <a href="#equipo">Equipo</a>
            <a href="#espacio">El espacio</a>
            {featured && <a href="#resenas">Reseñas</a>}
          </nav>

          <div className={styles.barRight}>
            <span className={styles.powered}>
              con <b>Pauta</b>
            </span>
            <BookingTrigger className={styles.bookPill} serviceId={services[0]?.id}>
              Reservar
            </BookingTrigger>
          </div>
        </div>
      </header>

      <main id="contenido">
        <section className={styles.hero} id="inicio">
          <div className={`${styles.shell} ${styles.heroInner}`}>
            <div>
              <p className={styles.eyebrow}>
                {tenant.address?.split(",")[0] ?? "Reservas en línea"}
              </p>
              <h1 className={styles.title}>{emphasizeLastWord(tenant.tagline ?? tenant.name)}</h1>
              <p className={styles.lead}>
                {tenant.story ?? tenant.description}
              </p>

              <div className={styles.ctas}>
                <BookingTrigger className={styles.cta} serviceId={services[0]?.id}>
                  Reservar mi cita
                </BookingTrigger>
                <a className={`${styles.cta} ${styles.ctaGhost}`} href="#servicios">
                  Ver la carta
                </a>
                {waHref && (
                  <a
                    className={`${styles.cta} ${styles.ctaGhost}`}
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={16} />
                    Escribir por WhatsApp
                  </a>
                )}
              </div>

              <div className={styles.heroMeta}>
                {averageRating && (
                  <span>
                    <b>
                      {averageRating.toFixed(1).replace(".", ",")} ★
                    </b>
                    {tenant.testimonials.length} reseñas
                  </span>
                )}
                <span>
                  <b>{staff.length}</b>
                  {staff.length === 1 ? "profesional" : "profesionales"}
                </span>
                <span>
                  <b>{services.length}</b>
                  {services.length === 1 ? "servicio" : "servicios"}
                </span>
                {isOpenNow && todayHours && (
                  <span>
                    <b>Ahora</b>abierto hasta {todayHours.closeTime}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.art} aria-hidden={!tenant.coverImageUrl}>
              {tenant.coverImageUrl ? (
                <div className={styles.cover}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tenant.coverImageUrl}
                    alt={`Interior de ${tenant.name}`}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.disc} />
                  <span className={styles.stamp}>
                    reservá
                    <br />
                    tu
                    <br />
                    cita
                  </span>
                </>
              )}

              {featured && (
                <div className={styles.rating}>
                  <span className={styles.stars}>
                    {"★".repeat(featured.rating)}
                    {"☆".repeat(Math.max(0, 5 - featured.rating))}
                  </span>
                  <span className={styles.ratingQuote}>
                    “{featured.quote.length > 92 ? `${featured.quote.slice(0, 92)}…` : featured.quote}”
                  </span>
                  <span className={styles.ratingBy}>— {featured.authorName}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <div className={styles.strip}>
            <div className={`${styles.shell} ${styles.stripInner}`}>
              {categories.map((category) => (
                <span key={category} className={styles.stripItem}>
                  <i>✂</i>
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        <section className={styles.section} id="servicios">
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.kicker}>La carta</p>
                <h2 className={styles.sectionTitle}>
                  Lo que se hace en {tenant.name}
                </h2>
                <p className={styles.sectionNote}>
                  Precios finales en {tenant.currency} · la duración incluye
                  preparación y cierre.
                </p>
              </div>
              <BookingTrigger className={styles.sectionLink} serviceId={services[0]?.id}>
                Ver disponibilidad →
              </BookingTrigger>
            </div>

            <div className={styles.cards}>
              {services.map((service) => (
                <article key={service.id} className={styles.card}>
                  <div className={styles.thumb}>
                    <span className={styles.badge}>{service.categoryName}</span>
                    {service.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.imageUrl} alt="" loading="lazy" />
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{service.name}</h3>
                    <p className={styles.cardDesc}>
                      {service.description ?? "Consultá detalles al reservar."}
                    </p>
                    <div className={styles.cardFoot}>
                      <span className={styles.price}>
                        {formatCurrency(service.price, tenant.currency)}
                      </span>
                      <span className={styles.duration}>
                        {service.durationMinutes} min
                      </span>
                      <BookingTrigger
                        className={styles.cardLink}
                        serviceId={service.id}
                        ariaLabel={`Reservar ${service.name}`}
                      >
                        Reservar
                      </BookingTrigger>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {staff.length > 0 && (
          <section className={`${styles.section} ${styles.sectionTight}`} id="equipo">
            <div className={styles.shell}>
              <div className={styles.sectionHead}>
                <div>
                  <p className={styles.kicker}>El equipo</p>
                  <h2 className={styles.sectionTitle}>Quién te va a escuchar</h2>
                  <p className={styles.sectionNote}>
                    Elegís profesional al reservar, o dejás que te asignemos
                    al primero con lugar.
                  </p>
                </div>
              </div>

              <div className={styles.team}>
                {staff.map((member) => {
                  const preferredServiceId = member.serviceIds.find((id) =>
                    services.some((service) => service.id === id)
                  );
                  return (
                    <article key={member.id} className={styles.person}>
                      <div className={styles.personTop}>
                        <span className={styles.face}>
                          {member.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.avatarUrl} alt="" loading="lazy" />
                          ) : (
                            member.displayName.charAt(0)
                          )}
                        </span>
                        <span>
                          <span className={styles.personName}>
                            {member.displayName}
                          </span>
                          <span className={styles.personRole}>
                            {member.specialties ?? "Especialista"}
                          </span>
                        </span>
                      </div>
                      {member.bio && (
                        <p className={styles.personBio}>{member.bio}</p>
                      )}
                      <BookingTrigger
                        className={styles.personLink}
                        staffId={member.id}
                        serviceId={preferredServiceId}
                      >
                        Reservar con {member.displayName.split(" ")[0]}
                      </BookingTrigger>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {featured && averageRating && (
          <section className={styles.quote} id="resenas">
            <div className={`${styles.shell} ${styles.quoteInner}`}>
              <div>
                <blockquote className={styles.blockquote}>
                  “{featured.quote}”
                </blockquote>
                <div className={styles.byline}>
                  <i>{featured.authorName.slice(0, 2).toUpperCase()}</i>
                  <span>{featured.authorName} · cliente del salón</span>
                </div>
              </div>
              <div className={styles.quoteMeta}>
                <b>{averageRating.toFixed(1).replace(".", ",")}</b>
                <span>
                  Promedio de {tenant.testimonials.length}{" "}
                  {tenant.testimonials.length === 1 ? "reseña" : "reseñas"}
                </span>
              </div>
            </div>
          </section>
        )}

        <section className={styles.section} id="espacio">
          <div className={`${styles.shell} ${styles.spot}`}>
            <div>
              <p className={styles.kicker}>El espacio</p>
              <h2 className={styles.sectionTitle}>Dónde y cuándo</h2>
              <p className={styles.story}>
                {tenant.story ??
                  tenant.description ??
                  `${tenant.name} atiende con cita previa.`}
              </p>

              <div className={styles.contactLinks}>
                {tenant.address && (
                  <a
                    className={styles.contactLink}
                    href={mapHref ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={15} />
                    {tenant.address}
                  </a>
                )}
                {phone && (
                  <a className={styles.contactLink} href={`tel:${tenant.phone}`}>
                    <Phone size={15} />
                    {phone}
                  </a>
                )}
                {instagramHref && (
                  <a
                    className={styles.contactLink}
                    href={instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AtSign size={15} />@{instagramHandle}
                  </a>
                )}
                {waHref && (
                  <a
                    className={styles.contactLink}
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            <aside className={styles.hours} aria-label="Horarios">
              <span className={styles.openBadge}>
                {isOpenNow ? "Abierto ahora" : "Cerrado ahora"}
              </span>
              <p className={styles.hoursTitle}>Horario del salón</p>
              {tenant.businessHours.map((row) => (
                <div key={row.dayOfWeek} className={styles.hoursRow}>
                  <span>{DAY_NAMES[row.dayOfWeek]}</span>
                  <span className={row.isClosed ? styles.hoursClosed : undefined}>
                    {row.isClosed ? "Cerrado" : `${row.openTime} – ${row.closeTime}`}
                  </span>
                </div>
              ))}
              <div className={styles.hoursRow} style={{ marginTop: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} /> Reserva
                </span>
                <span>
                  {tenant.minLeadTimeMinutes >= 60
                    ? `${Math.round(tenant.minLeadTimeMinutes / 60)} h de antelación`
                    : `${tenant.minLeadTimeMinutes} min de antelación`}
                </span>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <span>
            © {new Date().getFullYear()} {tenant.name}
          </span>
          <span>
            Reservas con <Link href="/">Pauta</Link>
          </span>
        </div>
      </footer>

      <BookingDock
        tenant={{
          slug: tenant.slug,
          name: tenant.name,
          currency: tenant.currency,
          timezone: tenant.timezone,
          address: tenant.address,
          whatsappNumber: tenant.whatsappNumber,
        }}
        services={services}
        staff={staff}
        todayKey={todayKey}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
