// assets/ klasörünü üretir: 16 sembol, 10 karakter portresi, 4 hatıra, 4 arka plan.
// Semboller index.html içinde inline de bulunur (currentColor için); buradakiler
// bağımsız/kanonik kopyalardır (donanım ekibi ve dokümantasyon için).
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const A = p => path.join(ROOT, 'assets', p);
for (const d of ['symbols', 'characters', 'backgrounds', 'sounds'])
  fs.mkdirSync(A(d), { recursive: true });

/* ---------------- 16 SEMBOL ---------------- */
const SYMBOLS = {
  bozkurt: `<path d="M20 64 L26 38 L36 18 L44 36 C58 30 74 38 86 50 C76 56 68 58 62 62 L48 74 L36 66 L26 72 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M86 50 L68 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="44" r="3.4" fill="currentColor"/>`,
  tengri: `<circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M50 34 V82 M34 52 Q50 38 66 52 M26 66 Q50 48 74 66 M34 82 H66" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
  'orhun-t': `<path d="M50 16 V82 M50 44 L28 22 M50 44 L72 22 M34 82 H66" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  kartal: `<circle cx="50" cy="18" r="5.5" fill="currentColor"/><path d="M50 26 L56 34 H88 L70 44 L80 52 L62 56 L66 72 L52 60 L50 82 L48 60 L34 72 L38 56 L20 52 L30 44 L12 34 H44 Z" fill="currentColor"/>`,
  sekizgen: `<rect x="29" y="29" width="42" height="42" fill="none" stroke="currentColor" stroke-width="4"/><rect x="29" y="29" width="42" height="42" fill="none" stroke="currentColor" stroke-width="4" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="6" fill="currentColor"/>`,
  rumi: `<path d="M56 66 C40 70 28 58 30 44 C32 32 44 26 54 30 C62 33 65 43 59 48 C54 52 47 50 47 44" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M56 66 C70 62 80 48 78 30 C66 36 57 48 56 66 Z" fill="currentColor"/><path d="M30 76 C38 80 50 80 58 76" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
  'cift-kartal': `<path d="M50 42 C46 32 38 27 31 30 C25 33 26 40 31 42 L38 43 C30 48 22 48 16 44 C18 54 27 58 35 56 C28 62 20 62 14 58 C18 68 29 72 39 68 L43 66 L43 77 C39 81 39 86 43 88 H57 C61 86 61 81 57 77 L57 66 L61 68 C71 72 82 68 86 58 C80 62 72 62 65 56 C73 58 82 54 84 44 C78 48 70 48 62 43 L69 42 C74 40 75 33 69 30 C62 27 54 32 50 42 Z" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round"/><circle cx="32" cy="34.5" r="1.8" fill="currentColor"/><circle cx="68" cy="34.5" r="1.8" fill="currentColor"/>`,
  mukarnas: `<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"><path d="M14 40 v-4 q9 -13 18 0 v4 Z"/><path d="M32 40 v-4 q9 -13 18 0 v4 Z"/><path d="M50 40 v-4 q9 -13 18 0 v4 Z"/><path d="M68 40 v-4 q9 -13 18 0 v4 Z"/><path d="M23 58 v-4 q9 -13 18 0 v4 Z"/><path d="M41 58 v-4 q9 -13 18 0 v4 Z"/><path d="M59 58 v-4 q9 -13 18 0 v4 Z"/><path d="M32 76 v-4 q9 -13 18 0 v4 Z"/><path d="M50 76 v-4 q9 -13 18 0 v4 Z"/><path d="M41 92 v-4 q9 -13 18 0 v4 Z"/><path d="M10 40 H90"/></g>`,
  tugra: `<g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"><path d="M46 76 C40 58 40 34 46 20"/><path d="M54 76 C48 58 48 30 54 16"/><path d="M62 76 C56 58 56 34 62 20"/><path d="M46 48 C30 42 20 48 22 57 C24 65 40 63 46 56"/><path d="M46 63 C26 57 14 66 18 74 C22 81 42 78 48 69"/><path d="M62 28 C76 23 88 28 90 38"/><path d="M34 82 C44 88 60 88 70 82"/></g>`,
  'hilal-yildiz': `<path fill="currentColor" fill-rule="evenodd" d="M44 20 a30 30 0 1 0 0 60 a30 30 0 1 0 0 -60 Z M55 26 a24 24 0 1 0 0 48 a24 24 0 1 0 0 -48 Z"/><polygon fill="currentColor" points="78,40 80.4,46.7 87.5,46.9 81.9,51.3 83.9,58.1 78,54 72.1,58.1 74.1,51.3 68.5,46.9 75.6,46.7"/>`,
  lale: `<path d="M50 60 C41 52 37 40 40 24 C46 30 48 36 50 43 C52 36 54 30 60 24 C63 40 59 52 50 60 Z" fill="currentColor"/><path d="M50 58 C46.5 49 46.5 38 50 30 C53.5 38 53.5 49 50 58 Z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M50 60 V88" stroke="currentColor" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M50 76 C40 74 33 65 31 54 C42 58 48 65 50 76 Z" fill="currentColor"/><path d="M50 76 C60 74 67 65 69 54 C58 58 52 65 50 76 Z" fill="currentColor"/>`,
  selvi: `<path d="M50 14 C40 30 36 52 42 70 C45 78 47 82 47 88 H53 C53 82 55 78 58 70 C64 52 60 30 52 16 C55 11 58 9 63 9 C58 5 52 7 50 14 Z" fill="currentColor"/><path d="M40 92 H60" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
  'gunes-kursu': `<circle cx="50" cy="46" r="21" fill="none" stroke="currentColor" stroke-width="3.6"/><circle cx="50" cy="46" r="4.5" fill="currentColor"/><g fill="currentColor"><circle cx="77" cy="46" r="3"/><circle cx="69" cy="65" r="3"/><circle cx="50" cy="73" r="3"/><circle cx="31" cy="65" r="3"/><circle cx="23" cy="46" r="3"/><circle cx="31" cy="27" r="3"/><circle cx="50" cy="19" r="3"/><circle cx="69" cy="27" r="3"/></g><path d="M30 62 C19 70 16 80 22 88 M70 62 C81 70 84 80 78 88 M50 25 V10 M41 26 L36 13 M59 26 L64 13" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
  basak: `<path d="M50 90 V28 M50 28 L42 10 M50 24 L50 8 M50 28 L58 10" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><g fill="currentColor"><path d="M50 40 C40 38 34 31 35 23 C44 26 49 31 50 40 Z"/><path d="M50 40 C60 38 66 31 65 23 C56 26 51 31 50 40 Z"/><path d="M50 56 C40 54 34 47 35 39 C44 42 49 47 50 56 Z"/><path d="M50 56 C60 54 66 47 65 39 C56 42 51 47 50 56 Z"/><path d="M50 72 C40 70 34 63 35 55 C44 58 49 63 50 72 Z"/><path d="M50 72 C60 70 66 63 65 55 C56 58 51 63 50 72 Z"/></g>`,
  'disli-hilal': `<g fill="currentColor"><rect x="46" y="10" width="8" height="11" rx="2"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(45 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(90 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(135 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(180 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(225 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(270 50 50)"/><rect x="46" y="10" width="8" height="11" rx="2" transform="rotate(315 50 50)"/></g><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" stroke-width="5"/><path d="M55 33 A18 18 0 1 0 55 67 A14 14 0 1 1 55 33 Z" fill="currentColor"/>`,
  zeytin: `<path d="M22 84 C36 68 56 50 80 26" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><g fill="currentColor"><ellipse cx="34" cy="68" rx="10" ry="3.6" transform="rotate(-40 34 68)"/><ellipse cx="45" cy="61" rx="10" ry="3.6" transform="rotate(28 45 61)"/><ellipse cx="53" cy="50" rx="10" ry="3.6" transform="rotate(-46 53 50)"/><ellipse cx="64" cy="43" rx="10" ry="3.6" transform="rotate(24 64 43)"/><ellipse cx="71" cy="33" rx="10" ry="3.6" transform="rotate(-52 71 33)"/><circle cx="40" cy="72" r="4.4"/><circle cx="59" cy="52" r="4.4"/><circle cx="76" cy="30" r="4.4"/></g>`,
};
for (const [name, body] of Object.entries(SYMBOLS)) {
  fs.writeFileSync(A(`symbols/${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    body.replaceAll('currentColor', '#F5D76E') + `</svg>\n`);
}

/* ---------------- 10 KARAKTER PORTRESİ ---------------- */
const CHARACTERS = {
  alp: `<path d="M18 140 C20 112 36 100 60 100 C84 100 100 112 102 140 Z" fill="#7a4a23"/>
<path d="M40 112 C48 106 72 106 80 112" stroke="#5d3517" stroke-width="4" fill="none"/>
<circle cx="60" cy="62" r="26" fill="#f2c79b"/>
<path d="M32 54 C32 28 46 16 60 14 C74 16 88 28 88 54 C78 42 42 42 32 54 Z" fill="#a93226"/>
<path d="M32 54 C44 45 76 45 88 54 L88 60 C76 51 44 51 32 60 Z" fill="#e8d3b0"/>
<circle cx="50" cy="66" r="3.2" fill="#2c1810"/><circle cx="70" cy="66" r="3.2" fill="#2c1810"/>
<path d="M44 59 Q50 56 55 59 M65 59 Q70 56 76 59" stroke="#5a3a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M52 77 Q60 84 68 77" stroke="#b06b3a" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  isik: `<defs><radialGradient id="ig" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#fffef2"/><stop offset=".55" stop-color="#F5D76E"/>
<stop offset="1" stop-color="#F5D76E" stop-opacity="0"/></radialGradient></defs>
<circle cx="60" cy="72" r="54" fill="url(#ig)" opacity=".95"/>
<g stroke="#F5D76E" stroke-width="3" stroke-linecap="round" opacity=".85">
<path d="M60 14 V26"/><path d="M60 118 V130"/><path d="M6 72 H18"/><path d="M102 72 H114"/>
<path d="M22 34 L31 43"/><path d="M98 34 L89 43"/><path d="M22 110 L31 101"/><path d="M98 110 L89 101"/></g>
<circle cx="60" cy="72" r="30" fill="#fffdf0"/>
<ellipse cx="51" cy="68" rx="3.6" ry="5.4" fill="#6b5510"/><ellipse cx="69" cy="68" rx="3.6" ry="5.4" fill="#6b5510"/>
<path d="M51 81 Q60 88 69 81" stroke="#c9a93c" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M26 30 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#fff"/>
<path d="M94 96 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 Z" fill="#fff"/>`,

  kur: `<path d="M18 140 C20 112 36 100 60 100 C84 100 100 112 102 140 Z" fill="#5d4023"/>
<path d="M36 106 L86 132" stroke="#8c5a2b" stroke-width="7"/>
<circle cx="60" cy="62" r="26" fill="#e8b88a"/>
<path d="M34 64 C30 78 30 90 34 100" stroke="#2e1d10" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M86 64 C90 78 90 90 86 100" stroke="#2e1d10" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M32 52 C32 30 45 16 60 16 C75 16 88 30 88 52 Z" fill="#6e4a2f"/>
<path d="M30 48 C44 40 76 40 90 48 L90 58 C76 50 44 50 30 58 Z" fill="#d9c7a8"/>
<circle cx="50" cy="66" r="3.2" fill="#2c1810"/><circle cx="70" cy="66" r="3.2" fill="#2c1810"/>
<path d="M43 58 H56 M64 58 H77" stroke="#3a2412" stroke-width="3" stroke-linecap="round"/>
<path d="M52 78 Q62 82 68 76" stroke="#a8693c" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  bekci: `<path d="M16 140 C18 110 34 98 60 98 C86 98 102 110 104 140 Z" fill="#4a3526"/>
<path d="M30 108 C44 98 76 98 90 108 L86 118 C72 108 48 108 34 118 Z" fill="#c7b299"/>
<circle cx="60" cy="58" r="24" fill="#e0b58e"/>
<path d="M38 66 C38 96 48 112 60 112 C72 112 82 96 82 66 C74 74 46 74 38 66 Z" fill="#e8e3da"/>
<path d="M36 44 C36 26 48 16 60 16 C72 16 84 26 84 44 C74 36 46 36 36 44 Z" fill="#e8e3da"/>
<path d="M36 44 C46 38 74 38 84 44 L84 50 C74 44 46 44 36 50 Z" fill="#8c5a2b"/>
<circle cx="60" cy="46" r="3" fill="#F5D76E"/>
<circle cx="51" cy="58" r="2.6" fill="#2c1810"/><circle cx="69" cy="58" r="2.6" fill="#2c1810"/>
<path d="M44 53 Q51 49 57 53 M63 53 Q69 49 76 53" stroke="#e8e3da" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M44 64 Q47 66 50 64 M70 64 Q73 66 76 64" stroke="#c79b72" stroke-width="2" fill="none"/>`,

  omer: `<path d="M20 140 C22 112 38 102 60 102 C82 102 98 112 100 140 Z" fill="#117a65"/>
<path d="M60 104 V140" stroke="#0b5345" stroke-width="3"/>
<circle cx="48" cy="118" r="2.4" fill="#F39C12"/><circle cx="48" cy="128" r="2.4" fill="#F39C12"/>
<circle cx="60" cy="62" r="25" fill="#f0c8a0"/>
<ellipse cx="60" cy="34" rx="30" ry="15" fill="#f2efe6"/>
<ellipse cx="60" cy="29" rx="23" ry="11" fill="#fdfbf4"/>
<circle cx="60" cy="18" r="5" fill="#f2efe6"/>
<circle cx="50" cy="65" r="3.6" fill="#20140a"/><circle cx="70" cy="65" r="3.6" fill="#20140a"/>
<path d="M44 57 Q50 53 56 57 M64 57 Q70 53 76 57" stroke="#5a3a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M54 79 Q60 82 66 79" stroke="#c2713f" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="42" cy="73" r="4" fill="#e8a17a" opacity=".5"/><circle cx="78" cy="73" r="4" fill="#e8a17a" opacity=".5"/>`,

  mahmud: `<path d="M16 140 C18 110 34 100 60 100 C86 100 102 110 104 140 Z" fill="#0e6655"/>
<path d="M36 104 C44 112 76 112 84 104" stroke="#0b5345" stroke-width="4" fill="none"/>
<circle cx="60" cy="60" r="24" fill="#ddb088"/>
<path d="M40 68 C40 92 50 104 60 104 C70 104 80 92 80 68 C72 76 48 76 40 68 Z" fill="#b8b2a8"/>
<ellipse cx="60" cy="32" rx="29" ry="16" fill="#f5f0e1"/>
<ellipse cx="60" cy="27" rx="22" ry="11" fill="#fbf8ef"/>
<path d="M33 34 C44 28 76 28 87 34" stroke="#F39C12" stroke-width="4" fill="none"/>
<circle cx="51" cy="59" r="2.8" fill="#2c1810"/><circle cx="69" cy="59" r="2.8" fill="#2c1810"/>
<path d="M44 54 Q51 50 57 54 M63 54 Q69 50 76 54" stroke="#9b948a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
<path d="M43 63 L39 66 M77 63 L81 66" stroke="#c79b72" stroke-width="1.8"/>`,

  murat: `<path d="M20 140 C22 112 38 102 60 102 C82 102 98 112 100 140 Z" fill="#7b241c"/>
<path d="M38 108 C46 102 74 102 82 108" stroke="#d4ac0d" stroke-width="3.4" fill="none"/>
<circle cx="60" cy="63" r="25" fill="#f2c79b"/>
<path d="M40 44 C40 24 50 15 60 15 C70 15 80 24 80 44 C70 38 50 38 40 44 Z" fill="#922b21"/>
<path d="M78 20 C84 22 87 28 86 34" stroke="#d4ac0d" stroke-width="2.4" fill="none"/><circle cx="86" cy="36" r="3" fill="#d4ac0d"/>
<circle cx="50" cy="66" r="3.4" fill="#20140a"/><circle cx="70" cy="66" r="3.4" fill="#20140a"/>
<path d="M44 58 Q50 60 56 56 M64 56 Q70 60 76 58" stroke="#5a3a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M54 81 Q60 78 66 81" stroke="#b06b3a" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M37 56 C35 60 35 63 37 65 C39 63 39 60 37 56 Z" fill="#aed6f1"/>`,

  suleyman: `<path d="M16 140 C18 110 34 100 60 100 C86 100 102 110 104 140 Z" fill="#3e2723"/>
<path d="M34 106 C44 114 76 114 86 106" stroke="#d4ac0d" stroke-width="3" fill="none"/>
<circle cx="60" cy="62" r="24" fill="#e3b289"/>
<ellipse cx="60" cy="28" rx="27" ry="19" fill="#f5f0e1"/>
<path d="M37 24 C48 16 72 16 83 24 M35 32 C48 24 72 24 85 32" stroke="#ddd5c0" stroke-width="2.4" fill="none"/>
<path d="M36 42 C46 36 74 36 84 42 L84 50 C74 44 46 44 36 50 Z" fill="#922b21"/>
<circle cx="51" cy="62" r="2.8" fill="#2c1810"/><circle cx="69" cy="62" r="2.8" fill="#2c1810"/>
<path d="M44 56 H57 M63 56 H76" stroke="#3a2412" stroke-width="3" stroke-linecap="round"/>
<path d="M46 76 C52 82 68 82 74 76 C68 79 52 79 46 76 Z" fill="#4a3526"/>
<path d="M52 84 H68" stroke="#b3835a" stroke-width="2.4" stroke-linecap="round"/>`,

  efe: `<path d="M20 140 C22 112 38 102 60 102 C82 102 98 112 100 140 Z" fill="#d5dbdb"/>
<path d="M44 104 L60 122 L76 104 L60 112 Z" fill="#c0392b"/>
<circle cx="60" cy="63" r="25" fill="#f6cfa6"/>
<path d="M32 44 C36 22 52 14 64 16 C78 18 86 30 86 42 L88 47 H30 Z" fill="#707b7c"/>
<path d="M28 46 C48 41 76 41 92 46 L90 52 C74 47 48 47 30 52 Z" fill="#5d6d7e"/>
<circle cx="50" cy="66" r="3.4" fill="#20140a"/><circle cx="70" cy="66" r="3.4" fill="#20140a"/>
<path d="M44 58 Q50 55 56 58 M64 58 Q70 55 76 58" stroke="#5a3a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M50 77 Q60 88 70 77 Q60 81 50 77 Z" fill="#8c4a2f"/>
<path d="M53 79 Q60 82 67 79" stroke="#fff" stroke-width="2.4" fill="none"/>
<circle cx="44" cy="73" r="1.4" fill="#d39a6a"/><circle cx="49" cy="76" r="1.4" fill="#d39a6a"/><circle cx="76" cy="73" r="1.4" fill="#d39a6a"/>`,

  yusufbey: `<path d="M16 140 C18 110 34 100 60 100 C86 100 102 110 104 140 Z" fill="#2C3E50"/>
<path d="M48 104 L60 118 L72 104 L66 102 H54 Z" fill="#fdfefe"/>
<path d="M57 110 H63 L62 126 H58 Z" fill="#922b21"/>
<circle cx="60" cy="62" r="24" fill="#e3b289"/>
<path d="M36 48 C36 22 48 12 60 12 C72 12 84 22 84 48 C74 40 46 40 36 48 Z" fill="#1c2833"/>
<path d="M42 30 C48 24 72 24 78 30 M40 38 C48 31 72 31 80 38" stroke="#2e4053" stroke-width="2" fill="none"/>
<circle cx="51" cy="62" r="2.8" fill="#2c1810"/><circle cx="69" cy="62" r="2.8" fill="#2c1810"/>
<path d="M44 56 Q51 53 57 56 M63 56 Q69 53 76 56" stroke="#3a2412" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M48 76 C53 80 67 80 72 76 C67 78 53 78 48 76 Z" fill="#34281c"/>
<path d="M53 84 Q60 87 67 84" stroke="#b3835a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
};
for (const [name, body] of Object.entries(CHARACTERS)) {
  fs.writeFileSync(A(`characters/${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">\n${body}\n</svg>\n`);
}

/* ---------------- 4 HATIRA İKONU ---------------- */
const KEEPSAKES = {
  'keepsake-tuy': `<path d="M22 54 C26 36 38 16 50 8 C48 26 40 44 26 52 Z" fill="#e8d9b0"/>
<path d="M22 54 C30 40 42 20 50 8" stroke="#b09a6a" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M22 54 L14 60" stroke="#b09a6a" stroke-width="2.4" stroke-linecap="round"/>`,
  'keepsake-cini': `<path d="M10 14 H48 V32 L40 40 L31 33 L22 42 L10 35 Z" fill="#1ABC9C"/>
<rect x="20" y="18" width="14" height="14" fill="none" stroke="#F39C12" stroke-width="2" transform="rotate(45 27 25)"/>
<path d="M31 33 L36 22 M22 42 L27 30" stroke="#eafaf6" stroke-width="1.6"/>`,
  'keepsake-lale': `<path d="M30 8 C18 24 18 40 30 56 C42 40 42 24 30 8 Z" fill="#C0392B"/>
<path d="M30 14 C26 26 26 38 30 50" stroke="#8e2b22" stroke-width="2" fill="none"/>`,
  'keepsake-serit': `<g transform="rotate(-8 30 30)"><rect x="4" y="22" width="52" height="16" rx="2" fill="#f4ecd8"/>
<circle cx="12" cy="30" r="2" fill="#2C3E50"/><rect x="17" y="28" width="7" height="4" fill="#2C3E50"/>
<circle cx="29" cy="30" r="2" fill="#2C3E50"/><circle cx="35" cy="30" r="2" fill="#2C3E50"/>
<rect x="40" y="28" width="7" height="4" fill="#2C3E50"/></g>`,
};
for (const [name, body] of Object.entries(KEEPSAKES)) {
  fs.writeFileSync(A(`symbols/${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">\n${body}\n</svg>\n`);
}

/* ---------------- 4 DÖNEM ARKA PLANI ---------------- */
const BG = {
  gokturk: { sky: ['#120a14', '#241019', '#2C1810'], sil: '#170c06',
    path: 'M0 900 V540 Q190 315 380 450 Q570 270 760 405 Q985 225 1170 495 Q1390 315 1600 405 V900 Z' },
  selcuklu: { sky: ['#04101f', '#0A2744', '#0d3357'], sil: '#04101f',
    path: 'M0 900 V495 H128 Q190 135 256 495 H480 Q540 135 608 495 H832 Q890 135 960 495 H1184 Q1240 135 1312 495 H1600 V900 Z' },
  osmanli: { sky: ['#0c0202', '#1A0505', '#2a0a08'], sil: '#0c0202',
    path: 'M0 900 V450 H64 V315 H112 V450 H192 V315 H240 V450 H352 Q416 45 480 450 H608 V315 H656 V450 H768 Q848 0 928 450 H1024 V315 H1072 V450 H1184 V315 H1232 V450 H1344 Q1408 135 1472 450 H1600 V900 Z' },
  cumhuriyet: { sky: ['#cfe5f2', '#f3ead7', '#FAFAFA'], sil: '#cdd9d3',
    path: 'M0 900 V585 Q256 315 512 495 Q800 270 1056 450 Q1344 315 1600 495 V900 Z' },
};
for (const [name, b] of Object.entries(BG)) {
  fs.writeFileSync(A(`backgrounds/${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${b.sky[0]}"/><stop offset=".5" stop-color="${b.sky[1]}"/>
<stop offset="1" stop-color="${b.sky[2]}"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#sky)"/>
<path d="${b.path}" fill="${b.sil}"/>
</svg>\n`);
}

/* ---------------- sounds/ açıklaması ---------------- */
fs.writeFileSync(A('sounds/README.md'),
`# assets/sounds

Bu prototipte tüm müzik ve efektler **çalışma anında Web Audio API ile sentezlenir**
(\`src/audio.js\` → AudioManager); ses dosyası gerekmez. Seslendirme Web Speech API
(Windows: Microsoft Tolga tr-TR) ile yapılır.

Bu klasör üretim aşaması için ayrılmıştır: kayıtlı replikler buraya
\`<karakter-id>/<replik-no>.mp3\` düzeninde konduğunda AudioManager.speak()
önce dosyayı arayacak şekilde genişletilebilir (bkz. hikaye-rehberi.md, ölçekleme).
`);

console.log('Varlıklar üretildi:',
  Object.keys(SYMBOLS).length, 'sembol,',
  Object.keys(CHARACTERS).length, 'karakter,',
  Object.keys(KEEPSAKES).length, 'hatıra,',
  Object.keys(BG).length, 'arka plan');
