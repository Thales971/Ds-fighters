/* ============================================================
   ACESSÓRIOS UNIVERSAIS — aparecem em TODOS os lutadores na luta,
   encaixados na CABEÇA medida de cada sprite (SpriteGen.headBox).
   Ligados/desligados na tela ACESSÓRIOS do menu e persistidos em
   Profile.setting('acc'). Um por LUGAR (slot): ligar o boné tira
   o gorro, mas óculos/faixa/fone convivem com um chapéu.

   fit (tipo de encaixe):
     'top'      chapéu sentado na cabeça: base em  topo + seat * altura
     'eyes'     centro na altura dos olhos:        topo + at * altura
     'forehead' centro na testa:                   topo + at * altura
     'ears'     base das conchas:                  topo + at * altura
   w = largura da cabeça * wMul; xOff = deslocamento pra frente (fração
   da largura da cabeça) — o desenho espelha quando o lutador vira.
   Arte: assets/acc/*.png (tools/build_acessorios.py gera os novos).
   ============================================================ */
const ACC_LIST = [
  {
    id: 'gorro-natal', icon: '🎅', name: 'Gorro de Natal', slot: 'cabeca', fit: 'top', wMul: 1.3, seat: 0.42, xOff: 0,
    desc: 'Opcional. Só aparece se você ligar aqui — nunca entra sozinho.',
    src: 'assets/acc/gorro-natal.png',
  },
  {
    id: 'bone', icon: '🧢', name: 'Boné', slot: 'cabeca', fit: 'top', wMul: 1.32, seat: 0.36, xOff: 0.16,
    desc: 'Boné vermelho com a aba pra frente. Estilo de quadra.',
    src: 'assets/acc/bone.png',
  },
  {
    id: 'coroa', icon: '👑', name: 'Coroa', slot: 'cabeca', fit: 'top', wMul: 0.92, seat: 0.16, xOff: 0,
    desc: 'Coroa de ouro com gemas. Pra quem é o rei do X1.',
    src: 'assets/acc/coroa.png',
  },
  {
    id: 'oculos', icon: '🕶️', name: 'Óculos Escuros', slot: 'olhos', fit: 'eyes', wMul: 0.95, at: 0.47, xOff: 0.08,
    desc: 'Lente preta com reflexo. Ninguém vê pra onde você olha.',
    src: 'assets/acc/oculos.png',
  },
  {
    id: 'faixa', icon: '🥷', name: 'Faixa Ninja', slot: 'testa', fit: 'forehead', wMul: 1.3, at: 0.26, xOff: -0.16,
    desc: 'Faixa vermelha na testa com as pontas voando pra trás.',
    src: 'assets/acc/faixa.png',
  },
  {
    id: 'fone', icon: '🎧', name: 'Fone Gamer', slot: 'orelhas', fit: 'ears', wMul: 1.32, at: 0.68, xOff: 0,
    desc: 'Headset com LED magenta. Música alta no meio da luta.',
    src: 'assets/acc/fone.png',
  },
];
/* ordem de desenho: o que fica mais "pra dentro" primeiro, chapéu por último */
const ACC_DRAW_ORDER = ['ears', 'eyes', 'forehead', 'top'];
const ACC_IMAGES = {};
for (const a of ACC_LIST) {
  try {
    const img = new Image();
    img.src = (typeof assetUrl === 'function' ? assetUrl : (u) => u)(a.src);
    ACC_IMAGES[a.id] = img;
  } catch (e) { /* sem DOM (teste): o desenho usa fallback */ }
}
/* Nenhum acessório entra sozinho. O jogador liga na tela ACESSÓRIOS. */
const ACC_DEFAULTS = {};
function accOn(id) {
  const s = (typeof Profile !== 'undefined' && Profile.setting('acc')) || null;
  const v = (s && s[id] !== undefined) ? s[id] : ACC_DEFAULTS[id];
  return !!v;
}
function accAnyOn() { return ACC_LIST.some((a) => accOn(a.id)); }
/* Liga/desliga um acessório respeitando 1 por lugar: devolve as configurações novas. */
function accToggle(settings, id, on) {
  const s = Object.assign({}, ACC_DEFAULTS, settings || {});
  const acc = ACC_LIST.find((a) => a.id === id);
  if (!acc) return s;
  if (on) for (const o of ACC_LIST) if (o.slot === acc.slot && o.id !== id) s[o.id] = false;
  s[id] = !!on;
  return s;
}
/* Onde desenhar o acessório, em coordenadas da CÉLULA do sprite (antes da escala
   do lutador): box = SpriteGen.headBox (x = centro, y = topo, w/h da cabeça).
   Devolve { x, y, w, h } do retângulo do acessório olhando pra direita. */
function accPlacement(acc, box, sc, imgW, imgH) {
  const s = sc || 1;
  const w = box.w * (acc.wMul || 1) * s;
  const h = w * (imgH / Math.max(1, imgW));
  const cx = (box.x + (acc.xOff || 0) * box.w) * s;
  const top = box.y * s, hh = box.h * s;
  let y;
  if (acc.fit === 'top') y = top + hh * (acc.seat == null ? 0.35 : acc.seat) - h;
  else if (acc.fit === 'ears') y = top + hh * (acc.at == null ? 0.68 : acc.at) - h;
  else y = top + hh * (acc.at == null ? 0.4 : acc.at) - h / 2;
  return { x: cx - w / 2, y, w, h };
}
