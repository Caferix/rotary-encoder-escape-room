const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

/* ============================================================
   STM32 Seri Port Köprüsü (USB CDC / Virtual COM Port)
   - 'serialport' paketi kuruluysa ve --port=COMx verildiyse
     (veya STM32 VCP otomatik bulunursa) gerçek porttan okur.
   - Değilse mock modda kalır; oyun klavye simülasyonuyla çalışır.
   Firmware protokolü (main.c):
     STM32 → PC : ~60 Hz "c1,c2,c3,c4\n" (ham sayaçlar, 0-19 dairesel)
                  20 adım/tur, 5 adım = 1 sembol → pozisyon 0-3
     PC → STM32 : "OPEN\n" (solenoid aç) · "CLOSE\n" · "RESET\n"
   Renderer'a yalnız pozisyon DEĞİŞİMLERİ 'encoder-data' olarak,
   ham sayaçlar test sayfası için 'encoder-raw' olarak gider.
   ============================================================ */
const { parseLine, countsToPositions, toFirmwareCommand } = require('./src/serial-parser');
let serial = null;
let win = null;
let lastPos = [null, null, null, null];   // son bildirilen pozisyonlar

function sendStatus(status) {
  if (win && !win.isDestroyed()) win.webContents.send('serial-status', status);
}

function getSerialLib() {
  try {
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');
    return { SerialPort, ReadlineParser };
  } catch (e) { return null; }
}

async function listPorts() {
  const lib = getSerialLib();
  if (!lib) return [];
  try { return await lib.SerialPort.list(); } catch (e) { return []; }
}

function closeSerial() {
  if (serial) { try { serial.close(); } catch (e) {} serial = null; }
}

function openPort(portPath) {
  const lib = getSerialLib();
  if (!lib) { sendStatus({ mode: 'mock', detail: 'serialport paketi yok (npm i serialport)' }); return; }
  closeSerial();
  try {
    serial = new lib.SerialPort({ path: portPath, baudRate: 115200 });
    const parser = serial.pipe(new lib.ReadlineParser({ delimiter: '\n' }));
    parser.on('data', line => {
      if (!win || win.isDestroyed()) return;
      win.webContents.send('serial-line', String(line).slice(0, 120)); // ham satır monitörü
      const msg = parseLine(line);
      if (!msg) return;
      if (msg.type === 'counts') {
        win.webContents.send('encoder-raw', { counts: msg.counts });
        countsToPositions(msg.counts).forEach((p, i) => {
          if (p !== lastPos[i]) {
            lastPos[i] = p;
            win.webContents.send('encoder-data', { enc: i + 1, pos: p });
          }
        });
      } else if (msg.type === 'pos') {
        lastPos[msg.enc - 1] = msg.pos;
        win.webContents.send('encoder-data', { enc: msg.enc, pos: msg.pos });
      }
    });
    serial.on('open', () => {
      // Birçok STM32 CDC yığını veri akıtmak için DTR bekler — açıkça bildir
      serial.set({ dtr: true, rts: true }, () => {});
      sendStatus({ mode: 'serial', detail: portPath });
    });
    serial.on('error', err => { sendStatus({ mode: 'mock', detail: 'port hatası: ' + err.message }); serial = null; });
    serial.on('close', () => sendStatus({ mode: 'mock', detail: 'bağlantı koptu' }));
  } catch (e) {
    sendStatus({ mode: 'mock', detail: 'port açılamadı: ' + e.message });
  }
}

async function setupSerial() {
  // --mock: donanım takılı olsa bile seri portu açma (otomatik testler için)
  if (process.argv.includes('--mock')) {
    sendStatus({ mode: 'mock', detail: 'zorla mock (--mock)' });
    return;
  }
  const portArg = process.argv.find(a => a.startsWith('--port='));
  let portPath = portArg ? portArg.split('=')[1] : null;
  if (!portPath) {
    /* Otomatik seçim — DİKKAT: ST-Link VCP de 0483 VID'li ama firmware'in
       CDC portu değildir! Öncelik: PID 5740 (STM32 USB CDC) → diğer 0483. */
    const ports = await listPorts();
    const cdc = ports.find(p => (p.vendorId || '').toLowerCase() === '0483'
                             && (p.productId || '').toLowerCase() === '5740');
    const anySt = ports.find(p => (p.vendorId || '').toLowerCase() === '0483');
    portPath = (cdc || anySt || {}).path || null;
  }
  if (!portPath) {
    sendStatus({ mode: 'mock', detail: 'STM32 bulunamadı' });
    return;
  }
  openPort(portPath);
}

ipcMain.on('serial-send', (ev, msg) => {
  const cmd = toFirmwareCommand(msg);    // UNLOCK → OPEN çevirisi dahil
  if (cmd && serial && serial.isOpen) serial.write(cmd + '\n');
});
/* Renderer mevcut fiziksel pozisyonları yeniden ister (bölüm başlarken) */
ipcMain.on('serial-sync', () => {
  if (!win || win.isDestroyed()) return;
  lastPos.forEach((p, i) => {
    if (p !== null) win.webContents.send('encoder-data', { enc: i + 1, pos: p });
  });
});
/* Test konsolu: portları listele / elle port seç */
ipcMain.handle('serial-list', () => listPorts());
ipcMain.on('serial-open', (ev, p) => { lastPos = [null, null, null, null]; openPort(p); });
ipcMain.handle('get-config', () => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'symbols.json'), 'utf8'));
  } catch (e) { return null; }
});

function createWindow() {
  const kiosk = process.argv.includes('--kiosk');
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Zaman Gezgini',
    fullscreen: true,
    kiosk: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // preload'un fs/path kullanabilmesi için (Electron 20+ varsayılanı sandbox'lı
      // ve sandbox'lı preload'da require('fs') yok → encoderAPI hiç açılamıyordu)
      sandbox: false
    }
  });

  // Varsayılan: oyun. --page=demo.html (animasyon demosu) ve
  // --page=ses-demo.html (ses stüdyosu) korunur.
  const pageArg = process.argv.find(a => a.startsWith('--page='));
  win.loadFile(pageArg ? pageArg.split('=')[1] : 'index.html');
  win.webContents.on('did-finish-load', () => setupSerial());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
