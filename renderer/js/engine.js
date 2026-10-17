// Dig-Engine: Mining nur durch echte Klicks.
//
// Ablauf: Der erste Klick auf die Tap-Fläche startet eine Session (Worker der
// Bee Engine). Jeder weitere echte Klick wird als Tap an den Worker gegeben.
// Nach dem Session-Fenster (oder sobald Taps und Dauer voll sind) wird gestoppt;
// die Bee Engine reicht Root + Proof ein und der Vertrag bestätigt.
//
// Was der Vertrag pro Reward-Epoche (1000 Blöcke ≈ 5,5 min) anrechnet (token.rs):
//   - höchstens 70 Taps (SMALL_TAP)
//   - höchstens 330 Einheiten Mining-Dauer; eine Einheit = 330 ms Abstand
//     zwischen erstem und letztem Tap → volle Anrechnung ab ~109 s Klick-Spanne
//   - Koeffizient ≈ (gewichtete Taps) × (Mining-Dauer)
// Tageslimit: 12.000 Taps pro 262.000-Block-Epoche (≈ 24 h).

import { bee, free, errText, isQueueFull, isNotOwner, isTransient } from './sdk.js';
import { ENDPOINTS, PROTOCOL as P, DIG } from './config.js';

export class DigEngine extends EventTarget {
  constructor({ log, MinerClass = null }) {
    super();
    this.log = log;
    this.MinerClass = MinerClass;
    this.keys = null;
    this.settings = null;
    this.miner = null;
    this.needsRebuild = false;
    this.active = false; // „bereit zum Graben“ eingeschaltet
    this.pollTimer = null;
    this.polling = false;
    this.blockMs = P.DEFAULT_BLOCK_MS;
    this.lastBlockSample = null;
    this.notOwnerStreak = 0;
    this.lastTapAt = 0;
    this.session = null;
    this.state = {
      mode: 'off', // off | preparing | ready | full | daily | session | submitting | error
      message: 'Aus',
      seq: null,
      epochStart: null,
      epochPos: null,
      epochTaps: null,
      dailyTaps: null,
      stats: { ok: 0, failed: 0, confirmedTotal: 0 },
    };
  }

  configure({ keys, settings }) {
    const changed = !this.keys || !keys || this.keys.ownerPublic !== keys.ownerPublic || this.keys.appId !== keys.appId;
    this.keys = keys;
    this.settings = settings;
    if (changed) this.needsRebuild = true;
  }

  target() {
    return Math.max(1, Math.min(P.TAPS_PER_EPOCH_MAX, Number(this.settings?.tapsPerEpoch) || 70));
  }

  dailyLimit() {
    return Math.min(P.TAPS_PER_DAY_MAX, Number(this.settings?.dailyLimit) || P.TAPS_PER_DAY_MAX);
  }

  snapshot() {
    const s = this.session;
    return {
      active: this.active,
      blockMs: this.blockMs,
      ...this.state,
      session: s
        ? {
            taps: s.taps,
            target: s.target,
            startedAt: s.startedAt,
            firstTapAt: s.firstTapAt,
            lastTapAt: s.lastTapAt,
            endsAt: s.endsAt,
            stage: s.stage,
          }
        : null,
    };
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('update', { detail: this.snapshot() }));
  }

  #set(patch) {
    Object.assign(this.state, patch);
    this.#emit();
  }

  // ---------------------------------------------------------------------
  // Ein/Aus
  // ---------------------------------------------------------------------
  async activate() {
    if (this.active) return;
    if (!this.keys?.propagated || !this.keys?.minerAddress) {
      this.log('Nicht gekoppelt – erst die Wallet koppeln.');
      return;
    }
    this.active = true;
    window.beeHost.setMiningActive(true);
    this.#set({ mode: 'preparing', message: 'Miner wird vorbereitet …' });
    await this.#poll();
    this.pollTimer = setInterval(() => this.#poll(), DIG.POLL_MS);
  }

  async deactivate() {
    if (!this.active) return;
    this.active = false;
    clearInterval(this.pollTimer);
    this.pollTimer = null;
    if (this.session?.stage === 'digging') this.#finishSession('Ausgeschaltet');
    if (this.session?.done) await this.session.done.catch(() => {});
    window.beeHost.setMiningActive(false);
    this.#set({ mode: 'off', message: 'Aus' });
  }

  async dispose() {
    await this.deactivate();
    if (this.miner) free(this.miner);
    this.miner = null;
  }

  async claimReward() {
    await this.#ensureMiner();
    await this.miner.get_reward();
    this.log('get_reward gesendet – offene ältere Epochen werden ausgezahlt.');
  }

  // ---------------------------------------------------------------------
  // Chain
  // ---------------------------------------------------------------------
  async #ensureMiner() {
    if (this.miner && !this.needsRebuild) return this.miner;
    if (this.miner) {
      free(this.miner);
      this.miner = null;
    }
    const k = this.keys;
    const delays = [20000, 40000, 80000];
    for (let attempt = 0; ; attempt++) {
      try {
        this.miner = await (this.MinerClass || bee.Miner).new(ENDPOINTS, k.appId, k.minerAddress, k.ownerPublic, k.ownerSecret);
        this.needsRebuild = false;
        return this.miner;
      } catch (e) {
        const msg = errText(e);
        if (isQueueFull(msg) && attempt < delays.length && this.active) {
          this.log(`Netz-Warteschlange voll (621) – neuer Versuch in ${delays[attempt] / 1000} s`);
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
        throw e;
      }
    }
  }

  async #readSeq() {
    const b = await this.miner.get_current_block();
    const seq = Number(b.seq_no);
    free(b);
    const now = Date.now();
    const last = this.lastBlockSample;
    if (!last || seq <= last.seq) {
      this.lastBlockSample = { seq, t: now };
    } else if (now - last.t > 20000 && seq - last.seq > 30) {
      const ms = Math.min(700, Math.max(150, (now - last.t) / (seq - last.seq)));
      this.blockMs = Math.round(this.blockMs * 0.7 + ms * 0.3);
      this.lastBlockSample = { seq, t: now };
    }
    return seq;
  }

  async #readCounts() {
    const seq = await this.#readSeq();
    const d = await this.miner.get_miner_data();
    const md = {
      bigStart: Number(d.epoch_start),
      epochStart: Number(d.epoch_5m_start),
      tapSum: Number(d.tap_sum),
      tapSum5m: Number(d.tap_sum_5m),
    };
    free(d);
    const epochStart = seq - (seq % P.REWARD_EPOCH_BLOCKS);
    const bigStart = seq - (seq % P.BIG_EPOCH_BLOCKS);
    return {
      seq,
      epochStart,
      epochPos: seq % P.REWARD_EPOCH_BLOCKS,
      epochTaps: md.epochStart === epochStart ? md.tapSum5m : 0,
      dailyTaps: md.bigStart === bigStart ? md.tapSum : 0,
    };
  }

  // Liest Epoche/Taps und setzt den Modus, solange keine Session läuft.
  async #poll() {
    if (!this.active || this.polling) return;
    this.polling = true;
    try {
      await this.#ensureMiner();
      const c = await this.#readCounts();
      this.notOwnerStreak = 0;
      if (this.session) {
        this.#set(c);
        return;
      }
      let mode = 'ready';
      let message = 'Bereit – klick auf die Fläche, um zu graben';
      if (c.dailyTaps >= this.dailyLimit()) {
        mode = 'daily';
        message = 'Tageslimit erreicht – morgen geht es weiter';
      } else if (c.epochTaps >= this.target()) {
        mode = 'full';
        message = 'Diese Epoche ist voll – gleich geht die nächste los';
      } else if (!this.miner.can_start()) {
        this.needsRebuild = true;
        mode = 'preparing';
        message = 'Miner wird neu aufgebaut …';
      }
      this.#set({ ...c, mode, message });
    } catch (e) {
      const msg = errText(e);
      if (isNotOwner(msg)) {
        this.notOwnerStreak += 1;
        if (this.notOwnerStreak >= 3) {
          this.dispatchEvent(new CustomEvent('not-owner'));
          this.log('Mining-Key wurde ersetzt (ERR_NOT_OWNER). Bitte neu koppeln.');
          await this.deactivate();
          return;
        }
        this.needsRebuild = true;
      } else if (!isTransient(msg)) {
        this.needsRebuild = true;
      }
      this.log(`Status lesen: ${msg}`);
      if (!this.session) this.#set({ mode: 'error', message: isQueueFull(msg) ? 'Netz ausgelastet – kurz warten' : 'Netzwerkfehler – neuer Versuch gleich' });
    } finally {
      this.polling = false;
    }
  }

  // ---------------------------------------------------------------------
  // Taps (nur aus echten Klicks; die UI prüft event.isTrusted)
  // ---------------------------------------------------------------------
  tap(x, y) {
    const now = Date.now();
    if (!this.active) return { ok: false, reason: 'Graben ist ausgeschaltet' };
    if (now - this.lastTapAt < DIG.MIN_TAP_GAP_MS) return { ok: false, reason: 'zu schnell' };

    if (!this.session) {
      if (this.state.mode !== 'ready') return { ok: false, reason: this.state.message };
      const room = this.target() - (this.state.epochTaps || 0);
      if (room <= 0) return { ok: false, reason: 'Epoche ist voll' };
      this.#startSession(room);
    }

    const s = this.session;
    if (s.stage !== 'digging') return { ok: false, reason: 'Session wird eingereicht' };

    this.lastTapAt = now;
    if (!s.workerUp) {
      s.pending.push([x, y]);
    } else if (!this.#sendTap(x, y)) {
      return { ok: false, reason: 'Worker nicht bereit' };
    }
    s.taps += 1;
    s.firstTapAt ??= now;
    s.lastTapAt = now;
    this.#emit();

    // Voll? Dann abschließen, sobald auch die Mindest-Spanne erreicht ist.
    if (s.taps >= s.target && now - s.firstTapAt >= DIG.FULL_SPAN_MS) this.#finishSession('voll');
    return { ok: true, counted: s.taps <= s.target };
  }

  #sendTap(x, y) {
    try {
      this.miner.add_tap(Math.max(0, Math.round(x)), Math.max(0, Math.round(y)));
      return true;
    } catch (e) {
      this.log(`Tap nicht angenommen: ${errText(e)}`);
      return false;
    }
  }

  // Manuell abschließen (Button)
  finishNow() {
    if (this.session?.stage === 'digging') this.#finishSession('manuell');
  }

  #startSession(target) {
    const startedAt = Date.now();
    const s = {
      target,
      taps: 0,
      pending: [],
      workerUp: false,
      startedAt,
      firstTapAt: null,
      lastTapAt: null,
      endsAt: startedAt + DIG.WINDOW_MS,
      stage: 'digging',
      epochStart: this.state.epochStart,
      before: { epochStart: this.state.epochStart, epochTaps: this.state.epochTaps || 0 },
      ev: { completed: null, rootOk: false, proofOk: false, accepted: false, rejected: false, removed: false, corrupted: false, errors: [] },
      done: null,
    };
    this.session = s;
    this.#set({ mode: 'session', message: 'Graben läuft – weiterklicken!' });

    try {
      this.miner.start(DIG.WINDOW_MS + DIG.WORKER_EXTRA_MS, (raw) => this.#onWorkerEvent(s, raw));
    } catch (e) {
      this.log(`Session-Start fehlgeschlagen: ${errText(e)}`);
      this.needsRebuild = true;
      this.session = null;
      this.#set({ mode: 'preparing', message: 'Miner wird neu aufgebaut …' });
      this.#poll();
      return;
    }
    // Der Worker wechselt einen Tick später auf „computing“; vorher gepufferte Taps nachreichen.
    setTimeout(() => {
      s.workerUp = true;
      for (const [x, y] of s.pending.splice(0)) this.#sendTap(x, y);
    }, 60);
    s.timer = setTimeout(() => this.#finishSession('Zeit'), DIG.WINDOW_MS);
    s.ticker = setInterval(() => this.#emit(), 1000);
  }

  #onWorkerEvent(s, raw) {
    let m;
    try {
      m = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    const a = m?.action;
    const d = m?.data || {};
    const ev = s.ev;
    if (m?.error) ev.errors.push(`${a}: ${m.error}${d.message ? ` (${d.message})` : ''}`);
    if (a === 'computation_completed') ev.completed = Number(d.taps ?? 0);
    if (a === 'submit_session_root' && !m.error) {
      ev.rootOk = true;
      s.stage = 'submitting';
      s.subStage = 'Prüf-Intervall abwarten';
    }
    if (a === 'submit_session_proof' && !m.error) {
      ev.proofOk = true;
      s.subStage = 'Proof eingereicht – warte auf Bestätigung';
    }
    if (a === 'session_accepted') ev.accepted = true;
    if (a === 'session_rejected') ev.rejected = true;
    if (a === 'status_updated' && d.status === 'removed') {
      ev.removed = true;
      if (d.miner_state_corrupted) ev.corrupted = true;
    }
    this.#emit();
  }

  #finishSession(reason) {
    const s = this.session;
    if (!s || s.stage !== 'digging') return;
    clearTimeout(s.timer);
    s.stage = 'submitting';
    s.subStage = 'Root wird eingereicht';
    this.#set({ mode: 'submitting', message: 'Wird eingereicht – Klicks zählen gerade nicht' });
    try {
      this.miner.stop();
    } catch {
      /* Worker schon fertig */
    }
    s.done = this.#settle(s, reason).finally(() => {
      clearInterval(s.ticker);
      this.session = null;
      this.#emit();
      if (this.active) this.#poll();
    });
  }

  async #settle(s, reason) {
    const ev = s.ev;
    const deadline = Date.now() + DIG.TERMINAL_TIMEOUT_MS;
    while (!(ev.accepted || ev.rejected || ev.removed) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
      if (ev.completed === 0) break;
    }

    // On-chain gegenprüfen – Events sind unzuverlässig, tap_sum nicht.
    let confirmed = 0;
    const wantConfirm = ev.accepted || ev.proofOk;
    const until = Date.now() + (wantConfirm ? 75000 : 8000);
    do {
      try {
        const c = await this.#readCounts();
        const before = s.before.epochStart === c.epochStart ? s.before.epochTaps : 0;
        confirmed = Math.max(0, c.epochTaps - before);
        this.#set(c);
        if (confirmed > 0) break;
      } catch (e) {
        this.log(`Bestätigung lesen: ${errText(e)}`);
      }
      await new Promise((r) => setTimeout(r, DIG.CONFIRM_POLL_MS));
    } while (Date.now() < until);

    if (!ev.removed || ev.corrupted || ev.rejected || !ev.rootOk) this.needsRebuild = true;
    for (const err of ev.errors) this.log(`Session: ${err}`);

    let status = 'bestätigt';
    if (confirmed === 0) {
      if (ev.rejected) status = 'abgelehnt';
      else if (ev.completed === 0) status = 'keine Taps';
      else if (!ev.rootOk) status = 'Einreichung fehlgeschlagen';
      else status = 'nicht bestätigt';
    }
    const spanS = s.firstTapAt && s.lastTapAt ? Math.round((s.lastTapAt - s.firstTapAt) / 1000) : 0;
    const res = {
      epoch: Math.floor((s.epochStart ?? 0) / P.REWARD_EPOCH_BLOCKS),
      epochStart: s.epochStart,
      at: Date.now(),
      sent: s.taps,
      computed: ev.completed,
      confirmed,
      spanS,
      reason,
      status,
    };
    if (confirmed > 0) {
      this.state.stats.ok += 1;
      this.state.stats.confirmedTotal += confirmed;
    } else {
      this.state.stats.failed += 1;
    }
    this.log(`Epoche #${res.epoch}: ${res.sent} Klicks, ${confirmed} bestätigt, Spanne ${spanS} s (${status}).`);
    this.dispatchEvent(new CustomEvent('session', { detail: res }));
  }
}
