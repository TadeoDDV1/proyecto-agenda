"use client";

import { useState } from "react";
import { registerTenantAction } from "@/app/actions/auth";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { getVertical, verticalOptions } from "@/lib/verticals";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [vertical, setVertical] = useState("");

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
    formData.append("vertical", vertical);

    const res = await registerTenantAction(formData);
    setLoading(false);

    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "No fue posible crear el negocio.");
    }
  }

  const verticalConfig = vertical ? getVertical(vertical) : null;

  return (
    <AuthShell
      eyebrow="Crear cuenta"
      title="Abrir mi agenda"
      description="Elige tu giro y arranca con catálogo, equipo y horario listos."
      maxWidth="max-w-lg"
    >
      <Card className="p-6 sm:p-8">
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2.5 rounded-[3px] border border-error/25 bg-error/10 p-3 text-xs text-error-text"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="space-y-4">
            <legend className="mb-4 w-full border-b border-border-subtle pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
              01 · Tu negocio
            </legend>

            <Field
              label="Giro del negocio"
              required
              htmlFor="vertical"
              hint={
                verticalConfig
                  ? `Precargaremos ${verticalConfig.presets.services.length} ${verticalConfig.terms.services.toLowerCase()} de ejemplo. Podrás editarlos después.`
                  : "Define el vocabulario, el catálogo inicial y la plantilla de tu portal."
              }
            >
              <Select
                id="vertical"
                required
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona el giro…
                </option>
                {verticalOptions().map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            <Field label="Nombre del negocio" required htmlFor="businessName">
              <Input
                id="businessName"
                type="text"
                required
                autoComplete="organization"
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
                <span className="pointer-events-none absolute left-3.5 select-none font-mono text-xs text-dim">
                  /b/
                </span>
                <Input
                  type="text"
                  required
                  autoComplete="off"
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
          </fieldset>

          <fieldset className="mt-7 space-y-4">
            <legend className="mb-4 w-full border-b border-border-subtle pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-dim">
              02 · Administrador
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre del admin" required htmlFor="ownerName">
                <Input
                  id="ownerName"
                  type="text"
                  required
                  autoComplete="name"
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
                  autoComplete="tel"
                  placeholder="55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Correo electrónico" required htmlFor="reg-email">
                <Input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@tu-salon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Moneda" htmlFor="currency">
                <Select
                  id="currency"
                  autoComplete="off"
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </fieldset>

          <Button
            type="submit"
            loading={loading}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
            className="mt-6 w-full"
          >
            {loading ? "Creando agenda..." : "Abrir mi agenda"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-dim">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-muted underline underline-offset-2 transition hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </Card>
    </AuthShell>
  );
}
