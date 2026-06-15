/* ============================================================
   STM32 seri protokol ayrıştırıcısı (main process kullanır).
   Firmware (main.c) ~60 Hz'de ham sayaç akışı gönderir:
       "12,3,19,0\n"   → 4 encoder sayacı, 0-19 dairesel
   20 adım/tur, 4 sembol → 5 adım = 1 sembol pozisyonu.
   Eski "E1:0" formatı da yedek olarak desteklenir.
   Elektron bağımlılığı yok — node ile birim test edilebilir.
   ============================================================ */
'use strict';

const STEPS_PER_REV = 20;
const STEPS_PER_SYMBOL = 5;

/* "12,3,19,0" → {type:'counts', counts:[12,3,19,0]}
   "E1:0"      → {type:'pos', enc:1, pos:0}
   tanınmayan  → null                                   */
function parseLine(line) {
  const t = String(line).trim();
  if (!t) return null;

  const csv = /^(-?\d+),(-?\d+),(-?\d+),(-?\d+)$/.exec(t);
  if (csv) {
    // 1, 2 ve 3. encoder'ların yönünü arayüz tarafında tersine çevir (C kodunu derlemeye gerek kalmadan)
    return { type: 'counts', counts: [-(+csv[1]), -(+csv[2]), -(+csv[3]), +csv[4]] };
  }
  const ep = /^E([1-4]):([0-3])$/.exec(t);
  if (ep) {
    return { type: 'pos', enc: +ep[1], pos: +ep[2] };
  }
  return null;
}

/* Ham sayaç → sembol pozisyonu (0-3): ibrenin EN YAKIN olduğu yön seçilir.
   Sektör merkezleri 0/5/10/15 adımdadır; sınır 2,5 adımda (45°) geçer. */
function countToPosition(count) {
  const c = ((count % STEPS_PER_REV) + STEPS_PER_REV) % STEPS_PER_REV;
  return Math.round(c / STEPS_PER_SYMBOL) % 4;
}
function countsToPositions(counts) {
  return counts.map(countToPosition);
}

/* Oyun komutu → firmware komutu (main.c: OPEN/CLOSE/RESET bekler) */
function toFirmwareCommand(cmd) {
  const map = { UNLOCK: 'OPEN', OPEN: 'OPEN', CLOSE: 'CLOSE', RESET: 'RESET' };
  return map[String(cmd).toUpperCase()] || null;
}

module.exports = { parseLine, countToPosition, countsToPositions, toFirmwareCommand, STEPS_PER_REV, STEPS_PER_SYMBOL };
