"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { 
  Scissors, 
  Calendar, 
  Layers, 
  Users, 
  ExternalLink, 
  LogOut,
  Sparkles
} from "lucide-react";

interface AdminNavProps {
  tenantName: string;
  tenantSlug: string;
  userEmail?: string;
}

export function AdminNav({ tenantName, tenantSlug, userEmail }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Resumen", icon: Layers },
    { href: "/admin/calendario", label: "Calendario Diario", icon: Calendar },
    { href: "/admin/servicios", label: "Servicios", icon: Scissors },
    { href: "/admin/personal", label: "Colaboradores", icon: Users },
  ];

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 block leading-tight">
                  Panel de Control
                </span>
                <span className="text-sm font-bold text-white leading-tight line-clamp-1">
                  {tenantName}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-slate-800 text-amber-400 border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/b/${tenantSlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition"
            >
              <span>Ver Portal Público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-1 py-2 border-t border-slate-850 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-amber-400 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
