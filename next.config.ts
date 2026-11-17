import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para la imagen Docker: genera .next/standalone con el servidor
  // autocontenido que copia la etapa `runner` del Dockerfile.
  output: "standalone",
  turbopack: {
    rules: {
      // Solo el CSS global de Tailwind. Aplicar este loader a *todo* `*.css`
      // desactiva el hashing de los CSS Modules: el import devuelve `undefined`
      // en los Server Components y la página queda sin estilos.
      "./src/app/globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
