"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
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
    { name: "Calendario", href: "/admin/calendario", icon: Calendar },
    { name: "Servicios", href: "/admin/servicios", icon: Layers },
    { name: "Equipo", href: "/admin/personal", icon: Users },
    { name: "Clientes", href: "/admin/clientes", icon: Contact },
    { name: "Configuración", href: "/admin/configuracion", icon: Settings },
  ];

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Barra superior móvil */}
      <div
        className="lg:hidden sticky top-0 z-40 border-b border-border px-4 h-14 flex items-center justify-between bg-base"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-admin"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span
            className="text-sm font-medium text-foreground truncate"
          >
            {tenantName}
          </span>
        </div>

        <Link
          href={`/b/${tenantSlug}`}
          target="_blank"
          className="text-[11px] font-medium px-2.5 py-1 rounded border border-border text-muted hover:text-foreground flex items-center gap-1.5 transition"
        >
          <span>Portal</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Backdrop móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-admin"
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 border-r border-border bg-base ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-5 py-5 border-b border-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group min-w-0">
              {/* Monograma del tenant */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 font-display bg-surface-raised border border-border text-accent-warm"
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span
                  className="text-[10px] font-medium uppercase tracking-widest text-dim block leading-tight"
                >
                  Panel de control
                </span>
                <span className="text-sm font-medium text-foreground truncate block mt-0.5">
                  {tenantName}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="lg:hidden p-1.5 text-muted hover:text-foreground rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Portal link */}
          <div className="px-4 pt-4">
            <Link
              href={`/b/${tenantSlug}`}
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-border-strong transition group text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5" />
                <span>Ver portal de clientes</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition" />
            </Link>
          </div>

          {/* Nav */}
          <nav className="px-4 pt-6 pb-4" aria-label="Navegación principal">
            <span className="px-2 text-[10px] font-medium uppercase tracking-widest text-dim block mb-3">
              Navegación
            </span>
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-surface-raised text-foreground border border-border"
                          : "text-muted hover:text-foreground hover:bg-surface"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive
                            ? "text-accent-warm"
                            : "text-dim"
                        }`}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <span
                          className="ml-auto w-1 h-4 rounded-full bg-accent-warm"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom: usuario */}
        <div
          className="px-4 py-4 border-t border-border"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Monograma del usuario */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 font-display bg-surface-raised border border-border text-accent-warm"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-foreground block truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-dim block truncate leading-tight">
                  {userEmail || userRole}
                </span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-1.5 text-dim hover:text-muted rounded transition"
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
