import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pauta — citas para cualquier oficio",
  description:
    "Agenda multi-vertical para barberías, salones, clínicas y consultorios: calendario por especialista, portal por giro y bot de WhatsApp sobre la misma disponibilidad.",
};

export const viewport = {
  themeColor: "#f4f1ea",
  colorScheme: "light" as const,
};

// Aplica el tema antes del primer pintado para evitar el destello blanco.
const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("tema")||"system";var oscuro=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=oscuro?"dark":"light";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${instrument.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
