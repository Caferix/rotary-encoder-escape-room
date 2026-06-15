/* ============================================================
   GAME — oyun mantığı ve akış denetimi
   Açılış → Bölüm 1..4 (varış diyaloğu → ipuçları → şifre →
   kilit sekansı → başarı diyaloğu → geçiş) → Final.
   Girdi: EncoderInput (donanım/mock aynı yol). İçerik: STORY.
   Ses: AudioManager. Görsel efektler: ZGAnim + styles/*.css
   ============================================================ */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- yapılandırma ---------------- */
const FALLBACK = {
  encoders: [
    { positions: ['hayat-agaci', 'alti-ok', 'at', 'cami'] },
    { positions: ['gunes', 'kurt', 'kartal', 'hilal'] },
    { positions: ['lale', 'sanayi', 'kilic', 'otag'] },
    { positions: ['ucak', 'yay', 'tugra', 'yildiz'] }
  ],
  codes: { gokturk: [2,1,3,1], selcuklu: [0,2,2,3], osmanli: [3,3,0,2], cumhuriyet: [1,0,1,0] },
};
/* Karakter seslendirmesi (Web Speech) KAPALI: karakterler sesli konuşmaz,
   diyaloglar yalnız yazıyla akar. Müzik ve efektler etkilenmez.
   Geri açmak için: true */
const VOICE = false;

const encoderInput = new EncoderInput();
const CONFIG = encoderInput.getConfig() || FALLBACK;
const ENCODERS = CONFIG.encoders.map(e => e.positions);
/* Sembol görselleri: ID'den dosya ismine eşleme */
const SYMBOLS = {
  'at': 'G1', 'hayat-agaci': 'S1', 'cami': 'O1', 'alti-ok': 'T1',
  'kurt': 'G2', 'kartal': 'S2', 'hilal': 'O2', 'gunes': 'T2',
  'otag': 'G3', 'kilic': 'S3', 'lale': 'O3', 'sanayi': 'T3',
  'yay': 'G4', 'yildiz': 'S4', 'tugra': 'O4', 'ucak': 'T4'
};
const symImg = (id) => `assets/icons/${SYMBOLS[id] || 'G1'}.png`;
const AM = window.AudioManager ? new window.AudioManager() : null;

/* ---------------- durum ---------------- */
let chapter = 0;
let state = 'boot';   // intro | arrival | play | unlocking | celebrate | success | transition | finale
let pos = [0, 0, 0, 0];
let active = 0;
let wrongCount = 0;
let lastInput = performance.now();
let fast = false;                  // test modu
let autoCheckTimer = null;
let rumbleTimer = null, chirpTimer = null;
const slots = [];
const CH = () => STORY.chapters[chapter];
const code = () => CONFIG.codes[CH().key];

/* ================== ENCODER PANELİ ================== */
/* Gerçekçi encoder modeli: semboller sabit, merkezdeki İBRE fiziksel
   milin her adımını (18°) takip eder; en yakın yöndeki sembol seçilir. */
const STEPS = 20, PER = 5, DEG = 360 / STEPS;   // 20 adım/tur, 5 adım/sembol
const counts = [0, 0, 0, 0];                    // ham adım (0-19)
const needleAngle = [0, 0, 0, 0];               // ibrenin kümülatif açısı (derece)
let lastTickAt = 0;

function buildSlots() {
  const panel = $('#encoderPanel');
  ENCODERS.forEach((row, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML =
      `<div class="frame"><div class="rimdots"></div><div class="dial">` +
      row.map((id, p) =>
        `<div class="spoke"><div class="symwrap"><img src="${symImg(id)}" alt="${id}"/></div></div>`
      ).join('') +
      `</div><div class="needle"></div><div class="hub"></div></div>` +
      `<div class="lbl">ENCODER ${i + 1}</div>` +
      `<div class="hint"><img class="havatar" alt=""/>` +
      `<div class="hballoon"><b class="hname"></b><span class="htext"></span></div></div>`;
    panel.appendChild(slot);
    slots.push({
      el: slot,
      needle: slot.querySelector('.needle'),
      wraps: [...slot.querySelectorAll('.symwrap')],
      hint: slot.querySelector('.hint'),
      havatar: slot.querySelector('.havatar'),
      hname: slot.querySelector('.hname'),
      htext: slot.querySelector('.htext'),
    });
    refreshEmphasis(i);
  });
}
function refreshEmphasis(i) {
  slots[i].wraps.forEach((w, p) => {
    const sel = p === pos[i];
    w.style.transform = `scale(${sel ? 1.2 : 0.74})`;
    w.style.opacity = sel ? '1' : '.45';
  });
}
/* Ham adım uygula: ibre adım adım döner, en yakın sembol seçilir.
   Dönüş sarma-bilinçli en kısa yoldan ilerler. true = pozisyon değişti */
function applyCount(i, newCount, instant) {
  const nc = ((Math.round(newCount) % STEPS) + STEPS) % STEPS;
  let delta = nc - counts[i];
  delta = ((delta % STEPS) + STEPS + STEPS / 2) % STEPS - STEPS / 2;   // -10..9
  if (delta === 0 && !instant) return false;
  // Farklı bir encoder çevrilmeye başlandı: odak ve ipucu oraya geçer
  if (!instant && state === 'play' && i !== active) selectEnc(i, true);
  counts[i] = nc;
  needleAngle[i] += delta * DEG;
  const s = slots[i];
  if (instant) s.needle.classList.add('notrans');
  s.needle.style.transform = `rotate(${needleAngle[i]}deg)`;
  if (instant) { s.needle.getBoundingClientRect(); s.needle.classList.remove('notrans'); }
  else if (AM && delta !== 0) {
    const now = performance.now();
    if (now - lastTickAt > 40) { AM.sfx('encoder', i); lastTickAt = now; }
  }
  const np = Math.round(nc / PER) % 4;
  const changed = np !== pos[i];
  if (changed || instant) {
    pos[i] = np;
    refreshEmphasis(i);
  }
  return changed;
}
/* Pozisyon olayı (senkron/mock): ibre ilgili sektör merkezine gider.
   İbre zaten o sektördeyse dokunma (donanım ham akışıyla çakışmasın). */
function setPos(i, v, instant) {
  const np = ((v % 4) + 4) % 4;
  if (Math.round(counts[i] / PER) % 4 === np) { refreshEmphasis(i); return; }
  applyCount(i, np * PER, instant);
}
function selectEnc(i, speakClue) {
  active = i;
  slots.forEach((s, k) => s.el.classList.toggle('active', k === i));
  if (speakClue) showHint(i);
}
/* Doğruluk geri bildirimi BİLEREK yok: oyuncu hangi kadranın doğru
   olduğunu görmemeli/duymamalı — yalnız 4'ü birden doğruysa kilit açılır. */
function randomizePos() {
  if (encoderInput.hardware) {
    // Donanım modunda ekran fiziksel konumları yansıtmalı — karıştırma yok,
    // mevcut pozisyonları yeniden iste (onData yoluyla kadranlar güncellenir).
    encoderInput.requestSync();
    selectEnc(0, false);
    return;
  }
  let target;
  do { target = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 4)); }
  while (target.every((v, i) => v === code()[i]));
  for (let i = 0; i < 4; i++) applyCount(i, target[i] * PER, true);
  selectEnc(0, false);
}

/* ================== GİRİŞ KAYNAKLARI ================== */
let hwMoves = 0;   // bölüm başından beri oyuncunun yaptığı fiziksel hamle sayısı
encoderInput.onData(d => {
  // Kadranlar 'arrival' sırasında da fiziksel konumu takip eder (senkron),
  // ama oyun mantığı yalnız 'play' durumunda işler.
  if (state !== 'play' && state !== 'arrival') return;
  lastInput = performance.now();
  // Odak/ipucu geçişini applyCount yönetir; burada yalnız konum işlenir
  if (d.enc !== active && state === 'play') selectEnc(d.enc, false);
  setPos(d.enc, d.pos, false);
  if (d.source === 'hw' && state === 'play') {
    hwMoves++;
    // Donanımda Space yok: otomatik kontrol. hwMoves koşulu, fiziksel reset
    // sonrası "hepsi 0 = Göktürk şifresi" durumunun oyuncu hiç dokunmadan
    // kilidi açmasını engeller.
    clearTimeout(autoCheckTimer);
    autoCheckTimer = setTimeout(() => {
      if (state === 'play' && hwMoves > 0 && pos.every((v, i) => v === code()[i])) unlock();
    }, 600);
  }
});
/* Donanım ham akışı: ibre her fiziksel adımı (18°) birebir takip eder */
encoderInput.onRaw(d => {
  if (state !== 'play' && state !== 'arrival') return;
  let moved = false;
  d.counts.forEach((c, i) => { if (applyCount(i, c)) moved = true; });
  if (moved) lastInput = performance.now();
});
encoderInput.onStatus(s => {
  const el = $('#serialStatus');
  el.textContent = 'STM32: ' + (s.mode === 'serial' ? s.detail + ' ✓' : 'mock (klavye)');
  el.classList.toggle('hw', s.mode === 'serial');
});

/* ================== DİYALOG MOTORU ================== */
let typeTimer = null, skipRequest = false, advanceResolve = null, clueToken = 0;
function typeText(el, text, speed) {
  return new Promise(res => {
    clearInterval(typeTimer);
    el.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      if (skipRequest) { el.textContent = text; clearInterval(typeTimer); return res(); }
      el.textContent = text.slice(0, ++i);
      if (i % 3 === 0 && AM) AM.sfx('type');
      if (i >= text.length) { clearInterval(typeTimer); res(); }
    }, speed);
  });
}
function setPort(side, who) {
  const c = STORY.cast[who];
  const port = $(side === 'L' ? '#portL' : '#portR');
  port.querySelector('img').src = c.img;
  port.querySelector('.pname').textContent = c.ad;
  // Işık'ın enerjisi bölüm ilerledikçe görünür biçimde azalır
  port.style.filter = who === 'isik' ? 'brightness(var(--isik-glow, 1))' : '';
  return port;
}
function hidePorts() {
  $('#portL').classList.remove('in', 'talk', 'dim');
  $('#portR').classList.remove('in', 'talk', 'dim');
}
/* Sahne kuralı: Alp hep solda sahnede kalır, karşısındaki sağda.
   Konuşan nefes alır, dinleyen hafifçe sönükleşir. */
function stagePorts(line) {
  const c = STORY.cast[line.who];
  const speaker = setPort(c.side, line.who);
  if (c.side === 'R') {                       // karşısında Alp dinliyor
    const alp = setPort('L', 'alp');
    alp.classList.add('in');
  }
  speaker.classList.add('in', 'talk');
  const other = $(c.side === 'R' ? '#portL' : '#portR');
  other.classList.remove('talk');
  other.classList.add('dim');
  speaker.classList.remove('dim');
  return speaker;
}
async function sayLine(line) {
  const c = STORY.cast[line.who];
  const port = stagePorts(line);
  $('#dlgName').textContent = c.ad + (line.phone ? ' 📞' : '');
  $('#dialog').classList.add('open');
  skipRequest = false;
  const speakP = (VOICE && AM && !fast) ? AM.speak(line.who, line.text) : Promise.resolve();
  await typeText($('#dlgText'), line.text, fast ? 2 : 28);
  if (skipRequest) { try { speechSynthesis.cancel(); } catch (e) {} }
  await speakP;
  port.classList.remove('talk');
}
function advanceWait(ms) {
  return new Promise(res => {
    let t = setTimeout(done, ms);
    advanceResolve = done;
    function done() { clearTimeout(t); advanceResolve = null; res(); }
  });
}
let dlgToken = 0;   // artınca süren diyalog döngüsü sessizce terk edilir
async function runDialog(lines) {
  const my = ++dlgToken;
  for (const ln of lines) {
    if (my !== dlgToken) return;
    await sayLine(ln);
    if (my !== dlgToken) return;
    $('#dlgNext').classList.add('show');
    await advanceWait(fast ? 120 : 1300);
    $('#dlgNext').classList.remove('show');
  }
  if (my !== dlgToken) return;
  hidePorts();
  await wait(fast ? 50 : 350);
  if (my !== dlgToken) return;
  $('#dialog').classList.remove('open');
}
/* Aktif kadranın ALTINDA dönemin sembol ipucu: kalıcı balon + seslendirme.
   Başka encoder'a geçilince balon oraya taşınır, önceki konuşma iptal olur. */
async function showHint(i) {
  if (state !== 'play') return;
  const line = CH().clues[i];
  const my = ++clueToken;
  try { speechSynthesis.cancel(); } catch (e) {}
  slots.forEach((s, k) => s.hint.classList.toggle('show', k === i));
  const s = slots[i];
  const c = STORY.cast[line.who];
  s.havatar.src = c.img;                 // ipucu veren karakterin görseli
  s.hname.textContent = c.ad;
  skipRequest = false;
  if (VOICE && AM && !fast) AM.speak(line.who, line.text);
  await typeText(s.htext, line.text, fast ? 2 : 18);
  // balon açık kalır — oyuncu okumaya devam edebilir (my/clueToken
  // kontrolü gerekmez; yeni ipucu balonu zaten başka kadrana taşır)
}
function hideHints() {
  clueToken++;
  slots.forEach(s => s.hint.classList.remove('show'));
  try { speechSynthesis.cancel(); } catch (e) {}
}

/* ================== YARDIM MERDİVENİ ================== */
let toastTimer = null;
function showToast(msg) {
  const t = $('#isikToast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ================== DÖNEM UYGULAMA ================== */
function applyEra(i, deferMusic = false) {
  chapter = i;
  const c = STORY.chapters[i];
  document.body.className = 'era-' + c.key;
  $('#eraBadge').textContent = `${c.title} · ${c.year}`;
  $('#objective').textContent = c.place;
  document.querySelectorAll('#progress .pnode').forEach((n, k) => {
    n.classList.toggle('done', k < i);
    n.classList.toggle('now', k === i);
  });
  if (AM && !deferMusic) AM.playEra(c.key);
  // Işık her bölümde biraz söner (enerji maliyeti)
  $('#portR').style.filter = '';
  document.documentElement.style.setProperty('--isik-glow', (1.05 - i * 0.12).toFixed(2));
  wrongCount = 0;
  hwMoves = 0;
  if (c.key === 'gokturk') {
    encoderInput.sendCommand('OPEN');   // Donanımı BAŞLANGIÇTA KİLİTLEMEK için OPEN sinyali (Röle ters çalıştığı için)
  }
  ZGAnim.setEra(c.key);
  clearTimeout(rumbleTimer); clearTimeout(chirpTimer);
  if (c.key === 'osmanli') scheduleRumble();
  if (c.key === 'cumhuriyet') scheduleChirp();
}
function scheduleRumble(delay) {
  rumbleTimer = setTimeout(() => {
    if (CH().key !== 'osmanli') return;
    if (AM && AM.isSpeaking()) { scheduleRumble(1800); return; }  // replik bölünmesin
    if (AM) AM.sfx('cannon');
    const st = $('#stage');
    st.classList.remove('rumble'); void st.offsetWidth; st.classList.add('rumble');
    const b = $('#boomFlash');
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    scheduleRumble();
  }, delay || 7000 + Math.random() * 5000);
}
function scheduleChirp() {
  chirpTimer = setTimeout(() => {
    if (CH().key === 'cumhuriyet') { if (AM) AM.sfx('bird'); scheduleChirp(); }
  }, 4000 + Math.random() * 4500);
}

/* ================== ŞİFRE KONTROLÜ ================== */
function check() {
  if (state !== 'play') return;
  if (pos.every((v, i) => v === code()[i])) { wrongCount = 0; unlock(); }
  else {
    if (AM) AM.sfx('wrong');
    wrongCount++;
    const p = $('#encoderPanel');
    p.classList.remove('deny'); void p.offsetWidth; p.classList.add('deny');
    const f = $('#denyFlash');
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    if (wrongCount === 2) showToast(CH().help);
    else if (wrongCount >= 4) showToast('Pes etme! İpuçlarını yeniden dinle: 1, 2, 3, 4 tuşları…');
  }
}

/* ================== KİLİT SEKANSI ================== */
function unlock() {
  state = 'unlocking';
  document.body.classList.remove('mode-play');
  hideHints();
  $('#dialog').classList.remove('open'); hidePorts();
  if (AM) AM.unlockSequence();
  if (CH().key === 'cumhuriyet') {
    encoderInput.sendCommand('CLOSE');       // Röle ters çalıştığı için AÇMA işlemini CLOSE sinyali ile yapıyoruz
  }
  
  slots.forEach((s, i) => setTimeout(() => {
    s.el.classList.add('flash');
    ZGAnim.ringAt(s.el, getComputedStyle(document.body).getPropertyValue('--sym'));
    if (AM) AM.sfx('chime', i);
  }, i * 300));
  setTimeout(() => $('#lockOv').classList.add('show', 'pop'), 1200);
  setTimeout(() => { 
    $('#lockOv').classList.add('open'); 
    if (AM) AM.sfx('clank'); 
  }, 2000);
  setTimeout(() => {
    $('#lockOv').classList.add('burst');
    const g = $('#goldFlash'); g.classList.remove('on'); void g.offsetWidth; g.classList.add('on');
  }, 2800);
  setTimeout(() => {
    const c = CH();
    const css = getComputedStyle(document.body);
    const rv = $('#reveal');
    rv.style.background = `radial-gradient(circle at 50% 45%, ${css.getPropertyValue('--accent')}cc, ${css.getPropertyValue('--bg')} 70%)`;
    rv.style.color = css.getPropertyValue('--sym');
    // Bölümün ana sembolünün görselini kullan
    $('#revealImg').src = symImg(c.reveal.hero);
    $('#revealTitle').textContent = c.title;
    $('#revealSub').textContent = c.reveal.sub;
    $('#bilgiText').textContent = c.fact;
    $('#ksImg').src = c.keepsake.img;
    $('#ksName').textContent = c.keepsake.ad;
    rv.classList.add('show');
    $('#lockOv').classList.add('fade');
  }, 3500);
  setTimeout(() => {
    const css = getComputedStyle(document.body);
    const eraLetters = ['G', 'S', 'O', 'T'];
    ZGAnim.rain([1, 2, 3, 4].map(n => `assets/icons/${eraLetters[chapter]}${n}.png`),
      [css.getPropertyValue('--sym'), css.getPropertyValue('--accent'), '#ffffff']);
    state = 'celebrate';
  }, 5000);
  setTimeout(() => { if (CH().key === 'gokturk') ZGAnim.shootingStar(); }, 5400);
  setTimeout(() => {
    $('#bilgi').classList.add('show');
    $('#keepsakeCard').classList.add('show');
    addKeepsake(CH().keepsake);
  }, 5600);
  setTimeout(() => $('#nextHint').classList.add('show'), 6300);
  // Kiosk: Enter beklemeden kendiliğinden sonraki döneme geç
  setTimeout(() => { if (state === 'celebrate') afterCelebrate(); }, 12000);
}
function closeReveal() {
  $('#reveal').classList.remove('show');
  $('#nextHint').classList.remove('show');
  $('#bilgi').classList.remove('show');
  $('#keepsakeCard').classList.remove('show');
  $('#lockOv').classList.remove('show', 'pop', 'open', 'burst', 'fade');
  slots.forEach(s => s.el.classList.remove('flash'));
}
function addKeepsake(k) {
  if ($('#keepsakes [data-k="' + k.id + '"]')) return;
  $('#keepsakes .klabel')?.remove();
  const img = document.createElement('img');
  img.src = k.img; img.title = k.ad; img.dataset.k = k.id;
  $('#keepsakes').appendChild(img);
}

/* ================== BÖLÜM AKIŞI ================== */
const ERA_VIDEOS = ['assets/video/gokturkson.mp4', 'assets/video/selcuklu.mp4', 'assets/video/fatihson.mp4', 'assets/video/türkiye.mp4'];
let videoSkipResolve = null;

async function playEraVideo(i) {
  const src = ERA_VIDEOS[i];
  if (!src) return;
  state = 'video';
  const ov = $('#videoOverlay');
  const vid = $('#eraVideo');
  ov.style.display = 'block';
  // Force reflow to ensure the display: block is applied before opacity change
  void ov.offsetWidth; 
  ov.style.opacity = '1';
  vid.src = src;
  
  return new Promise(res => {
    let resolving = false;
    videoSkipResolve = () => {
      if (resolving) return;
      resolving = true;
      vid.pause();
      ov.style.opacity = '0';
      setTimeout(() => {
        ov.style.display = 'none';
        if (AM) AM.playEra(CH().key);
        videoSkipResolve = null;
        res();
      }, 1500); // Wait for the fade-out transition to complete
    };
    vid.onended = videoSkipResolve;
    vid.play().catch(e => {
      console.error(e);
      videoSkipResolve();
    });
  });
}

async function startChapter(i) {
  const hasVideo = !!ERA_VIDEOS[i];
  applyEra(i, hasVideo);
  randomizePos();
  await playEraVideo(i);
  state = 'arrival';
  await runDialog(CH().arrival);
  enterPlay();
}
function enterPlay() {
  state = 'play';
  document.body.classList.add('mode-play');   // kadranlar merkeze büyür
  $('#objective').textContent = CH().place;
  selectEnc(0, true);                          // varsayılan: Encoder 1'in ipucu
}
async function afterCelebrate() {
  if (state !== 'celebrate') return;   // çifte tetiklenme koruması (Enter + otomatik)
  closeReveal();
  state = 'success';
  await runDialog(CH().success);
  if (chapter < 3) transitionTo(chapter + 1);
  else finale();
}
function transitionTo(next) {
  state = 'transition';
  document.body.classList.remove('mode-play');
  hideHints();
  if (AM) AM.transitionWhoosh(STORY.chapters[next].key);
  ZGAnim.dissolve(CH().key);
  $('#stage').classList.add('depart');
  const w = $('#wipe');
  const n = STORY.chapters[next];
  const pal = { gokturk: ['#D4821A', '#2C1810'], selcuklu: ['#1ABC9C', '#0A2744'],
                osmanli: ['#C0392B', '#1A0505'], cumhuriyet: ['#E74C3C', '#FAFAFA'] }[n.key];
  w.style.background = `linear-gradient(105deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[1]} 100%)`;
  w.classList.add('cover');
  setTimeout(() => {
    const hasVideo = !!ERA_VIDEOS[next];
    applyEra(next, hasVideo);
    randomizePos();
    $('#stage').classList.remove('depart');
    w.classList.add('reveal');
  }, 1000);
  setTimeout(async () => {
    w.classList.remove('cover', 'reveal');
    await playEraVideo(next);
    state = 'arrival';
    await runDialog(CH().arrival);
    enterPlay();
  }, 2000);
}

/* ================== AÇILIŞ ================== */
const introTimers = [];
const iT = (fn, ms) => introTimers.push(setTimeout(fn, ms));
async function runIntro() {
  state = 'intro';
  iT(() => { $('#compass').classList.add('show'); if (AM) AM.compassIntro(); }, 200);
  iT(() => $('#compass').classList.add('spin'), 500);
  document.querySelectorAll('#compass .cdot').forEach((d, i) =>
    iT(() => { d.classList.add('lit'); if (AM) AM.sfx('chime', i); }, 1600 + i * 260));
  iT(() => typeText($('#introTitle'), 'ZAMAN GEZGİNİ', fast ? 2 : 70), 2800);
  iT(() => typeText($('#introSub'), 'ANTİK KOD ÇÖZÜCÜ', fast ? 2 : 45), 4000);
  await wait(fast ? 300 : 5200);
  if (state !== 'intro') return;            // intro atlandıysa devam etme
  $('#pressStart').classList.add('show');
  state = 'intro-ready';
}
function endIntro() {
  introTimers.forEach(clearTimeout);
  dlgToken++;                               // süren intro diyaloğunu iptal et
  clearInterval(typeTimer);
  try { speechSynthesis.cancel(); } catch (e) {}
  hidePorts(); $('#dialog').classList.remove('open');
  playRoomSequence();
}

async function playRoomSequence() {
  state = 'room';
  $('#introTitle').style.opacity = '0';
  $('#introSub').style.opacity = '0';
  $('#pressStart').classList.remove('show');
  
  await wait(800);
  await runDialog(STORY.intro);
  
  state = 'transition';
  if (AM) AM.transitionWhoosh('gokturk');
  
  const w = $('#wipe');
  w.style.background = `linear-gradient(105deg, #D4821A 0%, #2C1810 55%, #2C1810 100%)`;
  w.classList.add('cover');
  
  setTimeout(() => {
    $('#intro').classList.add('hide');
    const hasVideo = !!ERA_VIDEOS[0];
    applyEra(0, hasVideo);
    randomizePos();
    w.classList.add('reveal');
  }, 1000);
  
  setTimeout(async () => {
    w.classList.remove('cover', 'reveal');
    await playEraVideo(0);
    state = 'arrival';
    await runDialog(CH().arrival);
    enterPlay();
  }, 2000);
}

/* ================== FİNAL ================== */
async function finale() {
  state = 'finale';
  if (AM) AM.stopMusic();
  // Işık'ın vedası — fısıltı
  await sayLine(STORY.finale.farewell);
  await wait(fast ? 100 : 900);
  hidePorts(); $('#dialog').classList.remove('open');
  ZGAnim.dissolve('light');
  if (AM) AM.compassIntro();
  $('#finale').classList.add('open');
  // hatıralar tek tek belirir
  const fks = document.querySelectorAll('#finKeepsakes .fk');
  for (let i = 0; i < fks.length; i++) {
    await wait(fast ? 80 : 800);
    fks[i].classList.add('show');
    if (AM) AM.sfx('chime', i);
  }
  await wait(fast ? 100 : 600);
  await runDialog([STORY.finale.lines[0]]);
  $('#finEngraving').classList.add('show');             // O.D. 1957
  await runDialog(STORY.finale.lines.slice(1));
  await typeText($('#finTitle'), '“' + STORY.finale.title + '”', fast ? 2 : 60);
  if (AM) AM.sfx('fanfare');
  $('#finRestart').classList.add('show');
}

/* ================== KLAVYE ================== */
addEventListener('keydown', e => {
  if (AM) AM.init();
  lastInput = performance.now();
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();

  if (k === 'm' || k === 'M') { if (AM) { const m = AM.toggleMute(); showToast(m ? 'Ses kapatıldı' : 'Ses açıldı'); } return; }
  if (k === 'h' || k === 'H') { $('#help').classList.toggle('open'); return; }
  if (k === 'Escape') { $('#help').classList.remove('open'); return; }
  if ($('#help').classList.contains('open')) return;

  if (k === 'Enter') {
    if (state === 'intro-ready') return endIntro();
    if (state === 'intro' || state === 'arrival' || state === 'success' || state === 'finale' || state === 'room') {
      skipRequest = true;                       // yazıyı tamamla / satırı geç
      try { speechSynthesis.cancel(); } catch (err) {}
      if (advanceResolve) advanceResolve();
      if (state === 'finale' && $('#finRestart').classList.contains('show')) location.reload();
      return;
    }
    if (state === 'celebrate') return afterCelebrate();
    if (state === 'video' && videoSkipResolve) return videoSkipResolve();
    return;
  }
  if (state === 'celebrate' && k === 'ArrowRight') return afterCelebrate();
  if (state !== 'play') return;

  if (k >= '1' && k <= '4') { selectEnc(+k - 1, true); if (AM) AM.sfx('select'); }
  // Klavye = 1 ham adım (18°): fiziksel encoder tıkıyla birebir
  else if (k === 'ArrowLeft')  applyCount(active, counts[active] - 1);
  else if (k === 'ArrowRight') applyCount(active, counts[active] + 1);
  else if (k === ' ') check();
  else if (k === 'r' || k === 'R') { randomizePos(); wrongCount = 0; showToast('Bölüm sıfırlandı'); }
  else if (k === 'n' || k === 'N') transitionTo((chapter + 1) % 4);
});

/* Kiosk: 120 sn etkileşimsizlikte baştan başla */
ZGAnim.onTick(() => {
  if ((state === 'play' || state === 'intro-ready') && performance.now() - lastInput > 120000)
    location.reload();
});

/* ================== BAŞLAT ================== */
if (AM) AM.init();   // Electron'da autoplay serbest; tarayıcıda ilk tuşta tekrar denenir
buildSlots();
ZGAnim.init({
  bgCanvas: $('#bgCanvas'), fxCanvas: $('#fxCanvas'),
  fpsEl: $('#fps'), rainLayer: $('#rainLayer'),
});
ZGAnim.setEra('gokturk');
runIntro();

/* Test/otomasyon kancası */
window.ZG = {
  state: () => state,
  chapter: () => chapter,
  pos: () => pos.slice(),
  rot: () => needleAngle.slice(),
  counts: () => counts.slice(),
  wrongs: () => wrongCount,
  solve() { const c = code(); for (let i = 0; i < 4; i++) applyCount(i, c[i] * PER, true); },
  check, clue: i => showHint(i),
  start: endIntro,
  next: () => afterCelebrate(),
  setFast(v) { fast = v; },
  am: AM,
  input: encoderInput,
};
})();
