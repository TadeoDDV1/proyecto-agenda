"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Tema = "light" | "dark" | "system";

const ETIQUETA: Record<Tema, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Dispositivo",
};

function aplicar(tema: Tema) {
  const oscuro =
    tema === "dark" ||
    (tema === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
  localStorage.setItem("tema", tema);
}

export function ThemeToggle({ compacto = false }: { compacto?: boolean }) {
  const [tema, setTema] = useState<Tema>("system");

  useEffect(() => {
    const guardado = (localStorage.getItem("tema") as Tema | null) ?? "system";
    setTema(guardado);
  }, []);

  function cambiar(nuevo: Tema) {
    setTema(nuevo);
    aplicar(nuevo);
  }

  const opciones: { valor: Tema; icono: React.ReactNode }[] = [
    { valor: "light", icono: <Sun className="w-3.5 h-3.5" /> },
    { valor: "dark", icono: <Moon className="w-3.5 h-3.5" /> },
    { valor: "system", icono: <Monitor className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={compacto ? "flex gap-1" : "flex items-center gap-1"}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => cambiar(o.valor)}
          title={`Tema ${ETIQUETA[o.valor].toLowerCase()}`}
          aria-label={`Tema ${ETIQUETA[o.valor]}`}
          aria-pressed={tema === o.valor}
          className={`p-1.5 rounded-lg border transition ${
            tema === o.valor
              ? "border-accent text-accent-warm bg-accent-soft"
              : "border-border text-muted hover:text-foreground hover:bg-base"
          }`}
        >
          {o.icono}
        </button>
      ))}
    </div>
  );
}
