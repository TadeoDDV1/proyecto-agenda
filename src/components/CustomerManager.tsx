"use client";

import { useState } from "react";
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
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { createCustomerAction, updateCustomerNotesAction } from "@/app/actions/admin";

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

  // Estados para nuevo cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado para notas del cliente seleccionado
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Filtrado reactivo
  const filteredCustomers = customers.filter((customer) => {
    const q = search.toLowerCase();
    const matchesSearch =
      customer.fullName.toLowerCase().includes(q) ||
      customer.phone.includes(q) ||
      (customer.email && customer.email.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const aptCount = customer.appointments.length;
    if (activeTab === "frequent") return aptCount >= 2;
    if (activeTab === "new") return aptCount === 1;
    if (activeTab === "none") return aptCount === 0;
    return true;
  });

  // Métricas globales
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

  function getWhatsAppUrl(phone: string, customerName: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
    const msg = `¡Hola ${customerName}! Te escribimos de ${tenantName}. ¿En qué podemos apoyarte con tu próxima cita?`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="space-y-6">
      {/* Barra de Estadísticas Clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Clientes
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalCustomers}</div>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Registrados en agenda</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Clientes Frecuentes
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{frequentCustomers}</div>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Con 2 o más reservas</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Citas Completadas
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalCompletedAppointments}</div>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Servicios finalizados</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              LTV Acumulado
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            ${totalLTV.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
            <span className="text-xs text-zinc-400 font-normal">{tenantCurrency}</span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Facturación de clientes</span>
        </div>
      </div>

      {/* Controles de Búsqueda, Filtro y Acción */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Barra de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pestañas de Filtro y Botón Nuevo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "all"
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab("frequent")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "frequent"
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Frecuentes ({frequentCustomers})
            </button>
            <button
              onClick={() => setActiveTab("new")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "new"
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Nuevos
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Listado de Clientes */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-300">No se encontraron clientes</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Prueba cambiando el término de búsqueda o crea un nuevo cliente manualmente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-850">
            {filteredCustomers.map((customer) => {
              const apts = customer.appointments;
              const completedApts = apts.filter((a) => a.status === "COMPLETED");
              const totalSpent = completedApts.reduce(
                (sum, a) => sum + Number(a.totalPrice || 0),
                0
              );
              const lastApt = apts.length > 0 ? apts[0] : null;

              return (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-850/40 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-750 text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0 group-hover:border-amber-500/50 transition">
                      {customer.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition">
                          {customer.fullName}
                        </span>
                        {apts.length >= 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            VIP
                          </span>
                        )}
                        {apts.length === 2 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Recurrente
                          </span>
                        )}
                        {apts.length === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                            1 Cita
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Mail className="w-3 h-3 text-zinc-600" />
                            {customer.email}
                          </span>
                        )}
                        {customer.notes && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400/80 italic">
                            <FileText className="w-3 h-3" />
                            Nota
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Métricas del cliente y llamada a la acción */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-850">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                        Gasto Total
                      </span>
                      <span className="text-sm font-bold text-white block">
                        ${totalSpent.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {tenantCurrency}
                        </span>
                      </span>
                    </div>

                    <div className="text-left sm:text-right hidden md:block">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                        Última Cita
                      </span>
                      <span className="text-xs text-zinc-300 block font-medium">
                        {lastApt
                          ? format(new Date(lastApt.startTime), "d MMM yyyy", { locale: es })
                          : "Sin citas"}
                      </span>
                    </div>

                    {/* Botón rápido WhatsApp */}
                    <a
                      href={getWhatsAppUrl(customer.phone, customer.fullName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Drawer: Ficha Detallada del Cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl z-10">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-5 border-b border-zinc-850">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
                    {selectedCustomer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Botones de Contacto Directo */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <a
                  href={getWhatsAppUrl(selectedCustomer.phone, selectedCustomer.fullName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chatear en WhatsApp</span>
                </a>

                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  <Phone className="w-4 h-4 text-zinc-400" />
                  <span>Llamar al Móvil</span>
                </a>
              </div>

              {/* Resumen de Fidelidad y Métricas */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-center mb-6">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                    Citas Totales
                  </span>
                  <span className="text-base font-black text-white mt-0.5 block">
                    {selectedCustomer.appointments.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                    Completadas
                  </span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {selectedCustomer.appointments.filter((a) => a.status === "COMPLETED").length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                    Total Invertido
                  </span>
                  <span className="text-base font-black text-amber-400 mt-0.5 block">
                    $
                    {selectedCustomer.appointments
                      .filter((a) => a.status === "COMPLETED")
                      .reduce((sum, a) => sum + Number(a.totalPrice || 0), 0)
                      .toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Notas Internas del Cliente */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Notas Internas del Cliente</span>
                  </label>
                  {notesSuccess && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Guardado
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ej. Prefiere degradado alto con tijera arriba. Alérgico a productos mentolados..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs border border-zinc-700 transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSavingNotes ? "Guardando..." : "Guardar Nota"}</span>
                  </button>
                </div>
              </div>

              {/* Historial de Citas del Cliente */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Historial de Citas ({selectedCustomer.appointments.length})</span>
                </h4>

                {selectedCustomer.appointments.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 text-center">
                    Este cliente aún no registra citas.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCustomer.appointments.map((apt) => {
                      const startTime = new Date(apt.startTime);
                      const isCompleted = apt.status === "COMPLETED";
                      const isCancelled = apt.status === "CANCELLED";

                      return (
                        <div
                          key={apt.id}
                          className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100">{apt.service.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  isCompleted
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : isCancelled
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {isCompleted
                                  ? "Completada"
                                  : isCancelled
                                  ? "Cancelada"
                                  : "Confirmada"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
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

                          <div className="text-right font-bold text-zinc-200">
                            ${Number(apt.totalPrice).toLocaleString("es-MX")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Drawer */}
            <div className="pt-4 border-t border-zinc-850 mt-6 text-center">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-300 transition"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Nuevo Cliente Manualmente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-850 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Registrar Nuevo Cliente</h3>
                  <p className="text-[11px] text-zinc-400">Añade un contacto a la agenda del salón</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Ej. Roberto Navarro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="Ej. 55 9876 5432"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Notas de Preferencia (Opcional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Preferencias de corte, estilo habitual..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
