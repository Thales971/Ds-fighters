const fs=require('fs'), vm=require('vm');
const ctx={console, Image: class { set src(v){} }, Math, Date,
  Profile:{SECRET_IDS:['du','iales','felipinho'], data:{settings:{reducedMotion:false}, unlocked:[]}, isUnlocked:()=>true, petFor:()=>null, setting:()=>null, reducedMotion:()=>false, record(){}, skinFor:()=>0},
  EMPTY_INPUT:Object.freeze({left:false,right:false,down:false,up:false,punch:false,kick:false}),
  Input:{init(){},read:()=>({left:false,right:false,down:false,up:false,punch:false,kick:false}),pad:()=>null,padCount:0},
  AudioSys:new Proxy({},{get:()=>()=>{}}), UI:{ show(){}, hide(){}, banner(){}, hud: new Proxy({},{get:()=>()=>{}}), toast(){}, onMatchEnd(){}, cutIn(){}, say(){}, floatText(){}, announce(){} }, Net:{},
  AI:{think:()=>({left:false,right:false,down:false,up:false,punch:false,kick:false})},
  document:{getElementById:()=>null, createElement:()=>({getContext:()=>({}), style:{}}), addEventListener(){}},
  window:{addEventListener(){}}, setTimeout, clearTimeout, requestAnimationFrame:(cb)=>setTimeout(cb,16)};
ctx.SLOTTYPE = process.argv[3] || 'simple';
ctx.globalThis=ctx; vm.createContext(ctx);
const files=['assets/sprites/layout.js','js/engine/sprites.js','js/data/fighters.js','js/data/fighters-v10.js','js/data/fighters-v11.js','js/data/powers.js','js/data/powers-turbo.js','js/data/powers-v4.js','js/data/powers-v5.js','js/data/powers-v6.js','js/data/powers-balance-v6.js','js/data/powers-v7.js','js/data/powers-v8.js','js/data/powers-v9.js','js/data/powers-v10.js','js/data/powers-v11.js','js/data/fighters-v12.js','js/data/fighters-v13.js','js/data/fighters-v14.js','js/data/fighters-v15.js','js/data/fighters-v16.js','js/data/fighters-v17.js','js/data/fighters-v18.js','js/data/fighters-v19.js','js/data/fighters-v20.js','js/data/powers-balance-v7.js','js/data/powers-balance-v8.js','js/data/powers-balance-v9.js','js/data/pets.js','js/data/stages.js','js/engine/stage.js','js/engine/mechanics.js','js/engine/fx.js','js/engine/projectile.js','js/engine/fighter.js','js/engine/weather.js','js/engine/game.js','js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f}); } catch(e){ console.log('ERRO', f, String(e).slice(0,60)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText:()=>({width:10}), createLinearGradient:()=>({addColorStop(){}}), createRadialGradient:()=>({addColorStop(){}}), set imageSmoothingEnabled(v){} });
const mkGame = (mode, extra) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  const cfg = Object.assign({ mode, teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 }, extra || {});
  g.start(cfg);
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
// testa: castar H1 (punch-axe do Du, cd 90 base -> piso do anti-spam 130) repetidamente
const SLOT = SLOTTYPE;
const testMode = (mode, extra) => {
  const g = mkGame(mode, extra);
  if (g.roundState !== 'fight') return mode + ': luta nao iniciou (rs=' + g.roundState + ')';
  const f = g.activeOf(0);
  f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle'; f.charge = [100,100]; f.ultimate = 100;
  const kit = f.currentKit();
  const baseCd = kit[0].cd || 0;
  let casts = 0, gaps = [], lastCast = -999;
  const frames = 1800;
  const IDX = kit.findIndex((p) => p.slot === SLOT);
  if (IDX < 0) return mode + ': sem slot ' + SLOT;
  let lastRound = g.round;
  for (let t = 0; t < frames; t++) {
    f.state = 'idle'; f.cast = null;
    f.charge = [100, 100]; f.ultimate = 100;
    const rBefore = g.round;
    if (g.roundState !== 'fight') { lastCast = -999; } // fora da luta (intro/KO) = sem medir gap
    else if (f.tryCast(IDX)) {
      if (lastCast >= 0 && rBefore === lastRound) gaps.push(t - lastCast);
      lastCast = t; lastRound = rBefore; casts++;
    }
    g.tick();
    const f2 = g.activeOf(0);
    if (f2 !== f) return mode + ': lutador trocou';
    if (g.round !== lastRound) { lastRound = g.round; f.cd = f.cd.map(() => 0); f.castLock = 0; } // round novo = cds novos (design)
  }
  const minGap = gaps.length ? Math.min(...gaps) : -1;
  const piso = SLOT === 'ultimate' ? 150 : (SLOT === 'charge' ? 90 : 95); /* du e perfil chain */
  const ok = minGap >= piso - 10;
  return mode + ' [' + SLOT + ']: ' + casts + ' casts / intervalo min ' + minGap + 'f ' + (ok ? 'OK' : '<<< RECARGA FURADA (piso ' + piso + ')') + ' | cd base=' + baseCd;
};
console.log(testMode('versus'));
console.log(testMode('training', { dummy: 'stand', autoHeal: true, infiniteMeter: true, infiniteLife: true }));
console.log(testMode('arcade', { cpu: [false, true] }));
console.log(testMode('tag', { teams: [['du','nunes'], ['stack','mis']] }));
console.log(testMode('survival', { cpu: [false, true] }));
console.log(testMode('morte-subita', { roundsToWin: 1 }));
console.log(testMode('online', { netRole: 'host', mySlot: 0 }));
console.log(testMode('demo'));
`, ctx);
