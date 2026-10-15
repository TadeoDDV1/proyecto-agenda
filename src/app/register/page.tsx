"use client";

import { useState } from "react";
import { registerTenantAction } from "@/app/actions/auth";
import Link from "next/link";
import { Scissors, AlertCircle, ArrowRight, Building2, User, Mail, Lock, Phone, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("MXN");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-completar slug al escribir el nombre del negocio si el usuario no lo ha personalizado manualmente
  function handleBusinessNameChange(name: string) {
    setBusinessName(name);
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("slug", slug);
    formData.append("ownerName", ownerName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("currency", currency);

    const res = await registerTenantAction(formData);
    setLoading(false);

    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "No se pudo registrar el negocio.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-100 relative overflow-hidden selection:bg-amber-500 selection:text-zinc-950">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform ring-1 ring-amber-400/30">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Agenda<span className="text-amber-400">SaaS</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Crea tu negocio en minutos
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400">
          Obtén tu portal de reservas con enlace único y panel de gestión en tiempo real
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-zinc-900/60 border border-zinc-800/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información del Negocio */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nombre de tu Salón o Barbería *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Barbería Élite & Spa"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            {/* Enlace Personalizado / Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Enlace Público de Reservas *
                </label>
                {slug && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Disponible
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-zinc-500 flex items-center gap-1.5 text-xs font-mono pointer-events-none select-none">
                  <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline text-zinc-500">/b/</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="barberia-elite"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full sm:pl-16 pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm font-mono text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Tus clientes entrarán a este link para agendar citas sin necesidad de descargar una app.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nombre del Dueño/Admin *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Ramos"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 55 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@tu-salon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                >
                  <option value="MXN">MXN ($ - Peso Mexicano)</option>
                  <option value="USD">USD ($ - Dólar Estadounidense)</option>
                  <option value="COP">COP ($ - Peso Colombiano)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Contraseña de Acceso * (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-4 active:scale-[0.99]"
            >
              {loading ? "Creando tu negocio..." : "Comenzar Gratis y Abrir Agenda"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              ¿Ya registraste tu negocio?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-400 hover:text-amber-300 transition"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Sin tarjeta requerida • Base de datos aislada por tenant
        </p>
      </div>
    </div>
  );
}
