"use server";

import { rmSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkerOnline } from "@/lib/whatsapp/worker";

const SESSION_ROOT = process.env.BOT_SESSION_DIR || ".wa-auth";

async function getTenantId() {
  const session = await getSession();
  return session?.tenantId ?? null;
}

/**
 * Pide al worker que abra una sesión nueva. El worker corre aparte (`npm run
 * bot`): acá solo se deja el estado en PENDING y el QR aparece en la base.
 */
export async function startWhatsAppConnectionAction() {
  const tenantId = await getTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    await prisma.whatsAppAccount.upsert({
      where: { tenantId },
      create: { tenantId, status: "PENDING", botEnabled: true },
      update: {
        status: "PENDING",
        botEnabled: true,
        qr: null,
        qrUpdatedAt: null,
        lastError: null,
        disconnectRequestedAt: null,
        displayPhoneNumber: null,
        selfJid: null,
      },
    });

    revalidatePath("/admin/whatsapp");
    return { success: true };
  } catch (error) {
    console.error("Error al iniciar la conexión de WhatsApp:", error);
    return { success: false, error: "No se pudo iniciar la conexión." };
  }
}

/**
 * Desvincula el número.
 *
 * Si el worker está vivo, el logout lo hace él (Baileys necesita cerrar la
 * conexión). Si no está corriendo, no hay sesión que cerrar: limpiamos la
 * credencial del disco acá mismo para no dejar el dispositivo vinculado.
 */
export async function disconnectWhatsAppAction() {
  const tenantId = await getTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { tenantId },
      select: { workerSeenAt: true },
    });

    if (!account) return { success: true };

    if (!isWorkerOnline(account.workerSeenAt)) {
      try {
        rmSync(join(/*turbopackIgnore: true*/ SESSION_ROOT, tenantId), {
          recursive: true,
          force: true,
        });
      } catch (error) {
        console.error("No se pudo borrar la sesión local de WhatsApp:", error);
      }

      await prisma.whatsAppAccount.update({
        where: { tenantId },
        data: {
          status: "DISABLED",
          botEnabled: false,
          qr: null,
          qrUpdatedAt: null,
          displayPhoneNumber: null,
          selfJid: null,
          lastError: null,
          disconnectRequestedAt: null,
        },
      });
    } else {
      await prisma.whatsAppAccount.update({
        where: { tenantId },
        data: {
          botEnabled: false,
          qr: null,
          qrUpdatedAt: null,
          disconnectRequestedAt: new Date(),
        },
      });
    }

    revalidatePath("/admin/whatsapp");
    return { success: true };
  } catch (error) {
    console.error("Error al desconectar WhatsApp:", error);
    return { success: false, error: "No se pudo desconectar el número." };
  }
}

/** Pausa o reanuda las respuestas sin desvincular el dispositivo. */
export async function toggleWhatsAppBotAction(enabled: boolean) {
  const tenantId = await getTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    await prisma.whatsAppAccount.update({
      where: { tenantId },
      data: { botEnabled: enabled },
    });

    revalidatePath("/admin/whatsapp");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar el estado del bot:", error);
    return { success: false, error: "No se pudo cambiar el estado del bot." };
  }
}

/** Copia el número vinculado al perfil público del salón. */
export async function publishPublicNumberAction() {
  const tenantId = await getTenantId();
  if (!tenantId) return { success: false, error: "No autorizado." };

  try {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { tenantId },
      select: { displayPhoneNumber: true, status: true },
    });

    if (!account?.displayPhoneNumber || account.status !== "CONNECTED") {
      return {
        success: false,
        error: "Primero conectá el número para poder usarlo en la vitrina.",
      };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { whatsappNumber: account.displayPhoneNumber },
    });

    revalidatePath("/admin/whatsapp");
    revalidatePath("/admin/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error al publicar el número de WhatsApp:", error);
    return { success: false, error: "No se pudo actualizar el número público." };
  }
}
