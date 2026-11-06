"use client";

import { useState } from "react";
import { resetUserPasswordAction } from "@/app/actions/superadmin";

export function ResetPasswordButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pass, setPass] = useState("");
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function guardar() {
    setEnviando(true);
    const res = await resetUserPasswordAction(userId, pass);
    setEnviando(false);
    if (res.success) {
      setEstado("ok");
      setMensaje("Contraseña actualizada");
      setPass("");
      setTimeout(() => setAbierto(false), 1200);
    } else {
      setEstado("error");
      setMensaje(res.error ?? "No se pudo cambiar");
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted hover:text-foreground hover:bg-base"
      >
        Restablecer
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder={`nueva clave para ${email}`}
        className="w-40 rounded-lg border border-border bg-base px-2 py-1 text-[11px]"
      />
      <button
        type="button"
        onClick={guardar}
        disabled={enviando || pass.length < 6}
        className="text-[11px] px-2 py-1 rounded-lg bg-accent text-accent-fg disabled:opacity-50"
      >
        {enviando ? "…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setAbierto(false);
          setEstado("idle");
          setMensaje("");
        }}
        className="text-[11px] px-2 py-1 rounded-lg border border-border text-dim"
      >
        ✕
      </button>
      {estado !== "idle" && (
        <span className={`text-[10px] ${estado === "ok" ? "text-success" : "text-error"}`}>
          {mensaje}
        </span>
      )}
    </div>
  );
}
