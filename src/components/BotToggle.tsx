"use client";

import { useState, useTransition } from "react";
import { Power } from "lucide-react";
import { toggleWhatsAppBotAction } from "@/app/actions/whatsapp";

export function BotToggle({ activo }: { activo: boolean }) {
  const [encendido, setEncendido] = useState(activo);
  const [pendiente, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function alternar() {
    const nuevo = !encendido;
    setEncendido(nuevo); // respuesta inmediata en la interfaz
    start(async () => {
      const r = await toggleWhatsAppBotAction(nuevo);
      if (!r?.success) {
        setEncendido(!nuevo); // revertir si falló
        setError(r?.error ?? "No se pudo cambiar el estado del bot.");
      } else {
        setError(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-base px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-2.5 w-2.5 rounded-full ${
            encendido ? "bg-success" : "bg-dim"
          }`}
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">
            {encendido ? "Bot encendido" : "Bot apagado"}
          </p>
          <p className="text-[11px] text-muted">
            {encendido
              ? "Responde a los mensajes de WhatsApp automáticamente."
              : "No responde a nadie; los mensajes quedan sin contestar."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={alternar}
        disabled={pendiente}
        aria-pressed={encendido}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition disabled:opacity-60 ${
          encendido
            ? "border-error/40 text-error hover:bg-error/10"
            : "border-success/40 text-success hover:bg-success/10"
        }`}
      >
        <Power className="w-4 h-4" />
        {pendiente ? "Cambiando…" : encendido ? "Apagar bot" : "Encender bot"}
      </button>

      {error && <p className="w-full text-[11px] text-error">{error}</p>}
    </div>
  );
}
