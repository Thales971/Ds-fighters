/* DS Fighters — KUNO, a kunoichi (nov/2026). Arte do dono
   (bugs/Novos-personagens/Kuno *.jpg): ninja de preto com detalhes roxos,
   mascara, rabo de cavalo e kunais. poses -> tools/integrate_fighter.py kuno;
   poderes -> tools/build_kuno_fx.py. Assassina rapida e escorregadia: kunais
   em leque que sangram, lamina lunar que atravessa o rival intangivel, passo
   das sombras (some e aparece atras), bomba de fumaca que cega e a ult
   exclusiva que ROUBA a ultimate do rival. */
(() => {
  const id = 'kuno';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v72-kuno';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true,
    accHide: ['ko', 'jump'],
  });
  const visual = (row, color) => ({ visualSheet: id, visualRow: row, impactSheets: ['kuno-extra'], impactColor: color });

  FIGHTERS.push({
    id,
    name: 'KUNO',
    title: 'A Kunoichi das Sombras',
    bio: 'Ninguém viu ela entrar. Kunais em leque, uma lâmina lunar que passa através de você e uma bomba de fumaça na hora certa. No golpe final, o dragão das mil lâminas leva até a sua ultimate embora.',
    colors: { skin: '#F2D6C2', hair: '#1A1420', shirt: '#151218', pants: '#1A1620', shoes: '#D8D8E0', accent: '#B06BFF' },
    traits: { ponytail: true, mask: true, kunai: true },
    stats: { power: 1.05, speed: 1.3, weight: 0.85, hp: 145, meterRate: 1.3 },
    secret: false,
    quotes: {
      intro: ['Você nem me viu chegar.', 'Silêncio.'],
      win: ['Missão cumprida.', 'Sem rastros.'],
      lose: ['Fui... descoberta...', 'A sombra falhou.'],
      taunt: ['Atrás de você.'],
      special: ['KUNAI!', 'LÂMINA LUNAR!', 'PASSO DAS SOMBRAS!', 'FUMAÇA!'],
      super: ['DRAGÃO DAS MIL LÂMINAS!!'],
    },
    moves: {
      punch: { dmg: 7, range: 58, startup: 4, active: 4, recovery: 8 },
      kick: { dmg: 11, range: 72, startup: 7, active: 4, recovery: 10 },
    },
    special: { name: 'Chuva de Kunai', type: 'projectile', cost: 25, proj: { row: 0, speed: 14, dmg: 5, w: 26, h: 14, color: '#D8D8E0', shape: 'bolt', visualSheet: id, visualRow: 0 } },
    super: { name: 'Dragão das Mil Lâminas', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'sombra',
      theme: 'kunoichi: kunais em leque, lamina lunar intangivel, passo das sombras, bomba de fumaca e o dragao que rouba a ultimate',
      powers: [
        Object.assign({ id: 'chuva-kunai', name: 'Chuva de Kunai', slot: 'simple', row: 0, kind: 'shot', count: 3, spread: 0.18, dmg: 5, speed: 14, cd: 50, sfx: 'whoosh', fx: { bleed: 90 },
          desc: '3 kunais em leque, muito rápidas: cada uma deixa SANGRANDO.' }, visual(0, '#D8D8E0')),
        Object.assign({ id: 'lamina-lunar', name: 'Lâmina Lunar', slot: 'simple', row: 1, kind: 'dash', dmg: 14, speed: 19, phase: true, iFrames: 14, stun: 22, cd: 64, sfx: 'dash',
          desc: 'Corta ATRAVESSANDO o rival em meia-lua: INTANGÍVEL durante o corte (passa por golpes e projéteis).' }, visual(1, '#4FD2FF')),
        Object.assign({ id: 'passo-sombras', name: 'Passo das Sombras', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 150, teleportBehind: true, cloak: 150, burstDmg: 10, cd: 90, sfx: 'magic',
          desc: 'Some e reaparece ATRÁS do rival, quase invisível (FANTASMA) por ~2,5s; colada nele, já sai cortando.' }, visual(2, '#8A5BFF')),
        Object.assign({ id: 'bomba-fumaca', name: 'Bomba de Fumaça', slot: 'charge', meter: 1, row: 3, kind: 'zone', time: 260, dmg: 0.05, slow: 40, cd: 100, sfx: 'hazard', fx: { blind: 30 },
          desc: 'Nuvem de fumaça no rival por ~4s: CEGO (tela embaçada) e LENTO enquanto estiver dentro.' }, visual(3, '#9A8AB0')),
        Object.assign({ id: 'dragao-mil-laminas', name: 'Dragão das Mil Lâminas', slot: 'ultimate', row: 4, kind: 'kunoult', dmg: 6, hits: 5, steal: 40, cd: 150, sfx: 'ultimate',
          desc: 'EXCLUSIVA: Kuno some (invulnerável) e o dragão de lâminas acerta 5 vezes; o primeiro acerto ROUBA até 40% da ULTIMATE do rival pra ela.' }, visual(4, '#C77DFF')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#B06BFF' } });
  Object.assign(SIGNATURES, { [id]: { trait: 'SOMBRA', desc: 'Rápida e escorregadia: kunais que sangram, corte intangível, teleporte invisível, fumaça que cega e a ult que rouba a ultimate do rival.', basic: {}, ability: {} } });
})();
