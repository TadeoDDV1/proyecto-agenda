"use client";

import { useState, useTransition } from "react";
import { revokeUserSessionsAction } from "@/app/actions/admin";

export function RevokeSessionsButton({
  userId,
  email,
  activo,
}: {
  userId: string;
  email: string;
  activo: boolean;
}) {
  const [pendiente, start] = useTransition();
  const [hecho, setHecho] = useState(false);

  if (hecho) {
    return <span className="text-[11px] text-success">Sesiones cerradas</span>;
  }

  return (
    <button
      type="button"
      disabled={pendiente || !activo}
      title={activo ? `Cerrar todas las sesiones de ${email}` : "El usuario no tiene acceso"}
      onClick={() =>
        start(async () => {
          const r = await revokeUserSessionsAction(userId);
          if (r.success) setHecho(true);
        })
      }
      className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted hover:text-error hover:border-error/40 disabled:opacity-40"
    >
      {pendiente ? "Cerrando…" : "Cerrar sesiones"}
    </button>
  );
}
