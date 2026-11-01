/* ============================================================
   DS FIGHTERS — Áudio.
   - Efeitos (assets/audio/sfx/*.mp3) e narrador (assets/audio/voice/*.mp3)
     decodificados em WebAudio, com sintetizador de reserva.
   - Música: assets/music/playlist.json. A cada batalha uma faixa aleatória
     é sorteada (sem repetir a anterior). Coloque seus rocks em
     assets/music/rock/ e liste em "tracks". Sem faixas próprias, usa "fallback".
   - Nada toca antes do primeiro gesto do jogador (política dos navegadores).
   ============================================================ */
const SFX_FILES = ['axe', 'bees_loop', 'block', 'crowd', 'dash', 'dragon', 'explosion', 'fire', 'hazard', 'heavy', 'jump', 'kick', 'ko', 'magic', 'menu_back', 'menu_move', 'menu_ok', 'pickup', 'punch', 'rain_loop', 'shield', 'steal', 'thunder', 'thunder_cast', 'ultimate', 'unlock', 'water', 'whoosh', 'wind_loop'];
const VOICE_FILES = ['choose', 'combo', 'draw', 'fight', 'ko', 'perfect', 'powerup', 'round1', 'round2', 'round3', 'stolen', 'storm', 'timeup', 'title', 'ultimate', 'unlocked', 'youlose', 'youwin'];

const AudioSys = {
  ctx: null,
  enabled: true,
  unlocked: false,
  buffers: {},
  buses: {},
  loops: {},
  music: null,
  musicKind: null,
  playlist: { tracks: [], fallback: [], menu: null },
  lastTrack: null,
  nowPlaying: '',
  pending: null,
  _lastPlay: {},
  init() {
    fetch('assets/music/playlist.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) this.playlist = Object.assign(this.playlist, j); })
      .catch(() => {});
  },
  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        ['sfx', 'voice'].forEach((k) => {
          const g = this.ctx.createGain();
          g.connect(this.ctx.destination);
          this.buses[k] = g;
        });
        this.applyVolumes();
        this.loadAll();
      } catch (e) { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      this.flushPending();
    }
    return this.ctx;
  },
  loadAll() {
    const load = (name, url) => fetch(url).then((r) => r.arrayBuffer())
      .then((b) => new Promise((res, rej) => this.ctx.decodeAudioData(b, res, rej)))
      .then((buf) => { this.buffers[name] = buf; })
      .catch(() => {});
    SFX_FILES.forEach((n) => load(n, 'assets/audio/sfx/' + n + '.mp3'));
    VOICE_FILES.forEach((n) => load('v_' + n, 'assets/audio/voice/' + n + '.mp3'));
  },
  vol(kind) {
    const s = (typeof Profile !== 'undefined' && Profile.data) ? Profile.data.settings : { music: 0.5, sfx: 0.8, voice: 0.9, mute: false };
    if (s.mute) return 0;
    return s[kind] == null ? 0.8 : s[kind];
  },
  applyVolumes() {
    if (this.buses.sfx) this.buses.sfx.gain.value = this.vol('sfx');
    if (this.buses.voice) this.buses.voice.gain.value = this.vol('voice');
    if (this.music) this.music.volume = Math.min(1, this.vol('music'));
    Object.values(this.loops).forEach((l) => { if (l.g) l.g.gain.value = l.base; });
  },
  play(name, opts = {}) {
    if (!this.enabled || !this.ctx || !this.unlocked) return false;
    const buf = this.buffers[name];
    if (!buf) return false;
    const t = performance.now();
    if (!opts.force && this._lastPlay[name] && t - this._lastPlay[name] < (opts.gap || 35)) return true;
    this._lastPlay[name] = t;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (opts.rate) src.playbackRate.value = opts.rate;
    else if (!opts.exact) src.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = this.ctx.createGain();
    g.gain.value = opts.vol == null ? 1 : opts.vol;
    src.connect(g).connect(this.buses[opts.bus || 'sfx']);
    src.start();
    return true;
  },
  voice(name) {
    return this.play('v_' + name, { bus: 'voice', exact: true, force: true });
  },
  loop(name, on, vol = 0.5) {
    if (!this.ctx) return;
    if (on && !this.loops[name] && this.buffers[name]) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[name];
      src.loop = true;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g).connect(this.buses.sfx);
      src.start();
      this.loops[name] = { src, g, base: vol };
    } else if (!on && this.loops[name]) {
      try { this.loops[name].src.stop(); } catch (e) { /* já parado */ }
      delete this.loops[name];
    }
  },
  stopLoops() { Object.keys(this.loops).forEach((k) => this.loop(k, false)); },

  /* ---------- sintetizador de reserva ---------- */
  tone(freq, dur, type = 'square', vol = 0.15, slideTo = null, delay = 0) {
    if (!this.enabled || !this.ctx || !this.unlocked) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(this.buses.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },
  noise(dur, vol = 0.2, delay = 0, freq = 1000) {
    if (!this.enabled || !this.ctx || !this.unlocked) return;
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
    src.connect(f).connect(g).connect(this.buses.sfx);
    src.start(t0);
  },
  punch() { this.play('punch', { vol: 0.8 }) || (this.noise(0.08, 0.25, 0, 800), this.tone(180, 0.08, 'square', 0.12, 60)); },
  kick() { this.play('kick', { vol: 0.8 }) || (this.noise(0.12, 0.3, 0, 400), this.tone(120, 0.12, 'sawtooth', 0.15, 40)); },
  hit(heavy) { this.play(heavy ? 'heavy' : 'punch') || (this.noise(0.15, 0.28, 0, 600), this.tone(90, 0.15, 'square', 0.2, 40)); },
  block() { this.play('block') || this.tone(300, 0.06, 'square', 0.1, 200); },
  special() { this.play('magic') || this.tone(500, 0.25, 'sawtooth', 0.15, 1400); },
  super_() { this.play('ultimate') || this.tone(200, 0.5, 'sawtooth', 0.18, 1600); },
  ko() { this.play('ko', { exact: true }) || this.tone(400, 0.6, 'sawtooth', 0.2, 40); },
  jump() { this.play('jump', { vol: 0.5 }) || this.tone(300, 0.12, 'sine', 0.08, 600); },
  land() { this.play('land', { vol: 0.5 }) || this.noise(0.05, 0.06, 0, 280); },
  dash() { this.play('dash') || this.noise(0.06, 0.07, 0, 1400); },
  select() { this.play('menu_ok', { exact: true }) || (this.tone(660, 0.08, 'square', 0.12), this.tone(880, 0.1, 'square', 0.12, null, 0.07)); },
  back() { this.play('menu_back', { exact: true }) || this.tone(330, 0.08, 'square', 0.1); },
  cursor() { this.play('menu_move', { exact: true, gap: 20 }) || this.tone(440, 0.05, 'square', 0.08); },
  round() { this.tone(523, 0.15, 'square', 0.12); },
  sfx(name) { if (name && !this.play(name)) this.special(); },

  /* ---------- música ---------- */
  pickBattleTrack() {
    const own = (this.playlist.tracks || []).filter((t) => t && t.file);
    const pool = own.length ? own : (this.playlist.fallback || []);
    if (!pool.length) return null;
    let choice = pool[(Math.random() * pool.length) | 0];
    let guard = 0;
    while (pool.length > 1 && this.lastTrack && choice.file === this.lastTrack && guard++ < 10) {
      choice = pool[(Math.random() * pool.length) | 0];
    }
    this.lastTrack = choice.file;
    return choice;
  },
  playMusic(kind) {
    if (!this.unlocked) { this.pending = kind; return; }
    if (kind === 'menu' && this.musicKind === 'menu' && this.music && !this.music.paused) return;
    this.stopMusic();
    const track = kind === 'menu' ? this.playlist.menu : this.pickBattleTrack();
    this.musicKind = kind;
    if (!track || !track.file) return;
    const a = new Audio(track.file);
    a.loop = true;
    a.volume = Math.min(1, this.vol('music'));
    a.onerror = () => {
      // faixa listada mas ainda não enviada: cai para a trilha original
      if (kind !== 'menu' && (this.playlist.tracks || []).length) {
        this.playlist.tracks = this.playlist.tracks.filter((t) => t.file !== track.file);
        this.playMusic(kind);
      }
    };
    a.play().catch(() => {});
    this.music = a;
    this.nowPlaying = track.title || track.file.split('/').pop();
    if (typeof UI !== 'undefined' && UI.toast && kind !== 'menu') UI.toast('♪ ' + this.nowPlaying, 2600);
  },
  stopMusic() {
    if (this.music) { this.music.pause(); this.music.removeAttribute('src'); this.music = null; }
    this.musicKind = null;
  },
  flushPending() { if (this.pending) { const k = this.pending; this.pending = null; this.playMusic(k); } },
};
AudioSys.init();
