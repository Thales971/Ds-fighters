/* ============================================================
   DS FIGHTERS — Áudio procedural via WebAudio (sem arquivos).
   ============================================================ */

const AudioSys = {
  ctx: null,
  musicTimer: null,
  musicStep: 0,
  enabled: true,

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur, type = 'square', vol = 0.15, slideTo = null, delay = 0) {
    if (!this.enabled || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  noise(dur, vol = 0.2, delay = 0, freq = 1000) {
    if (!this.enabled || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t0);
  },

  punch()  { this.noise(0.08, 0.25, 0, 800); this.tone(180, 0.08, 'square', 0.12, 60); },
  kick()   { this.noise(0.12, 0.3, 0, 400);  this.tone(120, 0.12, 'sawtooth', 0.15, 40); },
  block()  { this.tone(300, 0.06, 'square', 0.1, 200); },
  special(){ this.tone(500, 0.25, 'sawtooth', 0.15, 1400); this.noise(0.2, 0.12, 0.05, 2000); },
  super_() { this.tone(200, 0.5, 'sawtooth', 0.18, 1600); this.tone(300, 0.4, 'square', 0.12, 1800, 0.1); this.noise(0.4, 0.18, 0.1, 900); },
  hit()    { this.noise(0.15, 0.28, 0, 600); this.tone(90, 0.15, 'square', 0.2, 40); },
  ko()     { this.tone(400, 0.7, 'sawtooth', 0.2, 40); this.tone(200, 0.9, 'square', 0.15, 30, 0.1); this.noise(0.6, 0.2, 0.05, 300); },
  jump()   { this.tone(300, 0.12, 'sine', 0.08, 600); },
  select() { this.tone(660, 0.08, 'square', 0.12); this.tone(880, 0.1, 'square', 0.12, null, 0.07); },
  cursor() { this.tone(440, 0.05, 'square', 0.08); },
  round()  { this.tone(523, 0.15, 'square', 0.15); this.tone(659, 0.15, 'square', 0.15, null, 0.15); this.tone(784, 0.3, 'square', 0.15, null, 0.3); },

  startMusic() {
    if (!this.enabled || !this.ensure() || this.musicTimer) return;
    const bass = [110, 0, 110, 0, 130.8, 0, 98, 0, 110, 0, 110, 0, 146.8, 0, 164.8, 0];
    const lead = [440, 0, 523, 587, 0, 659, 0, 523, 440, 0, 392, 0, 523, 587, 659, 0];
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const s = this.musicStep % 16;
      if (bass[s]) this.tone(bass[s], 0.22, 'triangle', 0.12);
      if (lead[s]) this.tone(lead[s], 0.16, 'square', 0.05);
      if (s % 4 === 0) this.noise(0.03, 0.05, 0, 6000);
      this.musicStep++;
    }, 160);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },
};
