/* ============================================================
   EncoderInput — Encoder/Serial giriş katmanı
   - Donanım: main process'teki seri port okuyucusundan IPC ile
     gelir (preload.js → window.encoderAPI). STM32 formatı: "E1:0\n"
   - Mock: klavye simülasyonu game.js'ten mockSet() çağırır.
   İki kaynak da aynı onData callback'ine düşer; oyun mantığı
   kaynağı umursamaz. STM32 bağlanınca kod değişikliği gerekmez.
   ============================================================ */
(function () {
'use strict';

class EncoderInput {
  constructor() {
    this._handlers = [];
    this._statusHandlers = [];
    this.hardware = false;
    this.status = { mode: 'mock', detail: 'klavye simülasyonu' };

    if (window.encoderAPI) {
      window.encoderAPI.onData(d => {
        // d = { enc: 1..4, pos: 0..3 }
        this.hardware = true;
        this._emit({ enc: d.enc - 1, pos: d.pos, source: 'hw' });
      });
      window.encoderAPI.onStatus(s => {
        this.status = s;
        this.hardware = s.mode === 'serial';
        this._statusHandlers.forEach(cb => cb(s));
      });
    }
  }

  /* cb({ enc:0..3, pos:0..3, source:'hw'|'mock' }) */
  onData(cb) { this._handlers.push(cb); }
  onStatus(cb) { this._statusHandlers.push(cb); cb(this.status); }
  _emit(d) { this._handlers.forEach(cb => cb(d)); }

  /* Klavye simülasyonu buradan girer — donanımla aynı yoldan akar */
  mockSet(enc, pos) {
    this._emit({ enc, pos: ((pos % 4) + 4) % 4, source: 'mock' });
  }

  /* STM32'ye komut: OPEN (solenoid aç) / CLOSE / RESET — main.c bunları bekler */
  sendCommand(cmd) {
    if (window.encoderAPI) window.encoderAPI.send(cmd);
  }
  /* Doğru kombinasyonda solenoid kilidi aç */
  sendUnlock() { this.sendCommand('OPEN'); }
  /* Fiziksel encoder pozisyonlarını yeniden iste (bölüm başı senkronu) */
  requestSync() {
    if (window.encoderAPI) window.encoderAPI.requestSync();
  }
  onRaw(cb) {
    if (window.encoderAPI) window.encoderAPI.onRaw(cb);
  }

  getConfig() {
    return window.encoderAPI ? window.encoderAPI.getConfig() : null;
  }
}

window.EncoderInput = EncoderInput;
})();
