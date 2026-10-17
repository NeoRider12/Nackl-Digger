import { initSdk, errText } from './sdk.js';
import { PROTOCOL as P, DIG, loadSettings, saveSettings, normalizeAppId } from './config.js';
import { loadConnection, loadKeys, saveKeys, clearAll, loadSessions, saveSessions, saveConnection } from './store.js';
import {
  ConnectFlow,
  listRegisteredAppIds,
  resolveWalletAddress,
  isBeeConnectSessionAlive,
  disconnectBeeConnect,
} from './connect.js';
import { DigEngine } from './engine.js';
import { RewardTracker, formatNackl } from './rewards.js';

const $ = (id) => document.getElementById(id);
const fmtInt = (n) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('de-DE'));
const short = (s, a = 8, b = 6) => (s && s.length > a + b + 1 ? `${s.slice(0, a)}…${s.slice(-b)}` : s || '–');
const timeStr = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const agoStr = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} min`;
  return `vor ${Math.floor(m / 60)} h ${m % 60} min`;
};
const setBar = (id, frac, full = false) => {
  const el = $(id);
  el.style.width = `${Math.max(0, Math.min(1, frac || 0)) * 100}%`;
  el.classList.toggle('full', full);
};

// ---------------------------------------------------------------------------
// Zustand
// ---------------------------------------------------------------------------
const app = {
  settings: loadSettings(),
  connection: null,
  keys: null,
  sessions: loadSessions(),
  connectMode: 'beeconnect',
  lastEngine: null,
  lastRewards: null,
  qrLink: null,
};

// ---------------------------------------------------------------------------
// Protokoll + Hinweise
// ---------------------------------------------------------------------------
const logLines = [];
function log(msg) {
  logLines.unshift(`${new Date().toLocaleTimeString('de-DE')}  ${msg}`);
  if (logLines.length > 400) logLines.length = 400;
  $('log').textContent = logLines.join('\n');
  console.log('[Digger]', msg);
}

let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 6000);
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
const engine = new DigEngine({ log });
const rewards = new RewardTracker({ log });
const flow = new ConnectFlow({
  log,
  onStatus: (s) => {
    $('pairStatus').textContent = s;
    $('pendingStatus').textContent = s;
    $('qrStatus').textContent = s;
  },
  onQr: (q) => showQr(q),
});

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------
const currentAppId = () => normalizeAppId($('appIdInput').value);

function renderWallet() {
  const c = app.connection;
  const k = app.keys;
  const connected = !!(c && k?.propagated && k?.minerAddress);
  const pending = !!(c && k && !k.propagated);
  $('viewConnected').hidden = !connected;
  $('viewPending').hidden = !pending;
  $('viewConnect').hidden = connected || pending;
  if (connected) {
    $('wName').textContent = c.walletName || '–';
    $('wAddr').textContent = short(c.walletAddress, 10, 6);
    $('wAddr').title = c.walletAddress || '';
    $('wApp').textContent = short(k.appId, 6, 6);
    $('wApp').title = k.appId;
    $('wMode').textContent = c.mode === 'beeconnect' ? 'Wallet Connect' : 'Direktlink';
  }
  $('btnArm').disabled = !connected;
}

function setConnectMode(mode) {
  app.connectMode = mode;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  $('modeBeeconnect').hidden = mode !== 'beeconnect';
  $('modeDeeplink').hidden = mode !== 'deeplink';
}

function showQr(q) {
  if (!q) {
    $('qrOverlay').hidden = true;
    app.qrLink = null;
    return;
  }
  app.qrLink = q.link;
  $('qrTitle').textContent = q.title;
  $('qrHint').textContent = q.hint;
  $('qrImg').src = q.dataUrl;
  $('qrOverlay').hidden = false;
}

async function onPaired(result) {
  app.connection = result.connection;
  app.keys = result.keys;
  app.settings.appId = result.keys.appId;
  saveSettings(app.settings);
  renderWallet();
  applyModules();
  toast('Wallet gekoppelt – schalte das Graben ein und leg los.');
}

async function pair() {
  const appId = currentAppId();
  if (!appId) {
    $('pairStatus').textContent = 'Bitte eine gültige App-ID eintragen (0x + bis zu 64 Hex-Zeichen).';
    $('pairStatus').classList.add('err');
    return;
  }
  $('btnPair').disabled = true;
  $('pairStatus').classList.remove('err');
  try {
    await engine.deactivate();
    let result;
    if (app.connectMode === 'beeconnect') {
      result = await flow.connectWithBeeConnect(appId);
    } else {
      const name = $('walletName').value.trim();
      if (!name) throw new Error('Bitte den Wallet-Namen eingeben.');
      result = await flow.connectWithDeepLink(appId, name);
    }
    await onPaired(result);
  } catch (e) {
    const msg = errText(e);
    if (msg !== 'Abgebrochen') {
      $('pairStatus').textContent = msg;
      $('pairStatus').classList.add('err');
      log(`Kopplung fehlgeschlagen: ${msg}`);
    }
    app.connection = await loadConnection();
    app.keys = await loadKeys();
    renderWallet();
  } finally {
    $('btnPair').disabled = false;
  }
}

async function resumeWait() {
  $('btnResumeWait').disabled = true;
  try {
    const keys = await flow.waitPropagation(app.connection.walletName, app.keys);
    await onPaired({ connection: app.connection, keys });
  } catch (e) {
    $('pendingStatus').textContent = errText(e);
    log(errText(e));
  } finally {
    $('btnResumeWait').disabled = false;
  }
}

async function repair() {
  await engine.deactivate();
  rewards.stop();
  const appId = app.keys?.appId || currentAppId();
  if (app.connection?.mode === 'beeconnect' && appId) {
    try {
      if (await isBeeConnectSessionAlive(app.connection)) {
        $('viewConnected').hidden = true;
        $('viewPending').hidden = false;
        const keys = await flow.requestMiningKeys(app.connection, appId);
        await onPaired({ connection: app.connection, keys });
        return;
      }
    } catch (e) {
      log(`Bestehende Connect-Session nicht nutzbar: ${errText(e)}`);
    }
  }
  await clearAll();
  app.connection = null;
  app.keys = null;
  renderWallet();
}

async function disconnect() {
  await engine.deactivate();
  rewards.stop();
  try {
    await disconnectBeeConnect(app.connection);
  } catch (e) {
    log(`Trennen der Connect-Session: ${errText(e)}`);
  }
  await clearAll();
  app.connection = null;
  app.keys = null;
  renderWallet();
  log('Getrennt. Der Mining-Key bleibt im Vertrag, bis er ersetzt wird.');
}

async function checkRegisteredIds() {
  const box = $('registeredIds');
  const name = $('walletName').value.trim();
  if (!name) {
    box.textContent = 'Wallet-Namen eingeben.';
    return;
  }
  box.textContent = 'Prüfe …';
  try {
    const appId = currentAppId() || '0x' + '0'.repeat(64);
    const addr = await resolveWalletAddress(name, appId);
    if (!addr) {
      box.textContent = 'Wallet nicht gefunden.';
      return;
    }
    const ids = await listRegisteredAppIds(addr, appId);
    box.innerHTML = '';
    if (!ids.length) {
      box.textContent = 'Noch keine App-ID registriert.';
      return;
    }
    const head = document.createElement('div');
    head.className = 'muted';
    head.textContent = `${ids.length} App-ID(s) mit Mining-Key:`;
    box.append(head);
    for (const { id } of ids) {
      const row = document.createElement('div');
      const code = document.createElement('code');
      code.textContent = short(id, 6, 8);
      code.title = id;
      row.append(code);
      if (id === currentAppId()) row.append(document.createTextNode(' ← diese ID (wird ersetzt)'));
      box.append(row);
    }
  } catch (e) {
    box.textContent = `Fehler: ${errText(e)}`;
  }
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------
function renderSettings() {
  $('setTaps').value = app.settings.tapsPerEpoch;
  $('setDaily').value = app.settings.dailyLimit;
  $('setAuto').checked = !!app.settings.autoStart;
  $('sDailyLimit').textContent = `/ ${fmtInt(app.settings.dailyLimit)}`;
  $('appIdInput').value = app.settings.appId || '';
}

function readSettingsFromForm() {
  app.settings.tapsPerEpoch = Math.max(1, Math.min(P.TAPS_PER_EPOCH_MAX, parseInt($('setTaps').value, 10) || 70));
  app.settings.dailyLimit = Math.max(70, Math.min(P.TAPS_PER_DAY_MAX, parseInt($('setDaily').value, 10) || 12000));
  app.settings.autoStart = $('setAuto').checked;
  saveSettings(app.settings);
  renderSettings();
  engine.configure({ keys: app.keys, settings: app.settings });
}

// ---------------------------------------------------------------------------
// Grabfläche
// ---------------------------------------------------------------------------
function buildPad() {
  const host = $('padCells');
  host.innerHTML = '';
  const rows = 7;
  const cols = 9;
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = `pad-row${r % 2 ? ' odd' : ''}`;
    for (let c = 0; c < cols - (r % 2); c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      row.append(cell);
    }
    host.append(row);
  }
}

function spark(pad, x, y, text, miss = false) {
  const s = document.createElement('span');
  s.className = `spark${miss ? ' miss' : ''}`;
  s.textContent = text;
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  pad.append(s);
  setTimeout(() => s.remove(), 950);
}

function onPadPointer(e) {
  // Nur echte Benutzer-Klicks zählen – programmatisch ausgelöste Events werden ignoriert.
  if (!e.isTrusted || e.button !== 0) return;
  const pad = $('pad');
  if (pad.classList.contains('locked')) return;
  const rect = pad.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const res = engine.tap(x, y);
  const cell = e.target.closest('.cell');
  if (res.ok) {
    if (cell) {
      cell.classList.remove('hit');
      void cell.offsetWidth;
      cell.classList.add('hit', 'dug');
      setTimeout(() => cell.classList.remove('dug'), 6000 + Math.random() * 8000);
    }
    spark(pad, x, y, res.counted ? '+1' : '+0 (Dauer)');
  } else if (res.reason !== 'zu schnell') {
    spark(pad, x, y, res.reason, true);
  }
}

// ---------------------------------------------------------------------------
// Anzeige
// ---------------------------------------------------------------------------
const MODE_PILL = { off: 'idle', preparing: 'wait', ready: 'run', full: 'wait', daily: 'wait', session: 'run', submitting: 'wait', error: 'err' };

function renderEngine(s = app.lastEngine) {
  if (!s) return;
  app.lastEngine = s;
  const paired = !!app.keys?.propagated;
  const pillText = !paired ? 'Nicht gekoppelt' : s.active ? s.message.split(' – ')[0] : 'Graben aus';
  $('phaseText').textContent = pillText;
  $('phasePill').className = `pill ${s.active ? MODE_PILL[s.mode] || 'idle' : 'idle'}`;
  $('btnArm').textContent = s.active ? 'Graben ausschalten' : 'Graben einschalten';
  $('btnArm').classList.toggle('stop', s.active);
  $('netInfo').textContent = s.seq ? `Block ${fmtInt(s.seq)} · ~${s.blockMs} ms/Block` : '–';

  // Grabfläche sperren/entsperren
  const pad = $('pad');
  const canDig = paired && s.active && (s.mode === 'ready' || (s.mode === 'session' && s.session?.stage === 'digging'));
  pad.classList.toggle('locked', !canDig);
  pad.classList.toggle('digging', s.mode === 'session');
  let veil = '';
  if (!paired) veil = 'Erst die Wallet koppeln';
  else if (!s.active) veil = 'Schalte das Graben ein';
  else if (!canDig) veil = s.message;
  $('padVeil').hidden = !veil;
  $('padVeilText').textContent = veil;
  $('digMessage').textContent = s.active ? s.message : paired ? 'Graben ist aus' : 'Nicht gekoppelt';

  // Session-Messwerte
  const target = Math.min(70, app.settings.tapsPerEpoch);
  const se = s.session;
  if (se) {
    const span = se.firstTapAt && se.lastTapAt ? (se.lastTapAt - se.firstTapAt) / 1000 : 0;
    const left = Math.max(0, Math.round((se.endsAt - Date.now()) / 1000));
    $('mTaps').textContent = `${se.taps} / ${se.target}`;
    setBar('bTaps', se.taps / se.target, se.taps >= se.target);
    $('mSpan').textContent = `${Math.round(span)} / ${DIG.FULL_SPAN_MS / 1000} s`;
    setBar('bSpan', (span * 1000) / DIG.FULL_SPAN_MS, span * 1000 >= DIG.FULL_SPAN_MS);
    if (se.stage === 'digging') {
      $('mLeft').textContent = `noch ${left} s`;
      setBar('bLeft', left / (DIG.WINDOW_MS / 1000));
    } else {
      $('mLeft').textContent = 'wird eingereicht';
      setBar('bLeft', 0);
    }
    $('btnSubmit').disabled = se.stage !== 'digging' || se.taps === 0;
  } else {
    const done = s.epochTaps || 0;
    $('mTaps').textContent = `0 / ${Math.max(0, target - done)}`;
    setBar('bTaps', 0);
    $('mSpan').textContent = `0 / ${DIG.FULL_SPAN_MS / 1000} s`;
    setBar('bSpan', 0);
    $('mLeft').textContent = s.mode === 'ready' ? 'startet mit dem ersten Klick' : '–';
    setBar('bLeft', 0);
    $('btnSubmit').disabled = true;
  }

  if (s.epochPos !== null && s.epochPos !== undefined && s.seq) {
    const leftMs = (1000 - s.epochPos) * s.blockMs;
    $('mEpoch').textContent = `#${fmtInt(Math.floor(s.epochStart / 1000))} · nächste in ${Math.round(leftMs / 1000)} s`;
    setBar('bEpoch', s.epochPos / 1000);
  }

  $('sEpochTaps').textContent = s.epochTaps ?? '–';
  setBar('bEpochTaps', (s.epochTaps || 0) / target, (s.epochTaps || 0) >= target);
  $('sDailyTaps').textContent = fmtInt(s.dailyTaps);
  setBar('bDailyTaps', (s.dailyTaps || 0) / app.settings.dailyLimit);

  const st = s.stats;
  $('sessionsInfo').textContent = st.ok || st.failed ? `${st.ok} Sessions bestätigt · ${st.failed} ohne Bestätigung` : '';
  window.beeHost.setTrayStatus(s.active ? `${pillText}${s.epochTaps !== null ? ` · ${s.epochTaps}/${target}` : ''}` : 'Graben aus');
}

function attributePayouts(payouts) {
  // Auszahlung für Epoche E kommt frühestens in Epoche E+2 → ältester bestätigter,
  // noch unbezahlter Eintrag, der mindestens ~4 min älter ist.
  const open = app.sessions.filter((x) => x.confirmed > 0 && !x.payoutId).sort((a, b) => a.at - b.at);
  const used = new Set(app.sessions.map((x) => x.payoutId).filter(Boolean));
  let changed = false;
  for (const p of payouts.filter((q) => !used.has(q.id)).sort((a, b) => a.at - b.at)) {
    const idx = open.findIndex((x) => x.at <= p.at - 4 * 60000);
    if (idx === -1) continue;
    const sess = open.splice(idx, 1)[0];
    sess.payoutId = p.id;
    sess.payout = p.value;
    changed = true;
  }
  if (changed) saveSessions(app.sessions);
  return changed;
}

function bigEpochStartMs() {
  const s = app.lastEngine;
  if (s?.seq) return Date.now() - (s.seq % P.BIG_EPOCH_BLOCKS) * s.blockMs;
  return Date.now() - 24 * 3600 * 1000;
}

function renderRewards(r = app.lastRewards) {
  if (!r) return;
  app.lastRewards = r;
  const payouts = r.payouts || [];
  const last = payouts[0];
  if (last) {
    $('lastPayout').textContent = formatNackl(last.value);
    const sess = app.sessions.find((x) => x.payoutId === last.id);
    const forEpoch = sess ? `für Epoche #${fmtInt(sess.epoch)} (≈) · ` : '';
    $('lastPayoutSub').textContent = `${forEpoch}${agoStr(last.at)}${last.source === 'saldo' ? ' · aus Saldo-Differenz' : ''}`;
  }
  const today = payouts.filter((p) => p.at >= bigEpochStartMs());
  const sum = today.reduce((a, p) => a + BigInt(p.value), 0n);
  $('sToday').textContent = today.length ? formatNackl(sum.toString(), 3) : '0';
  $('sTodayCount').textContent = today.length ? `${today.length} Auszahlungen` : 'noch keine';
  $('sLocked').textContent = r.locked !== null ? formatNackl(r.locked, 2) : '–';
  $('sLiquid').textContent = r.liquid !== null ? `frei: ${formatNackl(r.liquid, 2)} NACKL` : '';
}

function renderSessions() {
  const body = $('epochRows');
  body.innerHTML = '';
  if (!app.sessions.length) {
    body.innerHTML = '<tr><td colspan="6" class="muted">Noch keine Sessions</td></tr>';
    return;
  }
  for (const x of app.sessions.slice(0, 60)) {
    const tr = document.createElement('tr');
    const cls = x.confirmed > 0 ? 'ok' : x.status === 'abgelehnt' ? 'bad' : 'warn';
    const spanCls = x.spanS * 1000 >= DIG.FULL_SPAN_MS ? 'ok' : 'warn';
    const cells = [
      `#${fmtInt(x.epoch)}`,
      timeStr(x.at),
      `${x.confirmed}/${x.sent}`,
      `<span class="${spanCls}">${x.spanS ?? 0} s</span>`,
      `<span class="${cls}">${x.status}</span>`,
      x.payout ? `+${formatNackl(x.payout)}` : x.confirmed > 0 ? '<span class="muted">ausstehend</span>' : '–',
    ];
    cells.forEach((html, i) => {
      const td = document.createElement('td');
      td.innerHTML = html;
      if (i === 5) td.className = x.payout ? 'num pay' : 'num';
      tr.append(td);
    });
    body.append(tr);
  }
}

// ---------------------------------------------------------------------------
// Verdrahtung
// ---------------------------------------------------------------------------
function applyModules() {
  engine.configure({ keys: app.keys, settings: app.settings });
  if (app.connection?.walletAddress && app.keys?.appId) {
    rewards.configure({ connection: app.connection, appId: app.keys.appId });
    rewards.start();
  }
}

engine.addEventListener('update', (e) => renderEngine(e.detail));
engine.addEventListener('session', (e) => {
  const res = e.detail;
  app.sessions.unshift(res);
  if (app.sessions.length > 120) app.sessions.length = 120;
  saveSessions(app.sessions);
  renderSessions();
  if (res.confirmed > 0) {
    const last = app.lastRewards?.payouts?.[0];
    const hint = res.spanS * 1000 < DIG.FULL_SPAN_MS ? ` Tipp: Klicks länger verteilen (${res.spanS} s < 116 s).` : '';
    toast(
      `Epoche #${fmtInt(res.epoch)}: ${res.confirmed} Taps bestätigt.` +
        (last ? ` Letzte Auszahlung: +${formatNackl(last.value)} NACKL.` : '') +
        hint,
    );
  }
  setTimeout(() => rewards.refresh(), 20000);
});
engine.addEventListener('not-owner', async () => {
  toast('Mining-Key wurde ersetzt – bitte neu koppeln.');
  app.keys = null;
  await saveKeys(null);
  renderWallet();
});

let rewardsPrimed = false;
rewards.addEventListener('update', (e) => {
  const r = e.detail;
  if (r.error) log(`Saldo/Historie: ${r.error}`);
  if (attributePayouts(r.payouts || [])) renderSessions();
  renderRewards(r);
  const primed = rewardsPrimed;
  rewardsPrimed = true;
  if (primed && r.fresh?.length) {
    const sum = r.fresh.reduce((a, p) => a + BigInt(p.value), 0n);
    const big = document.querySelector('.big');
    big.classList.remove('flash');
    void big.offsetWidth;
    big.classList.add('flash');
    toast(`Neue Auszahlung: +${formatNackl(sum.toString())} NACKL`);
  }
});

function bindUi() {
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => setConnectMode(t.dataset.mode)));
  $('appIdInput').addEventListener('change', () => {
    const id = currentAppId();
    if (id) {
      app.settings.appId = id;
      saveSettings(app.settings);
      $('appIdInput').value = id;
    }
  });
  $('btnPair').addEventListener('click', pair);
  $('btnCheckIds').addEventListener('click', checkRegisteredIds);
  $('btnResumeWait').addEventListener('click', resumeWait);
  $('btnRepair').addEventListener('click', repair);
  $('btnRepair2').addEventListener('click', async () => {
    flow.cancel();
    await clearAll();
    app.connection = null;
    app.keys = null;
    renderWallet();
  });
  $('btnDisconnect').addEventListener('click', disconnect);
  $('btnCancelQr').addEventListener('click', () => flow.cancel());
  $('btnOpenLink').addEventListener('click', () => app.qrLink && window.beeHost.openExternal(app.qrLink));
  $('btnCopyLink').addEventListener('click', async () => {
    if (!app.qrLink) return;
    try {
      await navigator.clipboard.writeText(app.qrLink);
      toast('Link kopiert');
    } catch {
      toast('Kopieren nicht möglich');
    }
  });
  ['setTaps', 'setDaily', 'setAuto'].forEach((id) => $(id).addEventListener('change', readSettingsFromForm));
  $('btnArm').addEventListener('click', () => (engine.active ? engine.deactivate() : engine.activate()));
  $('btnSubmit').addEventListener('click', () => engine.finishNow());
  $('pad').addEventListener('pointerdown', onPadPointer);
  $('btnClaim').addEventListener('click', async () => {
    try {
      await engine.claimReward();
      toast('get_reward gesendet');
      setTimeout(() => rewards.refresh(), 15000);
    } catch (e) {
      toast(`get_reward fehlgeschlagen: ${errText(e)}`);
    }
  });
  window.beeHost.onTrayToggle(() => (engine.active ? engine.deactivate() : engine.activate()));
  setInterval(() => {
    renderEngine();
    renderRewards();
  }, 1000);
  setInterval(async () => {
    if (app.connection?.mode !== 'beeconnect' || !app.keys?.propagated || app.connection.sessionGone) return;
    try {
      if (!(await isBeeConnectSessionAlive(app.connection))) {
        app.connection.sessionGone = true;
        await saveConnection(app.connection);
        log('Wallet-Connect-Session wurde in der Wallet beendet. Der registrierte Mining-Key bleibt gültig.');
      }
    } catch {
      /* egal */
    }
  }, 180000);
}

async function main() {
  buildPad();
  renderSettings();
  bindUi();
  renderSessions();
  setConnectMode('beeconnect');
  $('phaseText').textContent = 'SDK lädt …';
  try {
    await initSdk();
  } catch (e) {
    $('phaseText').textContent = 'SDK-Fehler';
    log(`Bee-SDK konnte nicht geladen werden: ${errText(e)}`);
    return;
  }
  const enc = await window.beeHost.isEncrypted();
  log(`Bee-SDK 6.0.0 geladen. Schlüsselablage ${enc ? 'verschlüsselt (Windows DPAPI)' : 'UNVERSCHLÜSSELT'}.`);
  app.connection = await loadConnection();
  app.keys = await loadKeys();
  renderWallet();
  renderEngine(engine.snapshot());
  if (app.keys?.propagated && app.connection) {
    applyModules();
    log(`Gekoppelt mit ${app.connection.walletName}.`);
    if (app.settings.autoStart) engine.activate();
  }
}

main();
