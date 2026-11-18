// OPCOES RESPONSIVAS: garante que a aba de opcoes nao estoura o painel em telas
// estreitas (grid com minmax(0,1fr), controles width:100%, textos curtos nos
// <option> e regras mobile com safe-area + scroll).
const fs = require('fs');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const css = fs.readFileSync('css/style.css', 'utf8');
const mob = fs.readFileSync('css/mobile.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

// 1. grid da aba de opcoes permite encolher (antes era 1fr 1fr -> select longo estourava o painel)
check('style.css: .opts usa grid minmax(0,1fr)', /\.opts\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css));
check('style.css: labels do .opts com min-width:0 e quebra de texto', /\.opts label\s*\{[^}]*min-width:\s*0/.test(css) && /\.opts label\s*\{[^}]*overflow-wrap/.test(css));
check('style.css: selects/inputs de texto do .opts com width:100%', /\.opts select,\s*\.opts input\[type=text\]\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%/.test(css));
check('style.css: range do .opts com width:100%', /\.opts input\[type=range\]\s*\{[^}]*width:\s*100%/.test(css));

// 2. painel: largura maxima dentro do app 960 e scroll vertical em telas baixas
const wide = css.match(/\.panel\.wide\s*\{\s*width:\s*(\d+)px/);
check('painel wide <= 960px (cabe no app)', wide && +wide[1] <= 960, wide && wide[1] + 'px');
check('painel tem max-height + overflow auto (scroll em tela baixa)', /\.panel\s*\{[^}]*max-height:[^}]*overflow:\s*auto/.test(css));

// 3. textos dos <option> da aba de opcoes curtos (select fechado nao estoura a celula)
const scr = html.split('id="scr-options"')[1].split('</section>')[0];
const opts = [...scr.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map((m) => m[1].trim());
const longest = opts.reduce((a, b) => (b.length > a.length ? b : a), '');
check('todos os <option> da aba de opcoes com texto curto (<=30 chars)', opts.length >= 10 && opts.every((o) => o.length <= 30), `maior="${longest}" (${longest.length} chars, ${opts.length} options)`);

// 4. mobile: .opts em 1 coluna que encolhe, controles 100%, painel com respiro embaixo (botao VOLTAR alcancavel)
check('mobile.css: .opts portrait em coluna minmax(0,1fr)', /body\.mobile \.opts\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(mob));
check('mobile.css: .opts mobile com controles width:100%', /body\.mobile \.opts select,\s*body\.mobile \.opts input\[type=text\]/.test(mob) && /body\.mobile \.opts select[^{]*\{[^}]*width:\s*100%/.test(mob));
check('mobile.css: painel da aba de opcoes com margin-bottom (VOLTAR visivel)', /body\.mobile #scr-options \.panel\s*\{[^}]*margin:[^}]*28px/.test(mob));
check('mobile.css: telas com scroll vertical + safe-area', /body\.mobile \.screen\s*\{[^}]*overflow-y:\s*auto/.test(mob) && /body\.mobile \.screen\s*\{[^}]*env\(safe-area-inset/.test(mob));
check('mobile.css: inputs/selects mobile com min-height 44px (alvo de toque)', /body\.mobile input:not\(\[type=checkbox\]\)[^{]*select\s*\{[^}]*min-height:\s*44px/.test(mob));
check('mobile.css: .opts landscape em 2 colunas minmax(0,1fr)', /@media \(orientation: landscape\)\s*\{[^@]*body\.mobile \.opts\s*\{[^}]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(mob));

// 5. simulacao de estouro: coluna do grid vs largura do maior texto de option (Press Start 2P ~10px/char a 10px)
const colW = wide ? ( +wide[1] - 44 - 20) / 2 : 0;
const need = longest.length * 10 + 16;
check(`calculo de layout: maior option (${longest.length*10}px+pad) cabe na coluna de ${colW.toFixed(0)}px`, colW > 0 && need <= colW, `precisa ${need}px`);

console.log('---');
console.log('OPCOES RESPONSIVAS: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
