// Liest Salden und Mining-Auszahlungen der gekoppelten Wallet.
//
// Wie Auszahlungen ablaufen (Miner.sol / MobileVerifiersContractGameRoot.sol):
// Die Taps einer Epoche E werden ausgezahlt, sobald der Miner in Epoche E+2 oder
// später wieder etwas einreicht (oder get_reward ruft). Der Betrag wird als NACKL
// gemintet und landet im gesperrten „popitgame“-Saldo. In der Historie erscheint
// er als Transaktion vom Typ „Mining“.

import { bee, free, errText } from './sdk.js';
import { ENDPOINTS, API_URL } from './config.js';
import { loadPayouts, savePayouts } from './store.js';

const POLL_MS = 90000;

export class RewardTracker extends EventTarget {
  constructor({ log }) {
    super();
    this.log = log;
    this.connection = null;
    this.appId = null;
    this.wallet = null;
    this.timer = null;
    this.busy = false;
    this.historyWorks = null;
    this.state = {
      locked: null,
      liquid: null,
      payouts: loadPayouts(),
      updatedAt: null,
      error: null,
    };
  }

  configure({ connection, appId }) {
    if (this.wallet && (this.appId !== appId || this.connection?.walletAddress !== connection?.walletAddress)) {
      free(this.wallet);
      this.wallet = null;
    }
    this.connection = connection;
    this.appId = appId;
  }

  start() {
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), POLL_MS);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  #wallet() {
    if (!this.wallet) this.wallet = new bee.Wallet(ENDPOINTS, null, API_URL, this.appId);
    return this.wallet;
  }

  async refresh() {
    if (this.busy || !this.connection?.walletAddress) return;
    this.busy = true;
    const addr = this.connection.walletAddress;
    const newOnes = [];
    let softError = null;
    try {
      const w = this.#wallet();
      const prevLocked = this.state.locked;

      try {
        const b = await w.get_multifactor_balances({ multifactor_address: addr });
        const locked = b.popitgame?.['1'] ?? b.popitgame?.[1] ?? '0';
        const liquid = b.ecc?.['1'] ?? b.ecc?.[1] ?? '0';
        free(b);
        this.state.locked = String(locked);
        this.state.liquid = String(liquid);
      } catch (e) {
        softError = `Saldo: ${errText(e)}`;
      }

      try {
        const h = await w.get_history({ multifactor_address: addr, token_id: '1', page_size: 40 });
        const rows = Array.from(h.data || []).map((t) => {
          const row = { id: t.id, type: t.tx_type, value: String(t.value), at: Number(t.created_at) * 1000 };
          free(t);
          return row;
        });
        free(h);
        this.historyWorks = true;
        const known = new Set(this.state.payouts.map((p) => p.id));
        for (const r of rows) {
          if (r.type !== 'Mining' || known.has(r.id)) continue;
          newOnes.push({ id: r.id, at: r.at, value: r.value, source: 'history' });
        }
      } catch (e) {
        if (this.historyWorks !== false) this.log(`Historie nicht lesbar (${errText(e)}) – nutze Saldo-Differenz.`);
        this.historyWorks = false;
        // Ersatz: Anstieg des gesperrten Saldos als Auszahlung werten.
        if (prevLocked !== null && this.state.locked !== null) {
          const delta = BigInt(this.state.locked) - BigInt(prevLocked);
          if (delta > 0n) newOnes.push({ id: `delta-${Date.now()}`, at: Date.now(), value: delta.toString(), source: 'saldo' });
        }
      }

      if (newOnes.length) {
        newOnes.sort((a, b) => a.at - b.at);
        this.state.payouts = [...newOnes.reverse(), ...this.state.payouts].sort((a, b) => b.at - a.at);
        savePayouts(this.state.payouts);
      }
      this.state.updatedAt = Date.now();
      this.state.error = softError;
    } catch (e) {
      this.state.error = errText(e);
    } finally {
      this.busy = false;
      this.dispatchEvent(new CustomEvent('update', { detail: { ...this.state, fresh: newOnes } }));
    }
  }
}

export function formatNackl(raw, digits = 4) {
  let v;
  try {
    v = BigInt(raw);
  } catch {
    return '–';
  }
  const neg = v < 0n;
  if (neg) v = -v;
  const base = 10n ** 9n;
  const whole = v / base;
  const frac = ((v % base) * 10n ** BigInt(digits)) / base;
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${wholeStr},${frac.toString().padStart(digits, '0')}`;
}
