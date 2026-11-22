// BUSCA/FILTRO/FAVORITOS NA GRADE DE SELECAO: selFilterSlots (funcao real do
// ui.js) testada com o FIGHTERS real + wiring de HTML/CSS/teclado.
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
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: {}, unlocked: [] }, isUnlocked(id) { return !this.SECRET_IDS.includes(id) || this.data.unlocked.includes(id); }, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js',
  'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js',
  'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js',
  'js/data/powers-balance-v6.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) {} }
for (const f of fs.readdirSync('js/data').filter((f) => /^fighters.*\.js$/.test(f)).sort()) {
  try { vm.runInContext(fs.readFileSync('js/data/' + f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 60)); }
}

/* extrai as funcoes reais do ui.js */
const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
const fnNorm = uiSrc.match(/function normSelText\(s\) \{[\s\S]*?\n\}/);
const fnFilter = uiSrc.match(/function selFilterSlots\(list[\s\S]*?\n\}/);
check('ui.js tem normSelText() e selFilterSlots()', !!fnNorm && !!fnFilter);
vm.runInContext(fnNorm[0] + '\n' + fnFilter[0], ctx);

const F = vm.runInContext('FIGHTERS', ctx);
check('FIGHTERS real carregou (>40)', F.length > 40, F.length + ' lutadores');

// 1) normalizacao de acentos
check('normSelText tira acentos ("Crianças Café ÇÃ" -> "criancas cafe ca")', vm.runInContext('normSelText("Crianças Café ÇÃ")', ctx) === 'criancas cafe ca');

// 2) filtro "all": todos menos boneco + ALEATORIA no fim
const all = vm.runInContext('selFilterSlots(FIGHTERS, "", "all", [], () => true)', ctx);
check('filtro TODOS: 52 lutadores + aleatoria no fim', all.length === F.length && all[all.length - 1] === F.length, 'slots=' + all.length + ' F=' + F.length);
check('boneco de treino nunca aparece', !all.includes(F.findIndex((d) => d.id === 'boneco-treino')));

// 3) busca por nome parcial
const rafa = vm.runInContext('selFilterSlots(FIGHTERS, "rafa", "all", [], () => true)', ctx);
check('busca "rafa" acha so o RAFAEL (+ aleatoria)', rafa.length === 2 && F[rafa[0]] && F[rafa[0]].id === 'rafael', JSON.stringify(rafa.map((i) => F[i] && F[i].id)));
const lob = vm.runInContext('selFilterSlots(FIGHTERS, "lobao", "all", [], () => true)', ctx);
check('busca sem acento "lobao" acha LOBÃO', lob.length === 2 && F[lob[0]] && F[lob[0]].id === 'lobao', JSON.stringify(lob.map((i) => F[i] && F[i].id)));
const senior = vm.runInContext('selFilterSlots(FIGHTERS, "senior", "all", [], () => true)', ctx);
check('busca "senior" acha DEV SENIOR (no id)', senior.some((i) => F[i] && F[i].id === 'dev-senior'), JSON.stringify(senior.map((i) => F[i] && F[i].id)));
const nada = vm.runInContext('selFilterSlots(FIGHTERS, "zzzzqq", "all", [], () => true)', ctx);
check('busca sem resultado = so a aleatoria', nada.length === 1 && nada[0] === F.length);

// 4) filtros
const sec = vm.runInContext('selFilterSlots(FIGHTERS, "", "secret", [], () => true)', ctx);
check('filtro SECRETOS: so os 6 secretos (incl. dolynho e kernor) + aleatoria', sec.length === 7 && sec.slice(0, -1).every((i) => F[i] && F[i].secret) && sec.slice(0, -1).some((i) => F[i] && F[i].id === 'dolynho'), sec.map((i) => F[i] && F[i].id).join(','));
const fav = vm.runInContext('selFilterSlots(FIGHTERS, "", "fav", ["du", "kira"], () => true)', ctx);
check('filtro FAVORITOS [du,kira] -> du,kira,aleatoria', fav.length === 3 && F[fav[0]] && F[fav[0]].id === 'du' && F[fav[1]] && F[fav[1]].id === 'kira', JSON.stringify(fav.map((i) => F[i] && F[i].id)));
const unl = vm.runInContext('selFilterSlots(FIGHTERS, "", "unlocked", [], (id) => id !== "du")', ctx);
check('filtro LIBERADOS respeita isUnlocked (du travado some)', !unl.some((i) => F[i] && F[i].id === 'du'));
const combo = vm.runInContext('selFilterSlots(FIGHTERS, "max", "secret", [], () => true)', ctx);
check('busca+filtro combinados: "max" em secretos -> so MAXIMILIAN', combo.length === 2 && F[combo[0]] && F[combo[0]].id === 'maximilian');

// 5) wiring HTML/CSS/teclado
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const mob = fs.readFileSync('css/mobile.css', 'utf8');
const scr = html.split('id="scr-select"')[1].split('</section>')[0];
check('index.html: campo #sel-search + chips (all/unlocked/secret/fav) + #sel-empty na tela de selecao', /id="sel-search"/.test(scr) && /id="sel-chips"/.test(scr) && /data-f="all"/.test(scr) && /data-f="unlocked"/.test(scr) && /data-f="secret"/.test(scr) && /data-f="fav"/.test(scr) && /id="sel-empty"/.test(scr));
check('ui.js: buildSelGrid/bindSelTools/refreshSelGrid/toggleFav + favFighters + botao ★ (favbtn)', uiSrc.indexOf('buildSelGrid()') >= 0 && uiSrc.indexOf('bindSelTools()') >= 0 && uiSrc.indexOf('refreshSelGrid()') >= 0 && uiSrc.indexOf('toggleFav(') >= 0 && uiSrc.indexOf("favFighters") >= 0 && uiSrc.indexOf('favbtn') >= 0);
check('ui.js: selectSlots usa selFilterSlots; selectKeys tem guard de digitacao + tecla / + tecla F', uiSrc.indexOf('selFilterSlots(FIGHTERS') >= 0 && uiSrc.indexOf("Input.hit(['Slash'])") >= 0 && uiSrc.indexOf("Input.hit(['KeyF'])") >= 0 && /selectKeys\(m\) \{[\s\S]*?INPUT\|TEXTAREA\|SELECT/.test(uiSrc));
check('ui.js: refreshSelGrid prende o cursor numa celula visivel', uiSrc.indexOf('if (!slots.includes(f.cursor[who])) f.cursor[who] = slots[0];') >= 0);
check('css: .sel-tools/#sel-search/.chip/.favbtn/.sel-empty estilizados', /\.sel-tools\s*\{/.test(css) && /#sel-search\s*\{/.test(css) && /\.chip\s*\{/.test(css) && /\.favbtn\s*\{/.test(css) && /\.sel-empty\s*\{/.test(css));
check('mobile.css: ferramentas de busca empilham no celular', /body\.mobile \.sel-tools/.test(mob) && /body\.mobile #sel-search/.test(mob));

// 6) favoritos persistem no perfil
const favRt = vm.runInContext(`(function(){ const P = Profile; const a = P.setting('favFighters'); P.setting('favFighters', ['du', 'kira']); const b = P.setting('favFighters'); return JSON.stringify([a === undefined, Array.isArray(b) && b.length === 2]); })()`, ctx);
check('favFighters persiste no Profile (default vazio, salva array)', JSON.parse(favRt).every(Boolean), favRt);

// 7) FIX grade quebrada: favbtn era <button> dentro de <button class="cell"> —
//    o parser HTML fecha o botao externo no favbtn e os spans .cur viram itens
//    da grid (layout quebrado). Agora favbtn e <span> e a celula nao tem botao dentro.
{
  const cellTpl = uiSrc.match(/<button class="cell[\s\S]*?<\/button>/);
  check('celula da grade NAO tem <button> aninhado (favbtn virou span) — sem quebrar o parse', !!cellTpl && cellTpl[0].indexOf('<button', 10) < 0 && uiSrc.indexOf('<span class="favbtn') >= 0 && !/<button[^>]*class="favbtn/.test(uiSrc));
  check('binding do fav continua no .favbtn (span aceita click) + tecla F continua', uiSrc.indexOf("querySelectorAll('.favbtn')") >= 0 && uiSrc.indexOf("Input.hit(['KeyF'])") >= 0);
  check('css: .favbtn com display (span precisa) e .on dourado', /\.favbtn\s*\{[^}]*display\s*:/.test(css) && /\.favbtn\.on/.test(css));
}

// 8) FIX 30fps na selecao: fundo ao vivo em meia resolucao + metade da taxa,
//    e o loop principal pula o render do demo escondido atras da tela de selecao
{
  const mainSrc = fs.readFileSync('js/main.js', 'utf8');
  check('main.js: pula game.render quando a selecao esta com palco ao vivo (selBgOn)', mainSrc.indexOf("UI.screen === 'select' && !!UI._selBg") >= 0 && /const skipGame = selBgOn \|\| demoHidden/.test(mainSrc) && /if \(game\.stage && !skipGame\)/.test(mainSrc));
  check('ui.js startSelectBg: canvas 480x270 (metade) + paint a cada 2 frames (30fps)', uiSrc.indexOf('const W = 480, H = 270;') >= 0 && uiSrc.indexOf('(skip++ % 2) === 0') >= 0);
  check('ui.js startSelectBg: qualidade baixa/reduzido continua 1 frame estatico', uiSrc.indexOf("if (q === 'low' || reduced) paint();") >= 0);
}

console.log('---');
console.log(fails === 0 ? 'BUSCA NA GRADE: TUDO OK (' + n + ' checks)' : 'BUSCA NA GRADE: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
