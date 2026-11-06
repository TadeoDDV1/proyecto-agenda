import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";

export const SUPERADMIN_ROLE = "SUPERADMIN";

/** Cualquier acceso al panel de plataforma exige rol SUPERADMIN. */
export async function requireSuperadmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== SUPERADMIN_ROLE) {
    redirect("/login?next=/superadmin");
  }
  return session;
}

// Reexporta la configuración (segura para cliente) desde un único lugar.
export {
  FEATURE_KEYS,
  FEATURE_LABELS,
  DEFAULT_FEATURES,
  PLANS,
  parseFeatures,
} from "@/lib/tenant-config";
export type { FeatureKey, Plan } from "@/lib/tenant-config";
