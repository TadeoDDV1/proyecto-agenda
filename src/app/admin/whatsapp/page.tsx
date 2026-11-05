import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import QRCode from "qrcode";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  MessageCircle,
  MessagesSquare,
  ShieldAlert,
} from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkerOnline } from "@/lib/whatsapp/worker";
import { WhatsAppPanel } from "@/components/WhatsAppPanel";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function relativeTime(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

/** La página es dinámica: la ventana se calcula en cada request. */
function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

export default async function AdminWhatsAppPage() {
  const { tenant } = await requireTenant();

  const since = sevenDaysAgo();

  const [account, conversations, whatsappAppointments, messages7d, messages] =
    await Promise.all([
      prisma.whatsAppAccount.findUnique({ where: { tenantId: tenant.id } }),
      prisma.whatsAppConversation.count({ where: { tenantId: tenant.id } }),
      prisma.appointment.count({
        where: { tenantId: tenant.id, source: "WHATSAPP" },
      }),
      prisma.whatsAppMessage.count({
        where: { tenantId: tenant.id, createdAt: { gte: since } },
      }),
      prisma.whatsAppMessage.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          conversation: {
            select: {
              waId: true,
              customer: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

  const qrDataUrl = account?.qr
    ? await QRCode.toDataURL(account.qr, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 416,
        color: { dark: "#121210", light: "#F4F1EA" },
      })
    : null;

  const workerOnline = isWorkerOnline(account?.workerSeenAt ?? null);

  const stats = [
    {
      label: "Conversaciones",
      value: conversations,
      hint: "clientes que escribieron",
      icon: MessagesSquare,
    },
    {
      label: "Citas por WhatsApp",
      value: whatsappAppointments,
      hint: "desde que conectaste el bot",
      icon: CalendarCheck,
    },
    {
      label: "Mensajes (7 días)",
      value: messages7d,
      hint: "entrantes y salientes",
      icon: MessageCircle,
    },
  ];

  return (
    <main className="p-5 sm:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        eyebrow="Canal de WhatsApp"
        title="Bot de WhatsApp"
        description="Reservas, próximas citas y cancelaciones automáticas sobre la misma agenda del panel."
        action={<Badge tone="accent">Baileys</Badge>}
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <WhatsAppPanel
            status={account?.status ?? null}
            qrDataUrl={qrDataUrl}
            phoneNumber={account?.displayPhoneNumber ?? null}
            botEnabled={account?.botEnabled ?? false}
            lastError={account?.lastError ?? null}
            workerOnline={workerOnline}
            disconnectPending={Boolean(account?.disconnectRequestedAt)}
            lastConnectedAt={
              account?.lastConnectedAt
                ? formatInTimeZone(
                    account.lastConnectedAt,
                    tenant.timezone,
                    "d MMM, HH:mm",
                    { locale: es }
                  )
                : null
            }
            publicNumber={tenant.whatsappNumber}
            conversationCount={conversations}
          />

          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<Bot className="w-4 h-4" />}
              title="Qué puede hacer el bot"
              subtitle="Sin IA: menús numerados, respuestas predecibles y disponibilidad real."
              className="pb-5 mb-5"
            />

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <p className="text-foreground font-medium">Reservar</p>
                <p className="text-muted mt-1">
                  Servicio, profesional, día y hora con la disponibilidad real de
                  la agenda. Pide el nombre solo si el número es nuevo.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium">Ver próximas citas</p>
                <p className="text-muted mt-1">
                  Lista hasta tres citas activas del número y muestra el detalle
                  con el código de confirmación.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium">Cancelar</p>
                <p className="text-muted mt-1">
                  Pide confirmación antes de liberar el horario y registra la
                  cancelación tardía si corresponde.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium">Pausar</p>
                <p className="text-muted mt-1">
                  “Pausar bot” deja de responder sin desvincular el número. Los
                  mensajes se siguen guardando.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-[3px] border border-warning/20 bg-warning/5 px-3.5 py-3 text-[11px] text-muted">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-warning-text" />
              <p>
                Baileys usa WhatsApp Web no oficial: un uso intensivo puede
                terminar en bloqueo. Por eso el número debe ser dedicado, no el
                principal del salón.
              </p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-[3px] bg-surface-raised border border-border flex items-center justify-center flex-shrink-0 text-accent-warm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-light text-foreground leading-none font-display">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted mt-1 truncate">
                      {stat.label}
                      <span className="text-dim"> · {stat.hint}</span>
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="p-5">
              <CardHeader
                icon={<MessagesSquare className="w-4 h-4" />}
                title="Actividad reciente"
                subtitle="Últimos mensajes del canal"
                action={
                  workerOnline ? (
                    <Badge tone="success">En vivo</Badge>
                  ) : (
                    <Badge>Worker apagado</Badge>
                  )
                }
                className="pb-4 mb-4"
              />
            </div>

            {messages.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={<MessageCircle className="w-5 h-5" />}
                  title="Sin mensajes todavía"
                  description="Cuando un cliente escriba al número conectado, la conversación aparece acá."
                  className="border-dashed bg-transparent"
                />
              </div>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {messages.map((item) => {
                  const inbound = item.direction === "INBOUND";
                  const Icon = inbound ? ArrowDownLeft : ArrowUpRight;

                  return (
                    <li
                      key={item.id}
                      className="px-5 py-3 flex items-start gap-3 min-w-0"
                    >
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          inbound
                            ? "border-border bg-surface-raised text-muted"
                            : "border-accent/30 bg-accent-soft text-accent-warm"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-xs text-foreground truncate">
                            {item.conversation.customer?.fullName ??
                              item.conversation.waId}
                          </p>
                          <span className="text-[10px] text-dim flex-shrink-0">
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5 line-clamp-2 whitespace-pre-line">
                          {item.body ??
                            (item.type === "text"
                              ? "(sin texto)"
                              : `(mensaje ${item.type})`)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <p className="text-[11px] text-dim px-1">
            El worker se mantiene con{" "}
            <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-surface-raised border border-border">
              npm run bot
            </code>
            . Si se apaga, el panel muestra el estado pero no responde mensajes.
          </p>
        </div>
      </div>
    </main>
  );
}
