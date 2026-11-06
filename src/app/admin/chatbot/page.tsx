import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ChatbotSimulator } from "@/components/ChatbotSimulator";
import { PageHeader } from "@/components/ui";

export default async function ChatbotPage() {
  const session = await getSession();

  let tenant = null;
  if (session?.tenantId) {
    tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  }
  if (!tenant) {
    tenant = await prisma.tenant.findFirst({ where: { slug: "barberia-vintage" } });
  }
  if (!tenant) return null;

  const servicios = await prisma.service.count({ where: { tenantId: tenant.id, isActive: true } });
  const colaboradores = await prisma.staffProfile.count({
    where: { tenantId: tenant.id, isActive: true },
  });

  const waListo = Boolean(process.env.WA_TOKEN && process.env.WA_VERIFY_TOKEN);

  return (
    <main className="p-5 sm:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
      <PageHeader
        eyebrow="Automatización"
        title="Chatbot de WhatsApp"
        description={`Prueba el asistente de ${tenant.name} sin conectar WhatsApp. Responde con los servicios, horarios y colaboradores reales del negocio.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Servicios disponibles", servicios],
          ["Colaboradores activos", colaboradores],
          ["Canal", "WhatsApp / web"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-panel p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dim">{label}</p>
            <p className="text-xl font-display mt-1">{value}</p>
          </div>
        ))}
      </div>

      <ChatbotSimulator tenantSlug={tenant.slug} tenantName={tenant.name} />

      <div className="rounded-xl border border-border bg-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-dim">Canal de WhatsApp</p>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              waListo
                ? "border-success/40 text-success"
                : "border-border text-muted"
            }`}
          >
            {waListo ? "Conectado" : "Modo simulación"}
          </span>
        </div>
        <p className="text-xs text-muted">
          {waListo
            ? "Las respuestas del bot se envían por la API de WhatsApp. El webhook está escuchando."
            : "El bot responde igual, pero los mensajes no salen a WhatsApp: se registran en el servidor. Configura WA_TOKEN, WA_VERIFY_TOKEN y WA_PHONE_MAP para activarlo."}
        </p>
        <p className="text-[11px] text-dim mt-2">
          Webhook: <code className="text-accent-warm">/api/whatsapp/webhook</code> · negocios por
          número en <code className="text-accent-warm">WA_PHONE_MAP</code>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 text-xs text-muted space-y-1">
        <p className="text-foreground font-medium">Qué entiende hoy</p>
        <p>• Saludo y menú · servicios y precios · horarios · ubicación · pasar con una persona</p>
        <p>• Agendar: servicio → colaborador → día → hora → nombre → confirmación (crea la cita real)</p>
        <p>• Fechas: hoy, mañana, día de la semana, 25/12 · horas: 10:30, 5 pm</p>
        <p>• Funciona con cualquier giro: los servicios y colaboradores salen de la base de datos.</p>
      </div>
    </main>
  );
}
