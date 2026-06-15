const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

/* Encoder/Serial köprüsü: main process'teki seri port okuyucusunu
   renderer'a güvenli şekilde açar (contextIsolation korunur). */
contextBridge.exposeInMainWorld('encoderAPI', {
  onData(cb)   { ipcRenderer.on('encoder-data',  (e, d) => cb(d)); },
  onRaw(cb)    { ipcRenderer.on('encoder-raw',   (e, d) => cb(d)); },
  onLine(cb)   { ipcRenderer.on('serial-line',   (e, l) => cb(l)); },
  onStatus(cb) { ipcRenderer.on('serial-status', (e, s) => cb(s)); },
  send(msg)    { ipcRenderer.send('serial-send', msg); },
  requestSync(){ ipcRenderer.send('serial-sync'); },
  listPorts()  { return ipcRenderer.invoke('serial-list'); },
  openPort(p)  { ipcRenderer.send('serial-open', p); },
  getConfig() {
    try {
      return JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'symbols.json'), 'utf8'));
    } catch (e) { return null; }
  },
});

contextBridge.exposeInMainWorld('zamanGezgini', {
  surumler: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
