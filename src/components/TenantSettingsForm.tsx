"use client";

import { useState } from "react";
import { updateTenantSettingsAction } from "@/app/actions/admin";
import {
  Save,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

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

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/b/${tenant.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("tenantId", tenant.id);

    const res = await updateTenantSettingsAction(formData);
    setIsSubmitting(false);

    if (res?.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(res?.error || "No fue posible guardar los cambios.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Banner de enlace público */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-dim mb-1">
              Portal público activo
            </p>
            <h3 className="text-base font-light text-foreground font-display mb-0.5">
              Enlace de reservas
            </h3>
            <p className="text-xs text-muted">
              Comparte en Instagram, WhatsApp Business o donde tus clientes te encuentren.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </Button>

            <a
              href={`/b/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 gap-1.5 px-3 rounded-lg bg-accent text-accent-fg text-xs font-medium hover:bg-accent-dim transition"
            >
              <span>Abrir portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-4 p-2.5 rounded-lg border border-border bg-base flex items-center gap-2 font-mono text-xs break-all select-all text-accent-warm">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-dim" />
          <span>/b/{tenant.slug}</span>
        </div>
      </Card>

      {/* Formulario */}
      <Card className="p-6 sm:p-8">
        <div className="pb-5 border-b border-border mb-6">
          <h3 className="text-sm font-medium text-foreground">Datos del negocio</h3>
          <p className="text-xs mt-0.5 text-muted">
            Personaliza cómo ven tus clientes la información de tu salón.
          </p>
        </div>

        {success && (
          <div className="mb-5 p-3 rounded-lg border border-success/25 bg-success/10 text-success-text text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Configuración actualizada correctamente.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-error/25 bg-error/10 text-error-text text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nombre del salón" required htmlFor="tenant-name">
              <Input type="text" name="name" required defaultValue={tenant.name} id="tenant-name" />
            </Field>
            <Field label="Teléfono de contacto" htmlFor="tenant-phone">
              <Input
                type="tel"
                name="phone"
                defaultValue={tenant.phone || ""}
                placeholder="+52 55 1234 5678"
              id="tenant-phone"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Dirección física" htmlFor="tenant-address">
              <Input
                type="text"
                name="address"
                defaultValue={tenant.address || ""}
                placeholder="Av. Insurgentes Sur 450, CDMX"
              id="tenant-address"
              />
            </Field>
            <Field label="Moneda" htmlFor="tenant-currency">
              <Select name="currency" defaultValue={tenant.currency} id="tenant-currency">
                <option value="MXN">MXN — Peso Mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="COP">COP — Peso Colombiano</option>
                <option value="EUR">EUR — Euro</option>
              </Select>
            </Field>
          </div>

          <Field label="Descripción / mensaje de bienvenida" htmlFor="tenant-description">
            <Textarea
              name="description"
              rows={3}
              defaultValue={tenant.description || ""}
              placeholder="Barbería clásica y corte moderno. Café de cortesía en cada cita."
            id="tenant-description"
            />
          </Field>

          <div className="pt-5 border-t border-border flex items-center justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
