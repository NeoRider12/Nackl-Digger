// Wallet-Kopplung. Zwei Wege:
//  1) BeeConnect (empfohlen): QR scannen → Wallet meldet sich (wallet_hello) →
//     App bittet per verschlüsselter Session um Freigabe der Mining-Keys.
//  2) Direktlink: Wallet-Name eintippen → gen_mining_keys liefert einen Deep-Link →
//     QR scannen und bestätigen.
// In beiden Fällen bleibt der private Wallet-Schlüssel im Handy; die App hält nur
// das eigene Mining-Schlüsselpaar für die gewählte App-ID.

import { bee, free, errText, isTransient } from './sdk.js';
import { ENDPOINTS, CLIENT_CONFIG, API_URL } from './config.js';
import { saveConnection, saveKeys } from './store.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class ConnectFlow {
  constructor({ onQr, onStatus, log }) {
    this.onQr = onQr;
    this.onStatus = onStatus;
    this.log = log;
    this.token = 0;
  }

  cancel() {
    this.token += 1;
    this.onQr(null);
  }

  #alive(token) {
    if (token !== this.token) throw new Error('Abgebrochen');
  }

  async #showQr(link, title, hint) {
    const dataUrl = await window.beeHost.makeQr(link);
    this.onQr({ dataUrl, link, title, hint });
  }

  // --- Weg 1: BeeConnect -------------------------------------------------
  async connectWithBeeConnect(appId) {
    const token = ++this.token;
    const bc = new bee.BeeConnect();
    try {
      this.onStatus('Session wird erstellt …');
      const session = bc.create_shared_key_session(appId, 300, null);
      const s = {
        sessionId: session.session_id,
        description: session.description,
        dhSecret: session.client_dh_secret,
        createdAt: session.created_at,
        deepLink: session.deep_link,
      };
      free(session);

      await this.#showQr(
        s.deepLink,
        'Mit AN Wallet scannen',
        'Öffne die Acki Nacki Wallet auf dem Handy, scanne den Code und bestätige die Verbindung.',
      );
      this.onStatus('Warte auf Bestätigung in der Wallet … (max. 5 min)');

      const hello = await bc.wait_wallet_hello(ENDPOINTS, s.sessionId, s.description, s.dhSecret, s.createdAt, 150, 2000);
      this.#alive(token);
      const connection = {
        mode: 'beeconnect',
        walletName: hello.wallet_name,
        walletAddress: hello.wallet_address,
        profileAddress: hello.profile_address,
        sessionId: s.sessionId,
        description: s.description,
        sessionStateJson: hello.session_state_json,
      };
      free(hello);
      await saveConnection(connection);
      this.log(`Wallet verbunden: ${connection.walletName}`);

      const keys = await this.requestMiningKeys(connection, appId, token);
      return { connection, keys };
    } finally {
      free(bc);
      this.onQr(null);
    }
  }

  async requestMiningKeys(connection, appId, token = ++this.token) {
    const bc = new bee.BeeConnect();
    try {
      this.onStatus('Mining-Schlüssel werden erzeugt …');
      const gen = await bee.gen_mining_keys(appId);
      const ownerPublic = gen.public;
      const ownerSecret = gen.secret;
      free(gen);

      this.onStatus('Freigabe der Mining-Schlüssel wird an die Wallet gesendet …');
      const req = await bc.request_set_mining_keys(
        ENDPOINTS,
        connection.sessionId,
        connection.description,
        connection.sessionStateJson,
        appId,
        ownerPublic,
        30,
        1000,
      );
      if (req.updated_session_state_json) {
        connection.sessionStateJson = req.updated_session_state_json;
        await saveConnection(connection);
      }
      free(req);
      this.#alive(token);

      // Push an die Wallet-App (wie im offiziellen Beispiel, fire-and-forget)
      fetch(`${API_URL}/v1/push/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_address: connection.walletAddress,
          kind: 'connect_set_mining_keys',
          request_id: crypto.randomUUID(),
          origin_name: 'NeoRiders Nackl Digger',
        }),
      }).catch(() => {});

      const keys = { appId, ownerPublic, ownerSecret, minerAddress: null, propagated: false };
      await saveKeys(keys);
      this.onStatus('Bitte die Mining-Freigabe in der Wallet bestätigen …');
      this.log('Mining-Freigabe angefragt – in der Wallet bestätigen.');

      await this.waitPropagation(connection.walletName, keys, token);
      return keys;
    } finally {
      free(bc);
    }
  }

  // --- Weg 2: Direktlink -------------------------------------------------
  async connectWithDeepLink(appId, walletName) {
    const token = ++this.token;
    this.onStatus('Wallet wird gesucht …');
    const walletAddress = await resolveWalletAddress(walletName, appId);
    this.#alive(token);
    if (!walletAddress) throw new Error(`Wallet „${walletName}“ wurde nicht gefunden.`);

    const gen = await bee.gen_mining_keys(appId);
    const keys = { appId, ownerPublic: gen.public, ownerSecret: gen.secret, minerAddress: null, propagated: false };
    const link = gen.deep_link;
    free(gen);

    const connection = { mode: 'deeplink', walletName, walletAddress };
    await saveConnection(connection);
    await saveKeys(keys);

    await this.#showQr(link, 'Mining-Freigabe scannen', 'In der AN Wallet scannen und die Registrierung bestätigen.');
    try {
      await this.waitPropagation(walletName, keys, token);
    } finally {
      this.onQr(null);
    }
    return { connection, keys };
  }

  // Wartet, bis der öffentliche Mining-Key im Miner-Vertrag steht.
  async waitPropagation(walletName, keys, token = this.token) {
    this.onStatus('Warte, bis die Freigabe im Miner-Vertrag angekommen ist …');
    const minerAddress = await bee.get_miner_address_by_wallet_name({ client_config: CLIENT_CONFIG, wallet_name: walletName });
    this.#alive(token);
    keys.minerAddress = minerAddress;
    await saveKeys(keys);

    let attempt = 0;
    for (;;) {
      try {
        await bee.ensure_mining_keys_propagated({
          client_config: CLIENT_CONFIG,
          miner_address: minerAddress,
          app_id: keys.appId,
          expected_owner_public: keys.ownerPublic,
          max_attempts: 150,
          interval_ms: 2000,
        });
        break;
      } catch (e) {
        this.#alive(token);
        const msg = errText(e);
        if (isTransient(msg) && ++attempt <= 4) {
          this.log(`Netzwerk hakt (${msg}) – neuer Versuch …`);
          await sleep(5000 * attempt);
          continue;
        }
        throw new Error(`Freigabe nicht bestätigt: ${msg}`);
      }
    }
    this.#alive(token);
    keys.propagated = true;
    await saveKeys(keys);
    this.log('Mining-Schlüssel sind on-chain registriert.');
    this.onStatus('Verbunden');
    return keys;
  }
}

export async function resolveWalletAddress(walletName, appId) {
  const wallet = new bee.Wallet(ENDPOINTS, null, API_URL, appId);
  try {
    const d = await wallet.get_multifactor_data_by_name(walletName);
    if (!d) return null;
    const addr = d.address;
    free(d);
    return addr;
  } finally {
    free(wallet);
  }
}

// Welche App-IDs haben auf dem Miner-Vertrag dieser Wallet schon einen Mining-Key?
export async function listRegisteredAppIds(walletAddress, appId) {
  const wallet = new bee.Wallet(ENDPOINTS, null, API_URL, appId);
  try {
    const d = await wallet.get_miner_details_by_multifactor_address(walletAddress);
    const map = d.owner_public || {};
    const out = Object.entries(map).map(([id, pub]) => ({ id: toHex64(id), pub: String(pub) }));
    free(d);
    return out;
  } finally {
    free(wallet);
  }
}

function toHex64(id) {
  const s = String(id).trim();
  try {
    const hex = s.startsWith('0x') ? s.slice(2) : BigInt(s).toString(16);
    return '0x' + hex.toLowerCase().padStart(64, '0');
  } catch {
    return s;
  }
}

export async function isBeeConnectSessionAlive(connection) {
  if (connection?.mode !== 'beeconnect') return true;
  const bc = new bee.BeeConnect();
  try {
    return await bc.is_session_profile_deployed(ENDPOINTS, connection.description);
  } finally {
    free(bc);
  }
}

export async function disconnectBeeConnect(connection) {
  if (connection?.mode !== 'beeconnect') return;
  const bc = new bee.BeeConnect();
  try {
    await bc.disconnect_session(
      ENDPOINTS,
      connection.sessionId,
      connection.description,
      connection.sessionStateJson,
      'user_requested',
      20,
      1000,
    );
  } finally {
    free(bc);
  }
}
