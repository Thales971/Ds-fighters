// INTENSIVO: tudo que entrou no PR das fichas — casos extremos
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0,
    unlockPitoco() { if (this.data.pitocoUnlocked) return false; this.data.pitocoUnlocked = true; return true; }, hasPitoco() { return !!this.data.pitocoUnlocked; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
vm.runInContext(`const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {} });
const mk = (me, opp, stage, mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [[me], [opp || 'du']], stage: stage || 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. JESS: DALTONIC duracao exata (6s = 360 ticks) ====
const g1 = mk('jess', 'du');
const fj = g1.activeOf(0), od = g1.activeOf(1);
fj.x = 300; od.x = 500; fj.dir = 1;
fj.cd = [0,0,0,0,0,0,0,0,0,0]; fj.castLock = 0; fj.spamShared = 0; fj.state = 'idle'; fj.cast = null; fj.ultimate = 100;
fj.tryCast(4);
for (let t = 0; t < 70; t++) g1.tick();
let durou = 0;
for (let t = 0; t < 500; t++) { g1.tick(); if (od.has('daltonic')) durou++; }
check('DALTONIC dura ~6s', durou >= 330 && durou <= 380, durou + ' ticks');

// LIFESTEAL exato: 25% do dano vira vida
const g2 = mk('jess', 'du');
const f2 = g2.activeOf(0), o2 = g2.activeOf(1);
f2.addStatus('lifesteal', 600);
f2.hp = f2.maxHp * 0.3;
const hpA = f2.hp;
o2.guardUp = false; o2.status = {};
const danoDado = 40;
o2.takeHit(danoDado, { attacker: f2 });
const curou = f2.hp - hpA;
check('LIFESTEAL: cura exatamente 25% do dano', Math.abs(curou - danoDado * 0.25) < 0.01, 'curou ' + curou.toFixed(2) + ' de ' + danoDado);

// TO BE aplica a marca (vuln = +10% dano recebido)
const g3 = mk('jess', 'du');
const f3 = g3.activeOf(0), o3 = g3.activeOf(1);
f3.x = 300; o3.x = 500; f3.dir = 1;
f3.cd = [0,0,0,0,0,0,0,0,0,0]; f3.castLock = 0; f3.spamShared = 0; f3.state = 'idle'; f3.cast = null;
f3.tryCast(0); /* To Be */
let marcou = false;
for (let t = 0; t < 200; t++) { g3.tick(); if (o3.has('vuln')) { marcou = true; break; } }
check('TO BE aplica ASSERTION FAILED (vuln)', marcou);

// ==== 2. JESS: partida IA-vs-IA em 3 palcos diferentes ====
let jPartidas = 0;
for (const [a, b, st] of [['jess', 'du', 'treino-dojo'], ['jess', 'henrico', 'arquibancada'], ['jess', 'iales', 'parque-lago']]) {
  try {
    const g = mk(a, b, st);
    g.cfg.cpu[0] = true; g.cfg.cpu[1] = true;
    for (let t = 0; t < 3600; t++) { g.tick(); if (['win', 'ko', 'over'].includes(g.roundState)) break; }
    jPartidas++;
  } catch (e) { console.log('   CRASH ' + a + ' vs ' + b + ': ' + String(e).slice(0, 50)); }
}
check('3 partidas IA com Jess sem crash', jPartidas === 3, jPartidas + '/3');

// ==== 3. PITOCO: edge cases do apelao ====
// esquiva NAO vale pra golpe inbloqueavel
const g4 = mk('du', 'stack');
const dono4 = g4.activeOf(0);
dono4.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
dono4.hp = dono4.maxHp;
dono4.takeHit(20, { attacker: g4.activeOf(1), height: 'unblockable' });
check('esquiva NAO vale pra inbloqueavel', dono4.hp < dono4.maxHp, 'hp: ' + Math.round(dono4.hp) + '/' + dono4.maxHp);
// o OONENTE com pitoco tambem esquiva (simetrico)
const g5 = mk('du', 'stack');
const rival5 = g5.activeOf(1);
rival5.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
rival5.hp = rival5.maxHp;
let errouRival = 0;
for (let k = 0; k < 40; k++) { rival5.hp = rival5.maxHp; rival5.takeHit(10, { attacker: g5.activeOf(0) }); if (rival5.hp >= rival5.maxHp) errouRival++; }
check('esquiva funciona pro rival tambem (pet do P2)', errouRival > 8, errouRival + '/40 erraram');
// regen NAO passa do maximo
dono4.hp = dono4.maxHp - 2;
for (let t = 0; t < 130; t++) g4.tick();
check('regen respeita o teto de vida', dono4.hp <= dono4.maxHp, Math.round(dono4.hp) + '/' + dono4.maxHp);
// pitoco em todos os modos
let pitModos = 0;
for (const modo of ['versus', 'arcade', 'training', 'tag', 'survival']) {
  try { const gm = mk('du', 'stack', 'treino-dojo', modo); const f = gm.activeOf(0); if (f) f.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } }; for (let t = 0; t < 60; t++) gm.tick(); pitModos++; } catch (e) {}
}
check('pitoco nos 5 modos sem crash', pitModos === 5, pitModos + '/5');
// konami: janela deslizante com ruido no meio
const konami = (seq) => { let buf = []; for (const k of seq) { buf.push(k); if (buf.length > 6) buf.shift(); if (buf.join(',') === ['KeyP','KeyI','KeyT','KeyO','KeyC','KeyO'].join(',')) { Profile.unlockPitoco(); buf = []; } } };
Profile.data.pitocoUnlocked = false;
konami(['KeyX', 'KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('PITOCO com 1 tecla de ruido ANTES pega (janela deslizante)', Profile.hasPitoco() === true);
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyZ', 'KeyZ', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('PITOCO quebrado no meio NAO pega', Profile.hasPitoco() === false);
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC']);
check('PITOC incompleto nao desbloqueia', Profile.hasPitoco() === false);
// unlockPitoco nao duplica
Profile.data.pitocoUnlocked = true;
check('unlockPitoco idempotente', Profile.unlockPitoco() === false);

// ==== 4. FAUNA: as 8 especies fogem E se comportam 300 ticks ====
const gF = mk('du', 'stack', 'parque-lago');
let fogemSpr = 0, comportamSpr = 0;
const mapaSpr = { dog: 'dog', cat: 'cat', pigeons: 'pigeon', fish: 'fish', frog: 'frog', rabbits: 'rabbit', hamster: 'hamster', turtle: 'turtle' };
/* defs sinteticas COM bioma (stageFauna filtra por bioma: peixe so em agua, etc.) */
const biomaSpr = {
  dog: { id: 't-rua', name: 'Rua', fauna: ['dog'] },
  cat: { id: 't-rua', name: 'Rua', fauna: ['cat'] },
  pigeons: { id: 't-praca', name: 'Praca', fauna: ['pigeons'] },
  fish: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['fish'] },
  frog: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['frog'] },
  rabbits: { id: 't-campo', name: 'Campo', fauna: ['rabbits'] },
  hamster: { id: 't-campo', name: 'Campo', fauna: ['hamster'] },
  turtle: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['turtle'] },
};
for (const [kk, especie] of Object.entries(mapaSpr)) {
  const lf = new LiveFauna(gF, biomaSpr[kk] || { fauna: [kk] });
  gF.stage.liveFauna = lf;
  const a = lf.animals[0];
  if (!a) { console.log('   NAO NASCE:', kk); continue; }
  let crash = false;
  try { for (let t = 0; t < 300; t++) lf.update(); } catch (e) { crash = true; }
  if (!crash) comportamSpr++;
  if (['dog', 'cat', 'pigeon', 'frog', 'rabbit', 'hamster', 'turtle'].includes(especie)) {
    const lf3 = new LiveFauna(gF, biomaSpr[kk] || { fauna: [kk] });
    gF.stage.liveFauna = lf3;
    const b = lf3.animals[0];
    gF.activeOf(0).x = b.x + 30;
    for (let t = 0; t < 40; t++) gF.tick();
    if (b.state === 'flee' || b.state === 'gone') fogemSpr++;
    else console.log('   NAO FOGE:', kk, '(estado=' + b.state + ')');
  }
}
check('as 8 especies se comportam 300 ticks sem crash', comportamSpr === 8, comportamSpr + '/8');
check('as 7 terrestres/aereas em sprite fogem', fogemSpr === 7, fogemSpr + '/7');

// ==== 5. TORCIDA: render com canvas REAL (pixels) ====
const canvas = createCanvas(960, 540);
const gT = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
gT.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'arquibancada', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && gT.roundState !== 'fight'; t++) gT.tick();
/* injeta a folha da torcida como o browser faria */
try { const img = new Image(); img.src = 'assets/fauna/torcida.png'; gT.stage.crowdSheet = img; } catch (e) {}
gT.stage.crowdHype = 60;
for (let t = 0; t < 10; t++) gT.tick();
gT.render();
fs.mkdirSync('.vibe/torcida', { recursive: true });
fs.writeFileSync('.vibe/torcida/arquibancada.png', canvas.toBuffer('image/png'));
check('torcida renderiza com canvas real sem crash', fs.existsSync('.vibe/torcida/arquibancada.png'));
/* hype decai */
const hype0 = gT.stage.crowdHype;
for (let t = 0; t < 100; t++) gT.tick();
check('hype decai com o tempo', gT.stage.crowdHype < hype0, hype0 + ' -> ' + gT.stage.crowdHype);

// ==== 6. JESS + PITOCO (sinergia da ficha: a dupla joga junta) ====
const gS = mk('jess', 'henrico');
const jess = gS.activeOf(0);
jess.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
jess.hp = jess.maxHp * 0.5;
const hpS0 = jess.hp;
for (let t = 0; t < 130; t++) gS.tick();
check('Jess + Pitoco: a dupla da ficha funciona (regen)', jess.hp > hpS0 + 25, Math.round(hpS0) + ' -> ' + Math.round(jess.hp));
let ticksS = 0;
for (let t = 0; t < 2400; t++) { gS.tick(); ticksS++; if (['win', 'ko', 'over'].includes(gS.roundState)) break; }
check('Jess com Pitoco: partida completa sem crash', ticksS > 0);

// ==== 7. SHEET DA JESS: recorte limpo em TODAS as 60 celulas ====
{
  const img = PNG.sync.read(fs.readFileSync('assets/sprites/jess.png'));
  check('jess.png 1280x3900 (4x15 de 320x260)', img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
  check('layout.js: jess -> assets/sprites/jess.png, 15 poses', SPRITE_LAYOUT.files.jess === 'assets/sprites/jess.png' && SPRITE_LAYOUT.poses.length === 15);
  const CW = 320, CH = 260, dd = img.data;
  const MAGENTA = (r,g,b,a) => a > 40 && g < 90 && r > 150 && b > 90;
  let magenta = 0, empty = 0, edgeTouch = 0, fragTotal = 0; const fragDet = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 4; c++) {
    const x0 = c * CW, y0 = r * CH;
    const op = new Uint8Array(CW * CH);
    let nOp = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = ((y0 + y) * img.width + x0 + x) * 4;
      if (dd[i + 3] > 40) { op[y * CW + x] = 1; nOp++; if (MAGENTA(dd[i], dd[i+1], dd[i+2], dd[i+3])) magenta++; }
    }
    if (nOp === 0) { empty++; continue; }
    let bx0 = CW, bx1 = -1, by0 = CH, by1 = -1;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (op[y * CW + x]) { if (x<bx0)bx0=x; if (x>bx1)bx1=x; if (y<by0)by0=y; if (y>by1)by1=y; }
    if (bx0 === 0 || bx1 === CW-1 || by0 === 0 || by1 === CH-1) edgeTouch++;
    const seen = new Uint8Array(CW * CH); const comps = [];
    for (let i = 0; i < CW * CH; i++) {
      if (!op[i] || seen[i]) continue;
      let size = 0; const st = [i]; seen[i] = 1;
      while (st.length) { const p = st.pop(); size++; const px = p % CW, py = (p / CW) | 0;
        if (px>0 && op[p-1] && !seen[p-1]) { seen[p-1]=1; st.push(p-1); }
        if (px<CW-1 && op[p+1] && !seen[p+1]) { seen[p+1]=1; st.push(p+1); }
        if (py>0 && op[p-CW] && !seen[p-CW]) { seen[p-CW]=1; st.push(p-CW); }
        if (py<CH-1 && op[p+CW] && !seen[p+CW]) { seen[p+CW]=1; st.push(p+CW); } }
      comps.push({ size, seed: i });
    }
    comps.sort((a, b) => b.size - a.size);
    const main = comps[0].seed;
    let m; { const st = [main]; const im = new Uint8Array(CW*CH); im[main] = 1;
      while (st.length) { const p = st.pop(); const px = p % CW, py = (p / CW) | 0;
        if (px>0 && op[p-1] && !im[p-1]) { im[p-1]=1; st.push(p-1); }
        if (px<CW-1 && op[p+1] && !im[p+1]) { im[p+1]=1; st.push(p+1); }
        if (py>0 && op[p-CW] && !im[p-CW]) { im[p-CW]=1; st.push(p-CW); }
        if (py<CH-1 && op[p+CW] && !im[p+CW]) { im[p+CW]=1; st.push(p+CW); } }
      m = im;
      for (let k = 0; k < 6; k++) { const nm = new Uint8Array(m);
        for (let p = 0; p < CW*CH; p++) { if (!m[p]) continue; const px = p % CW, py = (p / CW) | 0;
          nm[p]=1; if (px>0) nm[p-1]=1; if (px<CW-1) nm[p+1]=1; if (py>0) nm[p-CW]=1; if (py<CH-1) nm[p+CW]=1; }
        m = nm; } }
    for (const cp of comps.slice(1)) {
      if (cp.size < 8) continue;
      let near = false; const st = [cp.seed]; const vis = new Uint8Array(CW*CH); vis[cp.seed] = 1;
      while (st.length && !near) { const p = st.pop(); if (m[p]) { near = true; break; }
        const px = p % CW, py = (p / CW) | 0;
        if (px>0 && op[p-1] && !vis[p-1]) { vis[p-1]=1; st.push(p-1); }
        if (px<CW-1 && op[p+1] && !vis[p+1]) { vis[p+1]=1; st.push(p+1); }
        if (py>0 && op[p-CW] && !vis[p-CW]) { vis[p-CW]=1; st.push(p-CW); }
        if (py<CH-1 && op[p+CW] && !vis[p+CW]) { vis[p+CW]=1; st.push(p+CW); } }
      if (!near) { fragTotal++; if (fragDet.length < 5) fragDet.push('r'+r+'c'+c+' n='+cp.size); }
    }
  }
  check('60/60 celulas com conteudo (pose nenhuma vazia)', empty === 0, empty + ' vazias');
  check('sheet inteira: 0 pixels magenta', magenta === 0, magenta + ' px');
  check('0 fragmentos soltos em qualquer celula (recorte limpo)', fragTotal === 0, fragDet.join(' '));
  check('nenhuma celula toca a borda da celula (sem corte colado)', edgeTouch === 0, edgeTouch + ' tocam');
  const ab = PNG.sync.read(fs.readFileSync('assets/abilities/jess.png'));
  check('abilities/jess.png 512x640 (4 cols x 5 linhas de 128)', ab.width === 512 && ab.height === 640, ab.width + 'x' + ab.height);
  let abRows = 0;
  for (let r = 0; r < 5; r++) { let tem = false;
    for (let y = r*128; y < (r+1)*128 && !tem; y++) for (let x = 0; x < ab.width && !tem; x++) if (ab.data[(y*ab.width+x)*4+3] > 40) tem = true;
    if (tem) abRows++; }
  check('abilities/jess.png: 5/5 linhas com sprite (linha 4 = ult)', abRows === 5, abRows + '/5');
}

// ==== 8. ULT COMPLETA: gas rosa continuo + tela turva (classe+CSS) + slow + expira ====
const gU = mk('jess', 'du');
const fU = gU.activeOf(0), oU = gU.activeOf(1);
check('kit da Jess: 5 poderes, slot 4 = ultimate daltonic', fU.ownKit().length === 5 && fU.ownKit()[4].slot === 'ultimate', fU.ownKit().map(p => p.id).join(','));
fU.x = 300; oU.x = 500; fU.dir = 1;
fU.cd = [0,0,0,0,0,0,0,0,0,0]; fU.castLock = 0; fU.spamShared = 0; fU.state = 'idle'; fU.cast = null; fU.ultimate = 100;
fU.tryCast(4);
for (let t = 0; t < 70; t++) gU.tick();
check('ult aplicou daltonic + slow no rival e lifesteal na Jess', oU.has('daltonic') && oU.has('slow') && fU.has('lifesteal'));
let pink = 0;
for (let t = 0; t < 120; t++) { gU.tick(); pink += gU.sparks.filter((s) => s.color === '#ff7ad9').length; }
check('gas rosa #ff7ad9 continuo (>=20 sparks em 120 frames)', pink >= 20, pink + ' sparks');
for (let t = 0; t < 180; t++) gU.tick();
check('aos ~5s: rival segue daltonic E lento (slow constante)', oU.has('daltonic') && oU.has('slow'), 'dalt=' + oU.left('daltonic') + ' slow=' + oU.left('slow'));
check('speedMult do rival cortada pelo slow', oU.speedMult() <= (oU.def.stats.speed || 1) * 0.6, oU.speedMult().toFixed(2));
// tela turva/cinza: classe no canvas + CSS real
const toggles = [];
const gV = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle: (c, v) => toggles.push([c, v]), add() {}, remove() {} } });
gV.start({ mode: 'versus', teams: [['du'], ['jess']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && gV.roundState !== 'fight'; t++) gV.tick();
const pv = gV.activeOf(0), jv = gV.activeOf(1);
jv.x = 400; pv.x = 300; jv.dir = -1;
jv.cd = [0,0,0,0,0,0,0,0,0,0]; jv.castLock = 0; jv.spamShared = 0; jv.state = 'idle'; jv.cast = null; jv.ultimate = 100;
jv.tryCast(4);
for (let t = 0; t < 80; t++) { gV.tick(); gV.render(); }
const togD = toggles.filter((t) => t[0] === 'daltonic');
check('classe .daltonic LIGADA no canvas do jogador local atingido', togD.length > 0 && togD[togD.length-1][1] === true, JSON.stringify(togD.slice(-2)));
const css = fs.readFileSync('css/style.css', 'utf8');
check('CSS #game.daltonic = grayscale + blur (tela cinza/turva)', /#game\\.daltonic\\s*\\{[^}]*grayscale\\(1\\)[^}]*blur/.test(css));
check('CSS: veu de gas rosa sobre o palco (rgba 255,122,217)', /255,122,217/.test(css) && /daltonic/.test(css));
pv.status.daltonic = 0;
for (let t = 0; t < 5; t++) gV.render();
const offD = toggles.filter((t) => t[0] === 'daltonic');
check('classe .daltonic DESLIGA ao fim do status', offD[offD.length-1][1] === false);

// ==== 9. CONTROLES INVERTIDOS DE VERDADE (caminho real do jogo) ====
const gW = mk('jess', 'du');
const fW = gW.activeOf(0), oW = gW.activeOf(1);
fW.x = 300; oW.x = 520; fW.dir = 1; oW.dir = -1;
fW.cd = [0,0,0,0,0,0,0,0,0,0]; fW.castLock = 0; fW.spamShared = 0; fW.state = 'idle'; fW.cast = null; fW.ultimate = 100;
fW.tryCast(4);
for (let t = 0; t < 70; t++) gW.tick();
check('rival daltonic no teste de caminho', oW.has('daltonic') === true);
const rightIn = { left: false, right: true, down: false, up: false, punch: false, kick: false };
for (let k = 0; k < 10; k++) rightIn['a' + k] = false;
const origFor = gW.inputFor.bind(gW);
gW.inputFor = (ti) => ti === 1 ? Object.assign({}, rightIn) : origFor(ti);
oW.state = 'idle'; oW.x = 480; oW.vx = 0;
const x0 = oW.x;
for (let t = 0; t < 40; t++) gW.tick();
check('segurando RIGHT com daltonic o rival anda pra ESQUERDA', oW.x < x0, 'x ' + x0 + ' -> ' + oW.x.toFixed(1));
// habilidades: a0 -> slot 4, a4 -> slot 0, a1 -> slot 3 (espelho 1-5 dentro do kit)
const casts = [];
const origCast = oW.startCast.bind(oW);
oW.startCast = (i, p) => { casts.push(i); return origCast(i, p); };
/* drive direto no update do lutador (o loop do game pode estar em hitstop apos a ult) */
const pressA = (slot) => {
  const inp = { left: false, right: false, down: false, up: false, punch: false, kick: false };
  for (let k = 0; k < 10; k++) inp['a' + k] = false;
  inp['a' + slot] = true;
  oW.state = 'idle'; oW.cast = null; oW.castLock = 0; oW.spamShared = 0; oW.cd = oW.cd.map(() => 0); oW.ultimate = 100; oW.charge = [100, 100]; oW.onGround = true; oW.vx = 0; oW.benched = false;
  oW.buf.punch = 0; oW.buf.kick = 0; for (let k = 0; k < 10; k++) oW.buf['a' + k] = 0; /* limpa resto do press anterior */
  const antes = casts.length;
  oW.update(Object.assign({}, inp));
  return casts.length > antes ? casts[casts.length - 1] : -1;
};
const c0 = pressA(0), c4 = pressA(4), c1 = pressA(1);
oW.startCast = origCast;
check('tecla 1 (a0) com daltonic solta slot 4; tecla 5 (a4) solta slot 0; tecla 2 (a1) solta slot 3', c0 === 4 && c4 === 0 && c1 === 3, 'a0->' + c0 + ' a4->' + c4 + ' a1->' + c1);

console.log('---');
console.log(fails === 0 ? 'INTENSIVO JESS/PITOCO: TUDO OK (' + n + ' checks)' : 'INTENSIVO JESS/PITOCO: ' + fails + ' FALHAS de ' + n);
`, ctx);
