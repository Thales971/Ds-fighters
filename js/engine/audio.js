/* ============================================================
   DS FIGHTERS — Áudio.
   - Efeitos (assets/audio/sfx/*.mp3) e narrador (assets/audio/voice/*.mp3)
     decodificados em WebAudio, com sintetizador de reserva.
   - Música: assets/music/playlist.json. A cada batalha uma faixa aleatória
     é sorteada (sem repetir a anterior). Coloque seus rocks em
     assets/music/rock/ e liste em "tracks". Sem faixas próprias, usa "fallback".
   - Nada toca antes do primeiro gesto do jogador (política dos navegadores).
   ============================================================ */
const SFX_FILES = ['axe', 'bees_loop', 'block', 'crowd', 'dash', 'dragon', 'explosion', 'fire', 'hazard', 'heavy', 'jump', 'kick', 'ko', 'magic', 'menu_back', 'menu_move', 'menu_ok', 'pickup', 'punch', 'rain_loop', 'shield', 'steal', 'thunder', 'thunder_cast', 'ultimate', 'unlock', 'water', 'whoosh', 'wind_loop', 'amb_gym', 'amb_workshop', 'amb_metro', 'amb_rain', 'amb_park', 'amb_cafe', 'amb_server', 'amb_market', 'amb_night', 'amb_sesi', 'amb_estacao-valinhos', 'amb_feira-valinhos', 'amb_represa', 'amb_rua-centro-noite', 'amb_quadra-areia', 'amb_arquibancada', 'amb_oficina-senai', 'amb_terminal-onibus', 'amb_cafe-madrugada', 'amb_corredor-datacenter', 'amb_sala-deploy', 'amb_hackerspace', 'amb_telhado-escola', 'amb_ponte-rio', 'amb_parque-lago', 'amb_mercado-municipal', 'amb_estudio-pixel', 'amb_antena-morro', 'amb_biblioteca-noturna', 'amb_pista-skate'];
const VOICE_FILES = ['choose', 'combo', 'draw', 'fight', 'final', 'ko', 'perfect', 'powerup', 'round1', 'round2', 'round3', 'stolen', 'storm', 'timeup', 'title', 'ultimate', 'unlocked', 'youlose', 'youwin'];

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
  voiceActive: 0,
  _voicePlaying: Object.create(null),
  _speechSequence: 0,
  musicMixFactor: 0.7,
  musicDuckFactor: 0.25,
  /* 0 = rock no fundo, ambiente inteiro. 1 = rock no teto do volume do jogador e ambiente abafado. */
  intensity: 0,
  intensityTarget: 0,
  musicHot: null,
  musicCross: 0,
  hotWanted: false,
  _hitMarks: [],
  _mixFrame: 0,
  _ultUntil: 0,
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
  safeVol(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      const f = Number(fallback);
      return Number.isFinite(f) ? Math.max(0, Math.min(1, f)) : 0;
    }
    return Math.max(0, Math.min(1, n));
  },
  vol(kind) {
    const s = (typeof Profile !== 'undefined' && Profile.data) ? Profile.data.settings : { music: 0.35, sfx: 0.8, voice: 0.9, mute: false };
    if (s.mute) return 0;
    const defaults = { music: 0.35, sfx: 0.8, voice: 0.9 };
    return this.safeVol(s[kind], defaults[kind] == null ? 0.8 : defaults[kind]);
  },
  musicMixAt(intensity) {
    const calm = this.safeVol(this.musicMixFactor, 0.7);
    const hot = 1;
    const t = this.safeVol(intensity, 0);
    return calm + (hot - calm) * t;
  },
  musicVolume() {
    const mix = this.musicMixAt(this.intensity || 0);
    const duck = this.voiceActive > 0 ? this.safeVol(this.musicDuckFactor, 0.25) : 1;
    return this.safeVol(this.vol('music') * mix * duck);
  },
  /* Ambiente (chuva, vento, público do palco) cede espaço ao rock. Não passa de 28% no auge. */
  ambientGain(base) {
    const duck = 1 - 0.72 * this.safeVol(this.intensity, 0);
    return this.safeVol((base || 0) * duck);
  },
  _beginVoice(key) {
    this.voiceActive += 1;
    if (key) this._voicePlaying[key] = (this._voicePlaying[key] || 0) + 1;
    this.applyVolumes();
  },
  _endVoice(key) {
    this.voiceActive = Math.max(0, this.voiceActive - 1);
    if (key) {
      const count = (this._voicePlaying[key] || 0) - 1;
      if (count > 0) this._voicePlaying[key] = count;
      else delete this._voicePlaying[key];
    }
    this.applyVolumes();
  },
  applyVolumes() {
    if (this.buses.sfx) this.buses.sfx.gain.value = this.safeVol(this.vol('sfx'));
    if (this.buses.voice) this.buses.voice.gain.value = this.safeVol(this.vol('voice'));
    if (this._line) this._line.volume = this.safeVol(this.vol('voice'));
    this.applyMusicVolumes();
    Object.values(this.loops).forEach((l) => { if (l.g) l.g.gain.value = this.ambientGain(l.base); });
  },
  applyMusicVolumes() {
    const level = this.musicVolume();
    const cross = this.safeVol(this.musicCross, 0);
    const rate = 1 + 0.08 * this.safeVol(this.intensity, 0);
    const setRate = (el) => {
      if (!el) return;
      try { el.playbackRate = rate; } catch (e) { /* o elemento recusou a taxa */ }
    };
    if (this.music) this.music.volume = this.safeVol(level * (1 - cross));
    if (this.musicHot) this.musicHot.volume = this.safeVol(level * cross);
    setRate(this.music);
    setRate(this.musicHot);
  },
  play(name, opts = {}) {
    if (!this.enabled || !this.ctx || !this.unlocked) return false;
    const buf = this.buffers[name];
    if (!buf) return false;
    const isVoice = opts.bus === 'voice';
    const voiceKey = isVoice && opts.voiceKey ? String(opts.voiceKey) : null;
    if (voiceKey && this._voicePlaying[voiceKey]) return true;
    const t = performance.now();
    if (!opts.force && this._lastPlay[name] && t - this._lastPlay[name] < (opts.gap || 35)) return true;
    this._lastPlay[name] = t;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (opts.rate) src.playbackRate.value = opts.rate;
    else if (!opts.exact) src.playbackRate.value = 0.94 + Math.random() * 0.12;
    const g = this.ctx.createGain();
    g.gain.value = this.safeVol(opts.vol == null ? 1 : opts.vol, 1);
    const bus = this.buses[opts.bus || 'sfx'];
    if (!bus) return false;
    let ended = false;
    const finishVoice = () => {
      if (ended) return;
      ended = true;
      if (isVoice) this._endVoice(voiceKey);
    };
    if (isVoice) {
      src.onended = finishVoice;
      this._beginVoice(voiceKey);
    }
    src.connect(g).connect(bus);
    try {
      src.start();
    } catch (e) {
      finishVoice();
      return false;
    }
    return true;
  },
  sayCharacter(name) {
    const phrase = String(name || '').trim();
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    const volume = this.vol('voice');
    if (!phrase || !synth || !Utterance || typeof synth.speak !== 'function' || volume <= 0) return false;
    const utterance = new Utterance(phrase);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = volume;
    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const voice = voices.find((item) => /^pt-BR$/i.test(item.lang)) || voices.find((item) => /^pt-/i.test(item.lang));
    if (voice) utterance.voice = voice;
    const key = 'fighter-name-' + (++this._speechSequence);
    let started = false;
    let ended = false;
    utterance.onstart = () => { if (!ended) { started = true; this._beginVoice(key); } };
    const finish = () => { if (ended) return; ended = true; if (started) this._endVoice(key); };
    utterance.onend = finish;
    utterance.onerror = finish;
    try { synth.speak(utterance); return true; } catch (e) { finish(); return false; }
  },
  voice(name) {
    const key = 'v_' + name;
    return this.play(key, { bus: 'voice', exact: true, force: true, voiceKey: key });
  },
  /* Fala solta (lutador ou rivalidade). O arquivo pode ser trocado sem mexer no código. */
  playVoiceFile(url) {
    if (!url || this.vol('voice') <= 0) return false;
    this.ensure();
    if (this._line) {
      try { this._line.pause(); } catch (e) { /* já parou */ }
      this._line = null;
      this._endVoice('line');
    }
    const a = new Audio(url);
    a.volume = this.safeVol(this.vol('voice'));
    this._line = a;
    this._beginVoice('line');
    const finish = () => {
      if (this._line !== a) return;
      this._line = null;
      this._endVoice('line');
    };
    a.onended = finish;
    a.onerror = finish;
    try {
      const playback = a.play();
      if (playback && typeof playback.catch === 'function') playback.catch(finish);
    } catch (e) { finish(); return false; }
    return true;
  },
  loop(name, on, vol = 0.5) {
    if (!this.ctx) return;
    if (on && !this.loops[name] && this.buffers[name]) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[name];
      src.loop = true;
      const g = this.ctx.createGain();
      const base = this.safeVol(vol, 0.5);
      g.gain.value = this.ambientGain(base);
      src.connect(g).connect(this.buses.sfx);
      src.start();
      this.loops[name] = { src, g, base };
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
  punch(vol = 0.85) { this.play('punch', { vol: vol }) || (this.noise(0.08, 0.25 * vol, 0, 800), this.tone(180, 0.08, 'square', 0.12 * vol, 60)); },
  kick(vol = 0.9) { this.play('kick', { vol: vol }) || (this.noise(0.12, 0.3 * vol, 0, 400), this.tone(120, 0.12, 'sawtooth', 0.15 * vol, 40)); },
  /* Assobio do golpe no ar. O impacto de verdade usa impact(). */
  whiff(kind) { if (kind === 'kick') this.kick(0.34); else this.punch(0.3); },
  impact(kind, heavy, ult) {
    if (ult) { this.super_(); return; }
    if (heavy) { this.play('heavy', { vol: 0.95 }) || this.hit(true); return; }
    if (kind === 'kick') this.kick(1);
    else this.punch(1);
  },
  hit(heavy) { this.play(heavy ? 'heavy' : 'punch', { vol: heavy ? 0.95 : 1 }) || (this.noise(0.15, 0.28, 0, 600), this.tone(90, 0.15, 'square', 0.2, 40)); },
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
    const uniqueByFile = (list) => {
      const seen = new Set();
      return (Array.isArray(list) ? list : []).filter((t) => {
        if (!t || !t.file || seen.has(t.file)) return false;
        seen.add(t.file);
        return true;
      });
    };
    const own = uniqueByFile(this.playlist.tracks);
    const pool = own.length ? own : uniqueByFile(this.playlist.fallback);
    if (!pool.length) return null;
    const choices = pool.length > 1 && this.lastTrack ? pool.filter((t) => t.file !== this.lastTrack) : pool;
    const source = choices.length ? choices : pool;
    const index = Math.floor(Math.random() * source.length);
    const choice = source[index] || source[0];
    this.lastTrack = choice.file;
    return choice;
  },
  playMusic(kind) {
    if (!this.unlocked) { this.pending = kind; return; }
    if (kind === 'menu' && this.musicKind === 'menu' && this.music && !this.music.paused) return;
    if (kind === 'menu') {
      this.intensity = 0;
      this.intensityTarget = 0;
      this._hitMarks = [];
      this._ultUntil = 0;
    }
    this.stopMusic();
    const track = kind === 'menu' ? this.playlist.menu : this.pickBattleTrack();
    this.musicKind = kind;
    if (!track || !track.file) return;
    const a = new Audio(track.file);
    a.loop = kind === 'menu';
    a.volume = 0;
    a.onended = () => {
      if (kind !== 'menu' && this.music === a && this.musicKind === kind) this.playMusic(kind);
    };
    a.onerror = () => {
      // faixa listada mas ainda não enviada: cai para a trilha original
      if (this.music !== a) return;
      if (kind !== 'menu' && Array.isArray(this.playlist.tracks) && this.playlist.tracks.length) {
        this.playlist.tracks = this.playlist.tracks.filter((t) => t.file !== track.file);
        this.playMusic(kind);
      }
    };
    this.music = a;
    this.musicCross = 0;
    this._hotDone = false; /* nova faixa principal: libera UMA hot */
    this.hotWanted = false;
    this._hotMiss = false;
    this.applyMusicVolumes();
    this.nowPlaying = track.title || track.file.split('/').pop();
    try {
      const playback = a.play();
      if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    } catch (e) { /* política de autoplay ou falha do elemento */ }
    if (typeof UI !== 'undefined' && UI.toast && kind !== 'menu') UI.toast('♪ ' + this.nowPlaying, 2600);
  },
  stopMusic() {
    this._stopHot();
    this.musicCross = 0;
    this.hotWanted = false;
    if (this.music) { this.music.pause(); this.music.removeAttribute('src'); this.music = null; }
    this.musicKind = null;
  },
  _stopHot() {
    if (!this.musicHot) return;
    try { this.musicHot.pause(); this.musicHot.removeAttribute('src'); } catch (e) { /* já parado */ }
    this.musicHot = null;
  },
  flushPending() { if (this.pending) { const k = this.pending; this.pending = null; this.playMusic(k); } },
  /* O drama visual ainda avisa o palco. O volume do rock sobe pelo intensity, sem salto de taxa. */
  setTension(on) { this._tension = !!on; },
  fightIntensityTarget(sig) {
    const s = sig || {};
    const parts = [];
    if (s.finalRound) parts.push(0.58);
    const low = this.safeVol(s.low, 0);
    if (low > 0) parts.push(0.42 + low * 0.58);
    const combo = Math.max(0, Number(s.combo) || 0);
    if (combo >= 3) parts.push(Math.min(1, (combo - 2) / 7));
    if (s.ultHold) parts.push(0.92);
    const hits = Math.max(0, Number(s.hitRate) || 0);
    if (hits >= 4) parts.push(Math.min(1, (hits - 3) / 5));
    if (!parts.length) return 0;
    const peak = Math.max.apply(null, parts);
    const stack = parts.reduce((sum, v) => sum + v, 0) - peak;
    return Math.min(1, peak + Math.min(0.22, stack * 0.18));
  },
  /* Um passo por quadro de luta. Sobe mais rápido do que desce, sempre aos poucos. */
  driveIntensity(sig) {
    this._mixFrame += 1;
    if (sig && sig.hit) this._hitMarks.push(this._mixFrame);
    const horizon = this._mixFrame - 180;
    if (this._hitMarks.length) this._hitMarks = this._hitMarks.filter((frame) => frame >= horizon);
    if (sig && sig.ult) this._ultUntil = this._mixFrame + 150;
    const target = this.fightIntensityTarget({
      finalRound: !!(sig && sig.finalRound),
      low: sig && sig.low,
      combo: sig && sig.combo,
      ultHold: this._mixFrame < (this._ultUntil || 0),
      hitRate: this._hitMarks.length,
    });
    this.intensityTarget = target;
    const follow = target > this.intensity ? 0.035 : 0.018;
    this.intensity += (target - this.intensity) * follow;
    if (Math.abs(this.intensity - target) < 0.001) this.intensity = target;
    this._advanceCrossfade();
    this.applyVolumes();
  },
  _advanceCrossfade() {
    if (this.musicKind !== 'battle') return;
    if (this.intensity <= 0.32) this._hotMiss = false;
    /* FIX: UMA hot track por faixa principal — antes, com a luta quente,
       cada hot que acabava ja promovia outra: trocava de musica sem parar
       e nenhuma tocava ate o fim. Agora a faixa toca inteira. */
    if (this.intensity >= 0.75 && !this.musicHot && !this._hotMiss && !this._hotDone) this._promoteHotTrack();
    if (this.intensity <= 0.32) this.hotWanted = false;
    else if (this.intensity >= 0.75 && this.musicHot) this.hotWanted = true;
    const goal = this.hotWanted && this.musicHot ? 1 : 0;
    const prev = this.musicCross || 0;
    const step = 0.028;
    const delta = Math.max(-step, Math.min(step, goal - prev));
    this.musicCross = prev + delta;
    if (!this.hotWanted && this.musicCross <= 0.001) {
      this._stopHot();
      this.musicCross = 0;
    }
  },
  _promoteHotTrack() {
    if (!this.music || this.musicKind !== 'battle') return;
    this._hotDone = true; /* uma hot track por faixa — nao fica trocando */
    const next = this.pickBattleTrack();
    if (!next || !next.file || next.file === this.music.src) { this._hotMiss = true; return; }
    const a = new Audio(next.file);
    a.loop = false;
    a.volume = 0;
    a.onended = () => { if (this.musicHot === a) this._stopHot(); };
    a.onerror = () => { if (this.musicHot === a) this._stopHot(); };
    this.musicHot = a;
    this.hotWanted = true;
    this.nowPlaying = next.title || next.file.split('/').pop();
    try {
      const playback = a.play();
      if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    } catch (e) { /* autoplay */ }
  },
};
AudioSys.init();
