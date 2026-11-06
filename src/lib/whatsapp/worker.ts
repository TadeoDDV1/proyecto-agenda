/**
 * Señal de vida del worker.
 *
 * El bot corre en un proceso aparte de Next, así que el panel necesita una
 * forma de distinguir "esperando al worker" de "esperando el QR". El worker
 * escribe `workerSeenAt` en cada sincronización.
 */

export const WORKER_STALE_MS = 45_000;

export function isWorkerOnline(workerSeenAt: Date | string | null): boolean {
  if (!workerSeenAt) return false;
  const seenAt =
    workerSeenAt instanceof Date ? workerSeenAt : new Date(workerSeenAt);
  if (Number.isNaN(seenAt.getTime())) return false;
  return Date.now() - seenAt.getTime() < WORKER_STALE_MS;
}
