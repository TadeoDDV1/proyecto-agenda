"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenantByAdminAction } from "@/app/actions/superadmin";
import { PLANS } from "@/lib/tenant-config";

const inputCls = "w-full rounded-lg border border-border bg-base px-3 py-2 text-sm";
const labelCls = "block text-[11px] uppercase tracking-wider text-dim mb-1";

export function NewTenantForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createTenantByAdminAction(new FormData(e.currentTarget));
    setSaving(false);
    if (res.success && res.tenantId) {
      router.push(`/superadmin/negocios/${res.tenantId}`);
    } else {
      setError(res.error ?? "No se pudo crear el negocio.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-panel p-5 space-y-4">
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 text-error px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre del negocio *</label>
          <input name="name" required className={inputCls} placeholder="Estética Bella Vista" />
        </div>
        <div>
          <label className={labelCls}>Identificador (slug)</label>
          <input name="slug" className={inputCls} placeholder="estetica-bella-vista" />
        </div>
        <div>
          <label className={labelCls}>Nombre del dueño *</label>
          <input name="ownerName" required className={inputCls} placeholder="Patricia Núñez" />
        </div>
        <div>
          <label className={labelCls}>Correo del dueño *</label>
          <input type="email" name="email" required className={inputCls} placeholder="dueno@negocio.com" />
        </div>
        <div>
          <label className={labelCls}>Contraseña inicial *</label>
          <input name="password" required minLength={6} className={inputCls} placeholder="mínimo 6 caracteres" />
        </div>
        <div>
          <label className={labelCls}>Plan</label>
          <select name="plan" defaultValue="BASIC" className={inputCls}>
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Moneda</label>
          <select name="currency" defaultValue="MXN" className={inputCls}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <p className="text-[11px] text-dim">
        Al crear el negocio se genera su dueño, un colaborador inicial con horarios de lunes a
        sábado, una categoría y un servicio de ejemplo.
      </p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm disabled:opacity-60"
        >
          {saving ? "Creando…" : "Crear negocio"}
        </button>
      </div>
    </form>
  );
}
