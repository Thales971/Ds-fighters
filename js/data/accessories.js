/* ============================================================
   ACESSÓRIOS UNIVERSAIS — aparecem em TODOS os lutadores na luta
   (pendurados na cabeça via âncora automática do sprite, ver
   SpriteGen.headAnchor). Ligados/desligados na tela ACESSÓRIOS
   do menu e persistidos em Profile.setting('acc').
   ============================================================ */
const ACC_LIST = [
  {
    id: 'gorro-natal', icon: '🎅', name: 'Gorro de Natal',
    desc: 'Todo mundo de gorro na luta. Padrão ligado no mês de festas.',
    src: 'assets/acc/gorro-natal.png', scale: 1.15,
  },
];
const ACC_IMAGES = {};
for (const a of ACC_LIST) {
  try {
    const img = new Image();
    img.src = a.src + '?v=v47-maresprites';
    ACC_IMAGES[a.id] = img;
  } catch (e) { /* sem DOM (teste): o desenho usa fallback */ }
}
/* Default: gorro de natal ligado; os demais desligados ate serem comprados/desbloqueados. */
const ACC_DEFAULTS = { 'gorro-natal': true };
function accOn(id) {
  const s = (typeof Profile !== 'undefined' && Profile.setting('acc')) || null;
  const v = (s && s[id] !== undefined) ? s[id] : ACC_DEFAULTS[id];
  return !!v;
}
function accAnyOn() { return ACC_LIST.some((a) => accOn(a.id)); }
