/**
 * THE LIVING BROADSHEET — Phonograph Engine
 * Everything you hear is synthesised live with the Web Audio API:
 * no audio files, nothing to license, works offline.
 *
 *  • Music   — an original 3/4 parlour waltz voiced as a Victorian music box
 *              (A minor, 32 bars), with a soft string pad. A "tension" mode
 *              (low drone + heartbeat) takes over for the barge climax.
 *  • Ambience— "street" (fog wind, hansom-cab hooves, distant church bell),
 *              "opera" (hall murmur), "river" (Thames lapping, ship horns, creaks).
 *  • Bells   — the Westminster Quarters (1859) and Big Ben hour strikes.
 *  • Effects — paper rustle, wax-seal crack, page turn, typewriter, escapement
 *              ratchet, telegraph sounder, Kodak shutter & flash powder.
 */
class Phonograph {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.levels = { music: 0.55, amb: 0.5, sfx: 0.8 };
    this.musicMode = "off";
    this.ambMode = "off";
    this._timers = [];
  }

  /* ---------- boot (must be called from a user gesture) ---------- */
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
    } catch (e) {
      return false;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);

    this.bus = {};
    ["music", "amb", "sfx"].forEach((k) => {
      const g = c.createGain();
      g.gain.value = this.levels[k];
      g.connect(this.master);
      this.bus[k] = g;
    });

    // Hall reverb (generated impulse)
    this.reverb = c.createConvolver();
    this.reverb.buffer = this._impulse(3.2, 2.6);
    this.reverbOut = c.createGain();
    this.reverbOut.gain.value = 0.42;
    this.reverb.connect(this.reverbOut).connect(this.master);

    this.white = this._noise(2, "white");
    this.brown = this._noise(4, "brown");

    this._buildMusicScore();
    this._scheduler = setInterval(() => this._tick(), 40);
    return true;
  }

  _impulse(seconds, decay) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  _noise(seconds, type) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return buf;
  }

  /* ---------- mixer ---------- */
  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.15);
  }
  setLevel(k, v) {
    this.levels[k] = v;
    if (!this.ctx) return;
    this.bus[k].gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  /* ---------- helpers ---------- */
  _env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  _mtof(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  _noiseSrc(buf, rate = 1) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf || this.white;
    s.playbackRate.value = rate;
    return s;
  }

  /* ===================================================================
     MUSIC — original parlour waltz for music box
     =================================================================== */
  _buildMusicScore() {
    // [beatLength, midi] per bar (3 beats). 0 = rest. Original composition.
    const A = [
      [[2, 76], [1, 69]],
      [[1, 72], [1, 71], [1, 69]],
      [[2, 77], [1, 74]],
      [[3, 76]],
      [[1.5, 81], [0.5, 80], [1, 81]],
      [[2, 84], [1, 81]],
      [[1, 80], [1, 77], [1, 74]],
      [[2, 76], [1, 71]],
    ];
    const B = [
      [[2, 79], [1, 76]],
      [[1, 74], [1, 71], [1, 79]],
      [[2, 84], [1, 81]],
      [[1, 83], [1, 80], [1, 76]],
      [[1, 81], [1, 77], [1, 72]],
      [[1, 74], [1, 77], [1, 81]],
      [[1.5, 80], [0.5, 83], [1, 80]],
      [[3, 81]],
    ];
    const chordsA = ["Am", "Am", "Dm", "E", "Am", "F", "E", "E"];
    const chordsB = ["C", "G", "Am", "E", "F", "Dm", "E", "Am"];
    const CH = {
      Am: [57, 60, 64], Dm: [50, 53, 57], E: [52, 56, 59], F: [53, 57, 60],
      C: [48, 52, 55], G: [55, 59, 62],
    };
    const bars = [...A, ...B, ...A.slice(0, 4), ...B.slice(4)];
    const chords = [...chordsA, ...chordsB, ...chordsA.slice(0, 4), ...chordsB.slice(4)];
    const ev = [];
    bars.forEach((bar, bi) => {
      let b = bi * 3;
      bar.forEach(([len, m]) => {
        if (m) ev.push({ beat: b, kind: "box", midi: m, vel: 0.22 });
        b += len;
      });
      const ch = CH[chords[bi]];
      ev.push({ beat: bi * 3, kind: "box", midi: ch[0] - 12 + 12, vel: 0.13 }); // oom
      ev.push({ beat: bi * 3 + 1, kind: "box", midi: ch[1] + 12, vel: 0.07 }); // pah
      ev.push({ beat: bi * 3 + 1, kind: "box", midi: ch[2] + 12, vel: 0.06 });
      ev.push({ beat: bi * 3 + 2, kind: "box", midi: ch[1] + 12, vel: 0.06 });
      ev.push({ beat: bi * 3 + 2, kind: "box", midi: ch[2] + 12, vel: 0.05 });
      ev.push({ beat: bi * 3, kind: "pad", notes: [ch[0] - 12, ch[2] - 12], dur: 3 });
    });
    this.score = ev.sort((a, b) => a.beat - b.beat);
    this.scoreBeats = bars.length * 3;
    this.bpm = 92;
  }

  _musicBox(t, midi, vel) {
    const c = this.ctx, f = this._mtof(midi);
    const out = c.createGain();
    out.connect(this.bus.music);
    const send = c.createGain();
    send.gain.value = 0.55;
    out.connect(send).connect(this.reverb);
    // comb-tooth partials: fundamental, inharmonic bright partials
    [[1, 1, 2.4], [2.01, 0.18, 0.9], [5.4, 0.08, 0.25], [8.9, 0.04, 0.12]].forEach(([r, a, d]) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f * r;
      const g = c.createGain();
      this._env(g, t, vel * a, 0.003, d);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + d + 0.05);
    });
  }

  _pad(t, notes, dur) {
    const c = this.ctx;
    notes.forEach((m) => {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = this._mtof(m);
      o.detune.value = (Math.random() - 0.5) * 8;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.5);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
      o.connect(lp).connect(g).connect(this.bus.music);
      g.connect(this.reverb);
      o.start(t);
      o.stop(t + dur + 0.5);
    });
  }

  _thump(t, f = 58, v = 0.5) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.25);
    this._env(g, t, v, 0.01, 0.35);
    o.connect(g).connect(this.bus.music);
    o.start(t);
    o.stop(t + 0.45);
  }

  setMusic(mode) {
    if (!this.ctx || mode === this.musicMode) return;
    const c = this.ctx;
    this.musicMode = mode;
    if (this._drone) {
      const d = this._drone;
      d.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.6);
      setTimeout(() => d.oscs.forEach((o) => o.stop()), 3000);
      this._drone = null;
    }
    if (mode === "waltz") {
      this._beat0 = c.currentTime + 0.3;
      this._nextIdx = 0;
      this._loop = 0;
    }
    if (mode === "tension") {
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.09, c.currentTime, 1.2);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 260;
      const lfo = c.createOscillator(), lfoG = c.createGain();
      lfo.frequency.value = 0.18;
      lfoG.gain.value = 90;
      lfo.connect(lfoG).connect(lp.frequency);
      const oscs = [55, 82.4, 110.6].map((f) => {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(lp);
        o.start();
        return o;
      });
      lfo.start();
      oscs.push(lfo);
      lp.connect(g).connect(this.bus.music);
      this._drone = { g, oscs };
      this._nextThump = c.currentTime + 0.5;
    }
  }

  _tick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, ahead = now + 0.25;
    if (this.musicMode === "waltz") {
      const spb = 60 / this.bpm;
      while (true) {
        const e = this.score[this._nextIdx];
        const t = this._beat0 + (this._loop * this.scoreBeats + e.beat) * spb + (Math.random() - 0.5) * 0.012;
        if (t > ahead) break;
        if (t > now - 0.05) {
          if (e.kind === "box") {
            // second time round, double the melody an octave lower for warmth
            this._musicBox(t, e.midi, e.vel);
            if (this._loop % 2 === 1 && e.vel > 0.2) this._musicBox(t, e.midi - 12, e.vel * 0.45);
          } else this._pad(t, e.notes, e.dur * spb);
        }
        this._nextIdx++;
        if (this._nextIdx >= this.score.length) {
          this._nextIdx = 0;
          this._loop++;
        }
      }
    } else if (this.musicMode === "tension") {
      while (this._nextThump < ahead) {
        this._thump(this._nextThump, 52, 0.45);
        this._thump(this._nextThump + 0.28, 48, 0.3);
        this._nextThump += 1.5;
      }
    }
  }

  /* ===================================================================
     AMBIENCE
     =================================================================== */
  setAmbience(mode) {
    if (!this.ctx || mode === this.ambMode) return;
    const c = this.ctx;
    this.ambMode = mode;
    if (this._amb) {
      const old = this._amb;
      old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.8);
      setTimeout(() => old.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }), 4000);
      clearInterval(old.timer);
    }
    this._amb = null;
    if (mode === "off") return;

    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(1, c.currentTime, 1.2);
    g.connect(this.bus.amb);
    const nodes = [];

    // fog wind bed (all modes, voiced differently)
    const wind = this._noiseSrc(this.brown);
    wind.loop = true;
    const wlp = c.createBiquadFilter();
    wlp.type = mode === "opera" ? "bandpass" : "lowpass";
    wlp.frequency.value = mode === "river" ? 520 : mode === "opera" ? 480 : 380;
    wlp.Q.value = mode === "opera" ? 0.7 : 0.5;
    const wg = c.createGain();
    wg.gain.value = mode === "opera" ? 0.22 : 0.3;
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = mode === "opera" ? 0.9 : 0.07;
    lg.gain.value = mode === "opera" ? 0.08 : 160;
    lfo.connect(lg).connect(mode === "opera" ? wg.gain : wlp.frequency);
    wind.connect(wlp).connect(wg).connect(g);
    wind.start();
    lfo.start();
    nodes.push(wind, lfo);

    const rnd = (a, b) => a + Math.random() * (b - a);
    let next = c.currentTime + rnd(2, 5);
    const timer = setInterval(() => {
      const now = c.currentTime;
      if (now < next) return;
      if (mode === "street") {
        Math.random() < 0.75 ? this._hooves(g, now) : this._bell(now, 45 + Math.floor(Math.random() * 3) * 2, 0.07, g);
        next = now + rnd(7, 15);
      } else if (mode === "river") {
        const r = Math.random();
        if (r < 0.35) this._shipHorn(g, now);
        else if (r < 0.7) this._creak(g, now);
        else this._lap(g, now);
        next = now + rnd(5, 11);
      } else if (mode === "opera") {
        this._fanFlutter(g, now);
        next = now + rnd(4, 9);
      }
    }, 300);

    if (mode === "river") {
      // continuous lapping water
      const w = this._noiseSrc(this.white, 0.5);
      w.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 700;
      bp.Q.value = 1.4;
      const wg2 = c.createGain();
      wg2.gain.value = 0.05;
      const l2 = c.createOscillator(), l2g = c.createGain();
      l2.frequency.value = 0.55;
      l2g.gain.value = 0.04;
      l2.connect(l2g).connect(wg2.gain);
      w.connect(bp).connect(wg2).connect(g);
      w.start();
      l2.start();
      nodes.push(w, l2);
    }
    this._amb = { g, nodes, timer };
  }

  _hooves(dest, t) {
    const c = this.ctx, pan = c.createStereoPanner();
    pan.pan.setValueAtTime(-0.9, t);
    pan.pan.linearRampToValueAtTime(0.9, t + 6);
    const pg = c.createGain();
    pg.gain.setValueAtTime(0.0001, t);
    pg.gain.linearRampToValueAtTime(0.55, t + 2.5);
    pg.gain.linearRampToValueAtTime(0.0001, t + 6);
    pan.connect(pg).connect(dest);
    for (let i = 0; i < 14; i++) {
      const base = t + i * 0.42;
      [0, 0.13].forEach((off, k) => {
        const tt = base + off + Math.random() * 0.02;
        const n = this._noiseSrc(this.white, 0.8), bp = c.createBiquadFilter(), g = c.createGain();
        bp.type = "bandpass";
        bp.frequency.value = k ? 1500 : 1100;
        bp.Q.value = 4;
        this._env(g, tt, 0.5, 0.002, 0.07);
        n.connect(bp).connect(g).connect(pan);
        n.start(tt);
        n.stop(tt + 0.1);
      });
    }
    // carriage wheel rumble
    const r = this._noiseSrc(this.brown), lp = c.createBiquadFilter(), rg = c.createGain();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    rg.gain.value = 0.25;
    r.connect(lp).connect(rg).connect(pan);
    r.start(t);
    r.stop(t + 6);
  }

  _shipHorn(dest, t) {
    const c = this.ctx, lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.5);
    g.gain.setValueAtTime(0.09, t + 2);
    g.gain.linearRampToValueAtTime(0.0001, t + 3.2);
    [98, 147, 196.5].forEach((f) => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(lp);
      o.start(t);
      o.stop(t + 3.3);
    });
    lp.connect(g).connect(dest);
    g.connect(this.reverb);
  }

  _creak(dest, t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t);
    o.frequency.linearRampToValueAtTime(230, t + 0.9);
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 6;
    const trem = c.createOscillator(), tg = c.createGain();
    trem.frequency.value = 28;
    tg.gain.value = 0.02;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + 1);
    trem.connect(tg).connect(g.gain);
    o.connect(bp).connect(g).connect(dest);
    o.start(t);
    trem.start(t);
    o.stop(t + 1.1);
    trem.stop(t + 1.1);
  }

  _lap(dest, t) {
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.5;
      const c = this.ctx, n = this._noiseSrc(this.white, 0.6), lp = c.createBiquadFilter(), g = c.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(1600, tt);
      lp.frequency.exponentialRampToValueAtTime(300, tt + 0.5);
      this._env(g, tt, 0.18, 0.05, 0.5);
      n.connect(lp).connect(g).connect(dest);
      n.start(tt);
      n.stop(tt + 0.6);
    }
  }

  _fanFlutter(dest, t) {
    const c = this.ctx;
    for (let i = 0; i < 5; i++) {
      const tt = t + i * 0.09;
      const n = this._noiseSrc(this.white), bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = "bandpass";
      bp.frequency.value = 2400;
      bp.Q.value = 0.8;
      this._env(g, tt, 0.05, 0.01, 0.06);
      n.connect(bp).connect(g).connect(dest);
      n.start(tt);
      n.stop(tt + 0.1);
    }
  }

  /* ===================================================================
     BELLS — Westminster Quarters & Big Ben
     =================================================================== */
  _bell(t, midi, vel = 0.2, dest) {
    const c = this.ctx, f = this._mtof(midi);
    const out = c.createGain();
    out.connect(dest || this.bus.sfx);
    out.connect(this.reverb);
    [[0.5, 0.5, 7], [1, 1, 5], [1.19, 0.45, 3.5], [1.5, 0.3, 3], [2, 0.32, 2.4], [2.52, 0.14, 1.6], [3.01, 0.1, 1.1]].forEach(
      ([r, a, d]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = f * r;
        this._env(g, t, vel * a, 0.004, d);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + d + 0.1);
      },
    );
  }

  westminster(changes = 2, strikes = 0) {
    if (!this.ctx) return 0;
    const Q = [
      [68, 66, 64, 59], [64, 68, 66, 59], [64, 66, 68, 64], [68, 64, 66, 59], [59, 66, 68, 64],
    ];
    let t = this.ctx.currentTime + 0.1;
    for (let i = 0; i < changes; i++) {
      Q[i].forEach((m, k) => this._bell(t + k * 0.75, m, k === 3 ? 0.2 : 0.16));
      t += 3.6;
    }
    for (let s = 0; s < strikes; s++) {
      this._bell(t + 0.6, 40, 0.3);
      t += 2.4;
    }
    return t - this.ctx.currentTime;
  }

  /* ===================================================================
     EFFECTS
     =================================================================== */
  rustle(dur = 0.8, amt = 1) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime;
    const grains = Math.floor(dur * 34 * amt);
    for (let i = 0; i < grains; i++) {
      const t = t0 + Math.random() * dur;
      const n = this._noiseSrc(this.white, 0.7 + Math.random() * 0.8);
      const bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = "bandpass";
      bp.frequency.value = 1800 + Math.random() * 5000;
      bp.Q.value = 0.9;
      this._env(g, t, 0.06 + Math.random() * 0.12, 0.003, 0.02 + Math.random() * 0.07);
      n.connect(bp).connect(g).connect(this.bus.sfx);
      n.start(t, Math.random());
      n.stop(t + 0.12);
    }
    // body of the sheet moving through air
    const w = this._noiseSrc(this.white), lp = c.createBiquadFilter(), wg = c.createGain();
    lp.type = "bandpass";
    lp.frequency.setValueAtTime(400, t0);
    lp.frequency.exponentialRampToValueAtTime(1800, t0 + dur * 0.6);
    lp.frequency.exponentialRampToValueAtTime(500, t0 + dur);
    wg.gain.setValueAtTime(0.0001, t0);
    wg.gain.linearRampToValueAtTime(0.12 * amt, t0 + dur * 0.4);
    wg.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    w.connect(lp).connect(wg).connect(this.bus.sfx);
    w.start(t0);
    w.stop(t0 + dur + 0.05);
  }

  pageTurn() {
    this.rustle(0.65, 0.8);
  }

  sealCrack() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    for (let i = 0; i < 9; i++) {
      const tt = t + i * 0.012 + Math.random() * 0.01;
      const n = this._noiseSrc(this.white), hp = c.createBiquadFilter(), g = c.createGain();
      hp.type = "highpass";
      hp.frequency.value = 1500;
      this._env(g, tt, 0.4, 0.001, 0.03);
      n.connect(hp).connect(g).connect(this.bus.sfx);
      n.start(tt);
      n.stop(tt + 0.05);
    }
    this._thumpSfx(t, 110, 0.5);
  }

  _thumpSfx(t, f, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.18);
    this._env(g, t, v, 0.004, 0.22);
    o.connect(g).connect(this.bus.sfx);
    o.start(t);
    o.stop(t + 0.3);
  }

  tick(pitch = 1) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "bandpass";
    f.frequency.value = 2400 * pitch;
    f.Q.value = 8;
    o.type = "triangle";
    o.frequency.setValueAtTime(1400 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.04);
    this._env(g, t, 0.35, 0.001, 0.045);
    o.connect(f).connect(g).connect(this.bus.sfx);
    o.start(t);
    o.stop(t + 0.06);
  }

  typeKey() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const n = this._noiseSrc(this.white), hp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    this._env(g, t, 0.35, 0.001, 0.025);
    n.connect(hp).connect(g).connect(this.bus.sfx);
    n.start(t);
    n.stop(t + 0.04);
    this._thumpSfx(t + 0.005, 220, 0.15);
  }

  ding() {
    if (!this.ctx) return;
    this._bell(this.ctx.currentTime, 93, 0.06);
  }

  success() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [81, 84, 88, 93, 88, 93].forEach((m, i) => this._musicBox(t + i * 0.12, m, 0.22));
  }

  fail() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._thumpSfx(t, 90, 0.5);
    this._thumpSfx(t + 0.16, 70, 0.45);
  }

  tone(on, freq = 680) {
    if (!this.ctx) return;
    const c = this.ctx;
    if (on) {
      if (this._key) return;
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.008);
      o.connect(g).connect(this.bus.sfx);
      o.start();
      this._key = { o, g };
    } else if (this._key) {
      const { o, g } = this._key;
      g.gain.setTargetAtTime(0.0001, c.currentTime, 0.008);
      o.stop(c.currentTime + 0.06);
      this._key = null;
    }
  }

  beep(t, dur, freq = 680) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.008);
    g.gain.setValueAtTime(0.18, t + dur - 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Plays morse; calls onSymbol(index) as each symbol sounds. Returns total ms. */
  playMorse(code, onSymbol, unit = 0.075) {
    if (!this.ctx) return 0;
    let t = this.ctx.currentTime + 0.1;
    const start = t;
    [...code].forEach((ch, i) => {
      const at = (t - this.ctx.currentTime) * 1000;
      if (ch === "." || ch === "·") {
        this.beep(t, unit);
        t += unit * 2;
      } else if (ch === "-" || ch === "—") {
        this.beep(t, unit * 3);
        t += unit * 4;
      } else if (ch === " ") t += unit * 2;
      else if (ch === "/") t += unit * 4;
      if (onSymbol) this._timers.push(setTimeout(() => onSymbol(i), at));
    });
    return (t - start) * 1000 + 100;
  }

  shutter() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    [0, 0.09].forEach((d) => {
      const n = this._noiseSrc(this.white), hp = c.createBiquadFilter(), g = c.createGain();
      hp.type = "highpass";
      hp.frequency.value = 3000;
      this._env(g, t + d, 0.5, 0.001, 0.02);
      n.connect(hp).connect(g).connect(this.bus.sfx);
      n.start(t + d);
      n.stop(t + d + 0.04);
    });
    // magnesium flash-powder "foom"
    const n = this._noiseSrc(this.brown), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3500, t + 0.12);
    lp.frequency.exponentialRampToValueAtTime(150, t + 1);
    this._env(g, t + 0.12, 0.6, 0.02, 0.9);
    n.connect(lp).connect(g).connect(this.bus.sfx);
    g.connect(this.reverb);
    n.start(t + 0.12);
    n.stop(t + 1.2);
  }

  strike() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    this._thumpSfx(t, 140, 0.8);
    const n = this._noiseSrc(this.white), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass";
    bp.frequency.value = 3200;
    bp.Q.value = 2;
    this._env(g, t, 0.5, 0.001, 0.4);
    n.connect(bp).connect(g).connect(this.bus.sfx);
    g.connect(this.reverb);
    n.start(t);
    n.stop(t + 0.5);
  }
}
