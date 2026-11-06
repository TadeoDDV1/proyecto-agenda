"use client";

import { useState } from "react";
import {
  updateTenantByAdminAction,
  toggleTenantActiveAction,
  deleteTenantAction,
} from "@/app/actions/superadmin";
import { FEATURE_KEYS, FEATURE_LABELS, PLANS, type FeatureKey } from "@/lib/tenant-config";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  currency: string;
  isActive: boolean;
  maxStaff: number;
  maxServices: number;
  suspendedReason: string | null;
  notes: string | null;
  features: Record<FeatureKey, boolean>;
  isPlatform: boolean;
};

const inputCls = "w-full rounded-lg border border-border bg-base px-3 py-2 text-sm";
const labelCls = "block text-[11px] uppercase tracking-wider text-dim mb-1";

export function TenantConfigForm({ tenant }: { tenant: Tenant }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await updateTenantByAdminAction(new FormData(e.currentTarget));
    setSaving(false);
    setMsg(res.success ? { ok: true, text: "Configuración guardada." } : { ok: false, text: res.error ?? "Error" });
  }

  async function toggle() {
    const res = await toggleTenantActiveAction(tenant.id, !tenant.isActive);
    setMsg(res.success ? { ok: true, text: tenant.isActive ? "Negocio suspendido." : "Negocio activado." } : { ok: false, text: res.error ?? "Error" });
  }

  async function remove() {
    if (!confirm(`¿Eliminar «${tenant.name}» y todos sus datos? Esta acción no se puede deshacer.`)) return;
    const res = await deleteTenantAction(tenant.id);
    if (res.success) {
      window.location.href = "/superadmin";
    } else {
      setMsg({ ok: false, text: res.error ?? "Error" });
    }
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            msg.ok ? "border-success/30 bg-success/10 text-success" : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-panel p-5 space-y-4">
        <input type="hidden" name="id" value={tenant.id} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre del negocio</label>
            <input name="name" defaultValue={tenant.name} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Identificador público (slug)</label>
            <input name="slug" defaultValue={tenant.slug} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Plan</label>
            <select name="plan" defaultValue={tenant.plan} className={inputCls}>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <select name="currency" defaultValue={tenant.currency} className={inputCls}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Límite de colaboradores</label>
            <input type="number" name="maxStaff" min={1} defaultValue={tenant.maxStaff} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Límite de servicios</label>
            <input type="number" name="maxServices" min={1} defaultValue={tenant.maxServices} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Funciones habilitadas</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {FEATURE_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2">
                <input type="checkbox" name={`feature_${k}`} defaultChecked={tenant.features[k]} />
                {FEATURE_LABELS[k]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Motivo de suspensión</label>
            <input name="suspendedReason" defaultValue={tenant.suspendedReason ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notas internas</label>
            <input name="notes" defaultValue={tenant.notes ?? ""} className={inputCls} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={tenant.isActive} />
          Negocio activo (si se desmarca, sus usuarios no podrán iniciar sesión)
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggle}
              className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-base"
            >
              {tenant.isActive ? "Suspender negocio" : "Activar negocio"}
            </button>
            {!tenant.isPlatform && (
              <button
                type="button"
                onClick={remove}
                className="px-3 py-2 rounded-lg border border-error/40 text-error text-xs hover:bg-error/10"
              >
                Eliminar negocio
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}
