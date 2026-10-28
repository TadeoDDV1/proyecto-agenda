/**
 * Una sesión de Baileys por tenant.
 *
 * El estado de autenticación vive en `.wa-auth/<tenantId>` (fuera de git).
 * La base guarda solo lo que el admin necesita ver: QR, número y estado.
 */

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState as loadAuthState,
  type WASocket,
  type WAMessage,
} from "baileys";
import pino from "pino";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleInbound } from "@/lib/whatsapp/engine";
import { jidToWaId } from "@/lib/whatsapp/phone";
import type { FlowContext } from "@/lib/whatsapp/types";

const SESSION_ROOT = process.env.BOT_SESSION_DIR || ".wa-auth";
const SESSION_TTL_MINUTES = 30;

const logger = pino({ level: process.env.BOT_LOG_LEVEL || "warn" });

type Content = {
  conversation?: string | null;
  extendedTextMessage?: { text?: string | null } | null;
  buttonsResponseMessage?: { selectedButtonId?: string | null } | null;
  listResponseMessage?: {
    singleSelectReply?: { selectedRowId?: string | null } | null;
  } | null;
  templateButtonReplyMessage?: { selectedId?: string | null } | null;
  ephemeralMessage?: { message?: Content | null } | null;
  viewOnceMessage?: { message?: Content | null } | null;
  viewOnceMessageV2?: { message?: Content | null } | null;
  documentWithCaptionMessage?: { message?: Content | null } | null;
};

function unwrap(content: Content | null | undefined): Content | null {
  if (!content) return null;
  return (
    unwrap(content.ephemeralMessage?.message) ??
    unwrap(content.viewOnceMessage?.message) ??
    unwrap(content.viewOnceMessageV2?.message) ??
    unwrap(content.documentWithCaptionMessage?.message) ??
    content
  );
}

function extractText(message: WAMessage["message"]): string | null {
  const content = unwrap(message as Content | null | undefined);
  if (!content) return null;

  return (
    content.conversation ??
    content.extendedTextMessage?.text ??
    content.buttonsResponseMessage?.selectedButtonId ??
    content.listResponseMessage?.singleSelectReply?.selectedRowId ??
    content.templateButtonReplyMessage?.selectedId ??
    null
  );
}

function messageType(message: WAMessage["message"]): string {
  const content = unwrap(message as Content | null | undefined);
  if (!content) return "unknown";
  if (content.conversation || content.extendedTextMessage) return "text";
  const keys = Object.keys(content).filter(
    (key) => !["messageContextInfo"].includes(key)
  );
  const key = keys[0] ?? "unknown";
  return key.replace(/Message$/, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WhatsAppSession {
  private sock: WASocket | null = null;
  private stopped = false;
  private closed = false;
  private starting = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastQr: string | null = null;

  constructor(
    private readonly tenantId: string,
    private readonly accountId: string
  ) {}

  get authDir() {
    return join(SESSION_ROOT, this.tenantId);
  }

  isClosed() {
    return this.closed;
  }

  async start() {
    if (this.starting || this.sock || this.stopped || this.closed) return;

    this.starting = true;
    try {
      mkdirSync(this.authDir, { recursive: true });

      const { state, saveCreds } = await loadAuthState(this.authDir);

      let version: [number, number, number] | undefined;
      try {
        version = (await fetchLatestBaileysVersion()).version;
      } catch {
        // Sin red usamos la versión que trae la librería.
      }

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: Browsers.ubuntu("Chrome"),
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
      });

      this.sock = sock;

      sock.ev.on("creds.update", saveCreds);
      sock.ev.on("connection.update", (update) => {
        void this.onConnectionUpdate(update);
      });
      sock.ev.on("messages.upsert", (event) => {
        if (event.type !== "notify") return;
        void this.onMessages(event.messages);
      });

      console.log(`[wa:${this.tenantId}] sesión iniciada`);
    } catch (error) {
      this.sock = null;
      await this.markError(error);
      this.scheduleReconnect();
    } finally {
      this.starting = false;
    }
  }

  async stop() {
    this.stopped = true;
    this.clearReconnect();

    const sock = this.sock;
    this.sock = null;
    if (sock) {
      try {
        sock.end(undefined);
      } catch {
        // La conexión ya estaba cerrada.
      }
    }
  }

  async logout() {
    this.stopped = true;
    this.clearReconnect();

    const sock = this.sock;
    this.sock = null;

    if (sock) {
      try {
        await sock.logout("Desvinculado desde el panel");
      } catch {
        // Si ya estaba caída, igual limpiamos la sesión local.
      }
    }

    try {
      rmSync(this.authDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`[wa:${this.tenantId}] no se pudo borrar la sesión`, error);
    }

    this.closed = true;
    await this.updateAccount({
      status: "DISABLED",
      botEnabled: false,
      qr: null,
      qrUpdatedAt: null,
      displayPhoneNumber: null,
      selfJid: null,
      lastError: null,
      disconnectRequestedAt: null,
    });

    console.log(`[wa:${this.tenantId}] sesión desvinculada`);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.closed) return;

    this.clearReconnect();
    const delay = Math.min(30_000, 2_000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.start();
    }, delay);
  }

  private async onConnectionUpdate(update: {
    connection?: string;
    qr?: string;
    lastDisconnect?: { error?: unknown };
    isNewLogin?: boolean;
  }) {
    if (update.qr && update.qr !== this.lastQr) {
      this.lastQr = update.qr;
      await this.updateAccount({
        status: "PENDING",
        qr: update.qr,
        qrUpdatedAt: new Date(),
        lastError: null,
      });
      console.log(
        `[wa:${this.tenantId}] QR listo: abrí /admin/whatsapp para escanearlo`
      );
    }

    if (update.connection === "open") {
      this.reconnectAttempts = 0;
      const user = this.sock?.user;
      const phone = jidToWaId(user?.id);

      await this.updateAccount({
        status: "CONNECTED",
        displayPhoneNumber: phone,
        selfJid: user?.id ?? null,
        qr: null,
        qrUpdatedAt: null,
        lastError: null,
        lastConnectedAt: new Date(),
      });

      console.log(
        `[wa:${this.tenantId}] conectado como ${phone ?? user?.id ?? "?"}`
      );
      return;
    }

    if (update.connection !== "close") return;

    const statusCode = (
      update.lastDisconnect?.error as
        | { output?: { statusCode?: number } }
        | undefined
    )?.output?.statusCode;

    this.sock = null;

    if (
      statusCode === DisconnectReason.loggedOut ||
      statusCode === DisconnectReason.forbidden
    ) {
      this.closed = true;
      try {
        rmSync(this.authDir, { recursive: true, force: true });
      } catch {
        // Sin sesión que borrar.
      }
      await this.updateAccount({
        status: "DISABLED",
        botEnabled: false,
        qr: null,
        qrUpdatedAt: null,
        displayPhoneNumber: null,
        selfJid: null,
        lastError: "WhatsApp cerró la sesión. Vuelve a conectar el número.",
      });
      console.log(`[wa:${this.tenantId}] sesión cerrada por WhatsApp`);
      return;
    }

    await this.updateAccount({
      status: "ERROR",
      lastError:
        statusCode === DisconnectReason.restartRequired
          ? null
          : `Conexión interrumpida${statusCode ? ` (${statusCode})` : ""}. Reintentando…`,
    });

    this.scheduleReconnect();
  }

  private async onMessages(messages: WAMessage[]) {
    for (const message of messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error(`[wa:${this.tenantId}] error procesando mensaje`, error);
        await this.markError(error);
      }
    }
  }

  private async processMessage(message: WAMessage) {
    if (!message.message) return;
    if (message.key.fromMe) return;

    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    const altJid = (message.key as { remoteJidAlt?: string | null })
      .remoteJidAlt;
    const waId = jidToWaId(altJid ?? remoteJid);
    const providerMessageId = message.key.id;

    if (!waId || !providerMessageId) return;
    if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") return;

    const alreadyProcessed = await prisma.whatsAppMessage.findFirst({
      where: {
        tenantId: this.tenantId,
        providerMessageId,
      },
      select: { id: true },
    });
    if (alreadyProcessed) return;

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: this.accountId },
      select: { botEnabled: true },
    });
    if (!account) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60_000);

    const conversation = await prisma.whatsAppConversation.upsert({
      where: {
        tenantId_waId: { tenantId: this.tenantId, waId },
      },
      create: {
        tenantId: this.tenantId,
        waId,
        state: "MENU",
        lastInboundAt: now,
        lastMessageAt: now,
        expiresAt,
      },
      update: {
        lastInboundAt: now,
        lastMessageAt: now,
        expiresAt,
      },
    });

    const text = extractText(message.message);

    try {
      await prisma.whatsAppMessage.create({
        data: {
          tenantId: this.tenantId,
          conversationId: conversation.id,
          providerMessageId,
          direction: "INBOUND",
          type: messageType(message.message),
          body: text ?? null,
          payload: {
            remoteJid,
            pushName: message.pushName ?? null,
          } as Prisma.InputJsonValue,
          status: "RECEIVED",
        },
      });
    } catch (error) {
      // Reintento del proveedor: el unique evita duplicar la respuesta.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }

    // Guardamos todo, pero el bot solo responde si está habilitado y en modo BOT.
    if (!account.botEnabled || conversation.mode !== "BOT") return;

    if (!text) {
      await this.send(
        conversation.id,
        remoteJid,
        "Por ahora solo puedo leer mensajes de texto. Escribe *menú* para empezar."
      );
      return;
    }

    const result = await handleInbound({
      tenant: await prisma.tenant.findUniqueOrThrow({
        where: { id: this.tenantId },
      }),
      state: conversation.state,
      context: conversation.context as unknown as FlowContext,
      waId,
      text,
      providerMessageId,
      expiresAt: conversation.expiresAt,
    });

    for (const reply of result.replies) {
      await this.send(conversation.id, remoteJid, reply);
      await sleep(400);
    }

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        state: result.state,
        context: result.context as unknown as Prisma.InputJsonValue,
        customerId:
          result.customerId ?? conversation.customerId ?? null,
        expiresAt,
        lastMessageAt: new Date(),
      },
    });

    console.log(
      `[wa:${this.tenantId}] ${waId} → ${result.state} (${result.replies.length} respuesta/s)`
    );
  }

  private async send(conversationId: string, jid: string, text: string) {
    if (!this.sock) return;

    try {
      await this.sock.sendPresenceUpdate("composing", jid);
      const sent = await this.sock.sendMessage(jid, { text });
      await this.sock.sendPresenceUpdate("paused", jid);

      if (sent?.key?.id) {
        await prisma.whatsAppMessage.create({
          data: {
            tenantId: this.tenantId,
            conversationId,
            providerMessageId: sent.key.id,
            direction: "OUTBOUND",
            type: "text",
            body: text,
            status: "SENT",
          },
        });
      }
    } catch (error) {
      console.error(`[wa:${this.tenantId}] no se pudo enviar`, error);
      await this.markError(error);
    }
  }

  private async updateAccount(
    data: Prisma.WhatsAppAccountUpdateInput
  ): Promise<void> {
    try {
      await prisma.whatsAppAccount.update({
        where: { id: this.accountId },
        data,
      });
    } catch (error) {
      console.error(`[wa:${this.tenantId}] no se pudo guardar estado`, error);
    }
  }

  private async markError(error: unknown) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : "Error desconocido";
    // No tocamos `status`: un fallo del motor no significa que la sesión cayó.
    await this.updateAccount({ lastError: message });
  }
}
