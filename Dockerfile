# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────
# 1) deps — instala dependencias con el lockfile exacto
# ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# libc6-compat: shims glibc para binarios nativos (lightningcss, etc.)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────
# 2) builder — genera el cliente Prisma y compila Next en standalone
# ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# openssl: Prisma lo detecta en Alpine para elegir el motor correcto
RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` no se conecta a la BD, pero prisma.config.ts exige que
# DATABASE_URL exista. Este valor es ficticio y solo vive durante el build;
# se puede sobreescribir con --build-arg. La URL real llega por compose.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN npx prisma generate

# Build de producción (Turbopack): genera .next/standalone y .next/static.
# Nota: la portada `/` consulta Prisma durante el prerender, así que este
# paso necesita una BD alcanzable o esa página marcada como dinámica.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────
# 3) runner — imagen mínima, usuario sin privilegios y solo lo necesario
# ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# openssl: motor de consultas de Prisma
RUN apk add --no-cache openssl

# Usuario sin root (uid/gid 1001) al que se le entrega el código.
# Se usan flags cortos por compatibilidad con BusyBox de Alpine.
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -D -H -u 1001 -G nodejs nextjs

# Artefactos del build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Esquema y seeds, para poder ejecutar migraciones desde el contenedor
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# El file tracing de Next no siempre incluye el motor de Prisma: lo copiamos
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# server.js lo genera Next en .next/standalone
CMD ["node", "server.js"]
