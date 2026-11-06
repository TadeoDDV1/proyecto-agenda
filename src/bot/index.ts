/**
 * Worker del bot de WhatsApp (Baileys).
 *
 *   npm run bot
 *
 * Es un proceso Node aparte de Next: mantiene la conexión de WhatsApp abierta,
 * escribe el QR en la base y responde con el motor de `src/lib/whatsapp`.
 * El panel `/admin/whatsapp` solo lee estado y deja pedidos en la tabla.
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { BotManager } from "./manager";

const SESSION_ROOT = process.env.BOT_SESSION_DIR || ".wa-auth";
const LOCK_FILE = join(SESSION_ROOT, "worker.lock");

function takeLock() {
  mkdirSync(SESSION_ROOT, { recursive: true });

  if (existsSync(LOCK_FILE)) {
    const pid = Number(readFileSync(LOCK_FILE, "utf8").trim());
    const alive = Number.isInteger(pid) && pid > 0 && isAlive(pid);

    if (alive) {
      console.error(
        `[bot] ya hay un worker corriendo (pid ${pid}). Cierralo antes de arrancar otro.`
      );
      process.exit(1);
    }
  }

  writeFileSync(LOCK_FILE, String(process.pid));
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {
    // El archivo ya no estaba; no hay nada que hacer.
  }
}

async function main() {
  takeLock();

  const manager = new BotManager();
  await manager.start();

  const accounts = await prisma.whatsAppAccount.count({
    where: { status: { not: "DISABLED" } },
  });

  console.log(
    `[bot] worker listo (pid ${process.pid}). Cuentas activas: ${accounts}.`
  );
  if (accounts === 0) {
    console.log(
      "[bot] Conectá un número desde /admin/whatsapp; el QR aparece en cuanto lo pidas."
    );
  }

  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;

    console.log(`\n[bot] ${signal}: cerrando sesiones…`);
    await manager.stop();
    await prisma.$disconnect();
    releaseLock();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("[bot] promesa rechazada sin manejar", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[bot] excepción no capturada", error);
  });
}

main().catch(async (error) => {
  console.error("[bot] no se pudo arrancar", error);
  await prisma.$disconnect();
  releaseLock();
  process.exit(1);
});
