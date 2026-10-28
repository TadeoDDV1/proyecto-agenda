"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
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
    <AuthShell
      eyebrow="Bienvenido de nuevo"
      title="Acceder al panel"
      description="Gestiona tu agenda, equipo y clientes desde un solo lugar."
    >
      <Card className="p-6 sm:p-8">
        {/* Cuenta demo */}
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-base p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
              Cuenta de demostración
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
              admin@barberiavintage.com
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fillDemoCredentials}
            className="flex-shrink-0 self-start sm:self-auto"
          >
            Autocompletar
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center gap-2.5 rounded-lg border border-error/25 bg-error/10 p-3 text-xs text-error-text"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Correo electrónico" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button
            type="submit"
            loading={loading}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
            className="mt-2 w-full"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-dim">
            ¿Sin cuenta aún?{" "}
            <Link
              href="/register"
              className="text-muted underline underline-offset-2 transition hover:text-foreground"
            >
              Registrar negocio
            </Link>
          </p>
        </div>
      </Card>
    </AuthShell>
  );
}
