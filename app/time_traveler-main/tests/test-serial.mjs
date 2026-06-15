// serial-parser.js birim testleri — donanım olmadan protokol doğrulaması.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseLine, countToPosition, countsToPositions, toFirmwareCommand } =
  require('./src/serial-parser.js');

let pass = 0, fail = 0;
const eq = (got, want, name) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? '✓' : '✗'} ${name}` + (ok ? '' : `  → beklenen ${JSON.stringify(want)}, gelen ${JSON.stringify(got)}`));
  ok ? pass++ : fail++;
};

console.log('1) Satır ayrıştırma (firmware CSV formatı)...');
eq(parseLine('12,3,19,0\n'), { type: 'counts', counts: [12, 3, 19, 0] }, 'normal satır');
eq(parseLine('0,0,0,0'), { type: 'counts', counts: [0, 0, 0, 0] }, 'reset sonrası sıfırlar');
eq(parseLine('  7,14,2,9  '), { type: 'counts', counts: [7, 14, 2, 9] }, 'boşluklu satır');
eq(parseLine('-1,20,5,5'), { type: 'counts', counts: [-1, 20, 5, 5] }, 'sınır dışı değerler kabul (sarma sonra)');
eq(parseLine('E2:3'), { type: 'pos', enc: 2, pos: 3 }, 'eski format yedeği');
eq(parseLine('çöp veri'), null, 'bozuk satır → null');
eq(parseLine('1,2,3'), null, 'eksik alan → null');
eq(parseLine(''), null, 'boş satır → null');

console.log('2) Sayaç → pozisyon (en yakın yön kuralı; merkezler 0/5/10/15)...');
eq(countToPosition(0), 0, 'sayaç 0 → poz 0 (tam merkez)');
eq(countToPosition(2), 0, 'sayaç 2 (36°) → poz 0 en yakın');
eq(countToPosition(3), 1, 'sayaç 3 (54°) → poz 1 en yakın');
eq(countToPosition(5), 1, 'sayaç 5 → poz 1 (tam merkez)');
eq(countToPosition(12), 2, 'sayaç 12 → poz 2');
eq(countToPosition(18), 0, 'sayaç 18 (324°) → sarmayla poz 0 en yakın');
eq(countToPosition(20), 0, 'sayaç 20 → sarma → poz 0');
eq(countToPosition(-1), 0, 'sayaç -1 → 19 → poz 0 en yakın');
eq(countsToPositions([0, 5, 10, 15]), [0, 1, 2, 3], 'dört sayaç birden');

console.log('3) Komut çevirisi (oyun → firmware)...');
eq(toFirmwareCommand('UNLOCK'), 'OPEN', 'UNLOCK → OPEN');
eq(toFirmwareCommand('open'), 'OPEN', 'küçük harf toleransı');
eq(toFirmwareCommand('CLOSE'), 'CLOSE', 'CLOSE geçer');
eq(toFirmwareCommand('RESET'), 'RESET', 'RESET geçer');
eq(toFirmwareCommand('rm -rf'), null, 'tanınmayan komut → null (porta yazılmaz)');

console.log(`\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
