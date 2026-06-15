// Tek seferlik duman testi: uygulamayı başlatır, pencereyi doğrular,
// ekran görüntüsü alır ve kapatır.
import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';

const APP_DIR = path.resolve(import.meta.dirname, '..');

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe'),
  args: [APP_DIR],
  timeout: 30_000,
});

const page = await app.firstWindow();
await page.waitForSelector('#surumler', { timeout: 10_000 });

const baslik = await page.title();
const govde = await page.evaluate(() => document.body.innerText);

console.log('Pencere başlığı:', baslik);
console.log('Sayfa içeriği:');
console.log(govde);

await page.screenshot({ path: path.join(APP_DIR, 'test-ekran-goruntusu.png') });
console.log('Ekran görüntüsü alındı: test-ekran-goruntusu.png');

await app.close();
console.log('TEST BAŞARILI');
