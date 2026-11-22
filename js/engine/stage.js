
/* ============================================================
   BIOMA DA ARENA -> fauna permitida (fauna presa ao palco):
   peixe/sapo/gaivota/libelula so em palco com agua (mare/tanque),
   morcego so em palco escuro, gato so em rua/noite/indoor, etc.
   stageFauna() deduplica, filtra pelo bioma e completa (palco de
   agua sempre ganha peixe). Usado por LiveFauna, StageRenderer e
   pela tela de arenas (preview).
   ============================================================ */
function stageBiome(def) {
  /* normaliza acentos pra casar "fundição" com "fundicao", "ginásio" com "ginasio"... */
  const hay = (((def && def.id) || '') + ' ' + ((def && def.name) || '') + ' ' + ((def && def.group) || ''))
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const wx = (def && def.weather) || [];
  const water = !!(def && (def.swim || def.bubbles || def.mech === 'tide'))
    || /represa|lago|mangue|doca|cais|ponte do rio|rio de|abismo|submarino|underwater|copacabana|beira-mar|bonito|iguacu|praia|mar\b/.test(hay);
  const night = /noite|night|noturna|halloween|codigocalipse|orbital|covil|cemiterio|mansao|cyberpunk|neon|datacenter|abismo|caverna|forja|fundicao|torrefa|pantano|citadel|madrugada|natal|anonovo|quermesse|arraial|junina|deploy|estudio/.test(hay)
    || wx.includes('darkfog') || wx.includes('eclipse') || wx.includes('aurora');
  const park = /parque|jardim|floresta|tijuca|ibirapuera|bosque|sitio|cafezal|arraial|quermesse|playground|divers|lago|mangue|sakura|colmeia|hive|pantano|escola|praca/.test(hay);
  const urban = /rua|centro|terminal|estacao|feira|mercado|praca|lapa|santa teresa|quadra|sesi|pista|beco|paulista|teatro|largo|valinhos|senai|oficina|trabalho|hackerspace|biblioteca|pizzaria|cafe|estudio|salao|loja|copacabana|beira|telhado|ginasio|arquibancada|docker|porto|dojo|circo|laje|churrasco/.test(hay);
  return { water, night, park, urban };
}
const FAUNA_RULES = {
  fish: (b) => b.water,
  seagull: (b) => b.water,
  frog: (b) => b.water || b.park,
  dragonfly: (b) => b.water || b.park,
  bat: (b) => b.night,
  fireflies: (b) => b.night || b.park,
  cat: (b) => b.night || b.urban,
  dog: (b) => b.urban || b.park,
  pigeons: (b) => b.urban,
  squirrel: (b) => b.park,
  bee: (b) => b.park || (!b.night && !b.urban),
  butterfly: (b) => b.park || b.water || !b.night,
  butterflies: (b) => b.park || b.water || !b.night,
  bird: () => true,
  birds: () => true,
};
function stageFauna(def) {
  if (def && def.faunaExact) {
    const seen = new Set();
    return ((def.fauna) || []).filter((k) => k && !seen.has(k) && seen.add(k));
  }
  const b = stageBiome(def);
  const seen = new Set();
  const out = [];
  for (const k of (def && def.fauna) || []) {
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const rule = FAUNA_RULES[k];
    if (!rule || rule(b)) out.push(k);
  }
  /* NB: nao adicionamos fauna automatico — palco de mare SEM peixe (ex.: Ilha
     Kotlin) fica com mare intermitente de proposito (permaTide desligado). */
  return out;
}

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
    const kinds = stageFauna(def);
    const groundY = (typeof GROUND_Y === 'number') ? GROUND_Y : 458;
    const spawn = (k, n, opts) => { const span = game.W || 960; for (let i = 0; i < n; i++) { const a = Object.assign({ k, x: 60 + Math.random() * (span - 120), y: groundY, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1, ph: Math.random() * 6, state: 'idle', timer: 60 + Math.random() * 240, scared: 0, alert: 0, perch: 0, peck: 0, jump: 0 }, opts); a.baseY = a.y; this.animals.push(a); } };
    for (const k of kinds) {
      if (k === 'pigeons') spawn('pigeon', 3 + Math.floor(Math.random() * 2), { y: groundY - 2 });
      if (k === 'birds' || k === 'bird') spawn('bird', 2, { y: groundY - 240 - Math.random() * 120, sky: true });
      if (k === 'bat') spawn('bat', 2, { y: groundY - 280 - Math.random() * 80, sky: true });
      if (k === 'cat') spawn('cat', 1, { y: groundY - 2 });
      if (k === 'dog') spawn('dog', 1, { y: groundY - 2 });
      if (k === 'dragonfly') spawn('dragonfly', 2, { y: groundY - 160 - Math.random() * 90, sky: true });
      if (k === 'fireflies') spawn('firefly', 6, { y: groundY - 210 - Math.random() * 160, sky: true });
      if (k === 'butterflies' || k === 'butterfly') spawn('butterfly', k === 'butterfly' ? 2 : 3, { y: groundY - 80 - Math.random() * 120, sky: true });
      if (k === 'squirrel') spawn('squirrel', 1, { y: groundY - 2 });
      if (k === 'seagull') spawn('seagull', 2, { y: groundY - 200 - Math.random() * 120, sky: true });
      if (k === 'frog') spawn('frog', 1, { y: groundY - 2 });
      /* peixe nasce NA AGUA: palco com tanque (bubbles/underwater) no meio da coluna,
         palco com mare (swim/tide) logo abaixo da linha do chao (dock) — antes nascia
         no ar, acima de groundY */
      if (k === 'fish') {
        const tank = def && (def.bubbles || def.id === '03-underwater-lab' || def.id === 'abismo-das-baleias');
        spawn('fish', 2, tank ? { y: 150 + Math.random() * 200, water: true } : { y: groundY + 24, water: true });
      }
      if (k === 'rabbits') spawn('rabbit', 2, { y: groundY - 2 });
      if (k === 'hamster') spawn('hamster', 1, { y: groundY - 2 });
      if (k === 'turtle') spawn('turtle', 1, { y: groundY - 2 });
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
      /* ALERTA: lutador perto mas FORA do raio de fuga — o bicho para e assiste a luta */
      if (near && nd >= range && nd < range + 130 && a.state === 'idle' && a.scared <= 0 && a.alert <= 0 && !a.water) a.alert = 40;
      if (a.alert > 0) a.alert--;
      if (near && nd < range && a.scared <= 0 && a.state !== 'flee') {
        a.state = 'flee'; a.scared = 360 + Math.random() * 240;
        a.vx = (a.x < (near ? near.x : 480) ? -1 : 1) * (a.k === 'bird' || a.k === 'pigeon' ? 5 : 3.4);
        a.dir = a.vx < 0 ? -1 : 1;
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
      } else if (a.alert > 0 && !a.sky && !a.water) {
        /* ASSISTINDO A LUTA: parado, virado pro lutador mais proximo */
        a.ph += 0.05;
        if (near) a.dir = near.x >= a.x ? 1 : -1;
      } else {
        /* comportamento calmo */
        if (a.k === 'firefly') { a.x += Math.sin(a.ph) * 0.8; a.y += Math.cos(a.ph * 0.7) * 0.7; }
        if (a.k === 'butterfly') {
          if (a.perch > 0) {
            /* POUSADA numa flor do palco: asas fecham devagar e fica parada */
            a.perch--;
            a.ph += 0.02;
            if (a.px != null) { a.x += (a.px - a.x) * 0.2; a.y += (a.py - a.y) * 0.2; }
          } else {
            const dx = Math.sin(a.ph * 0.8) * 1.1;
            a.x += dx; a.y += Math.cos(a.ph * 1.3) * 0.9;
            if (dx) a.dir = dx > 0 ? 1 : -1;
            if (a.x < 20 || a.x > (g.W || 960) - 20) a.dir *= -1;
            /* de vez em quando pousa numa flor do palco (se houver) */
            const st = g.stage;
            const flores = st && st.flora ? st.flora.filter((p) => p.k === 'flower_red' || p.k === 'flower_yellow') : [];
            if (flores.length && Math.random() < 0.003) {
              const fl = flores[(Math.random() * flores.length) | 0];
              a.perch = 240 + Math.random() * 300; a.px = fl.x; a.py = fl.y - 16 - Math.random() * 6;
            }
          }
        }
        if (a.k === 'fish') { a.timer--; if (a.timer <= 0) { a.jump = 26; a.timer = 400 + Math.random() * 600; if (g.splash) g.splash(a.x); try { if (g.audio && g.audio.play) g.audio.play('water', { vol: 0.12 }); } catch (e) {} } if (a.jump > 0) { a.jump--; a.y -= 2.4; } else if (a.y < a.baseY) a.y += 1.6; }
        if (a.k === 'squirrel') { a.x += a.dir * 1.6; a.timer--; if (a.timer <= 0) { a.dir *= -1; a.timer = 90 + Math.random() * 160; } if (a.x < 40 || a.x > (g.W || 960) - 40) a.dir *= -1; }
        if (a.k === 'seagull') { a.x += a.dir * 1.3; a.y += Math.sin(a.ph * 0.8) * 0.8; if (a.x < 30 || a.x > (g.W || 960) - 30) a.dir *= -1; }
        if (a.k === 'frog') { a.timer--; if (a.timer <= 0) { a.jump = 20; a.dir = Math.random() < 0.5 ? -1 : 1; a.timer = 300 + Math.random() * 500; } if (a.jump > 0) { a.jump--; a.x += a.dir * 1.4; a.y -= 1.8; } else if (a.y < a.baseY) a.y += 2.2; }
        else if (a.k === 'dragonfly') { a.x += Math.sin(a.ph * 0.6) * 1.4; a.y += Math.cos(a.ph) * 0.9; }
        else if (a.k === 'bird') { a.x += a.dir * 0.9; a.y += Math.sin(a.ph) * 0.5; if (a.x < 30 || a.x > (g.W || 960) - 30) a.dir *= -1; }
        else if (a.k === 'bat') { a.x += a.dir * 1.1; a.y += Math.sin(a.ph * 3) * 1.2; if (a.x < 30 || a.x > (g.W || 960) - 30) a.dir *= -1; }
        else if (a.k === 'pigeon') { a.x += a.dir * 0.5; if (Math.random() < 0.01) a.dir *= -1; if (a.x < 40 || a.x > (g.W || 960) - 40) a.dir *= -1; a.timer--; if (a.timer <= 0) { a.peck = 16; a.timer = 160 + Math.random() * 420; } if (a.peck > 0) a.peck--; }
        else if (a.k === 'cat' || a.k === 'dog' || a.k === 'rabbit' || a.k === 'hamster' || a.k === 'turtle') {
          a.timer--;
          if (a.timer <= 0) { a.dir *= -1; a.timer = 180 + Math.random() * 300; }
          a.x += a.dir * 0.4;
          if (a.x < 50 || a.x > (g.W || 960) - 50) a.dir *= -1;
        }
      }
    }
  }
  draw(ctx, layer = 'all') {
    const onGround = { pigeon: 1, cat: 1, dog: 1, squirrel: 1, frog: 1, firefly: 1, rabbit: 1, hamster: 1, turtle: 1 };
    for (const a of this.animals) {
      if (a.state === 'gone') continue;
      const grounded = !!onGround[a.k];
      if (layer === 'back' && !grounded) continue;
      if (layer === 'front' && grounded) continue;
      const x = a.x, y = a.y;
      /* BICHOS EM SPRITE (arte do dono): cachorro, gato, pombo, peixe, sapo,
         coelho, hamster, tartaruga, esquilo, libelula — o resto segue no canvas vetorial */
      const _sprRow = { dog: 0, cat: 1, pigeon: 2, fish: 3, frog: 4, rabbit: 5, hamster: 6, turtle: 7, squirrel: 8, dragonfly: 9 }[a.k];
      if (typeof Art !== 'undefined' && _sprRow != null) {
        let frame = a.state === 'flee' ? 3 : (Math.floor(this.t * 0.15 + a.ph) % 4);
        let dy = 0;
        if (a.k === 'pigeon' && a.peck > 0) { frame = 2; dy = -Math.sin((16 - a.peck) / 16 * Math.PI) * 7; }
        ctx.save();
        ctx.translate(x, y + dy);
        if (a.dir < 0) ctx.scale(-1, 1);
        Art.cell(ctx, 'bichos', _sprRow, frame, 0, 0, { scale: 0.62, dir: 1 });
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      if (a.k === 'firefly') {
        const blink = [0, 1, 2, 3, 2, 1];
        const f = blink[Math.floor(this.t * 0.12 + a.ph * 3) % blink.length];
        Art.cell(ctx, 'fx2:firefly', 1, 0, 0, 0, { scale: 1, add: true, alpha: 0.85 });
        Art.cell(ctx, 'fx2:firefly', 0, f, 0, 0, { scale: 1 });
      } else if (a.k === 'bat') {
        const frame = Math.floor(this.t / 4 + a.ph) % 4;
        Art.cell(ctx, 'fauna', 2, frame, 0, 0, { scale: 1.05, dir: a.dir || 1 });
      } else if (a.k === 'bird' || a.k === 'seagull') {
        const frame = Math.floor(this.t / 5 + a.ph) % 4;
        const face = (a.vx || a.dir || 1) < 0 ? -1 : 1;
        Art.fx2(ctx, 'birds', a.k === 'seagull' ? 1 : 0, frame, 0, 0, { scale: 1.05, dir: face });
      } else if (a.k === 'butterfly') {
        /* pousada numa flor: asas fechadas (frame 0) e parada */
        const frame = a.perch > 0 ? 0 : (Math.floor(this.t / 4 + a.ph) % 4);
        Art.cell(ctx, 'fauna', 1, frame, 0, 0, { scale: 1.3, dir: a.dir || 1 });
      } else if (a.k === 'fish') {
        const frame = Math.floor(this.t / 6 + a.ph) % 4;
        Art.cell(ctx, 'fauna', 3, frame, 0, 0, { scale: 1.2, dir: a.dir || 1 });
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
    this.flora = [];
    this.lights = [];
    this.foreground = [];
    this._skyGrad = null;
    this.makeFauna();
    this.makeFlora();
    this.makeForeground();
    this.initTorcida();
    this.lights = this.buildLights();
    this.vignette = null;
  }
  makeFauna() {
    const list = stageFauna(this.def);
    const spriteRow = { bee: 0, bat: 2 };
    /* especies que o LiveFauna (sprites de bichos.png) ja cobre nao nascem aqui,
       senao ficavam duplicadas (2 sistemas desenhando o mesmo bicho) */
    const LIVE_KINDS = new Set(['pigeons', 'birds', 'bird', 'cat', 'dog', 'dragonfly', 'fireflies', 'butterflies', 'butterfly', 'squirrel', 'seagull', 'frog', 'fish', 'rabbits', 'hamster', 'turtle', 'bat']);
    const gy = this.groundY || 458;
    list.forEach((kind, i) => {
      if (LIVE_KINDS.has(kind)) return;
      if (spriteRow[kind] == null && kind !== 'bird') return;
      const n = kind === 'bee' ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const inTank = kind === 'fish' && (this.def.bubbles || this.def.id === '03-underwater-lab' || this.def.id === 'abismo-das-baleias');
        const surface = kind === 'fish' && this.def.swim && !inTank;
        const y = kind === 'fish'
          ? (inTank ? 150 + Math.random() * 200 : surface ? gy - 26 - Math.random() * 22 : gy - 16 - Math.random() * 16)
          : (kind === 'bird' || kind === 'bat' ? 48 + Math.random() * 120 : 140 + Math.random() * 180);
        this.fauna.push({
          kind,
          x: Math.random() * this.W,
          y,
          homeY: y,
          vx: (Math.random() < 0.5 ? -1 : 1) * (kind === 'bird' ? 1.3 + Math.random() : 0.5 + Math.random() * 0.8),
          ph: Math.random() * 10,
          row: kind === 'bird' ? ((i + k) % 3) : spriteRow[kind],
          s: 0.9 + Math.random() * 0.25,
          hop: 0,
          swim: surface,
        });
      }
    });
    this.layers = [];
    this.props = [];
    this.hitFlash = 0;
    this.floraShake = 0;
    this.drama = 0;
    this.rainSheet = new Image();
    this.rainSheet.src = 'assets/fx/rain-streaks.png?v=v36-amb1';
    /* ondas da maré alta em sprite real (tools/build_mare_atlas.py) */
    this.waveSheet = new Image();
    this.waveSheet.src = 'assets/fx/mare.png?v=v55-revisao';
    const specs = this.def.layers || [];
    for (const spec of specs) {
      const img = new Image();
      const layer = { img, speed: spec.speed == null ? 0.4 : spec.speed, y: spec.y || 0, ready: false };
      img.onload = () => { layer.ready = true; };
      img.src = spec.src + (String(spec.src).indexOf('?') >= 0 ? '' : '?v=v36-amb1');
      this.layers.push(layer);
    }
    /* enfeites genericos (sheet antiga de postes, bonequinhos, placa...) removidos
       a pedido do dono: os mapas ja desenham o proprio cenario. */
  }
  makeFlora() {
    const d = this.def;
    const gy = this.groundY || 458;
    /* BIOMA por stage: cada tipo de palco tem flora própria */
    const biomeFlora = {
      'spring': ['grass', 'flower_red', 'flower_yellow', 'clover'],
      'python': ['grass', 'flower_red', 'clover'],
      'japan': ['grass', 'flower_red', 'clover'],
      'sakura': ['grass', 'flower_red', 'clover'],
      '06-sakura-dojo': ['grass', 'flower_red', 'clover'],
      '10-digital-forest': ['grass', 'flower_yellow', 'clover'],
      'forest': ['grass', 'grass_tall', 'mushroom', 'clover'],
      'cavern': ['mushroom', 'grass_tall'],
      'crystal': ['mushroom', 'grass'],
      '08-crystal-cavern': ['mushroom', 'grass'],
      '03-underwater-lab': [],
      'abismo-das-baleias': [],
    };
    const id = d.id || '';
    const group = d.group || '';
    /* FLORA SO EM MAPA NATURAL: d.flora explicito manda (vazio = sem flora);
       senao bioma especifico; senao so ganha grama/flores se o nome/grupo do
       palco for de lugar natural (parque, floresta, lago, rio, praia...). Palco
       urbano/tecnico (datacenter, metro, dojo, circo...) NAO tem flora. */
    const NATURAL_KW = ['parque', 'park', 'floresta', 'forest', 'jardim', 'garden', 'lago', 'represa', 'praia', 'beach', 'rio', 'ponte', 'manguezal', 'doca', 'serra', 'mirante', 'trilha', 'tijuca', 'iguacu', 'chapada', 'sitio', 'cafezal', 'lencois', 'campos', 'sakura', 'spring', 'python', 'japan', 'vale', 'savana', 'bosque', 'campo', 'quintal', 'fazenda', 'natureza', 'mata', 'terreiro', 'dunas', 'cachoeira', 'canyon', 'caatinga', 'pantano', 'morro', 'feira'];
    let kinds;
    if (Array.isArray(d.flora)) {
      kinds = d.flora;
    } else {
      kinds = [];
      const lower = (id + ' ' + (d.name || '') + ' ' + group).toLowerCase();
      let biomeMatch = false;
      for (const key of Object.keys(biomeFlora)) {
        if (lower.indexOf(key) >= 0) { kinds = biomeFlora[key]; biomeMatch = true; break; }
      }
      if (!biomeMatch && NATURAL_KW.some((k) => lower.indexOf(k) >= 0)) kinds = ['grass', 'flower_red', 'clover'];
    }
    const count = d.floraCount || (kinds.length ? 14 : 0);
    const span = this.W || 960;
    for (let i = 0; i < count; i++) {
      const k = kinds[i % kinds.length] || 'grass';
      const x = Math.random() * span;
      this.flora.push({
        k,
        x,
        y: gy - 2 - Math.random() * 6,
        baseY: gy - 2,
        ph: Math.random() * 6,
        sway: k === 'grass_tall' ? 0.05 : (0.03 + Math.random() * 0.05),
        amp: k === 'grass_tall' ? 5 : (k === 'mushroom' ? 1 : (2 + Math.random() * 4)),
        dir: Math.random() < 0.5 ? -1 : 1,
        life: 0,
        swaying: 0,
        scale: k === 'grass_tall' ? 1.4 : (k === 'mushroom' ? 1.1 : 1),
      });
    }
  }
  frameRect() {
    const d = this.def;
    if (!this.usingSheet) return [0, 0, this.img.naturalWidth || this.W, this.img.naturalHeight || this.H];
    const f = this.reducedFlag ? 0 : Math.floor(this.t / (60 / (d.fps || 10))) % d.frames;
    return [(f % d.cols) * d.frameW, Math.floor(f / d.cols) * d.frameH, d.frameW, d.frameH];
  }
  update(weather) {
    this.t++;
    if (this.crowd && this.crowdHype > 0) this.crowdHype--;
    const d = this.def;
    const want = Math.round((this.reducedFlag ? 18 : 110) * ((this.game && this.game.qAmb) || 1)); /* qualidade baixa/alta muda os motes de ambiente */
    const kinds = [];
    if (d.embers) kinds.push('ember');
    if (d.petals) kinds.push('petal');
    if (d.bubbles) kinds.push('bubble');
    if (d.fireflies) kinds.push('firefly');
    if (d.flora || d.flowers) kinds.push('flor', 'grama', 'folha');
    /* AMBIENCIA v2: neon piscando, barras de glitch, chuva de codigo,
       poeira de luz — cada mapa ganha vida propria. */
    if (d.neon) kinds.push('neon');
    if (d.glitch) kinds.push('glitch');
    if (d.code) kinds.push('code');
    if (d.motes !== false) kinds.push('mote'); /* poeira de luz em TODOS os palcos (a menos que o mapa desligue) */
    if (d.sparks) kinds.push('sparkd');
    if (kinds.length && this.ambient.length < want && this.t % 4 === 0) {
      const k = kinds[(Math.random() * kinds.length) | 0];
      const y0 = (k === 'ember' || k === 'bubble' || k === 'sparkd') ? this.H + 10
        : (k === 'petal' || k === 'code') ? -10
        : (k === 'firefly' ? 40 + Math.random() * 120
        : (k === 'glitch' ? Math.random() * this.H * 0.5 : 120 + Math.random() * 300));
      this.ambient.push({ k, x: Math.random() * this.W, y: y0, life: 0, ph: Math.random() * 6, s: Math.random(), w: k === 'glitch' ? 40 + Math.random() * 160 : 0, h: k === 'glitch' ? 2 + Math.random() * 5 : 0 });
    }
    const wind = weather ? weather.wind : 0;
    this._wind = wind;
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
      const tank = this.def.bubbles || this.def.id === '03-underwater-lab' || this.def.id === 'abismo-das-baleias';
      if (f.kind === 'fish' && f.swim) f.y = f.homeY + Math.sin(f.ph * 2) * 4;
      else if (f.kind === 'fish' && !tank) {
        if (f.hop > 0) { f.hop--; f.y -= 2.2; }
        else if (f.y < f.homeY) f.y += 1.6;
        else if (Math.random() < 0.004) f.hop = 22;
      }
      if (f.x < -60) f.x = this.W + 50;
      if (f.x > this.W + 60) f.x = -50;
    }
    /* FLORA: flores e grama balançam com vento e reagem a golpes */
    if (this.floraShake > 0) this.floraShake *= 0.9;
    const floraWind = wind * 0.5 + (this.floraShake > 0 ? Math.sin(this.t * 0.3) * 1.5 : 0);
    for (const pl of this.flora) {
      pl.ph += pl.sway;
      pl.x += Math.sin(pl.ph) * pl.sway * 0.5 + floraWind * 0.3;
      if (pl.swaying > 0) {
        pl.swaying--;
        pl.x += pl.dir * (pl.amp * 2);
      }
      if (pl.x < 10) pl.x = 10;
      if (pl.x > (this.W || 960) - 10) pl.x = (this.W || 960) - 10;
    }
    if (this.hitFlash > 0) this.hitFlash--;
  }
  /* TORCIDA (sprite do dono): assets/fauna/torcida.png tem 25 pessoas lado a lado
     (51.2 x 200 cada). Cada arena diz ONDE a torcida fica no proprio desenho:
       torcida: { rows: [{ y, scale, x0, x1, gap }] }
     y = linha dos pes (px de tela), scale sobre 200px de altura, x0..x1 = faixa
     horizontal, gap = passo entre pessoas em fracao da largura (default 0.9).
     Fileiras de tras pra frente na ordem da lista. Pulam quando a luta esquenta. */
  initTorcida() {
    this.crowd = null;
    const t = this.def.torcida;
    if (!t) return;
    this.crowdSheet = new Image();
    this.crowdSheet.src = 'assets/fauna/torcida.png?v=v47-maresprites';
    this.crowdHype = 0;
    const rows = (t && Array.isArray(t.rows) && t.rows.length) ? t.rows : [{ y: 308, scale: 0.3 }];
    /* as fichas sao escritas em 960x540 (chao 458); o preview AO VIVO da selecao
       roda em 480x270: escala tudo pro tamanho real do palco */
    const kx = (this.W || 960) / 960, ky = (this.groundY || 458) / 458;
    this.crowd = rows.map((r, ri) => {
      const scale = Math.min(0.6, r.scale || 0.3) * ky;
      const pw = (1280 / 25) * scale;
      const x0 = (r.x0 == null ? 0 : r.x0) * kx;
      const x1 = r.x1 == null ? this.W : r.x1 * kx;
      const step = Math.max(1, pw * (r.gap || 0.9));
      const people = [];
      let prev = -1;
      let h = (ri + 1) * 2654435761 >>> 0;
      for (let x = x0, k = 0; x + pw <= x1 + 0.5; x += step, k++) { /* pessoa inteira dentro da faixa */
        h = (h * 1664525 + 1013904223) >>> 0;
        let who = h % 25;
        if (who === prev) who = (who + 7) % 25; /* nunca a mesma pessoa lado a lado */
        prev = who;
        people.push({ who, x: Math.round(x), ph: (h >>> 8) % 628 / 100, speed: 0.8 + ((h >>> 16) % 60) / 100 });
      }
      return { y: r.y * ky, scale, people };
    });
  }
  drawTorcida(ctx) {
    if (!this.crowd || !this.crowdSheet || !this.crowdSheet.width) return;
    const hype = this.crowdHype > 0;
    const PW = this.crowdSheet.width / 25;
    const SH = this.crowdSheet.height;
    const reduced = this.reducedFlag;
    for (const row of this.crowd) {
      const w = PW * row.scale;
      const h = SH * row.scale;
      for (const p of row.people) {
        const jump = reduced ? 0 : hype
          ? Math.abs(Math.sin(this.t * 0.3 * p.speed + p.ph)) * 10 * row.scale
          : Math.max(0, Math.sin(this.t * 0.025 * p.speed + p.ph)) * 1.2;
        ctx.drawImage(this.crowdSheet, p.who * PW, 0, PW, SH, p.x, Math.round(row.y - h - jump), w, h);
      }
    }
  }
  drawFlora(ctx) {
    if (!this.flora || !this.flora.length) return;
    const gy = this.groundY || 458;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    /* Arte real da pasta flora/ (atlas assets/fauna/flora.png, gerado por
       tools/build_flora_atlas.py): linha por tipo, 4 variantes por linha.
       Se o atlas nao carregou, cai no desenho vetorial de antes. */
    const sprReady = typeof Art !== 'undefined' && Art.ready('flora');
    for (let fi = 0; fi < this.flora.length; fi++) {
      const pl = this.flora[fi];
      const xx = pl.x;
      const yy = pl.y - (pl.swaying > 0 ? 2 : 0);
      const sway = Math.sin(this.t * pl.sway + pl.ph) * pl.amp * (pl.swaying > 0 ? 2 : 1);
      const a = 0.85 + Math.sin(this.t * 0.05 + pl.ph) * 0.1;
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(xx + sway, yy);
      const sprRow = StageRenderer.FLORA_SPR_ROW[pl.k];
      if (sprReady && sprRow != null) {
        const sc = pl.scale * (pl.k === 'grass_tall' ? 0.55 : 0.32);
        Art.cell(ctx, 'flora', sprRow, fi % 4, 0, 0, {
          scale: sc,
          dir: pl.dir,
          anchor: 'bottom',
          rot: Math.sin(this.t * pl.sway + pl.ph) * 0.06,
        });
        ctx.restore();
        continue;
      }
      if (pl.k === 'grass') {
        ctx.fillStyle = '#7cb342';
        ctx.fillRect(-1, 0, 3, 10 + Math.sin(this.t * 0.1 + pl.ph) * 2);
        ctx.fillStyle = '#689f38';
        ctx.fillRect(1, 2, 2, 8 + Math.sin(this.t * 0.1 + pl.ph + 1) * 2);
      } else if (pl.k === 'grass_tall') {
        const h = 16 + Math.sin(this.t * 0.08 + pl.ph) * 3;
        ctx.fillStyle = '#689f38';
        ctx.fillRect(-2, 0, 5, h);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, 3, h - 4);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(-1, h - 6, 7, 4);
      } else if (pl.k === 'flower_red') {
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.arc(0, -4, 3 + Math.sin(this.t * 0.1 + pl.ph) * 0.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(0, -4, 1.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#558b2f';
        ctx.fillRect(-0.5, 0, 1, 6);
      } else if (pl.k === 'flower_yellow') {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(0, -4, 3 + Math.sin(this.t * 0.1 + pl.ph) * 0.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.arc(0, -4, 1.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#558b2f';
        ctx.fillRect(-0.5, 0, 1, 6);
      } else if (pl.k === 'mushroom') {
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.arc(0, -6, 5, 0, Math.PI, false);
        ctx.fill();
        ctx.fillStyle = '#4a148c';
        ctx.fillRect(-1, -6, 2, 8);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(-0.5, 2, 1, 4);
      } else if (pl.k === 'clover') {
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(-2, -3, 2.5, 0, 6.28);
        ctx.arc(2, -3, 2.5, 0, 6.28);
        ctx.arc(0, -5, 2.5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(-0.5, -2, 1, 4);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  react(power) {
    this.hitFlash = Math.max(this.hitFlash, power >= 11 ? 10 : 5);
    this.floraShake = Math.max(this.floraShake, power >= 12 ? 60 : 20);
    if (this.crowd) {
      const wasHype = this.crowdHype > 0;
      this.crowdHype = Math.max(this.crowdHype, power >= 8 ? 60 : 24);
      /* torcida vibra no golpe forte (som 'crowd', com throttle pra nao spammar) */
      const g = this.game;
      if (!wasHype && power >= 8 && g && g.audio && g.audio.play && (!this._cheerAt || this.t - this._cheerAt > 90)) {
        this._cheerAt = this.t;
        try { g.audio.play('crowd', { vol: 0.22 }); } catch (e) {}
      }
    }
    if (power < 11) return;
    /* FAUNA INTERATIVA: assusta bichos proximos a golpes fortes */
    if (this.liveFauna) {
      const r = power >= 15 ? 220 : 140;
      for (const a of this.liveFauna.animals) {
        if (a.state === 'gone' || a.scared > 0) continue;
        if (Math.abs(a.x - (this.game ? this.game.W / 2 : 480)) < r && Math.random() < 0.5) {
          a.state = 'flee'; a.scared = 240 + Math.random() * 180;
          a.vx = (a.x < 480 ? -1 : 1) * (a.k === 'bird' || a.k === 'pigeon' ? 5 : 3.4);
          a.dir = a.vx < 0 ? -1 : 1;
          if (a.k === 'pigeon' || a.k === 'bird') { a.vy = -3.2; a.flying = true; }
        }
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
    this._cam = camX || 0; /* fundo vivo (stage-extras) acompanha o parallax */
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
      this.layers.forEach((layer, li) => {
        const dw = W * z;
        const dh = H * z;
        /* VIDA: cada camada oscila devagar no proprio ritmo (fundo respira, frente quase parada) */
        const drift = this.reducedFlag ? 0 : Math.sin(this.t * 0.0026 + li * 1.9) * (6 - li * 1.8);
        const bob = this.reducedFlag ? 0 : Math.sin(this.t * 0.0019 + li * 2.3) * (li === 0 ? 2 : 0.8);
        this.blitWide(ctx, layer.img, 0, 0, layer.img.naturalWidth || W, layer.img.naturalHeight || H, (W - dw) / 2 + drift, (H - dh) * 0.85 + (layer.y || 0) + bob, dw, dh, camX, layer.speed);
      });
    } else if (this.ready) {
      const [sx, sy, sw, sh] = this.frameRect();
      const breathe = this.reducedFlag ? 0 : Math.sin(this.t * 0.004) * 0.002;
      const z = 1.08 + breathe + (zoomPulse || 0) * 0.01;
      const dw = W * z;
      const dh = H * z;
      const ox = (W - dw) / 2;
      const oy = (H - dh) * 0.85;
      ctx.save();
      const drift = this.reducedFlag ? 0 : Math.sin(this.t * 0.0026) * 5; /* VIDA: fundo de imagem unica tambem respira */
      this.blitWide(ctx, this.img, sx, sy, sw, sh, ox + drift, oy, dw, dh, camX, 0.16);
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
      if (f.kind === 'bird') Art.fx2(ctx, 'birds', f.row, Math.floor(this.t / 6 + f.ph), f.x, f.y, { scale: 1.05 * f.s, dir });
      else Art.cell(ctx, 'fauna', f.row, Math.floor(this.t / 4 + f.ph), f.x, f.y, { scale: 1.05 * f.s, dir: -dir });
    }
    /* CEU POR TEMA: gradiente de cor no topo do palco (cacheado, 1 retangulo por frame) */
    if (this._skyGrad == null) this._skyGrad = this.buildSkyGradient(ctx);
    if (this._skyGrad) {
      ctx.save();
      ctx.fillStyle = this._skyGrad;
      ctx.fillRect(0, 0, W, H * 0.75);
      ctx.restore();
    }
    /* FLORA: desenha flores e grama no chao */
    this.drawFlora(ctx);
    if (!this.reducedFlag) {
      // Tint leve, source-over e limitado à área acima do piso: custa menos
      // que uma blendagem avançada em toda a tela e deixa os masters legíveis.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.035 + Math.sin(this.t * 0.008) * 0.006;
      ctx.fillStyle = this.def.tint || '#ffffff';
      ctx.fillRect(0, 0, W, Math.min(H, this.groundY + 8));
      ctx.globalAlpha = 1;
    }
    /* aurora boreal: ceu de noite + cortinas ATRAS da torcida e dos lutadores */
    if (this.game && this.game.weather && this.game.weather.drawSky) this.game.weather.drawSky(ctx);
    this.drawTorcida(ctx);
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
    this.drawLights(ctx, camX);
    if (this.liveFauna) this.liveFauna.draw(ctx, 'back');
    ctx.restore();
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
    if (this.liveFauna) this.liveFauna.draw(ctx, 'front');
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
      else if (p.k === 'firefly') {
        const blink = [1, 2, 3, 2, 1, 0];
        const f = blink[Math.floor(p.life * 0.12 + p.ph * 3) % blink.length];
        Art.cell(ctx, 'fx2:firefly', 1, 0, p.x, p.y, { scale: 1, add: true, alpha: 0.8 * a });
        Art.cell(ctx, 'fx2:firefly', 0, f, p.x, p.y, { scale: 1, alpha: a });
      }
      else { const gl = 0.5 + Math.sin(p.life * 0.1 + p.ph) * 0.5; ctx.fillStyle = `rgba(210,255,120,${gl * a})`; ctx.fillRect(p.x, p.y, 3, 3); }
    }
    ctx.restore();
  }
  /* CEU POR TEMA: gradiente sutil no topo do palco muda a "cara" do mapa
     (neve fria, forja laranja, pôr do sol rosa no parque, noite indigo...).
     Cacheado no 1o frame: 1 createLinearGradient + 1 fillRect por frame. */
  buildSkyGradient(ctx) {
    const d = this.def || {};
    const t = ((d.id || '') + ' ' + (d.name || '') + ' ' + (d.group || '')).toLowerCase();
    const stops = StageRenderer.skyFor(t, d.tint || '#ffffff');
    const g = ctx.createLinearGradient(0, 0, 0, (this.H || 540) * 0.78);
    for (const [col, at] of stops) g.addColorStop(at, col);
    return g;
  }
  /* CAMADA FOREGROUND: tufos altos de grama nas bordas, NA FRENTE dos lutadores,
     com parallax rapido e leve blur — profundidade de palco 2D. So em mapa
     natural (onde existe flora). */
  makeForeground() {
    this.foreground = [];
    if (!this.flora || !this.flora.length) return;
    const gy = this.groundY || 458;
    const W = this.W || 960;
    const rows = [StageRenderer.FLORA_SPR_ROW.grass_tall, StageRenderer.FLORA_SPR_ROW.grass, StageRenderer.FLORA_SPR_ROW.clover];
    const n = 4 + ((Math.random() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const leftSide = i % 2 === 0;
      this.foreground.push({
        row: rows[(Math.random() * rows.length) | 0] || 0,
        x: leftSide ? -30 + Math.random() * 170 : W - 140 + Math.random() * 170,
        y: gy + 6 + Math.random() * 10,
        scale: 2.6 + Math.random() * 1.8,
        dir: Math.random() < 0.5 ? -1 : 1,
        ph: Math.random() * 6,
        col: (Math.random() * 4) | 0,
      });
    }
  }
  drawForeground(ctx, camX) {
    if (!this.foreground.length) return;
    const gy = this.groundY || 458;
    const wind = (this._wind || 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (!this.reducedFlag && ctx.filter !== undefined) { try { ctx.filter = 'blur(1.2px)'; } catch (e) {} }
    const sprReady = typeof Art !== 'undefined' && Art.ready('flora');
    for (const t of this.foreground) {
      const sway = this.reducedFlag ? 0 : (Math.sin(this.t * 0.045 + t.ph) * 7 + wind * 2.2);
      ctx.save();
      ctx.globalAlpha = 0.96;
      ctx.translate(t.x - camX * 26 + sway, t.y);
      if (sprReady) {
        Art.cell(ctx, 'flora', t.row, t.col, 0, 0, { scale: t.scale * 0.55, dir: t.dir, anchor: 'bottom', rot: sway * 0.012 });
      } else {
        /* fallback vetorial: tufo alto de grama */
        const h = 26 * t.scale * 0.4;
        ctx.fillStyle = '#4e8f2f';
        ctx.fillRect(-3, -h, 6, h);
        ctx.fillStyle = '#6ab04c';
        ctx.fillRect(0, -h * 0.85, 4, h * 0.85);
        ctx.fillStyle = '#3c7023';
        ctx.fillRect(-6, -h * 0.6, 4, h * 0.6);
      }
      ctx.restore();
    }
    try { ctx.filter = 'none'; } catch (e) {}
    ctx.restore();
  }
  /* LUZES DINAMICAS: luzes declaradas no mapa (def.lights) viram fontes de
     luz: halo aditivo pulsante ao redor da fonte e poça de luz no piso. */
  buildLights() {
    const d = this.def || {};
    const list = [];
    for (const L of (d.lights || [])) {
      list.push({ x: L.x, y: L.y, r: L.r || 110, color: L.color || '255,220,150', pulse: L.pulse == null ? 1 : L.pulse, ph: L.x * 0.013 + (L.y || 0) * 0.007 });
    }
    return list;
  }
  /* Halo/poça de cada luz cacheados em offscreen canvas (criados 1x): com FPS
     ilimitado (120/144/240 Hz) o render nao recria gradiente por frame. */
  _lightSprite(L, alpha) {
    if (!L._halo && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = c.height = Math.ceil(L.r * 2);
      const x = c.getContext('2d');
      const g = x.createRadialGradient(L.r, L.r, 0, L.r, L.r, L.r);
      g.addColorStop(0, 'rgba(' + L.color + ',' + alpha + ')');
      g.addColorStop(1, 'rgba(' + L.color + ',0)');
      x.fillStyle = g;
      x.fillRect(0, 0, L.r * 2, L.r * 2);
      L._halo = c;
    }
    return L._halo;
  }
  drawLights(ctx, camX) {
    if (!this.lights.length) return;
    const gy = this.groundY;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const L of this.lights) {
      const lx = L.x - camX * 18;
      const still = this.reducedFlag || (this.game && this.game.qFxOn === false); /* qualidade baixa: luzes estaticas, sem pulso */
      const pulse = still ? 1 : (0.82 + 0.18 * Math.sin(this.t * 0.045 * (L.pulse || 1) + L.ph));
      const halo = this._lightSprite(L, 0.16);
      if (halo) {
        ctx.globalAlpha = pulse;
        ctx.drawImage(halo, lx - L.r, L.y - L.r);
        ctx.globalAlpha = 1;
      } else {
        const g = ctx.createRadialGradient(lx, L.y, 0, lx, L.y, L.r);
        g.addColorStop(0, 'rgba(' + L.color + ',' + (0.16 * pulse).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + L.color + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(lx - L.r, L.y - L.r, L.r * 2, L.r * 2);
      }
      if (L.y < gy) {
        const pr = L.r * 0.85;
        if (!L._pool && typeof document !== 'undefined') {
          const c = document.createElement('canvas');
          c.width = c.height = 128;
          const x = c.getContext('2d');
          const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
          g.addColorStop(0, 'rgba(' + L.color + ',0.10)');
          g.addColorStop(1, 'rgba(' + L.color + ',0)');
          x.fillStyle = g;
          x.fillRect(0, 0, 128, 128);
          L._pool = c;
        }
        if (L._pool) {
          ctx.globalAlpha = pulse;
          ctx.drawImage(L._pool, lx - pr, gy + 4 - 12, pr * 2, 24);
          ctx.globalAlpha = 1;
        } else {
          const pg = ctx.createRadialGradient(lx, gy, 0, lx, gy, pr);
          pg.addColorStop(0, 'rgba(' + L.color + ',' + (0.10 * pulse).toFixed(3) + ')');
          pg.addColorStop(1, 'rgba(' + L.color + ',0)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.ellipse(lx, gy + 4, pr, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  /* FEIXES DE LUZ + POEIRA (nov/2026): todo mapa ganha luz descendo do ceu
     balancando devagar e poeira brilhando no ar, na cor da luz do proprio
     mapa. Barato (3 gradientes cacheados + ~24 pontos) e some no perf 2. */
  drawRays(ctx) {
    if (this.reducedFlag || this.perfVignetteOff || !ctx.createLinearGradient || !ctx.moveTo || !ctx.closePath) return;
    const d = this.def || {};
    if (d.rays === false) return;
    const W = this.W, H = this.H;
    if (!this._rays) {
      let h = 0; for (const ch of String(d.id || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      let col = d.rayColor || (d.lights && d.lights[0] && d.lights[0].color) || '#fff2c8';
      if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(String(col))) col = 'rgb(' + col + ')'; /* luzes guardadas como '150,200,255' */
      const left = (h & 1) === 0;
      const mk = (i) => {
        const g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
        try { g.addColorStop(0, col); } catch (e) { g.addColorStop(0, '#fff2c8'); }
        g.addColorStop(1, 'rgba(0,0,0,0)');
        return { g, x: (left ? 0.12 : 0.55) * W + i * W * (0.13 + ((h >> (i + 2)) & 3) * 0.02), w: 70 + ((h >> (i * 3)) & 63), ph: i * 2.1 + (h % 7) };
      };
      this._rays = { list: [mk(0), mk(1), mk(2)], skew: left ? 0.32 : -0.32, motes: Array.from({ length: 24 }, (_, i) => ({ x: ((h >> (i % 16)) * 37 + i * 97) % W, y: (i * 61 + (h % 200)) % (H * 0.8), s: 0.4 + ((i * 13) % 10) / 10, ph: i * 0.7 })), col };
    }
    const R = this._rays, t = this.t;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of R.list) {
      const a = 0.05 + 0.035 * Math.sin(t * 0.012 + r.ph);
      const sway = Math.sin(t * 0.004 + r.ph) * 18;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = r.g;
      ctx.beginPath();
      ctx.moveTo(r.x + sway, -10);
      ctx.lineTo(r.x + sway + r.w, -10);
      ctx.lineTo(r.x + sway + r.w * 1.9 + H * R.skew, H * 0.9);
      ctx.lineTo(r.x + sway + H * R.skew, H * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#fff4dc"; /* poeira em branco quente: com luz rosada ela virava pontinho magenta */
    for (const m of R.motes) {
      const y = (m.y - t * 0.15 * m.s + H * 2) % (H * 0.85);
      const x = m.x + Math.sin(t * 0.01 + m.ph) * 12;
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.03 + m.ph));
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }
  drawVignette(ctx) {
    if (this.perfVignetteOff) return; /* modo performance nivel 2 */
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
    /* DRAMA (HP baixo / round final): escurece mais as bordas, clima de cinema */
    if (this.drama && !this.reducedFlag) {
      const g = ctx.createRadialGradient(this.W / 2, this.H * 0.5, this.H * 0.3, this.W / 2, this.H * 0.5, this.W * 0.78);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(10,4,18,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }
}

/* Linhas do atlas de flora (assets/fauna/flora.png, gerado por
   tools/build_flora_atlas.py a partir de flora/flores.png + flora/grama.png)
   por tipo de planta; tipos sem linha caem no desenho vetorial. */
StageRenderer.FLORA_SPR_ROW = { grass: 0, grass_tall: 1, flower_red: 2, flower_yellow: 3, clover: 4 };

/* Paleta de ceu por tema do palco: [regex no id+nome+grupo, stops [[rgba, offset]...]]
   (topo -> horizonte). O ultimo fallback deriva a cor do proprio tint do mapa. */
StageRenderer.skyFor = (text, tint) => {
  const themes = [
    [/underwater|abismo|baleia|submarino/, [['rgba(24,96,170,0.36)', 0], ['rgba(10,44,96,0.14)', 0.55], ['rgba(0,0,0,0)', 1]]],
    [/kernel|neve|snow|artico|artic|ice|gelo|granizo|hail/, [['rgba(150,205,255,0.30)', 0], ['rgba(205,232,255,0.12)', 0.55], ['rgba(0,0,0,0)', 1]]],
    [/storm|tempestade/, [['rgba(26,34,64,0.34)', 0], ['rgba(48,58,96,0.12)', 0.6], ['rgba(0,0,0,0)', 1]]],
    [/volcan|forja|lava|rust|fundi|molten|calor|heat|deserto/, [['rgba(255,110,30,0.30)', 0], ['rgba(255,64,12,0.12)', 0.55], ['rgba(0,0,0,0)', 1]]],
    [/neon|cyber|chrome|cromada|codigo|datacenter|glitch|exe|placa-mae|hack/, [['rgba(255,79,216,0.22)', 0], ['rgba(63,208,255,0.14)', 0.5], ['rgba(0,0,0,0)', 1]]],
    [/noite|night|biblioteca|madrugada|halloween|cemiterio/, [['rgba(14,10,44,0.40)', 0], ['rgba(52,26,92,0.14)', 0.55], ['rgba(0,0,0,0)', 1]]],
    [/sakura|japan|parque|lago|floresta|forest|jardim|spring|python|pantano|manguezal|doca|iguacu|tijuca|bosque|sitio|cafezal|paraty|bonito|serra|mirante|chapada|lencois|campos|vale|praia|dunas|parque de divers/, [['rgba(255,150,185,0.30)', 0], ['rgba(255,120,110,0.13)', 0.5], ['rgba(0,0,0,0)', 1]]],
    [/circo|pizzaria|cafe|mercado|feira|terminal|metro|oficina|sesi|senai|quadra|escola|pista|estacao|trabalho|area|hive|colmeia|docker|porto/, [['rgba(255,190,90,0.18)', 0], ['rgba(255,150,60,0.07)', 0.55], ['rgba(0,0,0,0)', 1]]],
  ];
  for (const [re, stops] of themes) if (re.test(text)) return stops;
  /* fallback: deriva do tint do mapa (topo um pouco mais forte, some no horizonte) */
  const m = /^#([0-9a-f]{6})$/i.exec(tint || '');
  if (m) {
    const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
    return [['rgba(' + r + ',' + g + ',' + b + ',0.26)', 0], ['rgba(' + r + ',' + g + ',' + b + ',0.09)', 0.55], ['rgba(' + r + ',' + g + ',' + b + ',0)', 1]];
  }
  return [['rgba(255,255,255,0.10)', 0], ['rgba(255,255,255,0)', 1]];
};
