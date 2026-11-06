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
  Palette,
  Clock,
} from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea, buttonClasses } from "@/components/ui";
import { VITRINA_THEMES, VITRINA_THEME_NAMES } from "@/lib/vitrina/theme";
import { getVertical } from "@/lib/verticals";

const THEME_COPY: Record<string, { label: string; note: string }> = {
  TERRACOTTA: { label: "Terracota", note: "Cálido y artesanal. Barberías y salones clásicos." },
  SAGE: { label: "Salvia", note: "Natural y sereno. Spas y cuidado personal." },
  NOIR: { label: "Noir", note: "Sobrio y elegante. Estudios y marcas premium." },
};

const TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "America/Mexico_City", label: "Ciudad de México (centro)" },
  { value: "America/Cancun", label: "Cancún" },
  { value: "America/Monterrey", label: "Monterrey" },
  { value: "America/Tijuana", label: "Tijuana" },
  { value: "America/Bogota", label: "Bogotá" },
  { value: "America/Lima", label: "Lima" },
  { value: "America/Santiago", label: "Santiago" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/New_York", label: "Nueva York" },
  { value: "America/Los_Angeles", label: "Los Ángeles" },
  { value: "Europe/Madrid", label: "Madrid" },
];

interface TenantSettingsProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    address: string | null;
    currency: string;
    description: string | null;
    tagline: string | null;
    story: string | null;
    instagram: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    brandTheme: string;
    timezone: string;
    vertical: string;
    whatsappNumber: string | null;
    bookingWindowDays: number;
    minLeadTimeMinutes: number;
    cancellationWindowHours: number;
  };
}

export function TenantSettingsForm({ tenant }: TenantSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(tenant.brandTheme);
  const vertical = getVertical(tenant.vertical);

  const timezoneOptions = TIMEZONES.some((zone) => zone.value === tenant.timezone)
    ? TIMEZONES
    : [{ value: tenant.timezone, label: tenant.timezone }, ...TIMEZONES];

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
    formData.set("brandTheme", theme);

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
              Portal público activo · {vertical.label}
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
              className={buttonClasses("primary", "sm")}
            >
              <span>Abrir portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-4 p-2.5 rounded-[3px] border border-border bg-base flex items-center gap-2 font-mono text-xs break-all select-all text-accent-warm">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-dim" />
          <span>/b/{tenant.slug}</span>
        </div>
      </Card>

      {success && (
        <div className="p-3 rounded-[3px] border border-success/25 bg-success/10 text-success-text text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Configuración actualizada correctamente.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-[3px] border border-error/25 bg-error/10 text-error-text text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos del negocio */}
        <Card className="p-6 sm:p-8">
          <div className="pb-5 border-b border-border mb-6">
            <h3 className="text-sm font-medium text-foreground">Datos del negocio</h3>
            <p className="text-xs mt-0.5 text-muted">
              Información de contacto que se muestra en tu página pública.
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Nombre del salón" required htmlFor="tenant-name">
                <Input type="text" name="name" required defaultValue={tenant.name} id="tenant-name" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Teléfono de contacto" htmlFor="tenant-phone">
                <Input
                  type="tel"
                  name="phone"
                  defaultValue={tenant.phone || ""}
                  placeholder="+52 55 1234 5678"
                  id="tenant-phone"
                />
              </Field>
              <Field
                label="WhatsApp"
                htmlFor="tenant-whatsapp"
                hint="Se usa para el botón de WhatsApp de la página pública."
              >
                <Input
                  type="tel"
                  name="whatsappNumber"
                  defaultValue={tenant.whatsappNumber || ""}
                  placeholder="+52 55 1234 5678"
                  id="tenant-whatsapp"
                />
              </Field>
            </div>

            <Field label="Dirección física" htmlFor="tenant-address">
              <Input
                type="text"
                name="address"
                defaultValue={tenant.address || ""}
                placeholder="Av. Insurgentes Sur 450, CDMX"
                id="tenant-address"
              />
            </Field>

            <Field
              label="Descripción corta"
              htmlFor="tenant-description"
              hint="Texto de apoyo para buscadores y redes."
            >
              <Textarea
                name="description"
                rows={3}
                defaultValue={tenant.description || ""}
                placeholder="Barbería clásica y corte moderno. Café de cortesía en cada cita."
                id="tenant-description"
              />
            </Field>
          </div>
        </Card>

        {/* Identidad pública (Vitrina) */}
        <Card className="p-6 sm:p-8">
          <div className="pb-5 border-b border-border mb-6">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-dim" />
              Identidad pública
            </h3>
            <p className="text-xs mt-0.5 text-muted">
              Lo que aparece en la portada de tu página de reservas.
            </p>
          </div>

          <div className="space-y-5">
            <Field
              label="Frase de portada"
              htmlFor="tenant-tagline"
              hint="Una línea. La última palabra se destaca en cursiva."
            >
              <Input
                type="text"
                name="tagline"
                defaultValue={tenant.tagline || ""}
                placeholder="El oficio de siempre, con la precisión de hoy."
                id="tenant-tagline"
              />
            </Field>

            <Field
              label="Historia del salón"
              htmlFor="tenant-story"
              hint="Dos o tres frases. Se muestra en la sección El espacio."
            >
              <Textarea
                name="story"
                rows={4}
                defaultValue={tenant.story || ""}
                placeholder="Abrimos en 2014 con dos sillas y una idea simple: que cada corte tenga tiempo."
                id="tenant-story"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Instagram" htmlFor="tenant-instagram" hint="Solo el usuario: @tusalon">
                <Input
                  type="text"
                  name="instagram"
                  defaultValue={tenant.instagram || ""}
                  placeholder="barberiavintage"
                  id="tenant-instagram"
                />
              </Field>
              <Field label="URL del logo" htmlFor="tenant-logo" hint="Cuadrado, mínimo 200×200 px.">
                <Input
                  type="url"
                  name="logoUrl"
                  defaultValue={tenant.logoUrl || ""}
                  placeholder="https://…/logo.jpg"
                  id="tenant-logo"
                />
              </Field>
            </div>

            <Field
              label="URL de la portada"
              htmlFor="tenant-cover"
              hint="Horizontal, mínimo 1200 px de ancho. Sin portada se usa una composición gráfica."
            >
              <Input
                type="url"
                name="coverImageUrl"
                defaultValue={tenant.coverImageUrl || ""}
                placeholder="https://…/portada.jpg"
                id="tenant-cover"
              />
            </Field>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted mb-2">
                Tema de la página
              </p>
              <input type="hidden" name="brandTheme" value={theme} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VITRINA_THEME_NAMES.map((name) => {
                  const palette = VITRINA_THEMES[name];
                  const copy = THEME_COPY[name];
                  const selected = theme === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setTheme(name)}
                      aria-pressed={selected}
                      className={`text-left p-3 rounded-[3px] border transition ${
                        selected
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-base hover:border-border-strong"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 mb-2" aria-hidden="true">
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ background: palette.brand }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ background: palette.paper }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ background: palette.accent }}
                        />
                      </span>
                      <span className="block text-xs font-medium text-foreground">
                        {copy.label}
                        {selected && <span className="ml-1 text-accent-hover">✓</span>}
                      </span>
                      <span className="block text-[11px] text-dim mt-0.5 leading-snug">
                        {copy.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Reservas y operación */}
        <Card className="p-6 sm:p-8">
          <div className="pb-5 border-b border-border mb-6">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-dim" />
              Reservas y operación
            </h3>
            <p className="text-xs mt-0.5 text-muted">
              Reglas que aplican a la web, al admin y al futuro bot de WhatsApp.
            </p>
          </div>

          <div className="space-y-5">
            <Field
              label="Zona horaria"
              htmlFor="tenant-timezone"
              hint="Todas las citas se guardan en UTC y se muestran en esta zona."
            >
              <Select name="timezone" defaultValue={tenant.timezone} id="tenant-timezone">
                {timezoneOptions.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label} — {zone.value}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field
                label="Ventana de reserva"
                htmlFor="tenant-window"
                hint="Días hacia adelante."
              >
                <Input
                  type="number"
                  name="bookingWindowDays"
                  min={1}
                  max={365}
                  defaultValue={tenant.bookingWindowDays}
                  id="tenant-window"
                />
              </Field>
              <Field
                label="Antelación mínima"
                htmlFor="tenant-lead"
                hint="Minutos antes de la cita."
              >
                <Input
                  type="number"
                  name="minLeadTimeMinutes"
                  min={0}
                  max={1440}
                  step={15}
                  defaultValue={tenant.minLeadTimeMinutes}
                  id="tenant-lead"
                />
              </Field>
              <Field
                label="Cancelación"
                htmlFor="tenant-cancel"
                hint="Horas de cortesía."
              >
                <Input
                  type="number"
                  name="cancellationWindowHours"
                  min={0}
                  max={168}
                  defaultValue={tenant.cancellationWindowHours}
                  id="tenant-cancel"
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* En móvil la barra queda fija al fondo: el formulario es largo. */}
        <div className="sticky bottom-0 z-20 -mx-5 -mb-5 flex items-center justify-end gap-3 border-t border-border bg-base/95 px-5 py-3 backdrop-blur sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <p className="hidden sm:block mr-auto text-[11px] text-dim">
            Los cambios se publican al guardar.
          </p>
          <Button
            type="submit"
            loading={isSubmitting}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
}
