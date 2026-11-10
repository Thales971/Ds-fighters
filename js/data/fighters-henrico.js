/* DS Fighters — HENRICO, o Campeão da Quadra.
   Arte do dono em assets/maps/henrico-personagem/ (recortada para
   assets/sprites/henrico.png). Pedido: nível do BHM e Nunes PRA CIMA.
   Arquétipo: boxeador de rua — pressão constante, status em tudo. */
(() => {
  const id = 'henrico';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, special: 0.8, win: 0.75 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'HENRICO',
      title: 'O Campeão da Quadra',
      bio: 'Campeão de boxe da quadra de Valinhos. Treina de madrugada com o som do ginásio vazando pela fresta. O "1" na regata não é vaidade: é aviso.',
      colors: { skin: '#8a5a3a', hair: '#1a120c', shirt: '#f2f2f2', pants: '#111111', shoes: '#e8e8e8', accent: '#f0c040' },
      traits: { afro: true, glasses: true, jersey: true },
      stats: { power: 1.74, speed: 1.28, weight: 1.08, hp: 164, meterRate: 1.50 },
      secret: false,
      quotes: {
        intro: ['A quadra é minha casa.', 'Você treina? Eu moro aqui.'],
        win: ['O "1" não é sorte.', 'Volta pro treino.'],
        special: ['JAB!', 'GANCHO!', 'COMBO DA QUADRA!'],
        super: ['K.O. SUPREMO!!'],
      },
      moves: {
        punch: { dmg: 7, range: 58, startup: 4, active: 4, recovery: 9 },
        kick: { dmg: 10, range: 72, startup: 6, active: 4, recovery: 11 },
      },
      special: {
        name: 'Jab Duplo', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 12, w: 26, h: 22, color: '#f0c040', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'K.O. Supremo', type: 'blast', visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'terra',
      theme: 'boxe de rua: jabs em série, gancho que atordoa e o K.O. da quadra',
      powers: [
        Object.assign({
          id: 'jab-duplo', name: 'Jab Duplo', slot: 'simple', row: 0,
          kind: 'shot', dmg: 14, speed: 10, count: 3, spread: 0.09, cd: 60, sfx: 'punch',
          fx: { bleed: 100 },
          desc: 'Dois jabs direto do treinamento — o segundo risca o corte.',
        }, visual(0, '#f0c040')),
        Object.assign({
          id: 'gancho', name: 'Gancho', slot: 'simple', row: 1,
          kind: 'blast', at: 'target', dmg: 28, stun: 26, radius: 220, cd: 85, sfx: 'heavy',
          fx: { vertigo: 90 },
          desc: 'O gancho que fecha o olho de todo rival da quadra (vertigem).',
        }, visual(1, '#ff8a3b')),
        Object.assign({
          id: 'corda-de-pular', name: 'Corda de Pular', slot: 'charge', meter: 0, row: 2,
          kind: 'zone', at: 'self', time: 300, w: 240, dmg: 0.22, cd: 180, sfx: 'whoosh',
          fx: { slow: 90, bleed: 80 },
          desc: 'A corda varre o chão: quem entra fica lento e sangrando.',
        }, visual(2, '#7dff9a')),
        Object.assign({
          id: 'sombra', name: 'Sombra', slot: 'charge', meter: 1, row: 3,
          kind: 'dash', dmg: 24, speed: 19, iFrames: 10, cd: 150, sfx: 'dash',
          fx: { shock: 110 },
          desc: 'Treino de sombra: atravessa o rival — o choque do ombro desliga o passo.',
        }, visual(3, '#9adcff')),
        Object.assign({
          id: 'ko-supremo', name: 'K.O. Supremo', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 78, stun: 60, radius: 330, cd: 1100, sfx: 'ultimate',
          fx: { vertigo: 120, bleed: 200, slow: 140 },
          desc: 'A sequência completa da madrugada. Quem toma, vai ao chão da quadra.',
        }, visual(4, '#ffd27d')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    terra: { sheet: 'arcano', color: '#f0c040' },
    [id]: { sheet: id, color: '#f0c040' },
  });

  /* boxeador de pressao: encadeia como o BHM */
  POWERS[id].spamProfile = 'chain';

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'SANGUE NO OLHO',
      desc: 'Boxeador de pressão: tudo que acerta deixa status — sangramento, vertigem, lentidão e choque.',
      basic: {},
      ability: { bleed: 80 },
    },
  });
})();
