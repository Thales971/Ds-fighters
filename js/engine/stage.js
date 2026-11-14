
/* ============================================================
   FAUNA — bichos de ambiente nos palcos. Reagem aos lutadores:
   pombos e passaros fogem voando, gato se assusta e corre,
   cachorro late e sai de perto, libelula flutua, vagalumes brilham.
   Pixel art vetorial (sem asset novo).
   ============================================================ */
class LiveFauna {
  constructor(game, def) {
    this.game = game;
    this.animals = [];
    this.t = 0;
    this.liveFauna = null; /* animais vivos — setado pelo Game */
    const kinds = (def && def.fauna) || [];
    const W = game.W || 960, groundY = game.groundY != null ? game.groundY : 440;
    const spawn = (k, n, opts) => { for (let i = 0; i < n; i++) { const a = Object.assign({ k, x: 60 + Math.random() * (W - 120), y: groundY, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1, ph: Math.random() * 6, state: 'idle', timer: 60 + Math.random() * 240, scared: 0 }, opts); a.baseY = a.y; this.animals.push(a); } };
    for (const k of kinds) {
      if (k === 'pigeons') spawn('pigeon', 3 + Math.floor(Math.random() * 2), { y: groundY - 2 });
      if (k === 'birds') spawn('bird', 2, { y: groundY - 240 - Math.random() * 120, sky: true });
      if (k === 'cat') spawn('cat', 1, { y: groundY - 2 });
      if (k === 'dog') spawn('dog', 1, { y: groundY - 2 });
      if (k === 'dragonfly') spawn('dragonfly', 2, { y: groundY - 160 - Math.random() * 90, sky: true });
      if (k === 'fireflies') spawn('firefly', 8, { y: groundY - 40 - Math.random() * 220, sky: true });
      if (k === 'butterflies') spawn('butterfly', 3, { y: groundY - 60 - Math.random() * 140, sky: true });
      if (k === 'fish') spawn('fish', 2, { y: groundY + 6, water: true });
      if (k === 'squirrel') spawn('squirrel', 1, { y: groundY - 2 });
      if (k === 'seagull') spawn('seagull', 2, { y: groundY - 200 - Math.random() * 120, sky: true });
      if (k === 'frog') spawn('frog', 1, { y: groundY - 2 });
    }
  }
  update() {
    this.t++;
    const g = this.game;
    const fighters = (g.fighters && g.fighters()) || [];
    for (const a of this.animals) {
      a.ph += 0.05;
      /* reacao: lutador perto */
      let near = null, nd = 1e9;
      for (const f of fighters) {
        if (!f.alive) continue;
        /* f.y e coordenada de jogo (0 = chao, negativo = alto); a.y e tela */
        const d = Math.abs(f.x - a.x) + Math.abs(f.y) * 0.35;
        if (d < nd) { nd = d; near = f; }
      }
      const range = a.k === 'firefly' || a.k === 'dragonfly' ? 0 : (a.k === 'bird' ? 160 : 110);
      if (near && nd < range && a.scared <= 0 && a.state !== 'flee') {
        a.state = 'flee'; a.scared = 360 + Math.random() * 240;
        a.vx = (a.x < (near ? near.x : 480) ? -1 : 1) * (a.k === 'bird' || a.k === 'pigeon' ? 5 : 3.4);
        if (a.k === 'pigeon' || a.k === 'bird') { a.vy = -3.2; a.flying = true; }
        /* SONS da fauna (sintetizados, curtinhos) */
        const snd = (freq, dur, type, vol, slide) => { try { if (g.audio && g.audio.tone) g.audio.tone(freq, dur, type, vol, slide); } catch (e) {} };
        if (a.k === 'dog' && g.floatText) { g.floatText(a.x, a.y - 60, 'AU AU!', '#ffd27d'); snd(280, 0.09, 'square', 0.12, 180); }
        if (a.k === 'cat' && g.floatText) { g.floatText(a.x, a.y - 60, 'MIAU!', '#ffb0e0'); snd(620, 0.16, 'sine', 0.10, 900); }
        if (a.k === 'pigeon' || a.k === 'bird') snd(1250, 0.05, 'sine', 0.08, 1500);
        if (a.k === 'seagull') snd(880, 0.14, 'sawtooth', 0.09, 660);
        if (a.k === 'squirrel') snd(1500, 0.04, 'square', 0.07, 1800);
        if (a.k === 'frog') snd(140, 0.12, 'square', 0.10, 110);
      }
      if (a.scared > 0) a.scared--;
      if (a.state === 'flee') {
        a.x += a.vx; a.y += a.vy || 0;
        if (a.flying) a.vy = Math.min((a.vy || 0) + 0.06, -2.2);
        const W = g.W || 960;
        if (a.x < -60 || a.x > W + 60) { a.state = 'gone'; a.timer = 240 + Math.random() * 360; }
        if (!a.sky && a.y < a.baseY - 200) a.y = a.baseY - 200;
      } else if (a.state === 'gone') {
        a.timer--;
        if (a.timer <= 0) { /* volta */ a.state = 'idle'; a.x = Math.random() < 0.5 ? 40 : (g.W || 960) - 40; a.vx = 0; a.vy = 0; a.flying = false; a.y = a.baseY; a.dir = a.x < 400 ? 1 : -1; }
      } else {
        /* comportamento calmo */
        if (a.k === 'firefly') { a.x += Math.sin(a.ph) * 0.8; a.y += Math.cos(a.ph * 0.7) * 0.7; }
        if (a.k === 'butterfly') { a.x += Math.sin(a.ph * 0.8) * 1.1; a.y += Math.cos(a.ph * 1.3) * 0.9; if (a.x < 20 || a.x > (g.W || 960) - 20) a.dir *= -1; }
        if (a.k === 'fish') { a.timer--; if (a.timer <= 0) { a.jump = 26; a.timer = 400 + Math.random() * 600; } if (a.jump > 0) { a.jump--; a.y -= 2.4; } else if (a.y < a.baseY) a.y += 1.6; }
        if (a.k === 'squirrel') { a.x += a.dir * 1.6; a.timer--; if (a.timer <= 0) { a.dir *= -1; a.timer = 90 + Math.random() * 160; } if (a.x < 40 || a.x > (g.W || 960) - 40) a.dir *= -1; }
        if (a.k === 'seagull') { a.x += a.dir * 1.3; a.y += Math.sin(a.ph * 0.8) * 0.8; if (a.x < 30 || a.x > (g.W || 960) - 30) a.dir *= -1; }
        if (a.k === 'frog') { a.timer--; if (a.timer <= 0) { a.jump = 20; a.dir = Math.random() < 0.5 ? -1 : 1; a.timer = 300 + Math.random() * 500; } if (a.jump > 0) { a.jump--; a.x += a.dir * 1.4; a.y -= 1.8; } else if (a.y < a.baseY) a.y += 2.2; }
        else if (a.k === 'dragonfly') { a.x += Math.sin(a.ph * 0.6) * 1.4; a.y += Math.cos(a.ph) * 0.9; }
        else if (a.k === 'bird') { a.x += a.dir * 0.9; a.y += Math.sin(a.ph) * 0.5; if (a.x < 30 || a.x > (g.W || 960) - 30) a.dir *= -1; }
        else if (a.k === 'pigeon') { a.x += a.dir * 0.5; if (Math.random() < 0.01) a.dir *= -1; if (a.x < 40 || a.x > (g.W || 960) - 40) a.dir *= -1; }
        else if (a.k === 'cat' || a.k === 'dog') {
          a.timer--;
          if (a.timer <= 0) { a.dir *= -1; a.timer = 180 + Math.random() * 300; }
          a.x += a.dir * 0.4;
          if (a.x < 50 || a.x > (g.W || 960) - 50) a.dir *= -1;
        }
      }
    }
  }
  draw(ctx) {
    for (const a of this.animals) {
      if (a.state === 'gone') continue;
      const x = a.x, y = a.y;
      ctx.save();
      ctx.translate(x, y);
      if (a.k === 'firefly') {
        const blink = 0.45 + Math.sin(a.ph * 3) * 0.45;
        ctx.fillStyle = `rgba(255,240,140,${blink})`;
        ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, 6.3); ctx.fill();
        ctx.fillStyle = `rgba(255,240,140,${blink * 0.25})`;
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.3); ctx.fill();
      } else if (a.k === 'dragonfly') {
        ctx.fillStyle = '#5fd8c8';
        const w = Math.sin(a.ph * 8) * 3;
        ctx.fillRect(-6, -1 + w * 0.4, 5, 1.4); ctx.fillRect(1, -1 - w * 0.4, 5, 1.4);
        ctx.fillRect(-1, -1, 8, 1.8);
      } else if (a.k === 'bird') {
        ctx.fillStyle = '#4a4f5a';
        const flap = a.state === 'flee' ? Math.sin(a.ph * 10) * 4 : Math.sin(a.ph * 3) * 2.5;
        ctx.beginPath(); ctx.moveTo(-5, -flap); ctx.lineTo(0, 0); ctx.lineTo(5, -flap); ctx.lineTo(0, 1.5); ctx.closePath(); ctx.fill();
      } else if (a.k === 'pigeon') {
        ctx.scale(a.dir, 1);
        ctx.fillStyle = '#9aa2b0'; ctx.fillRect(-5, -7, 10, 6);
        ctx.fillStyle = '#7b8394'; ctx.fillRect(3, -12, 5, 4);
        ctx.fillStyle = '#e8a13b'; ctx.fillRect(7, -11, 3, 1.5);
        ctx.fillStyle = '#7b8394'; ctx.fillRect(-2, -1, 1.6, 3); ctx.fillRect(2, -1, 1.6, 3);
        if (a.state === 'flee') { const flap = Math.sin(a.ph * 12) * 5; ctx.fillStyle = '#b8c0d0'; ctx.fillRect(-5, -10 - flap, 10, 3); }
      } else if (a.k === 'cat') {
        ctx.scale(a.dir, 1);
        ctx.fillStyle = '#3d3a45'; ctx.fillRect(-7, -8, 13, 6);
        ctx.fillRect(4, -12, 6, 5);
        ctx.beginPath(); ctx.moveTo(5, -12); ctx.lineTo(6.5, -15); ctx.lineTo(8, -12); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8.5, -12); ctx.lineTo(10, -15); ctx.lineTo(11, -12); ctx.closePath(); ctx.fill();
        const tw = Math.sin(a.ph * 2) * 2;
        ctx.fillRect(-11, -9 + tw * 0.3, 4, 1.6);
        ctx.fillRect(-5, -2, 2, 3); ctx.fillRect(2, -2, 2, 3);
      } else if (a.k === 'butterfly') {
        const flap = Math.sin(a.ph * 14);
        ctx.fillStyle = '#ff9ad5';
        ctx.beginPath(); ctx.ellipse(-3, 0, 3.5, 2 + flap * 1.6, -0.5, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3, 0, 3.5, 2 - flap * 1.6, 0.5, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#3a2a3a'; ctx.fillRect(-0.8, -2, 1.6, 4);
      } else if (a.k === 'fish') {
        if (a.y < (a.baseY || 446) - 2) {
          ctx.fillStyle = '#6fb8e8';
          ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#4a90c8'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-9, -3); ctx.lineTo(-9, 3); ctx.closePath(); ctx.fill();
        } else { /* na agua: so a sombra */
          ctx.fillStyle = 'rgba(30,60,90,0.35)';
          ctx.beginPath(); ctx.ellipse(0, 0, 7, 2, 0, 0, 6.3); ctx.fill();
        }
      } else if (a.k === 'squirrel') {
        ctx.scale(a.dir, 1);
        ctx.fillStyle = '#a8724a'; ctx.fillRect(-5, -7, 10, 5);
        ctx.fillRect(4, -11, 5, 4);
        const tw2 = Math.sin(a.ph * 5) * 3;
        ctx.fillStyle = '#c89068'; ctx.beginPath(); ctx.ellipse(-7, -8 + tw2 * 0.4, 4.5, 2, 0.6, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-4, -2, 1.8, 3); ctx.fillRect(2, -2, 1.8, 3);
      } else if (a.k === 'seagull') {
        ctx.fillStyle = '#f0f0f5';
        const flap2 = a.state === 'flee' ? Math.sin(a.ph * 9) * 5 : Math.sin(a.ph * 2.5) * 3;
        ctx.beginPath(); ctx.moveTo(-7, -flap2); ctx.lineTo(0, 0); ctx.lineTo(7, -flap2); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8a13b'; ctx.fillRect(2, -1, 4, 1.2);
      } else if (a.k === 'frog') {
        ctx.scale(a.dir, 1);
        ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.ellipse(0, -3, 6, 4, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#3a7830'; ctx.beginPath(); ctx.arc(3, -7, 1.8, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(6.5, -7, 1.8, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(4, -8, 1, 1); ctx.fillRect(7, -8, 1, 1);
      } else if (a.k === 'dog') {
        ctx.scale(a.dir, 1);
        ctx.fillStyle = '#c48a4a'; ctx.fillRect(-8, -9, 14, 7);
        ctx.fillRect(5, -13, 6, 5);
        ctx.fillStyle = '#8a5a2a'; ctx.fillRect(6, -11, 5, 2);
        const wag = Math.sin(a.ph * 6) * 2.5;
        ctx.fillStyle = '#c48a4a'; ctx.fillRect(-11, -10 + wag, 4, 2);
        ctx.fillRect(-6, -2, 2.4, 3); ctx.fillRect(3, -2, 2.4, 3);
      }
      ctx.restore();
    }
  }
}
/* ============================================================
   DS FIGHTERS — Renderização de cenários.
   Fundo animado (spritesheet 6x4) ou ilustrado (jpg) com:
   parallax pela câmera, respiração de zoom, gradação de cor e luz,
   partículas de ambiente (brasas, pétalas, bolhas, vaga-lumes),
   fauna (pássaros, abelhas, borboletas, morcegos, peixes) e vinheta.
   ============================================================ */
const FAUNA_ROW = { bee: 0, butterfly: 1, bat: 2, fish: 3 };

/* Som de fundo por palco. `ambient` no palco usa o próprio arquivo. */
function stageAmbient(def) {
  if (!def) return null;
  if (def.ambient) return def.ambient;
  const id = def.id || '';
  if (id.indexOf('sesi') >= 0 || id === 'circo') return 'amb_gym';
  if (id.indexOf('senai') >= 0 || id === 'rust' || id === '02-volcanic-forge' || id === 'java') return 'amb_workshop';
  if (id === 'docker' || id === 'chrome' || id === '01-neon-rooftop' || id === 'cyberpunk') return 'amb_metro';
  if (id === 'kernel' || id === '04-storm-temple' || id === '07-sky-islands' || id === 'kotlin') return 'amb_rain';
  if (id === 'spring' || id === 'python' || id === '10-digital-forest' || id === 'japan' || id === '06-sakura-dojo') return 'amb_park';
  if (id === 'hive' || id === 'pizzaria') return 'amb_cafe';
  if (id === '09-orbital-core' || id === 'area-de-trabalho' || id === 'kali' || id === 'pos-codigocalipse') return 'amb_server';
  if (id === '03-underwater-lab' || id === 'abismo-das-baleias' || id === '08-crystal-cavern') return 'amb_rain';
  if (id === '05-chaos-citadel' || id === 'vale-do-cache') return 'amb_market';
  return 'amb_night';
}

function defaultStageProps(id) {
  let h = 0;
  const s = String(id || 'stage');
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  const pick = (n) => { h = (h * 1664525 + 1013904223) >>> 0; return h % n; };
  const spots = [
    { cell: 0, x: 46, y: 148, flash: true },
    { cell: 4, x: 914, y: 136, flash: true },
    { cell: 2, x: 118, y: 196 },
    { cell: 1, x: 842, y: 188 },
    { cell: 5, x: 64, y: 286, fall: true },
  ];
  return spots.map((p) => ({
    cell: p.cell,
    x: p.x + pick(18) - 9,
    y: p.y + pick(12) - 6,
    fall: !!p.fall,
    flash: !!p.flash,
  }));
}

class StageRenderer {
  constructor(def, W, H, groundY) {
    this.def = def;
    this.W = W;
    this.H = H;
    this.groundY = groundY;
    this.t = 0;
    this.reducedFlag = false;
    this.img = new Image();
    this.ready = false;
    this.usingSheet = !!def.sheet;
    this.img.onload = () => { this.ready = true; };
    this.img.onerror = () => {
      if (this.usingSheet && def.image) {
        this.usingSheet = false;
        this.img.src = def.image;
      }
    };
    this.img.src = def.sheet || def.image;
    this.ambient = [];
    /* sprites de ambiente (petalas, neon) — pixel art em assets/weather/ */
    this.ambSprites = {};
    for (const [k, src] of [['petals', 'assets/weather/petals.png'], ['neon', 'assets/weather/neon.png']]) {
      try {
        const img = new Image();
        img.onload = () => { this.ambSprites[k] = img; };
        img.src = src + '?v=v36-balance13';
      } catch (e) { /* sem DOM: fallback vetorial */ }
    }
    this.fauna = [];
    this.makeFauna();
    this.vignette = null;
  }
  makeFauna() {
    const list = this.def.fauna || [];
    list.forEach((kind, i) => {
      const n = kind === 'bee' ? 3 : 2;
      for (let k = 0; k < n; k++) {
        this.fauna.push({
          kind,
          x: Math.random() * this.W,
          y: kind === 'fish' ? 120 + Math.random() * 260 : kind === 'bird' ? 40 + Math.random() * 140 : 120 + Math.random() * 240,
          vx: (Math.random() < 0.5 ? -1 : 1) * (kind === 'bird' ? 1.3 + Math.random() : 0.5 + Math.random() * 0.8),
          ph: Math.random() * 10,
          row: kind === 'bird' ? ((i + k) % 3) : FAUNA_ROW[kind] || 0,
          s: 0.7 + Math.random() * 0.5,
        });
      }
    });
    this.layers = [];
    this.props = [];
    this.hitFlash = 0;
    this.propShake = 0;
    this.drama = 0;
    this.propSheet = new Image();
    this.propSheet.src = 'assets/fx/stage-props.png?v=v36-amb1';
    this.rainSheet = new Image();
    this.rainSheet.src = 'assets/fx/rain-streaks.png?v=v36-amb1';
    const specs = this.def.layers || [];
    for (const spec of specs) {
      const img = new Image();
      const layer = { img, speed: spec.speed == null ? 0.4 : spec.speed, y: spec.y || 0, ready: false };
      img.onload = () => { layer.ready = true; };
      img.src = spec.src + (String(spec.src).indexOf('?') >= 0 ? '' : '?v=v36-amb1');
      this.layers.push(layer);
    }
    const propList = this.def.props || defaultStageProps(this.def.id);
    this.props = propList.map((p) => ({ cell: p.cell || 0, x: p.x, y: p.y, baseY: p.y, fall: !!p.fall, flash: !!p.flash, vy: 0, rot: 0, falling: false }));
  }
  frameRect() {
    const d = this.def;
    if (!this.usingSheet) return [0, 0, this.img.naturalWidth || this.W, this.img.naturalHeight || this.H];
    const f = this.reducedFlag ? 0 : Math.floor(this.t / (60 / (d.fps || 10))) % d.frames;
    return [(f % d.cols) * d.frameW, Math.floor(f / d.cols) * d.frameH, d.frameW, d.frameH];
  }
  update(weather) {
    this.t++;
    const d = this.def;
    const want = this.reducedFlag ? 12 : 46;
    const kinds = [];
    if (d.embers) kinds.push('ember');
    if (d.petals) kinds.push('petal');
    if (d.bubbles) kinds.push('bubble');
    if (d.fireflies) kinds.push('firefly');
    /* AMBIENCIA v2: neon piscando, barras de glitch, chuva de codigo,
       poeira de luz — cada mapa ganha vida propria. */
    if (d.neon) kinds.push('neon');
    if (d.glitch) kinds.push('glitch');
    if (d.code) kinds.push('code');
    if (d.motes) kinds.push('mote');
    if (d.sparks) kinds.push('sparkd');
    if (kinds.length && this.ambient.length < want && this.t % 4 === 0) {
      const k = kinds[(Math.random() * kinds.length) | 0];
      const y0 = (k === 'ember' || k === 'bubble' || k === 'sparkd') ? this.H + 10
        : (k === 'petal' || k === 'code') ? -10
        : (k === 'glitch' ? Math.random() * this.H * 0.5 : 120 + Math.random() * 300);
      this.ambient.push({ k, x: Math.random() * this.W, y: y0, life: 0, ph: Math.random() * 6, s: Math.random(), w: k === 'glitch' ? 40 + Math.random() * 160 : 0, h: k === 'glitch' ? 2 + Math.random() * 5 : 0 });
    }
    const wind = weather ? weather.wind : 0;
    this.ambient = this.ambient.filter((p) => {
      p.life++;
      if (p.k === 'ember') { p.y -= 1 + p.s; p.x += Math.sin(p.life * 0.05 + p.ph) * 0.6 + wind; }
      else if (p.k === 'bubble') { p.y -= 0.8 + p.s; p.x += Math.sin(p.life * 0.07 + p.ph) * 0.5; }
      else if (p.k === 'petal') { p.y += 0.8 + p.s * 0.6; p.x += Math.sin(p.life * 0.04 + p.ph) * 1.1 + wind * 1.4; p.rot = (p.rot || p.ph) + 0.03 + p.s * 0.03; }
      else if (p.k === 'neon') { p.y += 0.3 + p.s * 0.5; p.x += wind * 0.5; }
      else if (p.k === 'glitch') { p.life += 2; }
      else if (p.k === 'code') { p.y += 2.2 + p.s * 2.4; p.x += wind * 0.6; }
      else if (p.k === 'mote') { p.x += Math.sin(p.life * 0.02 + p.ph) * 0.5; p.y += Math.cos(p.life * 0.03 + p.ph) * 0.4 - 0.15; }
      else if (p.k === 'sparkd') { p.y -= 0.6 + p.s; p.x += Math.sin(p.life * 0.06 + p.ph) * 0.8; }
      else { p.x += Math.sin(p.life * 0.02 + p.ph) * 0.5; p.y += Math.cos(p.life * 0.03 + p.ph) * 0.4; }
      return p.life < 600 && p.y > -20 && p.y < this.H + 20;
    });
    for (const f of this.fauna) {
      f.x += f.vx + wind * (f.kind === 'bird' ? 0.6 : 0.3);
      f.ph += 0.05;
      if (f.kind === 'bee' || f.kind === 'butterfly') { f.y += Math.sin(f.ph * 2) * 0.8; if (Math.random() < 0.01) f.vx = -f.vx; }
      if (f.kind === 'bat') f.y += Math.sin(f.ph * 3) * 1.2;
      if (f.x < -60) f.x = this.W + 50;
      if (f.x > this.W + 60) f.x = -50;
    }
    if (this.propShake > 0) this.propShake *= 0.84;
    if (this.hitFlash > 0) this.hitFlash--;
    for (const p of this.props) {
      if (!p.falling) continue;
      p.vy += 0.42;
      p.y += p.vy;
      p.rot += 0.12;
    }
  }
  react(power) {
    this.hitFlash = Math.max(this.hitFlash, power >= 11 ? 10 : 5);
    this.propShake = Math.max(this.propShake, power);
    if (power < 11) return;
    for (const p of this.props) {
      if (p.fall && !p.falling && Math.random() < 0.6) {
        p.falling = true;
        p.vy = -1.4;
      }
    }
  }
  /* Desenha um recorte mais largo que a tela e desloca pela câmera. */
  blitWide(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, camX, speed) {
    const shift = -camX * speed * 78;
    ctx.drawImage(img, sx, sy, sw, sh, dx + shift, dy, dw, dh);
  }
  /* camX: deslocamento da câmera (−1..1) para parallax */
  drawBack(ctx, camX, zoomPulse) {
    const W = this.W;
    const H = this.H;
    ctx.save();
    // Os masters são ilustrados, não pixel art: interpolação evita serrilha
    // ao exibir folhas de 768x432 no canvas de combate.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    if (this.layers.length && this.layers.every((l) => l.ready)) {
      if (this.def.pixel) ctx.imageSmoothingEnabled = false;
      const breathe = this.reducedFlag ? 0 : Math.sin(this.t * 0.004) * 0.002;
      const z = 1.08 + breathe + (zoomPulse || 0) * 0.01;
      for (const layer of this.layers) {
        const dw = W * z;
        const dh = H * z;
        this.blitWide(ctx, layer.img, 0, 0, layer.img.naturalWidth || W, layer.img.naturalHeight || H, (W - dw) / 2, (H - dh) * 0.85 + (layer.y || 0), dw, dh, camX, layer.speed);
      }
    } else if (this.ready) {
      const [sx, sy, sw, sh] = this.frameRect();
      const breathe = this.reducedFlag ? 0 : Math.sin(this.t * 0.004) * 0.002;
      const z = 1.08 + breathe + (zoomPulse || 0) * 0.01;
      const dw = W * z;
      const dh = H * z;
      const ox = (W - dw) / 2;
      const oy = (H - dh) * 0.85;
      ctx.save();
      this.blitWide(ctx, this.img, sx, sy, sw, sh, ox, oy, dw, dh, camX, 0.16);
      ctx.beginPath();
      ctx.rect(0, H * 0.18, W, H * 0.64);
      ctx.clip();
      this.blitWide(ctx, this.img, sx, sy, sw, sh, ox, oy, dw, dh, camX, 0.46);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, H * 0.74, W, H * 0.26);
      ctx.clip();
      this.blitWide(ctx, this.img, sx, sy, sw, sh, ox, oy, dw, dh, camX, 0.82);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120a24');
      g.addColorStop(1, '#2a1640');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    for (const f of this.fauna) {
      const dir = f.vx > 0 ? 1 : -1;
      if (f.kind === 'bird') Art.fx2(ctx, 'birds', f.row, Math.floor(this.t / 6 + f.ph), f.x, f.y, { scale: 0.7 * f.s, dir });
      else Art.cell(ctx, 'fauna', f.row, Math.floor(this.t / 4 + f.ph), f.x, f.y, { scale: 0.75 * f.s, dir: -dir });
    }
    if (!this.reducedFlag) {
      // Tint leve, source-over e limitado à área acima do piso: custa menos
      // que uma blendagem avançada em toda a tela e deixa os masters legíveis.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.035 + Math.sin(this.t * 0.008) * 0.006;
      ctx.fillStyle = this.def.tint || '#ffffff';
      ctx.fillRect(0, 0, W, Math.min(H, this.groundY + 8));
      ctx.globalAlpha = 1;
    }
    this.drawProps(ctx, camX);
    if (this.drama) this.drawDrama(ctx);
    if (this.hitFlash > 0) {
      ctx.globalAlpha = this.hitFlash / 18;
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    const gy = this.groundY;
    // Escurecimento curto e moderado, só no piso de combate; a versão antiga
    // cobria 30 px acima dele e chegava a 55% de opacidade.
    const fg = ctx.createLinearGradient(0, gy, 0, H);
    fg.addColorStop(0, 'rgba(0,0,0,0)');
    fg.addColorStop(0.45, 'rgba(0,0,0,0.08)');
    fg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, gy, W, H - gy);
    ctx.restore();
  }
  drawProps(ctx, camX) {
    const sheet = this.propSheet;
    if (!sheet || !sheet.complete || !sheet.naturalWidth) return;
    const shake = this.propShake || 0;
    for (const p of this.props) {
      const jx = shake ? Math.sin(this.t * 1.7 + p.x) * Math.min(6, shake * 0.35) : 0;
      const jy = shake ? Math.cos(this.t * 1.3 + p.y) * Math.min(3, shake * 0.18) : 0;
      const flash = p.flash && this.hitFlash > 0;
      ctx.save();
      ctx.translate(p.x + jx - camX * 18, p.y + jy);
      if (p.rot) ctx.rotate(p.rot);
      if (flash) ctx.globalAlpha = 0.55 + (this.hitFlash % 2) * 0.45;
      ctx.drawImage(sheet, (p.cell % 8) * 48, 0, 48, 64, -24, -56, 48, 64);
      ctx.restore();
    }
  }
  drawDrama(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 8, 22, 0.38)';
    ctx.fillRect(0, 0, this.W, this.H);
    const rain = this.rainSheet;
    if (rain && rain.complete && rain.naturalWidth) {
      const scroll = (this.t * 14) % this.H;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(rain, 0, scroll - this.H, this.W, this.H);
      ctx.drawImage(rain, 0, scroll, this.W, this.H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  drawAmbient(ctx) {
    if (this.liveFauna) this.liveFauna.draw(ctx);
    ctx.save();
    for (const p of this.ambient) {
      const a = Math.min(1, p.life / 30) * Math.min(1, (600 - p.life) / 60);
      if (p.k === 'ember') { ctx.fillStyle = `rgba(255,${120 + ((p.s * 100) | 0)},40,${0.85 * a})`; ctx.fillRect(p.x, p.y, 3, 3); }
      else if (p.k === 'bubble') { ctx.strokeStyle = `rgba(190,240,255,${0.7 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + p.s * 4, 0, 6.28); ctx.stroke(); }
      else if (p.k === 'petal') {
        /* PETALA SPRITE girando (3 designs) — cai em espiral */
        const sp = this.ambSprites.petals;
        if (sp && sp.width) {
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || p.ph);
          const design = (Math.floor(p.ph * 3)) % 3;
          ctx.drawImage(sp, design * 14, 0, 14, 14, -7, -7, 14, 14);
          ctx.restore();
        } else { ctx.fillStyle = `rgba(255,180,210,${0.9 * a})`; ctx.fillRect(p.x, p.y, 4, 3); }
      }
      else if (p.k === 'neon') {
        /* NEON: brilho que pisca (sprite ciano/magenta) */
        const sp = this.ambSprites.neon;
        const flick = 0.4 + 0.6 * Math.abs(Math.sin(p.life * 0.12 + p.ph * 3));
        ctx.globalAlpha = a * flick;
        if (sp && sp.width) ctx.drawImage(sp, p.s > 0.5 ? 10 : 0, 0, 10, 10, p.x - 5, p.y - 5, 10, 10);
        else { ctx.fillStyle = p.s > 0.5 ? '#c8fff8' : '#ffb0f5'; ctx.fillRect(p.x, p.y, 3, 3); }
        ctx.globalAlpha = 1;
      }
      else if (p.k === 'glitch') {
        /* BARRA DE GLITCH: risco horizontal deslocando (cyberpunk) */
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = p.s > 0.5 ? 'rgba(255,60,120,0.5)' : 'rgba(60,255,220,0.5)';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = 1;
      }
      else if (p.k === 'code') {
        /* CHUVA DE CODIGO: risco vertical caindo (verde matriz) */
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = p.s > 0.6 ? 'rgba(120,255,150,0.8)' : 'rgba(60,220,120,0.6)';
        ctx.fillRect(p.x, p.y, 2, 8 + p.s * 10);
        ctx.globalAlpha = 1;
      }
      else if (p.k === 'mote') {
        /* POEIRA DE LUZ: pontinhos dourados flutuando (catedral) */
        const gl = 0.4 + 0.6 * Math.abs(Math.sin(p.life * 0.05 + p.ph));
        ctx.globalAlpha = a * gl;
        ctx.fillStyle = '#ffe9b0';
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.globalAlpha = 1;
      }
      else if (p.k === 'sparkd') {
        /* FAISCA: sobe e apaga */
        ctx.globalAlpha = a * (0.4 + p.s * 0.6);
        ctx.fillStyle = '#ffd27d';
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.globalAlpha = 1;
      }
      else { const gl = 0.5 + Math.sin(p.life * 0.1 + p.ph) * 0.5; ctx.fillStyle = `rgba(210,255,120,${gl * a})`; ctx.fillRect(p.x, p.y, 3, 3); }
    }
    ctx.restore();
  }
  drawVignette(ctx) {
    if (!this.vignette) {
      const c = document.createElement('canvas');
      c.width = this.W;
      c.height = this.H;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(this.W / 2, this.H * 0.55, this.H * 0.35, this.W / 2, this.H * 0.55, this.W * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.22)');
      x.fillStyle = g;
      x.fillRect(0, 0, this.W, this.H);
      this.vignette = c;
    }
    ctx.drawImage(this.vignette, 0, 0);
  }
}
