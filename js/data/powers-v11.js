/* DS Fighters V11 — habilidades exclusivas e estados temporários limitados. */
(() => {
  const withVisual = (id, row, color, power) => Object.assign({}, power, {
    visualSheet: id,
    visualRow: row,
    impactSheets: [],
    impactColor: color,
  });
  const kit = (element, theme, powers) => ({ element, theme, powers });

  Object.assign(POWERS, {
    mis: kit('mis', 'chamas douradas, runas de brasa e vertigem térmica', [
      withVisual('mis', 0, '#ffb13b', {
        id: 'mistral-ember', name: 'Brasa Mistral', slot: 'simple', row: 0,
        kind: 'shot', dmg: 12, speed: 10, stun: 17, cd: 43, burn: 42, sfx: 'fire',
        desc: 'Uma esfera de fogo dourado deixa uma queimadura breve.',
      }),
      withVisual('mis', 1, '#ff6c2c', {
        id: 'flame-step', name: 'Passo da Labareda', slot: 'simple', row: 1,
        kind: 'dash', dmg: 15, speed: 13, stun: 21, cd: 48, burn: 36, sfx: 'fire',
        desc: 'Investida curta com rastro de fogo e um golpe em brasa.',
      }),
      withVisual('mis', 2, '#ff9736', {
        id: 'cinder-pillar', name: 'Pilar de Cinzas', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 16, dmg: 20, stun: 27, launch: -8, burn: 54, cd: 74, sfx: 'explosion',
        desc: 'Uma coluna de carvão incandescente sobe sob o rival.',
      }),
      withVisual('mis', 3, '#ffc45a', {
        id: 'ember-orbit', name: 'Órbita de Brasas', slot: 'charge', meter: 1, row: 3,
        kind: 'zone', at: 'target', time: 78, dmg: 0.085, burn: 30, slow: 18, cd: 84, sfx: 'magic',
        desc: 'Runas de fogo ocupam o chão por pouco tempo e queimam quem ficar perto.',
      }),
      withVisual('mis', 4, '#ff7040', {
        id: 'mistral-vertigo', name: 'Vórtice de Cabeça para Baixo', slot: 'ultimate', row: 4,
        kind: 'blast', at: 'target', dmg: 31, stun: 36, launch: -8, radius: 210,
        fx: { blind: 82, vertigo: 108, burn: 72 }, cd: 130, sfx: 'ultimate',
        desc: 'Um vórtice de fogo inverte brevemente o viewport de jogo do alvo, causa cegueira e queimadura contínua.',
      }),
    ]),
    'dev-senior': kit('dev-senior', 'punhos pesados, circuitos de nanomáquinas e overdrive', [
      withVisual('dev-senior', 0, '#f3a348', {
        id: 'pipeline-fist', name: 'Punho de Pipeline', slot: 'simple', row: 0,
        kind: 'shot', dmg: 15, speed: 10, stun: 19, cd: 42, sfx: 'metal',
        fx: { shock: 60, meterSlow: 30 },
        desc: 'Punho de energia comprimida que ELETRIZA os controles e atrasa o medidor do rival.',
      }),
      withVisual('dev-senior', 1, '#ffad4d', {
        id: 'cache-flush', name: 'Cache Flush', slot: 'simple', row: 1,
        kind: 'dash', dmg: 20, speed: 13, stun: 25, cd: 50, sfx: 'heavy',
        fx: { vuln: 90 },
        desc: 'Investida pesada que deixa o rival VULNERÁVEL após o impacto.',
      }),
      withVisual('dev-senior', 2, '#d9d5cb', {
        id: 'pipeline-impact', name: 'Impacto de Pipeline', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 18, dmg: 25, stun: 32, launch: -9, cd: 74, sfx: 'explosion',
        fx: { shock: 70 },
        desc: 'Golpe de cima para baixo que estoura o chão e ELETRIZA quem estiver perto.',
      }),
      withVisual('dev-senior', 3, '#ff8b2c', {
        id: 'nano-pressure', name: 'Pressão de Nanomáquinas', slot: 'charge', meter: 1, row: 3,
        kind: 'zone', at: 'target', time: 80, w: 200, dmg: 0.12, slow: 28, cd: 80, sfx: 'metal',
        fx: { poison: 140 },
        desc: 'Zona de nanomáquinas que CORRÓI com veneno, desacelera e dificulta a fuga.',
      }),
      withVisual('dev-senior', 4, '#ffbd59', {
        id: 'nano-overdrive', name: 'Nano Overdrive', slot: 'ultimate', row: 4,
        kind: 'aura', time: 240, grant: 'nanomachines', form: 'nano', armor: true, heal: 20,
        dmgMult: 1.25, defMult: 0.75, speedMult: 1.1, cd: 130, sfx: 'ultimate',
        desc: 'Dev Senior fica sem camisa e ativa nanomáquinas: superarmadura, +20% de força e 20% menos dano recebido por 3,5 segundos.',
      }),
    ]),
  });

  Object.assign(ELEMENT_FX, {
    mis: { sheet: 'mis', color: '#ff8427' },
    'dev-senior': { sheet: 'dev-senior', color: '#f29438' },
  });
  Object.assign(SIGNATURES, {
    mis: { trait: 'BRASA MISTRAL', desc: 'As chamas podem queimar por janelas curtas; a ultimate também causa cegueira e vertigem visual.', basic: {}, ability: {} },
    'dev-senior': { trait: 'NANOMÁQUINAS', desc: 'A ultimate ativa por tempo limitado uma forma sem camisa com armadura e força aumentadas.', basic: {}, ability: {} },
  });
})();
