// Demo akışını uçtan uca gezer ve her aşamanın ekran görüntüsünü alır.
import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';

const APP_DIR = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(APP_DIR, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe'),
  args: [APP_DIR, '--page=tests/demo.html'],
  timeout: 30_000,
});
const page = await app.firstWindow();
const ss = async name => {
  await page.screenshot({ path: path.join(SHOTS, name + '.png') });
  console.log('  ss:', name);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('1) Açılış sekansı...');
await page.waitForSelector('#compass', { timeout: 10_000 });
await sleep(6500);
await ss('01-acilis');

console.log('2) Göktürk dönemi...');
await page.keyboard.press('Enter');
await page.evaluate(() => window.ZG.am && window.ZG.am.setMaster(0.12)); // test sesi kısık
await sleep(1200);
await ss('02-gokturk');

console.log("2b) Yanlış deneme yardımı (Işık'ın balonu)...");
await page.keyboard.press('Space');                       // 1. yanlış
await sleep(400);
await page.keyboard.press('Space');                       // 2. yanlış → toast
await sleep(700);
await ss('02b-isik-yardim');
const wrongs = await page.evaluate(() => window.ZG.wrongs());
console.log('   yanlış sayacı:', wrongs, wrongs === 2 ? '✓' : '✗');

console.log('3) Kilit sekansı (çöz + SPACE)...');
await page.evaluate(() => window.ZG.solve());
await sleep(300);
await page.keyboard.press('Space');
await sleep(2600);                       // kilit görünür + mekanizma açılıyor
await ss('03-kilit-acilis');
await sleep(2000);                       // 4.6s: dönem görseli
await ss('04-donem-gorseli');
await sleep(1500);                       // 6.1s: sembol yağmuru
await ss('05-kutlama');

console.log('4) Dönem geçişleri...');
await sleep(1500);
await page.keyboard.press('Enter');      // sonraki dönem
await sleep(1500);
await ss('06-gecis-ortasi');
await sleep(1500);
await ss('07-selcuklu');
await page.keyboard.press('KeyT');
await sleep(3000);
await ss('08-osmanli');
await page.keyboard.press('KeyT');
await sleep(3000);
await ss('09-cumhuriyet');

console.log('5) Diyalog demosu...');
await page.keyboard.press('KeyD');
await sleep(1800);
await ss('10-diyalog');
await sleep(4500);                       // diyalog bitsin

console.log('6) Sembol galerisi...');
await page.keyboard.press('KeyG');
await sleep(600);
await ss('11-galeri');
await page.keyboard.press('Escape');

console.log('7) FPS ölçümü (3 sn)...');
const fps = await page.evaluate(() => new Promise(res => {
  let n = 0;
  const t0 = performance.now();
  (function tick(){
    n++;
    if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
    else res(Math.round(n / 3));
  })();
}));
console.log('  Ortalama FPS:', fps);

const st = await page.evaluate(() => ({ state: window.ZG.state(), era: window.ZG.era() }));
console.log('  Son durum:', JSON.stringify(st));

await app.close();
console.log('TEST TAMAMLANDI');
