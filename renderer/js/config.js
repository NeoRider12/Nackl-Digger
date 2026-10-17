// Zentrale Konstanten. Die Protokoll-Werte stammen direkt aus dem Quellcode:
//   contracts/mvsystem/modifiers/modifiers.sol (ackinacki/ackinacki)
//     SMALL_TAP = 70, BIG_TAP = 12000, MINING_DUR_TAP = 330,
//     MinerRewardPeriod = 1000, MinerTapDelay = 262000
//   tvm_vm/src/executor/token.rs (tvmlabs/tvm-sdk) – calc_tap_coef_with_params
//   bee_verifier/src/lib.rs (gosh-sh/bee-engine) – mining_dur = (letzter Tap - erster Tap) / 330 ms

export const ENDPOINTS = ['https://mainnet.ackinacki.org'];
export const CLIENT_CONFIG = { network: { endpoints: ENDPOINTS } };
export const API_URL = 'https://app-backend.ackinacki.org/api';

export const PROTOCOL = {
  REWARD_EPOCH_BLOCKS: 1000, // eine Reward-Epoche (~5,5 min)
  BIG_EPOCH_BLOCKS: 262000, // Tages-Epoche (~24 h)
  TAPS_PER_EPOCH_MAX: 70, // SMALL_TAP
  TAPS_PER_DAY_MAX: 12000, // BIG_TAP
  DUR_BLOCKS_PER_EPOCH_MAX: 330, // MINING_DUR_TAP (Blöcke à 330 ms ≈ 109 s Tap-Spanne)
  DUR_MS_PER_UNIT: 330, // Verifier rechnet (lastTap - firstTap) / 330
  DEFAULT_BLOCK_MS: 330,
};

// Ablauf einer Grab-Session (alles in ms)
export const DIG = {
  WINDOW_MS: 130000, // Session-Fenster ab dem ersten Klick
  FULL_SPAN_MS: 116000, // ab dieser Klick-Spanne wird die volle Mining-Dauer (330) angerechnet
  WORKER_EXTRA_MS: 10000, // Worker läuft etwas länger als das Fenster; stop() kommt vorher
  MIN_TAP_GAP_MS: 90, // schnellere Klicks werden ignoriert
  POLL_MS: 15000, // Epochen-/Tap-Status lesen, solange nicht gegraben wird
  TERMINAL_TIMEOUT_MS: 240000,
  CONFIRM_POLL_MS: 6000,
};

// Die App-ID kommt vom Acki-Nacki-Team (Antrag mit Name, Link, Logo).
// Bis dahin bleibt das Feld leer; die Kopplung startet erst mit einer gültigen ID.
export const KNOWN_APP_IDS = [];

const SETTINGS_KEY = 'beetap_settings_v1';

export const DEFAULT_SETTINGS = {
  appId: '',
  tapsPerEpoch: 70,
  dailyLimit: 12000,
  autoStart: false,
};

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function normalizeAppId(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!/^0x[0-9a-f]{1,64}$/.test(s)) return null;
  return '0x' + s.slice(2).padStart(64, '0');
}
