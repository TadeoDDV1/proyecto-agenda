import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Bitácora de acciones de plataforma.
 * Se guarda como JSON Lines en `.audit/auditoria.jsonl` para no requerir
 * migración de base de datos. Cada línea es un objeto independiente.
 */

const DIRECTORIO = path.join(process.cwd(), ".audit");
const ARCHIVO = path.join(DIRECTORIO, "auditoria.jsonl");

export interface EntradaAuditoria {
  actor: string;
  accion: string;
  objetivo?: string;
  detalle?: string;
}

export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    await mkdir(DIRECTORIO, { recursive: true });
    const linea = JSON.stringify({ ...entrada, fecha: new Date().toISOString() });
    await appendFile(ARCHIVO, linea + "\n", "utf8");
  } catch (error) {
    // La auditoría nunca debe romper la operación principal.
    console.error("[audit] no se pudo registrar:", error);
  }
}

export interface RegistroAuditoria extends EntradaAuditoria {
  fecha: string;
}

export async function leerAuditoria(limite = 200): Promise<RegistroAuditoria[]> {
  try {
    const contenido = await readFile(ARCHIVO, "utf8");
    const lineas = contenido.split("\n").filter(Boolean);
    return lineas
      .slice(-limite)
      .reverse()
      .map((l) => {
        try {
          return JSON.parse(l) as RegistroAuditoria;
        } catch {
          return null;
        }
      })
      .filter((x): x is RegistroAuditoria => x !== null);
  } catch {
    return [];
  }
}
