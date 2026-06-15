/* ============================================================
   ZAMAN GEZGİNİ — AudioManager
   Tamamı Web Audio sentezi: dönem müzikleri, ortam yatakları,
   efektler ve Web Speech API ile karakter seslendirme.
   Karakter profilleri hikaye-rehberi.md (Agent 1) ile uyumludur.
   ============================================================ */
(function () {
'use strict';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.era = null;
    this._voice = null;
    this._speaking = false;
    this._muted = false;
    this._shimmerTimer = null;

    /* Ses profilleri — pitch sırası (bilgeler): bekci < suleyman < mahmud < yusufbey
       ("geçmişe gidildikçe ses derinleşir" kuralı). Web Speech kısıtları:
       reverb/telefon filtresi OS sesine uygulanamaz; Işık için reverb hissi
       konuşma sırasında çalan parıltı çanlarıyla (shimmer) verilir. */
    this.CHARACTERS = {
      alp:      { ad: 'Alp',            pitch: 1.4,  rate: 1.15,
                  desc: 'Meraklı, aceleci; bölümler ilerledikçe yavaşlamayı öğrenir',
                  sample: 'Tamam tamam, bakıyorum! Bu taştaki şey az önce kıpırdadı mı?' },
      isik:     { ad: 'Işık',           pitch: 2.0,  rate: 1.2,  shimmer: true,
                  desc: 'En tiz, robotik ama sıcak; asla cevabı söylemez',
                  sample: 'Bunu sana söyleyemem çünküüü… kural! Ama Kür’e sorsan? O bilir.' },
      kur:      { ad: 'Kür',            pitch: 1.0,  rate: 0.85,
                  desc: 'Tok, kendinden emin bozkır çocuğu; kısa kesin cümleler',
                  sample: 'Rüzgârı dinle, kardeş. Bozkır konuşur. Acele eden duymaz.' },
      bekci:    { ad: 'Yazıt Bekçisi',  pitch: 0.5,  rate: 0.65, pauses: true, pauseMs: 750,
                  desc: 'En derin ses; her cümle öncesi nefes, uzun duraklamalar',
                  sample: 'Taşa kazınan söz… rüzgârdan uzun yaşar, evlat.' },
      omer:     { ad: 'Ömer',           pitch: 1.5,  rate: 1.2,
                  desc: 'Hızlı, dalgalı; yalnız gerginken kekeler',
                  sample: 'Bu çini… ş-şey… ustam görmesin, daha cilası bitmedi!' },
      mahmud:   { ad: 'Usta Mahmud',    pitch: 0.8,  rate: 0.9,
                  desc: 'Sabırlı usta; açıklarken sesi alçalır',
                  sample: 'Yaklaş, evladım. Bak şimdi… her desenin içinde bir hesap gizlidir.' },
      murat:    { ad: 'Murat',          pitch: 1.3,  rate: 1.0,
                  desc: 'Endişeli ama zeki; formal konuşur, top sesinde duraklar',
                  sample: 'Efendim, ben… ben bu kıvrımları tanıyorum. Babamın elinden.' },
      suleyman: { ad: 'Kâtip Süleyman', pitch: 0.7,  rate: 0.8,  pauses: true, pauseMs: 300,
                  desc: 'Resmî, vurgulu; her cümle net başlar net biter',
                  sample: 'Kayıt tamamdır. Şimdi. Mührü yerleştiriniz. Acelesiz.' },
      efe:      { ad: 'Efe',            pitch: 1.7,  rate: 1.35,
                  desc: 'En tiz, en hızlı, coşkulu Ankara çocuğu',
                  sample: 'Tıkır tıkır tıkır! Duyuyon mu? Ankara’nın sesi bu, gardaş!' },
      yusufbey: { ad: 'Yusuf Bey',      pitch: 0.9,  rate: 0.95,
                  desc: 'Sakin, güven veren memur; kritik cümlede yarım ton düşer',
                  sample: 'Sakin olun evlatlar. Bu makine sabırlıdır. Doğru mesajı bekler.' },
      dede:     { ad: 'Osman Dede',     pitch: 0.75, rate: 0.85,
                  desc: 'Pes, sıcak, muzip (kapanış telefonu; gerçek üründe telefon filtresi kayıtla yapılır)',
                  sample: 'Pusulayı buldun demek… Söyle bakalım, benim Işık hâlâ o kadar geveze mi?' },
    };

    this.SCALES = {
      gokturk:    [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66], // La pentatonik
      selcuklu:   [146.83, 155.56, 185, 196, 220, 233.08, 261.63],          // Re hicaz
      osmanli:    [98, 103.83, 123.47, 130.81, 146.83],
      cumhuriyet: [523.25, 587.33, 659.25, 783.99, 880],                    // melodi (Do pent.)
    };
    this.CHORDS = [ // Cumhuriyet: C – G – Am – F (umut dolu döngü)
      [130.81, 164.81, 196, 261.63],
      [196, 246.94, 293.66, 392],
      [110, 130.81, 164.81, 220],
      [174.61, 220, 261.63, 349.23],
    ];
    this.STEP = { gokturk: .326, selcuklu: .395, osmanli: .288, cumhuriyet: .357 };
  }

  /* ------------------------- KURULUM ------------------------- */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const ctx = this.ctx = new AudioContext();
      // gürültü tamponu (2 sn, loop'lanabilir)
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      /* DİKKAT: Chrome'un DynamicsCompressor'ı otomatik makeup gain uygular —
         agresif eşik/oran tüm miksi YÜKSELTİR. Bu yüzden yalnız yumuşak bir
         güvenlik limiteri kullanıyoruz (makeup ≈ +2.9 dB, kabul edilebilir). */
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -3; lim.ratio.value = 20; lim.knee.value = 0;
      lim.attack.value = 0.002; lim.release.value = 0.1;
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 1024;
      this.master.connect(lim); lim.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      this.musicBus = ctx.createGain(); this.musicBus.gain.value = 1;
      this.ambBus   = ctx.createGain(); this.ambBus.gain.value = 1;
      this.sfxBus   = ctx.createGain(); this.sfxBus.gain.value = 1;
      this.musicBus.connect(this.master);
      this.ambBus.connect(this.master);
      this.sfxBus.connect(this.master);

      // reverb (üretilmiş impulse, 1.8 sn) — yalnız send üzerinden
      const ir = ctx.createBuffer(2, ctx.sampleRate * 1.8, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const ch = ir.getChannelData(c);
        for (let i = 0; i < ch.length; i++)
          ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.4);
      }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      this.reverb = ctx.createGain(); this.reverb.gain.value = 0.5;
      this.reverb.connect(conv); conv.connect(this.master);

      this._loadVoices();
    } catch (e) { this.ctx = null; }
  }
  _loadVoices() {
    const pick = () => {
      const vs = speechSynthesis.getVoices();
      this._voices = vs;
      this._voice = vs.find(v => v.lang && v.lang.toLowerCase().startsWith('tr')) || null;
    };
    if ('speechSynthesis' in window) {
      pick();
      speechSynthesis.addEventListener('voiceschanged', pick);
    }
  }
  setMaster(v) { if (this.master) this.master.gain.value = v; }
  toggleMute() {
    if (!this.master) return;
    this._muted = !this._muted;
    this.master.gain.value = this._muted ? 0 : 0.9;
    return this._muted;
  }
  level() { // 0..1 arası kabaca RMS — test ve VU metre için
    if (!this.analyser) return 0;
    const a = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(a);
    let s = 0;
    for (let i = 0; i < a.length; i++) { const x = (a[i] - 128) / 128; s += x * x; }
    return Math.sqrt(s / a.length);
  }
  isSpeaking() { return this._speaking; }

  /* --------------------- SENTEZ YARDIMCILARI --------------------- */
  _osc(o) { // {f, f2, dur, type, vol, at, dest, attack, vib}
    const ctx = this.ctx; if (!ctx) return;
    const t = o.at || ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(osc.frequency); l.start(t + (o.vib[2] || 0)); l.stop(t + o.dur + .1);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.attack || .008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.dest || this.sfxBus);
    if (o.rev) g.connect(this.reverb);
    osc.start(t); osc.stop(t + o.dur + .1);
  }
  _noise(o) { // {dur, vol, at, ftype, ffreq, fto, q, dest, attack}
    const ctx = this.ctx; if (!ctx) return;
    const t = o.at || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.ftype || 'lowpass'; f.frequency.setValueAtTime(o.ffreq || 1000, t);
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.attack || .01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(o.dest || this.sfxBus);
    if (o.rev) g.connect(this.reverb);
    s.start(t); s.stop(t + o.dur + .1);
  }
  _pluck(freq, o = {}) { // Karplus-Strong: kopuz/ud teli
    const ctx = this.ctx; if (!ctx) return;
    const t = o.at || ctx.currentTime;
    const dl = ctx.createDelay(0.05); dl.delayTime.value = 1 / freq;
    /* KRİTİK: lowpass biquad'da Q DESİBEL cinsindendir (Web Audio spec).
       Pozitif Q = rezonans tepesi = geri besleme döngüsü kararsızlaşır ve
       tel modeli kendi kendine osilasyona kaçar. -6 dB tepeyi bastırır. */
    const fb = ctx.createGain(); fb.gain.value = Math.min(o.damp || 0.96, 0.968);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.bright || 3800;
    lp.Q.value = -6;
    const out = ctx.createGain(); out.gain.value = o.vol || .3;
    const burst = ctx.createBufferSource(); burst.buffer = this.noiseBuf;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(.9, t); bg.gain.exponentialRampToValueAtTime(.001, t + .02);
    burst.connect(bg); bg.connect(dl);
    dl.connect(lp); lp.connect(fb); fb.connect(dl);
    lp.connect(out); out.connect(o.dest || this.musicBus);
    burst.start(t); burst.stop(t + .03);
    setTimeout(() => { try { fb.gain.value = 0; out.disconnect(); } catch (e) {} }, 3500);
  }
  _drum(kind, at, dest, vol = 1) {
    if (kind === 'dum') { // mehter/şaman davulu gövdesi
      this._osc({ f: 75, f2: 46, dur: .28, type: 'sine', vol: .5 * vol, at, dest });
      this._noise({ dur: .12, vol: .2 * vol, at, ffreq: 220, dest });
    } else if (kind === 'tek') {
      this._noise({ dur: .07, vol: .28 * vol, at, ftype: 'bandpass', ffreq: 1900, q: 1.4, dest });
      this._osc({ f: 240, dur: .05, type: 'sine', vol: .12 * vol, at, dest });
    } else if (kind === 'zil') {
      this._noise({ dur: .5, vol: .07 * vol, at, ftype: 'highpass', ffreq: 6200, dest, rev: true });
      this._osc({ f: 3135, dur: .25, type: 'square', vol: .03 * vol, at, dest, rev: true });
      this._osc({ f: 4699, dur: .22, type: 'square', vol: .02 * vol, at: at + .01, dest, rev: true });
    }
  }
  _piano(f, at, dest, vol = .12) {
    this._osc({ f, dur: 1.9, type: 'triangle', vol, at, dest, attack: .006 });
    this._osc({ f: f * 2, dur: 1.4, type: 'sine', vol: vol * .35, at, dest });
    this._osc({ f: f * 3, dur: .8, type: 'sine', vol: vol * .12, at, dest });
  }
  _ney(f, at, dur, dest, vol = .07) {
    this._osc({ f, dur, type: 'sine', vol, at, dest, attack: .3, vib: [5, 4, .35], rev: true });
    this._noise({ dur, vol: vol * .45, at, ftype: 'bandpass', ffreq: f * 2, q: 2.5, dest, attack: .3 });
  }
  _pad(fs, at, dur, dest, vol = .028) {
    fs.forEach(f => {
      this._osc({ f: f * 0.997, dur, type: 'sawtooth', vol, at, dest, attack: .9 });
      this._osc({ f: f * 1.003, dur, type: 'sawtooth', vol, at, dest, attack: .9 });
    });
  }
  _bedNoise(era, { ffreq, ftype, q, vol, lfoHz, lfoDepth }) { // sürekli ortam yatağı
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = ffreq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.value = vol;
    if (lfoHz) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = lfoHz; lg.gain.value = lfoDepth || vol * .5;
      l.connect(lg); lg.connect(g.gain); l.start();
      era.stops.push(() => { try { l.stop(); } catch (e) {} });
    }
    s.connect(f); f.connect(g); g.connect(era.amb);
    s.start();
    era.stops.push(() => { try { s.stop(); } catch (e) {} });
  }

  /* ----------------------- DÖNEM MÜZİĞİ ----------------------- */
  playEra(key) {
    if (!this.ctx) return;
    if (this.era && this.era.key === key) return;
    if (this.era) this._stopEra(this.era, 1.8);   // crossfade: eski söner...
    this.era = this._startEra(key);               // ...yenisi 2 sn'de yükselir
  }
  stopMusic() { if (this.era) { this._stopEra(this.era, 1.2); this.era = null; } }
  _startEra(key) {
    const ctx = this.ctx, t = ctx.currentTime;
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, t);
    bus.gain.linearRampToValueAtTime(1, t + 2); bus.connect(this.musicBus);
    const amb = ctx.createGain(); amb.gain.setValueAtTime(0.0001, t);
    amb.gain.linearRampToValueAtTime(1, t + 2); amb.connect(this.ambBus);
    const era = { key, bus, amb, stops: [], step: 0, nextT: t + .1, lastNote: 2 };
    this._bed(era);
    era.timer = setInterval(() => this._schedule(era), 30);
    return era;
  }
  _stopEra(era, fade) {
    clearInterval(era.timer);
    const t = this.ctx.currentTime;
    era.bus.gain.cancelScheduledValues(t);
    era.bus.gain.setValueAtTime(era.bus.gain.value, t);
    era.bus.gain.linearRampToValueAtTime(0.0001, t + fade);
    era.amb.gain.cancelScheduledValues(t);
    era.amb.gain.setValueAtTime(era.amb.gain.value, t);
    era.amb.gain.linearRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => {
      era.stops.forEach(fn => fn());
      try { era.bus.disconnect(); era.amb.disconnect(); } catch (e) {}
    }, fade * 1000 + 250);
  }
  _schedule(era) {
    const ahead = this.ctx.currentTime + 0.15, dt = this.STEP[era.key];
    while (era.nextT < ahead) {
      this._step(era, era.step, era.nextT);
      era.step++; era.nextT += dt;
    }
  }
  _bed(era) {
    switch (era.key) {
      case 'gokturk':   // bozkır rüzgârı
        this._bedNoise(era, { ffreq: 320, vol: .07, lfoHz: .07, lfoDepth: .045 }); break;
      case 'selcuklu':  // avlu çeşmesi
        this._bedNoise(era, { ffreq: 2600, ftype: 'bandpass', q: 1.2, vol: .016 }); break;
      case 'osmanli': { // kalabalık uğultusu + gerilim dronu
        this._bedNoise(era, { ffreq: 260, ftype: 'bandpass', q: .7, vol: .04, lfoHz: .09, lfoDepth: .018 });
        const t = this.ctx.currentTime;
        [98, 98.6].forEach(f => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain(),
                lp = this.ctx.createBiquadFilter();
          o.type = 'sawtooth'; o.frequency.value = f;
          lp.type = 'lowpass'; lp.frequency.value = 240;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + 3);
          o.connect(lp); lp.connect(g); g.connect(era.bus); o.start();
          era.stops.push(() => { try { o.stop(); } catch (e) {} });
        });
        break;
      }
      case 'cumhuriyet': // hafif sabah esintisi
        this._bedNoise(era, { ffreq: 700, vol: .012 }); break;
    }
  }
  _step(era, k, t) {
    const R = Math.random, sc = this.SCALES[era.key], bus = era.bus, amb = era.amb;
    if (era.key === 'gokturk') {
      const pat = [1, 0, 0, 2, 1, 1, 0, 2][k % 8];
      if (pat === 1) this._drum('dum', t, bus, .8);
      if (pat === 2) this._drum('tek', t, bus, .7);
      if (k % 2 === 0 && R() < .65) { // kopuz gezintisi
        era.lastNote = Math.max(0, Math.min(sc.length - 1, era.lastNote + (R() < .5 ? -1 : 1)));
        this._pluck(sc[era.lastNote], { at: t, vol: .22, bright: 4200, damp: .965, dest: bus });
      }
      if (k % 32 === 0) this._pluck(sc[0], { at: t, vol: .3, bright: 3000, damp: .975, dest: bus });
    } else if (era.key === 'selcuklu') {
      const idx = [0, 2, 4, 2, 5, 4, 2, 1][k % 8];          // ud arpeji (hicaz)
      this._pluck(sc[idx], { at: t, vol: .2, bright: 2400, damp: .958, dest: bus });
      if (k % 32 === 8) this._ney(sc[2 + Math.floor(R() * 3)] * 2, t, this.STEP.selcuklu * 10, bus, .05);
      if (R() < .12) this._osc({ f: 1800 + R() * 1600, dur: .12, type: 'sine', vol: .015, at: t, dest: amb }); // damla
      if (R() < .06) this._noise({ dur: .05, vol: .04, at: t, ftype: 'highpass', ffreq: 2600, dest: amb });   // taş yontma
    } else if (era.key === 'osmanli') {
      const pat = [1, 0, 2, 0, 1, 1, 2, 0][k % 8];          // mehter iskeleti
      if (pat === 1) this._drum('dum', t, bus, 1);
      if (pat === 2) this._drum('tek', t, bus, .8);
      if (k % 16 === 14) this._drum('zil', t, bus, .8);
      if (k % 64 === 32) this._pluck(sc[1 + Math.floor(R() * 3)], { at: t, vol: .15, bright: 2000, damp: .97, dest: bus });
      if (R() < .3) this._noise({ dur: .03, vol: .012, at: t, ftype: 'highpass', ffreq: 4200, dest: amb });   // meşale çıtırtısı
    } else if (era.key === 'cumhuriyet') {
      if (k % 16 === 0) {                                   // piyano akoru + yaylı pad
        const ch = this.CHORDS[(k / 16) % 4 | 0];
        ch.forEach((f, i) => this._piano(f, t + i * .03, bus, .09));
        this._pad(ch.slice(0, 3), t, this.STEP.cumhuriyet * 16, bus);
      }
      if (k % 4 === 2 && R() < .6)                          // umutlu melodi
        this._piano(sc[Math.floor(R() * sc.length)], t, bus, .05);
      if ((k % 64) < 8 && k % 2 === 0)                      // telgraf ritmi
        this._osc({ f: 2100, dur: .02, type: 'square', vol: .025, at: t, dest: amb });
      if (R() < .025) this.sfx('bird', 0, t);               // dışarıda kuşlar
    }
  }

  /* ------------------------- EFEKTLER ------------------------- */
  sfx(name, i = 0, at) {
    if (!this.ctx) return;
    const t = at || this.ctx.currentTime, R = Math.random;
    switch (name) {
      case 'encoder': // mekanik tık + minik swoosh (sembol değişimi)
        this._osc({ f: 620 + i * 70, dur: .05, type: 'square', vol: .035, at: t });
        this._noise({ dur: .12, vol: .04, at: t, ftype: 'bandpass', ffreq: 900, fto: 2400, q: 2 });
        break;
      case 'select':
        this._osc({ f: 330, dur: .07, type: 'sine', vol: .05, at: t }); break;
      case 'correct':
        this._osc({ f: 660, dur: .12, type: 'triangle', vol: .06, at: t });
        this._osc({ f: 880, dur: .2, type: 'triangle', vol: .06, at: t + .09, rev: true });
        this._osc({ f: 2637, dur: .25, type: 'sine', vol: .018, at: t + .12, rev: true });
        break;
      case 'wrong':
        this._osc({ f: 150, f2: 110, dur: .22, type: 'sawtooth', vol: .06, at: t });
        this._noise({ dur: .16, vol: .04, at: t, ffreq: 380 });
        break;
      case 'clank':
        this._osc({ f: 320, dur: .07, type: 'square', vol: .08, at: t });
        this._noise({ dur: .1, vol: .07, at: t, ftype: 'highpass', ffreq: 1800 });
        break;
      case 'chime':
        this._osc({ f: [523.25, 587.33, 659.25, 783.99][i % 4], dur: 1,
          type: 'sine', vol: .07, at: t, rev: true });
        break;
      case 'cannon':
        this._noise({ dur: 1.2, vol: .32, at: t, ffreq: 110 });
        this._osc({ f: 46, dur: .9, type: 'sine', vol: .24, at: t });
        this._noise({ dur: .8, vol: .05, at: t + .05, ffreq: 500, rev: true });
        break;
      case 'bird':
        this._osc({ f: 2700, f2: 3400, dur: .07, type: 'sine', vol: .018, at: t });
        this._osc({ f: 3100, f2: 2500, dur: .06, type: 'sine', vol: .015, at: t + .12 });
        break;
      case 'type':
        this._osc({ f: 1050, dur: .015, type: 'square', vol: .01, at: t }); break;
      case 'fanfare':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, n) =>
          this._osc({ f, dur: .35, type: 'triangle', vol: .07, at: t + n * .13, rev: true }));
        break;
    }
  }

  /* Kilit açılma müziği (5 sn) — demo.html'in sekans zamanlamasıyla hizalı:
     0-1.2 yuva çanları oyun tarafından (sfx chime) · 1.2-2.8 yükseliş ·
     2.8 patlama · 3.5 çözülüş arpeji · 5.0 final */
  unlockSequence() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise({ dur: 1.6, vol: .16, at: t + 1.2, ftype: 'bandpass', ffreq: 300, fto: 3500, q: 1.5, attack: 1.2 });
    this._osc({ f: 80, f2: 34, dur: .5, type: 'sine', vol: .28, at: t + 2.5 });
    this._noise({ dur: .9, vol: .22, at: t + 2.8, ffreq: 140 });                       // darbe
    this._noise({ dur: .8, vol: .15, at: t + 2.8, ftype: 'highpass', ffreq: 5000, rev: true }); // parıltı
    [523.25, 659.25, 783.99, 1046.5].forEach((f, n) =>
      this._osc({ f, dur: .6, type: 'sine', vol: .06, at: t + 3.5 + n * .12, rev: true }));
    this._pad([130.81, 196, 329.63], t + 3.5, 2.4, this.sfxBus, .03);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, n) =>
      this._osc({ f, dur: .4, type: 'triangle', vol: .065, at: t + 5 + n * .13, rev: true }));
    for (let n = 0; n < 6; n++)
      this._osc({ f: 1568 + Math.random() * 1200, dur: .4, type: 'sine', vol: .015,
        at: t + 5.2 + Math.random() * .9, rev: true });
  }

  /* Dönem geçişi: whoosh + yeni dönemin imza sesi */
  transitionWhoosh(nextKey) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise({ dur: .9, vol: .2, at: t, ftype: 'bandpass', ffreq: 400, fto: 3800, q: 1.2, attack: .3 });
    const sig = t + .85;
    if (nextKey === 'gokturk') {
      this._pluck(110, { at: sig, vol: .35, bright: 4200, dest: this.sfxBus });
      this._pluck(164.81, { at: sig + .12, vol: .28, bright: 4200, dest: this.sfxBus });
    } else if (nextKey === 'selcuklu') this._ney(293.66, sig, 1.4, this.sfxBus, .07);
    else if (nextKey === 'osmanli') { this._drum('dum', sig, this.sfxBus); this._drum('zil', sig + .15, this.sfxBus, .7); }
    else if (nextKey === 'cumhuriyet') [261.63, 329.63, 392].forEach((f, n) => this._piano(f, sig + n * .04, this.sfxBus, .1));
  }

  /* Pusula aktivasyonu (açılış) */
  compassIntro() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc({ f: 55, dur: 2.4, type: 'sine', vol: .07, at: t, attack: 1 });
    this._osc({ f: 82.41, dur: 2.4, type: 'sine', vol: .05, at: t, attack: 1.2 });
    this._noise({ dur: 2, vol: .05, at: t + .2, ftype: 'bandpass', ffreq: 600, fto: 2600, q: 3, attack: .8, rev: true });
    this._osc({ f: 1568, dur: .8, type: 'sine', vol: .04, at: t + 2.1, rev: true });
  }

  /* ----------------------- SESLENDİRME -----------------------
     Web Speech API. Müzik/ortam konuşma sırasında %60 kısılır
     (ducking). Işık konuşurken reverb'li parıltı çanları çalar. */
  speak(charId, text) {
    return new Promise(res => {
      if (!('speechSynthesis' in window)) return res();
      const p = this.CHARACTERS[charId] || { pitch: 1, rate: 1 };
      try { speechSynthesis.cancel(); } catch (e) {}
      const chunks = p.pauses
        ? text.split(/(?<=[.!?…])\s+|…\s*/).filter(s => s.trim())
        : [text];
      this._speaking = true;
      this._duck(true);
      if (p.shimmer) this._startShimmer();
      let i = 0;
      const fin = () => {
        this._speaking = false; this._duck(false); this._stopShimmer(); res();
      };
      const next = () => {
        if (i >= chunks.length) return fin();
        const u = new SpeechSynthesisUtterance(chunks[i++]);
        u.lang = 'tr-TR';
        if (this._voice) u.voice = this._voice;
        u.pitch = p.pitch; u.rate = p.rate; u.volume = this._muted ? 0 : 1;
        u.onend = () => setTimeout(next, p.pauseMs || 60);
        u.onerror = () => setTimeout(next, 80);
        speechSynthesis.speak(u);
      };
      next();
      setTimeout(() => { if (this._speaking) fin(); }, 25000); // güvenlik ağı
    });
  }
  _duck(on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, v = on ? 0.4 : 1;
    [this.musicBus, this.ambBus].forEach(b => {
      b.gain.cancelScheduledValues(t);
      b.gain.setValueAtTime(b.gain.value, t);
      b.gain.linearRampToValueAtTime(v, t + (on ? .25 : .7));
    });
  }
  _startShimmer() {
    this._stopShimmer();
    const notes = [1568, 1760, 2093, 2349];
    this._shimmerTimer = setInterval(() => {
      if (!this.ctx) return;
      this._osc({ f: notes[Math.floor(Math.random() * 4)], dur: .5,
        type: 'sine', vol: .013, rev: true });
    }, 280);
  }
  _stopShimmer() { clearInterval(this._shimmerTimer); this._shimmerTimer = null; }

  voiceInfo() {
    const vs = this._voices || [];
    return {
      total: vs.length,
      turkish: vs.filter(v => v.lang && v.lang.toLowerCase().startsWith('tr'))
                 .map(v => v.name + ' (' + v.lang + ')'),
      selected: this._voice ? this._voice.name : null,
    };
  }
}

window.AudioManager = AudioManager;
})();
