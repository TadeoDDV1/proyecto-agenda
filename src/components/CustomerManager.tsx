"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  X,
  FileText,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Save,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { createCustomerAction, updateCustomerNotesAction } from "@/app/actions/admin";
import { getWhatsAppUrl } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  StatusPill,
  Textarea,
} from "@/components/ui";

interface AppointmentHistory {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  totalPrice: number | string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
  staff: {
    id: string;
    displayName: string;
    colorCode: string;
  };
}

interface CustomerItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string | Date;
  appointments: AppointmentHistory[];
}

interface CustomerManagerProps {
  initialCustomers: CustomerItem[];
  tenantCurrency: string;
  tenantName: string;
}

export function CustomerManager({
  initialCustomers,
  tenantCurrency,
  tenantName,
}: CustomerManagerProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "frequent" | "new" | "none">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [customerNotes, setCustomerNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // La ficha del cliente es un diálogo: bloquea el scroll del fondo y cierra
  // con Escape para no dejar al usuario atrapado en el panel lateral.
  useEffect(() => {
    if (!selectedCustomer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCustomer(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter((customer) => {
    const q = search.toLowerCase();
    const matchesSearch =
      customer.fullName.toLowerCase().includes(q) ||
      customer.phone.includes(q) ||
      (customer.email ? customer.email.toLowerCase().includes(q) : false);

    if (!matchesSearch) return false;

    const aptCount = customer.appointments.length;
    if (activeTab === "frequent") return aptCount >= 2;
    if (activeTab === "new") return aptCount === 1;
    if (activeTab === "none") return aptCount === 0;
    return true;
  });

  const totalCustomers = customers.length;
  const frequentCustomers = customers.filter((c) => c.appointments.length >= 2).length;
  const totalCompletedAppointments = customers.reduce(
    (acc, c) => acc + c.appointments.filter((a) => a.status === "COMPLETED").length,
    0
  );
  const totalLTV = customers.reduce((acc, c) => {
    const spent = c.appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + Number(a.totalPrice || 0), 0);
    return acc + spent;
  }, 0);

  function handleSelectCustomer(customer: CustomerItem) {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setNotesSuccess(false);
  }

  async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createCustomerAction(formData);
    setIsSubmitting(false);

    if (res.success && res.customer) {
      const newCustomerWithApts: CustomerItem = {
        ...res.customer,
        appointments: [],
      };
      setCustomers([newCustomerWithApts, ...customers]);
      setShowAddModal(false);
      form.reset();
    } else {
      setModalError(res.error || "No fue posible registrar al cliente.");
    }
  }

  async function handleSaveNotes() {
    if (!selectedCustomer) return;
    setIsSavingNotes(true);
    setNotesSuccess(false);

    const res = await updateCustomerNotesAction(selectedCustomer.id, customerNotes);
    setIsSavingNotes(false);

    if (res.success) {
      setNotesSuccess(true);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, notes: customerNotes } : c
        )
      );
      setTimeout(() => setNotesSuccess(false), 3000);
    }
  }

  const stats = [
    {
      label: "Total clientes",
      value: totalCustomers,
      hint: "Registrados en agenda",
      icon: Award,
      tone: "text-accent-warm",
    },
    {
      label: "Frecuentes",
      value: frequentCustomers,
      hint: "Con 2 o más reservas",
      icon: Sparkles,
      tone: "text-success-text",
    },
    {
      label: "Citas completadas",
      value: totalCompletedAppointments,
      hint: "Servicios finalizados",
      icon: Calendar,
      tone: "text-foreground",
    },
    {
      label: "LTV acumulado",
      value: `${totalLTV.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      hint: `Facturación · ${tenantCurrency}`,
      icon: TrendingUp,
      tone: "text-accent-warm",
    },
  ];

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "all", label: `Todos (${customers.length})` },
    { key: "frequent", label: `Frecuentes (${frequentCustomers})` },
    { key: "new", label: "Nuevos" },
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card key={label} className="p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted uppercase tracking-[0.1em] leading-tight">
                {label}
              </span>
              <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-dim">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`mt-2 text-xl sm:text-2xl font-semibold font-display ${tone}`}>
              {value}
            </div>
            <span className="text-[10px] text-dim mt-0.5 block leading-tight">{hint}</span>
          </Card>
        ))}
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-dim absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-2.5 text-dim hover:text-foreground text-xs transition"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex bg-surface p-1 rounded-lg border border-border text-xs font-semibold overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Listado */}
      <Card className="overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title="No se encontraron clientes"
            description="Prueba cambiando el término de búsqueda o crea un nuevo cliente manualmente."
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredCustomers.map((customer) => {
              const apts = customer.appointments;
              const completedApts = apts.filter((a) => a.status === "COMPLETED");
              const totalSpent = completedApts.reduce(
                (sum, a) => sum + Number(a.totalPrice || 0),
                0
              );
              const lastApt = apts.length > 0 ? apts[0] : null;

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-raised/60 transition group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-surface-raised border border-border text-accent-warm font-semibold flex items-center justify-center text-sm shrink-0 group-hover:border-accent/40 transition font-display">
                      {customer.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground group-hover:text-accent-warm transition">
                          {customer.fullName}
                        </span>
                        {apts.length >= 3 && <Badge tone="accent">VIP</Badge>}
                        {apts.length === 2 && <Badge tone="success">Recurrente</Badge>}
                        {apts.length === 1 && <Badge>1 cita</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-dim" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1 text-[11px] text-dim">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.notes && (
                          <span className="flex items-center gap-1 text-[11px] text-accent-warm italic">
                            <FileText className="w-3 h-3" />
                            Nota
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-subtle">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-dim uppercase tracking-wider block font-semibold">
                        Gasto total
                      </span>
                      <span className="text-sm font-semibold text-foreground block">
                        ${totalSpent.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-dim font-normal">
                          {tenantCurrency}
                        </span>
                      </span>
                    </div>

                    <div className="text-left sm:text-right hidden md:block">
                      <span className="text-[10px] text-dim uppercase tracking-wider block font-semibold">
                        Última cita
                      </span>
                      <span className="text-xs text-muted block font-medium">
                        {lastApt
                          ? format(new Date(lastApt.startTime), "d MMM yyyy", { locale: es })
                          : "Sin citas"}
                      </span>
                    </div>

                    <a
                      href={getWhatsAppUrl(
                        customer.phone,
                        `¡Hola ${customer.fullName}! Te escribimos de ${tenantName}. ¿En qué podemos apoyarte con tu próxima cita?`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-lg bg-success/10 hover:bg-success/20 text-success-text border border-success/25 transition"
                      title="Enviar WhatsApp"
                      aria-label="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <ChevronRight className="w-4 h-4 text-dim group-hover:text-accent-warm group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Drawer: ficha del cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar ficha"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedCustomer(null)}
          />

          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-drawer-title"
            tabIndex={-1}
            className="relative z-10 flex w-full max-w-lg flex-col justify-between overflow-y-auto border-l border-border bg-surface p-6 focus:outline-none animate-slide-in-right"
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-accent-soft border border-accent/25 text-accent-warm font-semibold flex items-center justify-center text-lg flex-shrink-0 font-display">
                    {selectedCustomer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3
                      id="customer-drawer-title"
                      className="font-semibold text-base text-foreground truncate"
                    >
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-dim" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="Cerrar detalle de cliente"
                  className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-raised transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contacto directo */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <a
                  href={getWhatsAppUrl(
                    selectedCustomer.phone,
                    `¡Hola ${selectedCustomer.fullName}! Te escribimos de ${tenantName}. ¿En qué podemos apoyarte con tu próxima cita?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-success/10 border border-success/25 text-success-text hover:bg-success/20 text-xs font-semibold transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-surface-raised border border-border text-foreground hover:border-border-strong text-xs font-semibold transition"
                >
                  <Phone className="w-4 h-4 text-muted" />
                  <span>Llamar</span>
                </a>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-base border border-border text-center mb-6">
                <div>
                  <span className="text-[10px] text-dim font-semibold uppercase block">
                    Citas
                  </span>
                  <span className="text-base font-semibold text-foreground mt-0.5 block font-display">
                    {selectedCustomer.appointments.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-dim font-semibold uppercase block">
                    Completadas
                  </span>
                  <span className="text-base font-semibold text-success-text mt-0.5 block font-display">
                    {selectedCustomer.appointments.filter((a) => a.status === "COMPLETED").length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-dim font-semibold uppercase block">
                    Invertido
                  </span>
                  <span className="text-base font-semibold text-accent-warm mt-0.5 block font-display">
                    $
                    {selectedCustomer.appointments
                      .filter((a) => a.status === "COMPLETED")
                      .reduce((sum, a) => sum + Number(a.totalPrice || 0), 0)
                      .toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Notas */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="cust-notes-detail" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-accent-hover" />
                    <span>Notas internas</span>
                  </label>
                  {notesSuccess && (
                    <span className="text-[11px] text-success-text font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Guardado
                    </span>
                  )}
                </div>
                <Textarea
                  id="cust-notes-detail"
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ej. Prefiere degradado alto con tijera arriba. Alérgico a productos mentolados..."
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleSaveNotes}
                    loading={isSavingNotes}
                    variant="secondary"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    {isSavingNotes ? "Guardando..." : "Guardar nota"}
                  </Button>
                </div>
              </div>

              {/* Historial */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-dim" />
                  <span>Historial de citas ({selectedCustomer.appointments.length})</span>
                </h4>

                {selectedCustomer.appointments.length === 0 ? (
                  <p className="text-xs text-dim italic p-4 rounded-xl bg-base border border-border text-center">
                    Este cliente aún no registra citas.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCustomer.appointments.map((apt) => {
                      const startTime = new Date(apt.startTime);

                      return (
                        <div
                          key={apt.id}
                          className="p-3 rounded-xl bg-base border border-border flex items-center justify-between text-xs gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {apt.service.name}
                              </span>
                              <StatusPill status={apt.status} />
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted">
                              <span>
                                {format(startTime, "EEEE d 'de' MMMM, HH:mm", { locale: es })} hrs
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: apt.staff.colorCode }}
                                />
                                {apt.staff.displayName}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-semibold text-foreground whitespace-nowrap">
                            ${Number(apt.totalPrice).toLocaleString("es-MX")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <Button
                variant="secondary"
                onClick={() => setSelectedCustomer(null)}
                className="w-full"
              >
                Cerrar detalle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nuevo cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent-soft border border-accent/20 text-accent-warm flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    Registrar nuevo cliente
                  </h3>
                  <p className="text-[11px] text-muted">
                    Añade un contacto a la agenda del salón
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                aria-label="Cerrar modal"
                className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-raised transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/25 text-error-text text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <Field label="Nombre completo" required htmlFor="cust-name">
                <Input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Ej. Roberto Navarro"
                id="cust-name"
                />
              </Field>

              <Field label="Teléfono / WhatsApp" required htmlFor="cust-phone">
                <Input type="tel" name="phone" required placeholder="Ej. 55 9876 5432" id="cust-phone" />
              </Field>

              <Field label="Correo electrónico (opcional)" htmlFor="cust-email">
                <Input type="email" name="email" placeholder="cliente@ejemplo.com" id="cust-email" />
              </Field>

              <Field label="Notas de preferencia (opcional)" htmlFor="cust-notes">
                <Textarea
                  name="notes"
                  rows={2}
                  placeholder="Preferencias de corte, estilo habitual..."
                id="cust-notes"
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
