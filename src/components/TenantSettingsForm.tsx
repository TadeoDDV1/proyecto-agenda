"use client";

import { useState } from "react";
import { updateTenantSettingsAction } from "@/app/actions/admin";
import {
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Save,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";

interface TenantSettingsProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    address: string | null;
    currency: string;
    description: string | null;
  };
}

export function TenantSettingsForm({ tenant }: TenantSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = `http://localhost:3000/b/${tenant.slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateTenantSettingsAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(res.error || "No fue posible guardar los cambios.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner de Enlace Público y Compartir */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/5 border border-amber-500/25 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Portal Público Activo
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Enlace de Reservas de tu Salón</h3>
            <p className="text-xs text-zinc-400">
              Comparte este link en tu biografía de Instagram, WhatsApp Business o Facebook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>{copied ? "¡Enlace Copiado!" : "Copiar Enlace"}</span>
            </button>

            <a
              href={`/b/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
            >
              <span>Abrir Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center gap-2 font-mono text-xs text-amber-400 break-all select-all">
          <LinkIcon className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>{publicUrl}</span>
        </div>
      </div>

      {/* Formulario de Configuración */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="pb-5 border-b border-zinc-850 mb-6">
          <h3 className="text-base font-bold text-white">Datos Generales del Negocio</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personaliza cómo ven los clientes la información de tu salón.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Configuración actualizada exitosamente en tiempo real.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nombre del Salón o Barbería *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={tenant.name}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  defaultValue={tenant.phone || ""}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Dirección Física
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="address"
                  defaultValue={tenant.address || ""}
                  placeholder="Ej. Av. Insurgentes Sur 450, CDMX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Moneda de Cobro
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <select
                  name="currency"
                  defaultValue={tenant.currency}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 transition"
                >
                  <option value="MXN">MXN ($ - Peso Mexicano)</option>
                  <option value="USD">USD ($ - Dólar Estadounidense)</option>
                  <option value="COP">COP ($ - Peso Colombiano)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Descripción o Mensaje de Bienvenida para el Cliente
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={tenant.description || ""}
              placeholder="Ej. Barbería clásica y corte moderno. Café y bebidas de cortesía en cada cita."
              className="w-full p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition"
            />
          </div>

          <div className="pt-4 border-t border-zinc-850 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Guardando..." : "Guardar Configuración"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
