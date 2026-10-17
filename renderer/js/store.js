// Persistenz: Geheimes (Mining-Secret, Connect-Session-State) landet verschlüsselt
// über den Hauptprozess (Windows DPAPI), Unkritisches im localStorage.

const K_CONNECTION = 'connection';
const K_KEYS = 'miningKeys';
const SESSIONS_KEY = 'beetap_sessions_v1';
const PAYOUTS_KEY = 'beetap_payouts_v1';

async function getJson(key) {
  const raw = await window.beeHost.secureGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setJson(key, value) {
  await window.beeHost.secureSet(key, value === null ? null : JSON.stringify(value));
}

// connection: { mode, walletName, walletAddress, profileAddress?, sessionId?, description?, sessionStateJson? }
export const loadConnection = () => getJson(K_CONNECTION);
export const saveConnection = (c) => setJson(K_CONNECTION, c);

// keys: { appId, ownerPublic, ownerSecret, minerAddress, propagated }
export const loadKeys = () => getJson(K_KEYS);
export const saveKeys = (k) => setJson(K_KEYS, k);

export async function clearAll() {
  await setJson(K_CONNECTION, null);
  await setJson(K_KEYS, null);
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(key, list, max) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
  } catch {
    /* ignore */
  }
}

// Sessions-Protokoll: [{ epoch, at, sent, confirmed, status, payout? }]
export const loadSessions = () => readLocal(SESSIONS_KEY);
export const saveSessions = (list) => writeLocal(SESSIONS_KEY, list, 120);

// Gesehene Auszahlungen: [{ id, at, value }]
export const loadPayouts = () => readLocal(PAYOUTS_KEY);
export const savePayouts = (list) => writeLocal(PAYOUTS_KEY, list, 300);
