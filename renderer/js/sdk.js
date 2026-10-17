// Lädt das offizielle Bee-Engine-SDK (@teamgosh/bee-sdk 6.0.0) genau einmal.
import init, * as bee from '../sdk/bee_sdk.js';

let initPromise = null;

export function initSdk() {
  if (!initPromise) {
    initPromise = init({ module_or_path: new URL('../sdk/bee_sdk_bg.wasm', import.meta.url) });
  }
  return initPromise;
}

export { bee };

// Gibt ein wasm-bindgen-Objekt frei, ohne bei Doppel-Free zu werfen.
export function free(obj) {
  try {
    obj?.free?.();
  } catch {
    /* schon freigegeben */
  }
}

export function errText(e) {
  if (!e) return 'Unbekannter Fehler';
  if (typeof e === 'string') return e;
  return e.message || String(e);
}

export const isQueueFull = (m) => /\b621\b|queue is full|QUEUE_OVERFLOW/i.test(m);
export const isNotOwner = (m) => /\b402\b|NOT_OWNER/i.test(m);
export const isTransient = (m) =>
  isQueueFull(m) ||
  /timed? ?out|timeout|network|fetch|failed to send|ECONN|50[234]|pool|temporar|unavailable|socket/i.test(m);
