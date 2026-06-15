// Tam oyun akışı testi: açılış → 4 bölüm → final. Hızlı modda (TTS kapalı).
import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';

const APP_DIR = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(APP_DIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe'),
  args: [APP_DIR, '--mock'],   // STM32 takılıyken bile test donanımdan bağımsız koşar
  timeout: 30_000,
});
const page = await app.firstWindow();
page.on('pageerror', e => console.log('  [pageerror]', e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ss = async n => { await page.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  ss:', n); };
const st = () => page.evaluate(() => window.ZG.state());
async function waitState(s, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await st() === s) return true;
    await sleep(150);
  }
  throw new Error(`durum '${s}' beklenirken zaman aşımı (şu an: ${await st()})`);
}

console.log('1) Açılış...');
await page.waitForFunction(() => typeof window.ZG === 'object', null, { timeout: 10_000 });
await page.evaluate(() => { window.ZG.setFast(true); window.ZG.am && window.ZG.am.setMaster(0.1); });
await sleep(2500);
await ss('g01-acilis');

console.log('2) Bölüm 1: Göktürk (varış diyaloğu hızlı akar)...');
await page.evaluate(() => window.ZG.start());
await waitState('play');
await ss('g02-gokturk-play');

console.log('2c) İbre adım takibi (5 tık sağ = +90° = bir sonraki sembol)...');
const rot0 = await page.evaluate(() => window.ZG.rot()[0]);
const pos0 = await page.evaluate(() => window.ZG.pos()[0]);
await page.keyboard.press('1');
for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(180); }
const rot1 = await page.evaluate(() => window.ZG.rot()[0]);
const pos1 = await page.evaluate(() => window.ZG.pos()[0]);
console.log(`   ibre: ${rot0}° → ${rot1}° ${rot1 - rot0 === 90 ? '✓' : '✗ YANLIŞ'}`);
console.log(`   pozisyon: ${pos0} → ${pos1} ${pos1 === (pos0 + 1) % 4 ? '✓' : '✗ YANLIŞ'}`);
await ss('g02c-kadran');

console.log('3) İpucu sistemi (encoder 2 → Yazıt Bekçisi)...');
await page.keyboard.press('2');
await sleep(150);
await ss('g03-ipucu');
await sleep(600);

console.log('4) Yanlış denemeler (yalnız sözlü teşvik — kadranda ipucu YOK)...');
for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await sleep(250); }
await ss('g04-isik-tesvik');
console.log('   yanlış sayacı:', await page.evaluate(() => window.ZG.wrongs()));
const leak = await page.evaluate(() =>
  !!document.querySelector('.slot .mark, .slot .ghost, .slot .tint, .slot.ok, .slot.wrong'));
console.log('   doğruluk sızıntısı var mı:', leak ? '✗ VAR!' : '✓ yok');
await sleep(1200);

console.log('5) Şifre çöz → kilit sekansı...');
await page.evaluate(() => window.ZG.solve());
await page.keyboard.press('Space');
await sleep(2600);
await ss('g05-kilit');
await sleep(3500);
await ss('g06-kutlama');
await waitState('celebrate');

console.log('6) Başarı diyaloğu + Selçuklu geçişi...');
await page.keyboard.press('Enter');
await waitState('play', 30000);
console.log('   bölüm:', await page.evaluate(() => window.ZG.chapter()));
await ss('g07-selcuklu');

console.log('7) N ile hızlı tur: Osmanlı, Cumhuriyet...');
await page.keyboard.press('KeyN');
await waitState('play', 30000);
await ss('g08-osmanli');
await page.keyboard.press('KeyN');
await waitState('play', 30000);
await ss('g09-cumhuriyet');

console.log('8) Son bölümü çöz → FİNAL...');
await page.evaluate(() => window.ZG.solve());
await page.keyboard.press('Space');
await sleep(7000);
await page.keyboard.press('Enter');        // celebrate → success → finale
await waitState('finale', 30000);
await sleep(6000);                          // hatıralar + diyalog + başlık (fast)
await ss('g10-final');

const fin = await page.evaluate(() => ({
  restart: document.querySelector('#finRestart').classList.contains('show'),
  engraving: document.querySelector('#finEngraving').classList.contains('show'),
  title: document.querySelector('#finTitle').textContent,
}));
console.log('   final durumu:', JSON.stringify(fin));

console.log('9) FPS...');
const fps = await page.evaluate(() => new Promise(res => {
  let n = 0; const t0 = performance.now();
  (function tick() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(tick) : res(Math.round(n / 2)); })();
}));
console.log('   FPS:', fps);

await app.close();
console.log('OYUN TESTİ TAMAMLANDI');
