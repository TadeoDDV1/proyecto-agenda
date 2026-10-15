"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  Contact,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Store,
} from "lucide-react";

interface AdminSidebarProps {
  tenantName: string;
  tenantSlug: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

export function AdminSidebar({
  tenantName,
  tenantSlug,
  userEmail,
  userName = "Administrador",
  userRole = "OWNER",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Calendario Diario", href: "/admin/calendario", icon: Calendar },
    { name: "Catálogo de Servicios", href: "/admin/servicios", icon: Layers },
    { name: "Equipo & Especialistas", href: "/admin/personal", icon: Users },
    { name: "Clientes & CRM", href: "/admin/clientes", icon: Contact },
    { name: "Configuración del Salón", href: "/admin/configuracion", icon: Settings },
  ];

  return (
    <>
      {/* Barra superior solo para móviles */}
      <div className="lg:hidden sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white line-clamp-1">{tenantName}</span>
          </div>
        </div>

        <Link
          href={`/b/${tenantSlug}`}
          target="_blank"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5"
        >
          <span>Portal</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Backdrop móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fijo + Móvil drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Header del Negocio */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-850">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block leading-tight">
                  Panel de Control
                </span>
                <span className="font-extrabold text-sm text-zinc-100 line-clamp-1 block mt-0.5">
                  {tenantName}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Enlace rápido al portal público */}
          <div className="mt-5">
            <Link
              href={`/b/${tenantSlug}`}
              target="_blank"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-amber-400 hover:border-amber-500/40 transition group text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Ver Portal de Clientes</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {/* Menú de Navegación Principal */}
          <nav className="mt-6 space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
              Menú Principal
            </span>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-zinc-900 text-amber-400 border border-zinc-800 shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-zinc-500"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sección Inferior de Usuario & Logout */}
        <div className="p-4 m-4 rounded-2xl bg-zinc-900/80 border border-zinc-850">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-zinc-200 block truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate leading-tight">
                  {userEmail || userRole}
                </span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
