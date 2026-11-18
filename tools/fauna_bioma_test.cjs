// FAUNA POR BIOMA: stageFauna() filtra/deduplica/completa a fauna de TODOS os
// palcos de acordo com o bioma (agua, noite, parque, urbano).
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Math, window: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => null, width: 0, height: 0 }), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  Image: function () { return { set src(v) {}, get src() { return ''; } }; },
  AudioSys: new Proxy({}, { get: () => () => {} }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/engine/stage.js']) {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 100)); }
}

let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const STAGE_LIST = vm.runInContext('STAGE_LIST', ctx);
const stageFauna = vm.runInContext('stageFauna', ctx);
const stageBiome = vm.runInContext('stageBiome', ctx);
check('STAGE_LIST carregou (>80 palcos)', STAGE_LIST.length > 80, STAGE_LIST.length + ' palcos');
check('stageFauna e stageBiome existem no stage.js', typeof stageFauna === 'function' && typeof stageBiome === 'function');

// 1) varre TODOS os palcos: sem duplicar, sem fauna fora do bioma
let dup = 0, offBiome = [];
for (const s of STAGE_LIST) {
  const fa = stageFauna(s);
  if (new Set(fa).size !== fa.length) dup++;
  const b = stageBiome(s);
  for (const k of fa) {
    if ((k === 'fish' || k === 'seagull') && !b.water) offBiome.push(s.id + ':' + k);
    if ((k === 'frog' || k === 'dragonfly') && !(b.water || b.park)) offBiome.push(s.id + ':' + k);
    if (k === 'bat' && !b.night) offBiome.push(s.id + ':' + k);
    if (k === 'fireflies' && !(b.night || b.park)) offBiome.push(s.id + ':' + k);
    if (k === 'cat' && !(b.night || b.urban)) offBiome.push(s.id + ':' + k);
    if (k === 'dog' && !(b.urban || b.park)) offBiome.push(s.id + ':' + k);
    if (k === 'pigeons' && !b.urban) offBiome.push(s.id + ':' + k);
    if (k === 'squirrel' && !b.park) offBiome.push(s.id + ':' + k);
    if (k === 'bee' && !(b.park || (!b.night && !b.urban))) offBiome.push(s.id + ':' + k);
  }
}
check('nenhum palco com fauna duplicada apos stageFauna', dup === 0, dup + ' com dup');
check('nenhum bicho fora do bioma em NENHUM palco (' + STAGE_LIST.length + ')', offBiome.length === 0, offBiome.slice(0, 8).join(' '));

// 2) agua: peixe so em palco de agua, e palco de mare sem peixe continua sem
//    (Ilha Kotlin tem mare intermitente de proposito — permaTide desligado)
const water = STAGE_LIST.filter((s) => stageBiome(s).water);
const fishOffWater = STAGE_LIST.filter((s) => !stageBiome(s).water && stageFauna(s).includes('fish'));
check('peixe nunca aparece fora de palco com agua (' + water.length + ' palcos de agua no jogo)', fishOffWater.length === 0, fishOffWater.map((s) => s.id).join(' '));
check('Ilha Kotlin (mare intermitente) NAO ganha peixe automatico', !stageFauna(STAGE_LIST.find((s) => s.id === 'kotlin')).includes('fish'));
check('palco de agua com peixe continua com peixe (paraty)', stageFauna(STAGE_LIST.find((s) => s.id === 'paraty')).includes('fish'));

// 3) casos especificos que o dono citou
check('Cais de Paraty tem peixe', stageFauna(STAGE_LIST.find((s) => s.id === 'paraty')).includes('fish'));
check('Telhado Neon (noite) continua com morcego', stageFauna(STAGE_LIST.find((s) => s.id === '01-neon-rooftop')).includes('bat'));
check('Dojo Sakura continua com abelha', stageFauna(STAGE_LIST.find((s) => s.id === '06-sakura-dojo')).includes('bee'));
check('Dojo de Treino continua com gato', stageFauna(STAGE_LIST.find((s) => s.id === 'treino-dojo')).includes('cat'));
check('palco sintetico seco com peixe no def -> peixe removido', !stageFauna({ id: 'x', name: 'Seco', fauna: ['fish', 'bird'] }).includes('fish'));
check('palco de agua mantem o peixe declarado (represa)', stageFauna({ id: 'represa-x', name: 'Represa X', mech: 'tide', fauna: ['bird', 'fish'] }).includes('fish'));
check('mare sem peixe declarado continua sem (design: mare intermitente)', !stageFauna({ id: 'ilha-x', name: 'Ilha Kotlin', mech: 'tide', fauna: ['bird'] }).includes('fish'));

// 4) wiring: os 3 consumidores usam stageFauna
const ssrc = fs.readFileSync('js/engine/stage.js', 'utf8');
const usrc = fs.readFileSync('js/ui/ui.js', 'utf8');
check('LiveFauna e StageRenderer.makeFauna usam stageFauna()', ssrc.indexOf('const kinds = stageFauna(def);') >= 0 && ssrc.indexOf('const list = stageFauna(this.def);') >= 0);
check('preview da tela de arenas (ui.js) mostra a fauna filtrada pelo bioma', usrc.indexOf('stageFauna(s)') >= 0);

// 5) funcional: LiveFauna so nasce o que o bioma permite
const LiveFauna = vm.runInContext('LiveFauna', ctx);
const gStub = { W: 960, rnd: Math.random, fighters: () => [] };
const lfWater = new LiveFauna(gStub, STAGE_LIST.find((s) => s.id === 'paraty'));
check('LiveFauna no Cais de Paraty nasce peixe na agua', lfWater.animals.some((a) => a.k === 'fish' && a.water), lfWater.animals.map((a) => a.k).join(','));
const lfDry = new LiveFauna(gStub, { id: 'seco', name: 'Chao Seco', fauna: ['fish', 'bat', 'bird'] });
check('LiveFauna em palco seco nao nasce peixe nem morcego', !lfDry.animals.some((a) => a.k === 'fish' || a.k === 'bat') && lfDry.animals.some((a) => a.k === 'bird'), lfDry.animals.map((a) => a.k).join(','));

console.log('---');
console.log(fails === 0 ? 'FAUNA BIOMA: TUDO OK (' + n + ' checks)' : 'FAUNA BIOMA: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
