/**
 * Limitador de intentos en memoria.
 * Suficiente para desarrollo y para una sola instancia. En producción con varias
 * instancias debe sustituirse por Redis o por el limitador del hosting.
 */

type Entrada = { cuenta: number; reinicio: number };

const intentos = new Map<string, Entrada>();

function limpiar() {
  const ahora = Date.now();
  for (const [k, v] of intentos) {
    if (ahora > v.reinicio) intentos.delete(k);
  }
}

export interface ResultadoLimite {
  ok: boolean;
  restantes: number;
  reintentarEn?: number;
}

/** Registra un intento para `clave` y dice si está permitido. */
export function rateLimit(clave: string, maximo: number, ventanaMs: number): ResultadoLimite {
  if (intentos.size > 5000) limpiar();

  const ahora = Date.now();
  const actual = intentos.get(clave);

  if (!actual || ahora > actual.reinicio) {
    intentos.set(clave, { cuenta: 1, reinicio: ahora + ventanaMs });
    return { ok: true, restantes: maximo - 1 };
  }

  actual.cuenta += 1;
  if (actual.cuenta > maximo) {
    return {
      ok: false,
      restantes: 0,
      reintentarEn: Math.ceil((actual.reinicio - ahora) / 1000),
    };
  }
  return { ok: true, restantes: maximo - actual.cuenta };
}

/** Borra el contador (por ejemplo, tras un login correcto). */
export function limpiarLimite(clave: string) {
  intentos.delete(clave);
}
