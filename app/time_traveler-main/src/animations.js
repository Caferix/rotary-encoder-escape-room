/* ============================================================
   ZGAnim — animasyon motoru (Animation Agent)
   Canvas partikül sistemi (dönem arka planları + geçiş çözülmeleri),
   sembol yağmuru, kayan yıldız, ışık halkası, FPS sayacı.
   CSS animasyonları styles/*.css içindedir; bu modül canvas ve
   DOM tabanlı dinamik efektleri yönetir.
   ============================================================ */
(function () {
'use strict';

let bgC, bgX, fxC, fxX, fpsEl, rainLayer;
let W = 0, H = 0;
let eraKey = 'gokturk';
const bgParts = [], fxParts = [];
let lastT = performance.now(), frames = 0, fpsAt = lastT;
let tickCb = null;

function resize() {
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = innerWidth; H = innerHeight;
  for (const c of [bgC, fxC]) {
    if (!c) continue;
    c.width = W * DPR; c.height = H * DPR;
    c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}

/* ------------------ dönem arka plan partikülleri ------------------ */
function seedBg() {
  bgParts.length = 0;
  if (eraKey === 'gokturk')
    for (let i = 0; i < 110; i++) bgParts.push({ t: 'star', x: Math.random() * W, y: Math.random() * H * .62,
      r: .5 + Math.random() * 1.4, ph: Math.random() * 7, vx: -(1.5 + Math.random() * 2) });
}
function spawnBg(dt) {
  const R = Math.random;
  if (eraKey === 'gokturk') {
    if (bgParts.filter(p => p.t === 'dust').length < 70 && R() < dt * 28)
      bgParts.push({ t: 'dust', x: W + 12, y: H * (.4 + R() * .6), len: 8 + R() * 20,
        vx: -(150 + R() * 230), vy: (R() - .5) * 22, a: .12 + R() * .26, life: 0, max: 9 });
  } else if (eraKey === 'selcuklu') {
    if (R() < dt * 9)
      bgParts.push({ t: 'spark', x: R() * W, y: R() * H, life: 0, max: .9 + R() * .9,
        s: 5 + R() * 16, c: R() < .5 ? '26,188,156' : '243,156,18' });
  } else if (eraKey === 'osmanli') {
    if (bgParts.filter(p => p.t === 'smoke').length < 26 && R() < dt * 5)
      bgParts.push({ t: 'smoke', x: W * (.3 + R() * .8), y: H * (.2 + R() * .65), r: 26 + R() * 54,
        vx: -(13 + R() * 22), vy: -(3 + R() * 7), a: .04 + R() * .07, life: 0, max: 9 });
    if (bgParts.filter(p => p.t === 'ember').length < 40 && R() < dt * 26) {
      const side = R() < .5;
      bgParts.push({ t: 'ember', x: side ? R() * W * .16 : W - R() * W * .16, y: H * (.3 + R() * .7),
        vx: (R() - .5) * 18, vy: -(26 + R() * 48), r: 1 + R() * 2, life: 0, max: 2.4, ph: R() * 7 });
    }
  } else {
    if (bgParts.filter(p => p.t === 'leaf').length < 14 && R() < dt * 1.8)
      bgParts.push({ t: 'leaf', x: -24, y: R() * H * .5, vx: 34 + R() * 44, vy: 18 + R() * 24,
        rot: R() * 7, vr: (R() - .5) * 3, s: 7 + R() * 8, ph: R() * 7, life: 0, max: 30 });
    if (bgParts.filter(p => p.t === 'mote').length < 24 && R() < dt * 8)
      bgParts.push({ t: 'mote', x: R() * W, y: R() * H, r: 1 + R() * 2, life: 0, max: 3 + R() * 2, ph: R() * 7 });
  }
}
function drawBg(dt, t) {
  bgX.clearRect(0, 0, W, H);
  spawnBg(dt);
  for (let i = bgParts.length - 1; i >= 0; i--) {
    const p = bgParts[i];
    p.life = (p.life || 0) + dt;
    p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
    let dead = p.life > (p.max || 1e9) || p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80;
    switch (p.t) {
      case 'star': {
        if (p.x < -5) p.x = W + 5;
        const a = .35 + .55 * Math.abs(Math.sin(t * .0012 + p.ph));
        bgX.fillStyle = `rgba(245,233,200,${a})`;
        bgX.beginPath(); bgX.arc(p.x, p.y, p.r, 0, 7); bgX.fill();
        dead = false; break;
      }
      case 'dust':
        bgX.strokeStyle = `rgba(229,193,133,${p.a})`; bgX.lineWidth = 1.2;
        bgX.beginPath(); bgX.moveTo(p.x, p.y); bgX.lineTo(p.x + p.len, p.y + p.len * .08); bgX.stroke();
        break;
      case 'spark': {
        const k = Math.sin(Math.PI * Math.min(1, p.life / p.max));
        bgX.strokeStyle = `rgba(${p.c},${.85 * k})`; bgX.lineWidth = 1.4;
        const s = p.s * k;
        bgX.beginPath();
        bgX.moveTo(p.x - s, p.y); bgX.lineTo(p.x + s, p.y);
        bgX.moveTo(p.x, p.y - s); bgX.lineTo(p.x, p.y + s);
        bgX.stroke();
        bgX.fillStyle = `rgba(255,255,255,${.9 * k})`;
        bgX.beginPath(); bgX.arc(p.x, p.y, 1.6 * k, 0, 7); bgX.fill();
        break;
      }
      case 'smoke': {
        const k = Math.sin(Math.PI * Math.min(1, p.life / p.max));
        bgX.fillStyle = `rgba(150,110,100,${p.a * k})`;
        bgX.beginPath(); bgX.arc(p.x, p.y, p.r * (1 + p.life * .08), 0, 7); bgX.fill();
        break;
      }
      case 'ember': {
        const a = Math.max(0, 1 - p.life / p.max) * (.6 + .4 * Math.sin(t * .02 + p.ph));
        bgX.fillStyle = `rgba(255,160,60,${a})`;
        bgX.beginPath(); bgX.arc(p.x, p.y, p.r, 0, 7); bgX.fill();
        break;
      }
      case 'leaf': {
        p.rot += p.vr * dt; p.x += Math.sin(t * .001 + p.ph) * 22 * dt;
        bgX.save(); bgX.translate(p.x, p.y); bgX.rotate(p.rot);
        bgX.fillStyle = 'rgba(125,170,105,.8)';
        bgX.beginPath(); bgX.ellipse(0, 0, p.s, p.s * .42, 0, 0, 7); bgX.fill();
        bgX.restore();
        break;
      }
      case 'mote': {
        const k = Math.sin(Math.PI * Math.min(1, p.life / p.max));
        bgX.fillStyle = `rgba(255,250,230,${.35 * k})`;
        bgX.beginPath(); bgX.arc(p.x, p.y - p.life * 8, p.r, 0, 7); bgX.fill();
        break;
      }
    }
    if (dead) bgParts.splice(i, 1);
  }
}

/* --------------- geçiş çözülmesi: kum/çini/kâğıt/ışık --------------- */
const DISSOLVE_OF = { gokturk: 'sand', selcuklu: 'tile', osmanli: 'paper', cumhuriyet: 'light' };
function dissolve(kindOrEra) {
  const kind = DISSOLVE_OF[kindOrEra] || kindOrEra;
  const R = Math.random;
  const n = kind === 'paper' ? 150 : 240;
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * H;
    if (kind === 'sand')
      fxParts.push({ k: 'dot', x, y, vx: -(70 + R() * 220), vy: (R() - .5) * 70, g: 240, r: 1.5 + R() * 2.6,
        c: 'rgba(216,178,110,', life: 0, max: .9 + R() * .6 });
    else if (kind === 'tile')
      fxParts.push({ k: 'rect', x, y, vx: (R() - .5) * 180, vy: -40 - R() * 120, g: 560, s: 3 + R() * 7,
        rot: R() * 7, vr: (R() - .5) * 12, c: ['#1ABC9C', '#F39C12', '#11618f', '#eafaf6'][i % 4], life: 0, max: 1 + R() * .5 });
    else if (kind === 'paper')
      fxParts.push({ k: 'rect', x, y, vx: (R() - .5) * 60, vy: 30 + R() * 80, g: 30, s: 5 + R() * 8,
        rot: R() * 7, vr: (R() - .5) * 5, sway: R() * 7, c: '#e8dcc0', life: 0, max: 1.2 + R() * .6 });
    else {
      const a = R() * Math.PI * 2, sp = 120 + R() * 420;
      fxParts.push({ k: 'dot', x: W / 2 + (x - W / 2) * .3, y: H / 2 + (y - H / 2) * .3,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, r: 1.5 + R() * 2.4,
        c: 'rgba(255,236,170,', life: 0, max: .9 + R() * .7 });
    }
  }
}
function drawFx(dt) {
  fxX.clearRect(0, 0, W, H);
  for (let i = fxParts.length - 1; i >= 0; i--) {
    const p = fxParts[i];
    p.life += dt;
    if (p.life > p.max) { fxParts.splice(i, 1); continue; }
    p.vy += (p.g || 0) * dt;
    p.x += p.vx * dt + (p.sway ? Math.sin(p.life * 6 + p.sway) * 40 * dt : 0);
    p.y += p.vy * dt;
    const a = Math.max(0, 1 - p.life / p.max);
    if (p.k === 'dot') {
      fxX.fillStyle = p.c + a + ')';
      fxX.beginPath(); fxX.arc(p.x, p.y, p.r, 0, 7); fxX.fill();
    } else {
      p.rot += p.vr * dt;
      fxX.save(); fxX.translate(p.x, p.y); fxX.rotate(p.rot);
      fxX.globalAlpha = a; fxX.fillStyle = p.c;
      fxX.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.4);
      fxX.restore(); fxX.globalAlpha = 1;
    }
  }
}

/* ------------------------- DOM efektleri ------------------------- */
/* srcs: resim yolları (madalyon olarak yağar) */
function rain(srcs, colors) {
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('img');
    s.className = 'drop coin';
    s.src = srcs[i % srcs.length];
    const size = 3 + Math.random() * 4;
    s.style.cssText = `left:${Math.random() * 100}vw; width:${size}vh; height:${size}vh;` +
      `animation-duration:${2.8 + Math.random() * 2.4}s;` +
      `animation-delay:${Math.random() * 1.6}s; opacity:${.7 + Math.random() * .3};`;
    rainLayer.appendChild(s);
  }
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('div');
    d.className = 'conf drop';
    d.style.cssText = `left:${Math.random() * 100}vw; background:${colors[i % colors.length]};` +
      `animation-duration:${2.4 + Math.random() * 2}s; animation-delay:${Math.random() * 1.4}s;`;
    rainLayer.appendChild(d);
  }
  setTimeout(() => { rainLayer.innerHTML = ''; }, 7500);
}
function shootingStar() {
  const d = document.createElement('div');
  d.className = 'shoot';
  d.style.top = (8 + Math.random() * 12) + 'vh';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1600);
}
function ringAt(el, color) {
  const r = el.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fxring';
  d.style.left = (r.left + r.width / 2) + 'px';
  d.style.top = (r.top + r.height / 2) + 'px';
  d.style.borderColor = color || '#F5D76E';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900);
}

/* --------------------------- ana döngü --------------------------- */
function loop(t) {
  const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  drawBg(dt, t);
  drawFx(dt);
  frames++;
  if (t - fpsAt > 1000) {
    if (fpsEl) fpsEl.textContent = frames + ' fps';
    frames = 0; fpsAt = t;
  }
  if (tickCb) tickCb(t);
  requestAnimationFrame(loop);
}

window.ZGAnim = {
  init(opts) {
    bgC = opts.bgCanvas; bgX = bgC.getContext('2d');
    fxC = opts.fxCanvas; fxX = fxC.getContext('2d');
    fpsEl = opts.fpsEl || null;
    rainLayer = opts.rainLayer;
    addEventListener('resize', resize); resize();
    requestAnimationFrame(loop);
  },
  setEra(key) { eraKey = key; seedBg(); },
  onTick(cb) { tickCb = cb; },   // game.js attract-loop denetimi için
  dissolve, rain, shootingStar, ringAt,
};
})();
