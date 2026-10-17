'use strict';

// NeoRiders Nackl Digger – Electron-Hauptprozess.
// Aufgaben: Fenster + Tray, eigenes app://-Protokoll (damit WASM per fetch
// geladen werden kann und localStorage einen festen Ursprung hat), verschlüsselte
// Ablage der Mining-Schlüssel (Windows DPAPI via safeStorage), Energiespar-Sperre
// während des Minens und QR-Code-Erzeugung.

const path = require('path');
const fs = require('fs');
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  protocol,
  safeStorage,
  powerSaveBlocker,
  shell,
} = require('electron');
const QRCode = require('qrcode');

const APP_HOST = 'bee';
const RENDERER_DIR = path.join(__dirname, 'renderer');
const SDK_DIR = path.dirname(require.resolve('@teamgosh/bee-sdk/package.json'));

// Hintergrund-Drosselung von Timern abschalten – sonst schlafen Taps und
// Mining-Schleife ein, sobald das Fenster im Tray liegt.
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function resolveAppPath(urlString) {
  const url = new URL(urlString);
  if (url.host !== APP_HOST) return null;
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  let base = RENDERER_DIR;
  if (rel.startsWith('/sdk/')) {
    base = SDK_DIR;
    rel = rel.slice('/sdk'.length);
  }
  const full = path.normalize(path.join(base, rel));
  if (!full.startsWith(base + path.sep)) return null; // kein Ausbruch aus dem Ordner
  return full;
}

// ---------------------------------------------------------------------------
// Verschlüsselter Speicher (Mining-Schlüssel, Connect-Session)
// ---------------------------------------------------------------------------
const secureFile = () => path.join(app.getPath('userData'), 'secure-store.json');

function readSecureFile() {
  try {
    return JSON.parse(fs.readFileSync(secureFile(), 'utf8'));
  } catch {
    return {};
  }
}

function writeSecureFile(obj) {
  fs.mkdirSync(path.dirname(secureFile()), { recursive: true });
  const tmp = secureFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj), 'utf8');
  fs.renameSync(tmp, secureFile());
}

function secureGet(key) {
  const entry = readSecureFile()[key];
  if (!entry) return null;
  try {
    if (entry.enc) return safeStorage.decryptString(Buffer.from(entry.v, 'base64'));
    return entry.v;
  } catch {
    return null;
  }
}

function secureSet(key, value) {
  const all = readSecureFile();
  if (value === null || value === undefined) {
    delete all[key];
  } else if (safeStorage.isEncryptionAvailable()) {
    all[key] = { enc: true, v: safeStorage.encryptString(String(value)).toString('base64') };
  } else {
    all[key] = { enc: false, v: String(value) };
  }
  writeSecureFile(all);
  return true;
}

// ---------------------------------------------------------------------------
// Fenster + Tray
// ---------------------------------------------------------------------------
let mainWindow = null;
let tray = null;
let quitting = false;
let powerBlockId = null;
let trayStatus = 'Bereit';
let miningActive = false;

const iconPath = path.join(__dirname, 'assets', 'icon.png');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'NeoRiders Nackl Digger',
    backgroundColor: '#14120f',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`app://${APP_HOST}/index.html`);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Links aus der Seite nie im App-Fenster öffnen.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`app://${APP_HOST}/`)) e.preventDefault();
  });
}

function showWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: `Status: ${trayStatus}`, enabled: false },
    { type: 'separator' },
    { label: 'Fenster anzeigen', click: showWindow },
    {
      label: miningActive ? 'Mining stoppen' : 'Mining starten',
      click: () => mainWindow?.webContents.send('tray:toggle-mining'),
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        quitting = true;
        app.quit();
      },
    },
  ]);
}

function createTray() {
  let img = nativeImage.createFromPath(iconPath);
  if (img.isEmpty()) img = nativeImage.createEmpty();
  tray = new Tray(img.resize({ width: 16, height: 16 }));
  tray.setToolTip('NeoRiders Nackl Digger');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', () => (mainWindow?.isVisible() ? mainWindow.hide() : showWindow()));
}

function openExternalSafe(url) {
  try {
    const u = new URL(url);
    const blocked = ['file:', 'javascript:', 'data:', 'vbscript:', 'about:', 'app:'];
    if (blocked.includes(u.protocol)) return false;
    shell.openExternal(url);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------
function registerIpc() {
  ipcMain.handle('secure:get', (_e, key) => secureGet(String(key)));
  ipcMain.handle('secure:set', (_e, key, value) => secureSet(String(key), value));
  ipcMain.handle('secure:encrypted', () => safeStorage.isEncryptionAvailable());

  ipcMain.handle('qr:make', async (_e, text) =>
    QRCode.toDataURL(String(text), { errorCorrectionLevel: 'M', margin: 1, width: 320 }),
  );

  ipcMain.handle('open:external', (_e, url) => openExternalSafe(String(url)));

  ipcMain.on('mining:active', (_e, active) => {
    miningActive = !!active;
    if (miningActive && powerBlockId === null) {
      powerBlockId = powerSaveBlocker.start('prevent-app-suspension');
    } else if (!miningActive && powerBlockId !== null) {
      powerSaveBlocker.stop(powerBlockId);
      powerBlockId = null;
    }
    tray?.setContextMenu(buildTrayMenu());
  });

  ipcMain.on('tray:status', (_e, text) => {
    trayStatus = String(text).slice(0, 60);
    tray?.setToolTip(`NeoRiders Nackl Digger – ${trayStatus}`);
    tray?.setContextMenu(buildTrayMenu());
  });

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    userData: app.getPath('userData'),
    platform: process.platform,
  }));
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(() => {
    protocol.handle('app', async (request) => {
      const file = resolveAppPath(request.url);
      if (!file) return new Response('Not found', { status: 404 });
      try {
        const data = await fs.promises.readFile(file);
        const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        return new Response(data, { headers: { 'content-type': mime } });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    });

    registerIpc();
    createWindow();
    createTray();
  });

  app.on('before-quit', () => {
    quitting = true;
  });

  app.on('window-all-closed', () => {
    // Läuft im Tray weiter; Beenden nur über das Tray-Menü.
  });
}
