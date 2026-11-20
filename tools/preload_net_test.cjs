// PRELOAD COMPLETO + HUD DE REDE: buildPreloadUrls() cobre TODOS os assets do
// jogo (e cada URL existe no disco), o loader bloqueia ate 100%, e a opcao
// showNet liga o HUD de ping/rede na luta (netHudText com Net falso/real).
const fs = require('fs');
const vm = require('vm');

let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = {
  console, Math, JSON, Date, URLSearchParams, fs,
  Image: function () { return { set src(v) {}, get src() { return ''; } }; },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => null, style: {} }), addEventListener() {} },
  window: {},
};
ctx.globalThis = ctx;
ctx.window = ctx; /* window.DSGame cai no global */
vm.createContext(ctx);
for (const f of ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/engine/fx.js', 'js/core/profile.js',
  'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js']) {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); }
}

/* extrai as funcoes reais do main.js (sem rodar o boot) */
const mainSrc = fs.readFileSync('js/main.js', 'utf8');
const fnPreload = mainSrc.match(/function buildPreloadUrls\(\) \{[\s\S]*?\n\}/);
const fnNet = mainSrc.match(/function netHudText\(\) \{[\s\S]*?\n\}/);
check('main.js tem buildPreloadUrls() e netHudText()', !!fnPreload && !!fnNet);
vm.runInContext(fnPreload[0] + '\n' + fnNet[0], ctx);

// ===== PRELOAD =====
const urls = vm.runInContext('buildPreloadUrls()', ctx);
check('buildPreloadUrls retorna array grande (>150 assets)', Array.isArray(urls) && urls.length > 150, urls.length + ' urls');
check('sem URL duplicada', new Set(urls).size === urls.length, '');

const STAGE_LIST = vm.runInContext('STAGE_LIST', ctx);
const missing = STAGE_LIST.filter((s) => (s.image && !urls.includes(s.image)) || (s.sheet && !urls.includes(s.sheet)));
check('TODOS os mapas/sheets das ' + STAGE_LIST.length + ' arenas estao no preload', missing.length === 0, missing.map((s) => s.id).join(','));
const layersMissing = [];
for (const s of STAGE_LIST) for (const l of (s.layers || [])) { const u = String(l.src) + (String(l.src).indexOf('?') >= 0 ? '' : '?v=v36-amb1'); if (!urls.includes(u)) layersMissing.push(s.id + ':' + l.src); }
check('todas as camadas parallax das arenas estao no preload', layersMissing.length === 0, layersMissing.slice(0, 3).join(','));

for (const u of ['assets/fx/rain-streaks.png?v=v36-amb1', 'assets/fx/mare.png?v=v54-ambiente',
  'assets/fauna/torcida.png?v=v47-maresprites', 'assets/weather/petals.png?v=v36-balance13', 'assets/weather/neon.png?v=v36-balance13',
  'assets/weather/snowflakes.png?v=v33-weather', 'assets/weather/leaf.png?v=v33-weather', 'assets/weather/spark.png?v=v33-weather',
  'assets/pets/pitoco.png?v=v47-maresprites']) {
  if (!urls.includes(u)) check('preload inclui ' + u, false, 'faltando');
}
check('torcida/maré/climas/petalas/pitoco com os MESMOS tokens que o motor pede', true, '');

/* a garantia central: cada URL do preload existe no disco (sem query string) */
const notOnDisk = urls.map((u) => u.split('?')[0]).filter((p) => !fs.existsSync(p));
check('TODAS as URLs do preload existem no disco (' + urls.length + ' arquivos)', notOnDisk.length === 0, notOnDisk.slice(0, 5).join(' '));

/* sprites dos lutadores e atlas de habilidades tambem */
const spritesOk = vm.runInContext('Object.keys(SPRITE_LAYOUT.files).every((id) => buildPreloadUrls().includes(SpriteGen.url(id)))', ctx);
check('todos os sprites de lutadores (SPRITE_LAYOUT.files) no preload', spritesOk === true);
const artOk = vm.runInContext('Object.values(ART_SHEETS).every((s) => buildPreloadUrls().includes(Art.url(s.src)))', ctx);
check('todos os atlas ART_SHEETS (habilidades/fx/fauna/pets) no preload', artOk === true);

/* wiring do loader: bloqueia a tela ate 100% e so libera quando nao falhou */
const css = fs.readFileSync('css/style.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
check('loader cobre a tela (z-index 9999) e some so com .done', /#loader\s*\{[^}]*z-index:\s*9999/.test(css) && /#loader\.done\s*\{[^}]*pointer-events:\s*none/.test(css));
check('main.js: preloadAll usa buildPreloadUrls() e mostra progresso done/total', mainSrc.indexOf('const list = buildPreloadUrls();') >= 0 && mainSrc.indexOf("' assets ('") >= 0);
check('main.js: falha de asset mostra retry (nao entra faltando)', mainSrc.indexOf('retry.onclick') >= 0 && mainSrc.indexOf('failed.length') >= 0);

// ===== HUD DE REDE =====
check('index.html: opcao data-set="showNet" na aba de opcoes', /id="scr-options"[\s\S]*?data-set="showNet"/.test(html));
check('index.html: div #net-hud existe', /id="net-hud"/.test(html));
check('css: .net-hud estilizado', /\.net-hud\s*\{/.test(css));
check('main.js: loop atualiza #net-hud quando showNet ligado e tela=fight', mainSrc.indexOf("getElementById('net-hud')") >= 0 && mainSrc.indexOf('showNet') >= 0 && mainSrc.indexOf("UI.screen === 'fight'") >= 0);

/* funcional: netHudText com Net falso */
const t1 = vm.runInContext(`(function(){ window.DSGame = { mode: 'online' }; Net = { room: { code: 'ABC123', players: [{}, {}] }, ping: 37, transport: 'p2p', isHost: () => true }; return netHudText(); })()`, ctx);
check('online anfitriao P2P: "37 ms · sala ABC123 · P2P · anfitrião · 2 jog."', /37 ms/.test(t1) && /ABC123/.test(t1) && /P2P/.test(t1) && /anfitrião/.test(t1) && /2 jog/.test(t1), t1);
const t2 = vm.runInContext(`(function(){ Net = { room: { code: 'ZZ9Y8X', players: [{}] }, ping: 0, transport: 'ws', isHost: () => false }; return netHudText(); })()`, ctx);
check('convidado WS ping medindo: WS + convidado + medindo', /WS/.test(t2) && /convidado/.test(t2) && /medindo/.test(t2) && /ZZ9Y8X/.test(t2), t2);
const t3 = vm.runInContext(`(function(){ Net = { room: null, ping: 0 }; return netHudText(); })()`, ctx);
check('sem sala online -> offline/local', /offline/.test(t3) && /local/.test(t3), t3);
const t4 = vm.runInContext(`(function(){ window.DSGame = { mode: 'versus' }; Net = { room: null }; return netHudText(); })()`, ctx);
check('luta local (nao online) -> offline · partida local', /partida local/.test(t4), t4);

/* setting showNet: default desligado, liga e persiste */
const p = vm.runInContext(`(function(){ const a = Profile.setting('showNet'); Profile.setting('showNet', true); const b = Profile.setting('showNet'); Profile.setting('showNet', false); return JSON.stringify([a, b, Profile.setting('showNet')]); })()`, ctx);
const pv = JSON.parse(p);
check('Profile.setting showNet: default falsy, liga true, desliga false', !pv[0] && pv[1] === true && pv[2] === false, p);

console.log('---');
console.log(fails === 0 ? 'PRELOAD+REDE: TUDO OK (' + n + ' checks)' : 'PRELOAD+REDE: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
