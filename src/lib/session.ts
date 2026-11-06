/**
 * Firma y verificación del JWT de sesión.
 *
 * Separado de `auth.ts` para que `src/proxy.ts` pueda verificarlo sin cargar
 * Prisma ni `next/headers`.
 */

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_agenda_saas_super_secret_jwt_key_2026"
);

export const SESSION_COOKIE_NAME = "agenda_session";

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  fullName: string;
  /** Versión del token: al cambiarla se invalidan las sesiones abiertas. */
  v?: number;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
