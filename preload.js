'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beeHost', {
  secureGet: (key) => ipcRenderer.invoke('secure:get', key),
  secureSet: (key, value) => ipcRenderer.invoke('secure:set', key, value),
  isEncrypted: () => ipcRenderer.invoke('secure:encrypted'),
  makeQr: (text) => ipcRenderer.invoke('qr:make', text),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  setMiningActive: (active) => ipcRenderer.send('mining:active', !!active),
  setTrayStatus: (text) => ipcRenderer.send('tray:status', String(text)),
  appInfo: () => ipcRenderer.invoke('app:info'),
  onTrayToggle: (fn) => {
    ipcRenderer.on('tray:toggle-mining', () => fn());
  },
});
