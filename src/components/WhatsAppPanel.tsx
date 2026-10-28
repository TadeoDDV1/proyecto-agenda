"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Link2,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Power,
  QrCode,
  RefreshCw,
  Smartphone,
  Unplug,
} from "lucide-react";
import {
  disconnectWhatsAppAction,
  startWhatsAppConnectionAction,
  toggleWhatsAppBotAction,
  publishPublicNumberAction,
} from "@/app/actions/whatsapp";
import { Badge, Button, Card } from "@/components/ui";

export interface WhatsAppPanelProps {
  status: "PENDING" | "CONNECTED" | "ERROR" | "DISABLED" | null;
  qrDataUrl: string | null;
  phoneNumber: string | null;
  botEnabled: boolean;
  lastError: string | null;
  workerOnline: boolean;
  disconnectPending: boolean;
  lastConnectedAt: string | null;
  publicNumber: string | null;
  conversationCount: number;
}

const statusMeta = {
  PENDING: { label: "Esperando QR", tone: "warning" as const },
  CONNECTED: { label: "Conectado", tone: "success" as const },
  ERROR: { label: "Con error", tone: "error" as const },
  DISABLED: { label: "Desconectado", tone: "default" as const },
};

export function WhatsAppPanel(props: WhatsAppPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Mientras se espera el QR, refrescamos para mostrarlo apenas el worker lo
  // escriba (Baileys lo regenera cada ~20 segundos).
  const shouldPoll =
    props.status === "PENDING" || props.disconnectPending || !props.workerOnline;

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [shouldPoll, router]);

  function run(action: () => Promise<{ success: boolean; error?: string }>, ok?: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setFeedback(result.error ?? "No se pudo completar la acción.");
        return;
      }
      if (ok) setFeedback(ok);
      router.refresh();
    });
  }

  const connected = props.status === "CONNECTED";
  const meta = props.status ? statusMeta[props.status] : null;

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 mb-5 border-b border-border">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 text-muted flex-shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground">
                Conexión de WhatsApp
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Vinculá un número dedicado al bot. Las credenciales quedan en este
                equipo.
              </p>
            </div>
          </div>

          {meta ? (
            <Badge tone={meta.tone}>{meta.label}</Badge>
          ) : (
            <Badge>Sin conectar</Badge>
          )}
        </div>

        {!props.workerOnline && props.status !== null && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-xs text-warning-text">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              El worker del bot no está corriendo. Abrí una terminal y ejecutá{" "}
              <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-surface-raised">
                npm run bot
              </code>
              .
            </p>
          </div>
        )}

        {/* Conectado */}
        {connected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 px-4 py-3.5">
              <CheckCircle2 className="w-5 h-5 text-success-text flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium truncate">
                  {props.phoneNumber ?? "Número vinculado"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {props.lastConnectedAt
                    ? `Conectado desde ${props.lastConnectedAt}`
                    : "Dispositivo vinculado"}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-wider text-dim">
                  Respuestas del bot
                </p>
                <p className="text-sm text-foreground mt-1 flex items-center gap-2">
                  {props.botEnabled ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-success-text" />
                      Activas
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-warning-text" />
                      En pausa
                    </>
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-border px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-wider text-dim">
                  Conversaciones
                </p>
                <p className="text-sm text-foreground mt-1">
                  {props.conversationCount}{" "}
                  <span className="text-muted text-xs">
                    {props.conversationCount === 1 ? "cliente" : "clientes"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(
                    () => toggleWhatsAppBotAction(!props.botEnabled),
                    props.botEnabled ? "Bot pausado." : "Bot reanudado."
                  )
                }
                leftIcon={
                  pending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : props.botEnabled ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )
                }
              >
                {props.botEnabled ? "Pausar bot" : "Reanudar bot"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={pending || props.publicNumber === props.phoneNumber}
                onClick={() =>
                  run(
                    () => publishPublicNumberAction(),
                    "Número publicado en la vitrina."
                  )
                }
                leftIcon={<Link2 className="w-3.5 h-3.5" />}
              >
                {props.publicNumber === props.phoneNumber
                  ? "Número público"
                  : "Usar en la vitrina"}
              </Button>
            </div>
          </div>
        )}

        {/* Esperando QR */}
        {props.status === "PENDING" && props.qrDataUrl && !props.disconnectPending && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="rounded-2xl border border-border-strong bg-[#EDE7DC] p-3 flex-shrink-0">
                <Image
                  src={props.qrDataUrl}
                  alt="Código QR para vincular WhatsApp"
                  width={208}
                  height={208}
                  unoptimized
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-lg"
                />
              </div>

              <ol className="space-y-3 text-xs text-muted">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-border text-[10px] flex items-center justify-center flex-shrink-0 text-foreground">
                    1
                  </span>
                  <span>
                    Abrí WhatsApp en el <strong className="text-foreground font-medium">teléfono del bot</strong>.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-border text-[10px] flex items-center justify-center flex-shrink-0 text-foreground">
                    2
                  </span>
                  <span>
                    Entrá a <strong className="text-foreground font-medium">Dispositivos vinculados</strong> y elegí
                    “Vincular un dispositivo”.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-border text-[10px] flex items-center justify-center flex-shrink-0 text-foreground">
                    3
                  </span>
                  <span>Escaneá este código. Se renueva solo cada pocos segundos.</span>
                </li>
              </ol>
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-dim">
              <RefreshCw className="w-3 h-3" />
              Actualizando automáticamente…
            </p>
          </div>
        )}

        {/* PENDING sin QR */}
        {props.status === "PENDING" && !props.qrDataUrl && !props.disconnectPending && (
          <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
            <QrCode className="w-7 h-7 mx-auto text-dim" />
            <p className="text-sm text-foreground mt-3">
              {props.workerOnline
                ? "Generando el código QR…"
                : "Esperando al worker del bot"}
            </p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {props.workerOnline
                ? "Baileys está abriendo la sesión. En unos segundos aparece el código."
                : "El panel no puede abrir WhatsApp por su cuenta: el worker mantiene la conexión."}
            </p>
            {!props.workerOnline && (
              <code className="inline-block mt-3 text-[11px] font-mono px-2 py-1 rounded bg-surface-raised border border-border text-muted">
                npm run bot
              </code>
            )}
          </div>
        )}

        {/* Desconectando */}
        {props.disconnectPending && (
          <div className="rounded-xl border border-border px-5 py-10 text-center">
            <Loader2 className="w-6 h-6 mx-auto text-muted animate-spin" />
            <p className="text-sm text-foreground mt-3">Desvinculando el dispositivo…</p>
            <p className="text-xs text-muted mt-1">
              {props.workerOnline
                ? "El worker está cerrando la sesión de WhatsApp."
                : "El worker no está corriendo. Iniciá el bot para completar la desconexión."}
            </p>
          </div>
        )}

        {/* Error */}
        {props.status === "ERROR" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/10 px-3.5 py-3 text-xs text-error-text">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{props.lastError ?? "La conexión se interrumpió. Se reintenta sola."}</p>
            </div>
            {props.lastError && !props.workerOnline && (
              <p className="text-xs text-muted">
                El worker no está corriendo, así que no hay reintentos en curso.
              </p>
            )}
          </div>
        )}

        {/* Sin conectar / desconectado */}
        {(props.status === null || props.status === "DISABLED") && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
              <Smartphone className="w-7 h-7 mx-auto text-dim" />
              <p className="text-sm text-foreground mt-3">
                {props.status === "DISABLED"
                  ? "Número desvinculado"
                  : "Todavía no hay un número conectado"}
              </p>
              <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                Usá un número dedicado al bot, distinto del personal. Al conectar
                aparece un QR para escanear desde ese teléfono.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-raised/40 px-3.5 py-3 text-[11px] text-muted flex items-start gap-2">
              <Bot className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-accent-warm" />
              <p>
                Conectamos por Baileys (WhatsApp Web no oficial). Es estable para
                un piloto, pero conviene no usar el número principal del salón.
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <p className="mt-4 text-xs text-muted border-l-2 border-accent/50 pl-3">
            {feedback}
          </p>
        )}

        {/* Acciones de conexión */}
        <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
          {(props.status === null || props.status === "DISABLED" || props.status === "ERROR") && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => startWhatsAppConnectionAction())}
              leftIcon={
                pending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )
              }
            >
              {props.status === "ERROR" ? "Reconectar" : "Conectar número"}
            </Button>
          )}

          {(props.status === "PENDING" || props.status === "CONNECTED") &&
            !props.disconnectPending &&
            (confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">¿Desvincular el número?</span>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false);
                    run(() => disconnectWhatsAppAction());
                  }}
                >
                  Sí, desconectar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => setConfirming(true)}
                leftIcon={<Unplug className="w-3.5 h-3.5" />}
              >
                Desconectar
              </Button>
            ))}

          {props.status === "PENDING" && props.qrDataUrl && (
            <span className="ml-auto text-[11px] text-dim flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              El QR caduca rápido
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
