"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { Scissors, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail("admin@barberiavintage.com");
    setPassword("password123");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginAction(formData);
    setLoading(false);

    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "No fue posible iniciar sesión.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-100 relative overflow-hidden selection:bg-amber-500 selection:text-zinc-950">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform ring-1 ring-amber-400/30">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Agenda<span className="text-amber-400">SaaS</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Bienvenido a tu panel de control
        </h2>
        <p className="mt-2 text-xs text-zinc-400">
          Gestiona citas, colaboradores y catálogo en tiempo real
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-zinc-900/60 border border-zinc-800/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-9 backdrop-blur-xl">
          {/* Botón rápido de demo */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/5 border border-amber-500/25 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <span className="font-semibold block text-amber-300">¿Quieres explorar la demo?</span>
              <span className="text-zinc-400 text-[11px]">Usa las credenciales del negocio ya configurado.</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs whitespace-nowrap transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              Autocompletar Demo
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@barberiavintage.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Contraseña
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
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? "Iniciando sesión..." : "Ingresar al Panel"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              ¿Aún no tienes cuenta para tu negocio?{" "}
              <Link
                href="/register"
                className="font-semibold text-amber-400 hover:text-amber-300 transition"
              >
                Registrar nuevo salón
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Protegido con sesiones criptográficas JWT HttpOnly y contraseñas bcrypt
        </p>
      </div>
    </div>
  );
}
