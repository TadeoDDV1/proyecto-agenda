"use client";

import { useTransition } from "react";
import { impersonateTenantAction } from "@/app/actions/impersonate";

export function ImpersonateButton({ tenantId }: { tenantId: string }) {
  const [pendiente, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          await impersonateTenantAction(tenantId);
        })
      }
      disabled={pendiente}
      className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-panel disabled:opacity-60"
    >
      {pendiente ? "Entrando…" : "Entrar como el negocio"}
    </button>
  );
}
