/**
 * Orquestador de sesiones de WhatsApp.
 *
 * El worker corre como proceso aparte de Next (Baileys mantiene una conexión
 * persistente). Cada pocos segundos mira la tabla `whatsapp_accounts` para
 * saber qué tenants conectar, quién pidió desconectar y si sigue vivo. El
 * admin nunca habla con Baileys: solo escribe en la base.
 */

import { rmSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { WhatsAppSession } from "./session";

const SYNC_INTERVAL_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const SESSION_ROOT = process.env.BOT_SESSION_DIR || ".wa-auth";

export class BotManager {
  private readonly sessions = new Map<string, WhatsAppSession>();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatAt = 0;
  private syncing = false;
  private stopping = false;

  async start() {
    await this.sync();
    this.syncTimer = setInterval(() => {
      void this.sync();
    }, SYNC_INTERVAL_MS);
  }

  async stop() {
    this.stopping = true;

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    await Promise.all(
      [...this.sessions.values()].map((session) => session.stop())
    );
    this.sessions.clear();
  }

  private async sync() {
    if (this.syncing || this.stopping) return;
    this.syncing = true;

    try {
      const accounts = await prisma.whatsAppAccount.findMany({
        select: {
          id: true,
          tenantId: true,
          status: true,
          disconnectRequestedAt: true,
        },
      });

      const seen = new Set<string>();

      for (const account of accounts) {
        const existing = this.sessions.get(account.id);

        // Desvincular: el logout se hace acá y no en la request del admin.
        if (account.disconnectRequestedAt) {
          if (existing) {
            await existing.logout();
            this.sessions.delete(account.id);
          } else {
            this.removeAuthDir(account.tenantId);
            await prisma.whatsAppAccount.update({
              where: { id: account.id },
              data: {
                status: "DISABLED",
                botEnabled: false,
                qr: null,
                qrUpdatedAt: null,
                displayPhoneNumber: null,
                selfJid: null,
                disconnectRequestedAt: null,
              },
            });
          }
          continue;
        }

        // Sesión que terminó sola (logout remoto): se descarta y, si el
        // admin vuelve a conectar, el próximo sync arranca una nueva.
        if (existing?.isClosed()) {
          this.sessions.delete(account.id);
        }

        if (account.status === "DISABLED") continue;

        if (!this.sessions.has(account.id)) {
          const session = new WhatsAppSession(account.tenantId, account.id);
          this.sessions.set(account.id, session);
          void session.start();
          console.log(
            `[bot] sesión creada para tenant ${account.tenantId} (${account.id})`
          );
        }

        seen.add(account.id);
      }

      // Cuentas deshabilitadas o borradas desde el admin: cerramos la sesión.
      for (const [accountId, session] of this.sessions) {
        if (seen.has(accountId)) continue;
        await session.stop();
        this.sessions.delete(accountId);
      }

      await this.heartbeat(accounts.map((account) => account.id));
    } catch (error) {
      console.error("[bot] no se pudo sincronizar cuentas", error);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Marca que el worker está vivo. El panel compara este valor con la hora
   * actual para distinguir "esperando worker" de "esperando QR".
   */
  private async heartbeat(accountIds: string[]) {
    const now = Date.now();
    if (now - this.heartbeatAt < HEARTBEAT_INTERVAL_MS) return;
    this.heartbeatAt = now;

    if (accountIds.length === 0) return;

    try {
      await prisma.whatsAppAccount.updateMany({
        where: { id: { in: accountIds } },
        data: { workerSeenAt: new Date() },
      });
    } catch (error) {
      console.error("[bot] no se pudo guardar el latido", error);
    }
  }

  private removeAuthDir(tenantId: string) {
    try {
      rmSync(join(SESSION_ROOT, tenantId), { recursive: true, force: true });
    } catch (error) {
      console.error(`[bot] no se pudo borrar la sesión de ${tenantId}`, error);
    }
  }
}
