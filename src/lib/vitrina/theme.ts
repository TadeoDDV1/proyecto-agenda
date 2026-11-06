/**
 * Temas curados de Vitrina.
 *
 * No se permite color libre por tenant: cada tema está pensado para cumplir
 * contraste AA. El acento se usa solo sobre fondo de marca (hero/cita) o como
 * detalle decorativo, nunca como texto sobre papel ni como fondo de botón con
 * texto blanco.
 */

export const VITRINA_THEME_NAMES = ["TERRACOTTA", "SAGE", "NOIR"] as const;
export type VitrinaThemeName = (typeof VITRINA_THEME_NAMES)[number];

export interface VitrinaTheme {
  /** Fondo papel de la página. */
  paper: string;
  /** Tarjetas y superficies elevadas. */
  surface: string;
  /** Texto principal. */
  ink: string;
  /** Texto secundario (≥ 4.5:1 sobre paper). */
  muted: string;
  /** Texto terciario (≥ 4.5:1 sobre paper). */
  dim: string;
  line: string;
  lineSoft: string;
  /** Color de marca: botones primarios y enlaces. */
  brand: string;
  brandDeep: string;
  brandMid: string;
  /** Acento decorativo. */
  accent: string;
  /** Texto sobre fondos de marca. */
  onBrand: string;
}

export const VITRINA_THEMES: Record<VitrinaThemeName, VitrinaTheme> = {
  TERRACOTTA: {
    paper: "#FBF7F0",
    surface: "#FFFFFF",
    ink: "#17110F",
    muted: "#6A5F59",
    dim: "#7C706A",
    line: "#E8E0D5",
    lineSoft: "#F2ECE3",
    brand: "#B3402C",
    brandDeep: "#6D1F16",
    brandMid: "#D1613F",
    accent: "#F0B429",
    onBrand: "#FBF7F0",
  },
  SAGE: {
    paper: "#F7F5EF",
    surface: "#FFFFFF",
    ink: "#16201A",
    muted: "#55645A",
    dim: "#6E7C72",
    line: "#E1E4DA",
    lineSoft: "#EFF0E9",
    brand: "#3F5D45",
    brandDeep: "#22392A",
    brandMid: "#5E7D63",
    accent: "#C9A227",
    onBrand: "#F7F5EF",
  },
  NOIR: {
    paper: "#F6F4F1",
    surface: "#FFFFFF",
    ink: "#141414",
    muted: "#5C5752",
    dim: "#736D67",
    line: "#E4E0DA",
    lineSoft: "#F0ECE6",
    brand: "#1F2937",
    brandDeep: "#0E1520",
    brandMid: "#3A4A60",
    accent: "#C8A96A",
    onBrand: "#F6F4F1",
  },
};

export function resolveTheme(name: string | null | undefined): VitrinaTheme {
  if (name && name in VITRINA_THEMES) {
    return VITRINA_THEMES[name as VitrinaThemeName];
  }
  return VITRINA_THEMES.TERRACOTTA;
}

/** Variables CSS que consume `vitrina.module.css`. */
export function themeToCssVars(theme: VitrinaTheme): Record<string, string> {
  return {
    "--vit-paper": theme.paper,
    "--vit-surface": theme.surface,
    "--vit-ink": theme.ink,
    "--vit-muted": theme.muted,
    "--vit-dim": theme.dim,
    "--vit-line": theme.line,
    "--vit-line-soft": theme.lineSoft,
    "--vit-brand": theme.brand,
    "--vit-brand-deep": theme.brandDeep,
    "--vit-brand-mid": theme.brandMid,
    "--vit-accent": theme.accent,
    "--vit-on-brand": theme.onBrand,
    // Evita que el foco global (índigo de Nocturne) se vea fuera de paleta.
    "--accent-hover": theme.brand,
    "--accent": theme.brand,
    "--ring": `${theme.brand}40`,
  };
}

/** Contraste WCAG entre dos colores hexadecimales (1–21). */
export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const value = hex.replace("#", "");
    const channels = [0, 2, 4].map((offset) =>
      parseInt(value.slice(offset, offset + 2), 16)
    );
    const linear = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };

  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a
  );
  return (lighter + 0.05) / (darker + 0.05);
}
