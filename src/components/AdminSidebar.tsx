"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getVertical } from "@/lib/verticals";
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  Contact,
  MessageCircle,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Store,
  MessageSquare,
} from "lucide-react";

interface AdminSidebarProps {
  tenantName: string;
  tenantSlug: string;
  vertical?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

export function AdminSidebar({
  tenantName,
  tenantSlug,
  vertical,
  userEmail,
  userName = "Administrador",
  userRole = "OWNER",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const config = getVertical(vertical);
  const [mobileOpen, setMobileOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // En móvil el panel se comporta como diálogo: bloquea el scroll del fondo,
  // atrapa el foco y cierra con Escape.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = asideRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  const navigation = [
    { name: "Agenda", href: "/admin", icon: LayoutDashboard },
    { name: "Calendario", href: "/admin/calendario", icon: Calendar },
    { name: config.terms.services, href: "/admin/servicios", icon: Layers },
    { name: config.terms.professionals, href: "/admin/personal", icon: Users },
    { name: config.terms.customers, href: "/admin/clientes", icon: Contact },
    { name: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
    { name: "Configuración", href: "/admin/configuracion", icon: Settings },
  ];

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentSection =
    navigation.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    )?.name ?? "Panel";

  return (
    <>
      {/* Barra superior móvil */}
      <div
        className="lg:hidden sticky top-0 z-40 border-b border-border px-4 h-14 flex items-center justify-between bg-surface/95 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-[3px] text-muted hover:text-foreground hover:bg-surface-raised transition"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-admin"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-medium text-foreground truncate">
              {tenantName}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-dim truncate">
              {currentSection}
            </span>
          </span>
        </div>

        <Link
          href={`/b/${tenantSlug}`}
          target="_blank"
          className="text-[11px] font-medium px-2.5 py-1.5 rounded-[3px] border border-border text-muted hover:text-foreground hover:bg-surface-raised flex items-center gap-1.5 transition"
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
        ref={asideRef}
        id="sidebar-admin"
        aria-label="Menú de administración"
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between overscroll-contain transition-transform duration-200 lg:translate-x-0 border-r border-border bg-surface ${
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
                className="w-9 h-9 rounded-[3px] flex items-center justify-center text-sm font-semibold flex-shrink-0 font-display bg-accent-soft border border-accent/35 text-accent-warm shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]"
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.16em] text-dim block leading-tight"
                >
                  {config.label}
                </span>
                <span className="text-sm font-medium text-foreground truncate block mt-1">
                  {tenantName}
                </span>
              </div>
            </Link>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="lg:hidden p-1.5 text-muted hover:text-foreground rounded-[3px] hover:bg-surface-raised transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Portal link */}
          <div className="px-4 pt-4">
            <Link
              href={`/b/${tenantSlug}`}
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[3px] border border-border text-muted hover:text-foreground hover:border-border-strong hover:bg-surface-raised transition group text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-accent-warm" />
                <span>Ver portal de clientes</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition" />
            </Link>
          </div>

          {/* Nav */}
          <nav className="px-4 pt-6 pb-4" aria-label="Navegación principal">
            <span className="eyebrow-plain px-2 block mb-3">
              Navegación
            </span>
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-[3px] text-sm transition ${
                        isActive
                          ? "bg-accent-soft text-foreground font-medium"
                          : "text-muted hover:text-foreground hover:bg-surface-raised font-normal"
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-accent-warm" : "text-dim"
                        }`}
                      />
                      <span>{item.name}</span>
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
          <div className="flex items-center justify-between gap-2 rounded-[3px] border border-border bg-base/60 px-2.5 py-2">
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
                className="p-1.5 text-dim hover:text-foreground rounded-[3px] hover:bg-surface-raised transition"
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
