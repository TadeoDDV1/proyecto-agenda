"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

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
    <div className="min-h-screen bg-base flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center mb-10">
        <Link href="/" className="inline-block mb-8">
          <span className="font-display italic text-muted text-sm tracking-wider">
            AgendaSaaS
          </span>
        </Link>
        <h1 className="font-display text-3xl font-light tracking-tight text-foreground">
          Acceder al panel
        </h1>
        <p className="mt-2 text-sm text-muted">Gestiona tu agenda y equipo</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Card className="p-8">
          {/* Demo credentials */}
          <div className="mb-6 pb-6 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted mb-1">
                  Cuenta de demostración
                </p>
                <p className="text-[11px] text-dim font-mono truncate">
                  admin@barberiavintage.com
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoCredentials}
                className="flex-shrink-0"
              >
                Autocompletar
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-error/10 border border-error/25 text-error-text text-xs flex items-center gap-2.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                placeholder="tu@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Button
              type="submit"
              loading={loading}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="w-full mt-2"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-dim">
              ¿Sin cuenta aún?{" "}
              <Link
                href="/register"
                className="text-muted hover:text-foreground underline underline-offset-2 transition"
              >
                Registrar negocio
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-[11px] text-dim mt-5">
          Sesiones JWT HttpOnly · Contraseñas bcrypt
        </p>
      </div>
    </div>
  );
}
