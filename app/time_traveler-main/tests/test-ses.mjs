// Ses sistemi testi: TTS sesleri, dönem müziği sinyal seviyesi, seslendirme süresi.
// Not: Test sırasında kısa süreli gerçek ses çıkışı olur (düşük seviyede).
import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';

const APP_DIR = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(APP_DIR, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe'),
  args: [APP_DIR, '--page=tests/ses-demo.html'],
  timeout: 30_000,
});
const page = await app.firstWindow();
const sleep = ms => new Promise(r => setTimeout(r, ms));

await page.waitForSelector('#charGrid .card', { timeout: 10_000 });
await page.evaluate(() => window.AM.setMaster(0.18));   // test sırasında kısık ses
await sleep(1500);                                       // voiceschanged beklensin

console.log('1) TTS ses envanteri...');
const vi = await page.evaluate(() => window.AM.voiceInfo());
console.log(`   Toplam ses: ${vi.total}`);
console.log(`   Türkçe sesler: ${vi.turkish.length ? vi.turkish.join(' | ') : 'YOK'}`);
console.log(`   Seçili: ${vi.selected || '(varsayılan)'}`);

console.log('2) Dönem müziği sinyal testi...');
const levels = {};
for (const era of ['gokturk', 'selcuklu', 'osmanli', 'cumhuriyet']) {
  await page.evaluate(k => window.AM.playEra(k), era);
  await sleep(2600);                                     // crossfade otursun
  // 10 örnek alıp tepe değeri kullan (vuruşlar arası boşluğa denk gelmesin)
  levels[era] = await page.evaluate(async () => {
    let peak = 0;
    for (let i = 0; i < 10; i++) {
      peak = Math.max(peak, window.AM.level());
      await new Promise(r => setTimeout(r, 90));
    }
    return +peak.toFixed(4);
  });
  console.log(`   ${era}: tepe RMS = ${levels[era]} ${levels[era] > 0.003 ? '✓ sinyal var' : '✗ SESSİZ!'}`);
}
await page.evaluate(() => window.AM.stopMusic());

console.log('3) Efekt testi (kilit sekansı)...');
await page.evaluate(() => window.AM.unlockSequence());
await sleep(3200);
const fxLevel = await page.evaluate(async () => {
  let peak = 0;
  for (let i = 0; i < 8; i++) {
    peak = Math.max(peak, window.AM.level());
    await new Promise(r => setTimeout(r, 80));
  }
  return +peak.toFixed(4);
});
console.log(`   Kilit sekansı tepe RMS = ${fxLevel} ${fxLevel > 0.003 ? '✓' : '✗'}`);
await sleep(2500);

console.log('4) Seslendirme testi (Alp + Yazıt Bekçisi)...');
for (const id of ['alp', 'bekci']) {
  const ms = await page.evaluate(async cid => {
    const t0 = performance.now();
    await window.AM.speak(cid, window.AM.CHARACTERS[cid].sample);
    return Math.round(performance.now() - t0);
  }, id);
  console.log(`   ${id}: ${ms} ms ${ms > 400 ? '✓ konuştu' : '⚠ çok kısa (TTS çalışmamış olabilir)'}`);
}

await page.screenshot({ path: path.join(SHOTS, '12-ses-studyosu.png'), fullPage: false });
console.log('  ss: 12-ses-studyosu');

await app.close();
console.log('SES TESTİ TAMAMLANDI');
