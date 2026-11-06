"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  rol: "bot" | "user";
  texto: string;
}

export function ChatbotSimulator({ tenantSlug, tenantName }: { tenantSlug: string; tenantName: string }) {
  const [mensajes, setMensajes] = useState<Msg[]>([
    {
      rol: "bot",
      texto: `¡Hola! Soy el asistente de ${tenantName}. Escríbeme como si fueras un cliente: "hola", "servicios", "quiero una cita"…`,
    },
  ]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const sessionId = useRef(`sim-${Math.random().toString(36).slice(2, 10)}`);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || cargando) return;

    setMensajes((m) => [...m, { rol: "user", texto: limpio }]);
    setTexto("");
    setCargando(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          sessionId: sessionId.current,
          mensaje: limpio,
          telefono: "demo-555-0000",
        }),
      });
      const data = await res.json();
      setMensajes((m) => [
        ...m,
        { rol: "bot", texto: data.reply ?? data.error ?? "No pude responder." },
      ]);
    } catch {
      setMensajes((m) => [...m, { rol: "bot", texto: "Error de conexión con el bot." }]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-panel flex flex-col h-[32rem]">
      <div className="px-4 py-3 border-b border-border text-xs text-dim">
        Simulador · negocio <span className="text-foreground">{tenantSlug}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.map((m, i) => (
          <div key={i} className={m.rol === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.rol === "user"
                  ? "bg-accent text-accent-fg"
                  : "bg-base border border-border text-foreground"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {cargando && <p className="text-xs text-dim">escribiendo…</p>}
        <div ref={fin} />
      </div>

      <form onSubmit={enviar} className="p-3 border-t border-border flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe como cliente…"
          className="flex-1 rounded-lg border border-border bg-base px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={cargando}
          className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
