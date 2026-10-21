"use client";

import { useState } from "react";
import { registerTenantAction } from "@/app/actions/auth";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select } from "@/components/ui";

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
      setError(res.error || "No fue posible crear el negocio.");
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-10">
        <Link href="/" className="inline-block mb-8">
          <span className="font-display italic text-muted text-sm tracking-wider">
            AgendaSaaS
          </span>
        </Link>
        <h1 className="text-3xl font-light tracking-tight text-foreground font-display">
          Registrar negocio
        </h1>
        <p className="mt-2 text-sm text-muted">
          Configura tu agenda en minutos, sin tarjeta requerida
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/25 text-error-text text-xs flex items-center gap-2.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Nombre del negocio" required htmlFor="businessName">
              <Input
                id="businessName"
                type="text"
                required
                placeholder="Ej. Barbería Élite"
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
              />
            </Field>

            <Field
              label="Enlace de reservas"
              required
              hint="Tus clientes usarán este enlace para agendar sin app."
              htmlFor="slug"
            >
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-dim text-xs font-mono pointer-events-none select-none">
                  /b/
                </span>
                <Input
                  type="text"
                  required
                  placeholder="barberia-elite"
                  id="slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="pl-10 font-mono text-accent-warm"
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre del admin" required htmlFor="ownerName">
                <Input
                  id="ownerName"
                  type="text"
                  required
                  placeholder="Carlos Ramos"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </Field>
              <Field label="Teléfono / WhatsApp" required htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Correo electrónico" required htmlFor="reg-email">
                <Input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="admin@tu-salon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Moneda" htmlFor="currency">
                <Select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="MXN">MXN — Peso Mexicano</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="EUR">EUR — Euro</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Contraseña"
              required
              hint="Mínimo 6 caracteres."
              htmlFor="reg-password"
            >
              <Input
                id="reg-password"
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
              {loading ? "Creando agenda..." : "Abrir mi agenda"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-dim">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-muted hover:text-foreground underline underline-offset-2 transition"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-[11px] text-dim mt-5">
          Base de datos aislada por tenant · Sin tarjeta requerida
        </p>
      </div>
    </div>
  );
}
