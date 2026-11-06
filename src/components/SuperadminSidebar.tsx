import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/superadmin", label: "Panel general" },
  { href: "/superadmin/citas", label: "Citas" },
  { href: "/superadmin/nuevo", label: "Nuevo negocio" },
  { href: "/superadmin/auditoria", label: "Auditoría" },
];

export function SuperadminSidebar({ email }: { email?: string }) {
  return (
    <aside className="lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-panel">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 text-accent-warm">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
            Administración de plataforma
          </span>
        </div>
        <p className="mt-1 text-sm font-display text-foreground">AgendaSaaS</p>
        {email && <p className="text-[11px] text-dim break-all mt-0.5">{email}</p>}
      </div>

      <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-base transition whitespace-nowrap"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pt-3"><ThemeToggle compacto /></div>
      <form action={logoutAction} className="p-3 lg:absolute lg:bottom-0 lg:w-full">
        <button
          type="submit"
          className="w-full px-3 py-2 rounded-lg text-xs text-muted border border-border hover:text-foreground hover:bg-base transition"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
