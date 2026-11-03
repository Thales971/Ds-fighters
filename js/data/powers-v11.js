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
    grika: kit('grika', 'trevas violeta, garras oníricas e singularidade sombria', [
      withVisual('grika', 0, '#b252f0', {
        id: 'nightmare-shard', name: 'Estilhaço Onírico', slot: 'simple', row: 0,
        kind: 'shot', dmg: 12, speed: 9, stun: 18, cd: 45, fx: { slow: 24 }, sfx: 'magic',
        big: true, projScale: 1.7, count: 1, spread: 0,
        desc: 'Um fragmento de pesadelo reduz a velocidade do rival por um instante.',
      }),
      withVisual('grika', 1, '#8d42cf', {
        id: 'gothic-lunge', name: 'Investida do Eclipse', slot: 'simple', row: 1,
        kind: 'dash', dmg: 16, speed: 13, stun: 22, cd: 49, fx: { vuln: 34 }, sfx: 'dash',
        dashScale: 1.8, phase: true, iFrames: 10,
        desc: 'Grika cruza a arena num arco violeta e deixa o alvo vulnerável por pouco tempo.',
      }),
      withVisual('grika', 2, '#cc90ff', {
        id: 'nightmare-claw', name: 'Garra do Pesadelo', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 16, dmg: 20, stun: 27, launch: -8, cd: 74, fx: { blind: 34 }, sfx: 'explosion',
        big: true,
        desc: 'Uma garra de sombra golpeia o ponto marcado e obscurece a visão brevemente.',
      }),
      withVisual('grika', 3, '#7f35bd', {
        id: 'shadow-chains', name: 'Correntes do Sono', slot: 'charge', meter: 1, row: 3,
        kind: 'zone', at: 'target', time: 84, w: 300, dmg: 0.075, slow: 25, cd: 82, fx: { meterSlow: 24 }, sfx: 'magic',
        desc: 'Correntes de sombra prendem o chão e atrasam a recuperação de medidor por um instante.',
      }),
      withVisual('grika', 4, '#c06bff', {
        id: 'nightmare-black-hole', name: 'Buraco Negro do Pesadelo', slot: 'ultimate', row: 4,
        kind: 'zone', at: 'target', time: 130, w: 380, dmg: 0.16, cd: 130,
        fx: { paralyze: 20 }, sfx: 'ultimate', big: true,
        desc: 'Uma singularidade no chão causa dano contínuo e paralisa por uma janela curta, sem renovar o controle indefinidamente.',
      }),
    ]),
    'dev-senior': kit('dev-senior', 'punhos pesados, circuitos de nanomáquinas e overdrive', [
      withVisual('dev-senior', 0, '#f3a348', {
        id: 'pipeline-fist', name: 'Punho de Pipeline', slot: 'simple', row: 0,
        kind: 'shot', dmg: 13, speed: 10, stun: 19, cd: 44, sfx: 'metal',
        desc: 'Um punho de energia comprimida cruza a arena.',
      }),
      withVisual('dev-senior', 1, '#ffad4d', {
        id: 'cache-flush', name: 'Cache Flush', slot: 'simple', row: 1,
        kind: 'dash', dmg: 18, speed: 12, stun: 25, cd: 52, sfx: 'heavy',
        desc: 'Investida pesada que descarrega o impacto no contato.',
      }),
      withVisual('dev-senior', 2, '#d9d5cb', {
        id: 'pipeline-impact', name: 'Impacto de Pipeline', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 18, dmg: 23, stun: 30, launch: -9, cd: 78, sfx: 'explosion',
        desc: 'Um golpe de cima para baixo estoura o chão com força de produção.',
      }),
      withVisual('dev-senior', 3, '#ff8b2c', {
        id: 'nano-pressure', name: 'Pressão de Nanomáquinas', slot: 'charge', meter: 1, row: 3,
        kind: 'zone', at: 'target', time: 66, w: 190, dmg: 0.10, slow: 20, cd: 84, sfx: 'metal',
        desc: 'Nanomáquinas formam uma zona curta de pressão e dificultam a fuga.',
      }),
      withVisual('dev-senior', 4, '#ffbd59', {
        id: 'nano-overdrive', name: 'Nano Overdrive', slot: 'ultimate', row: 4,
        kind: 'aura', time: 210, grant: 'nanomachines', form: 'nano', armor: true,
        dmgMult: 1.20, defMult: 0.80, cd: 140, sfx: 'ultimate',
        desc: 'Dev Senior fica sem camisa e ativa nanomáquinas: superarmadura, +20% de força e 20% menos dano recebido por 3,5 segundos.',
      }),
    ]),
  });

  Object.assign(ELEMENT_FX, {
    mis: { sheet: 'mis', color: '#ff8427' },
    grika: { sheet: 'grika', color: '#a24ce8' },
    'dev-senior': { sheet: 'dev-senior', color: '#f29438' },
  });
  Object.assign(SIGNATURES, {
    mis: { trait: 'BRASA MISTRAL', desc: 'As chamas podem queimar por janelas curtas; a ultimate também causa cegueira e vertigem visual.', basic: {}, ability: {} },
    grika: { trait: 'PESADELO', desc: 'Ataques de sombra controlam o espaço; a ultimate paralisa por uma janela limitada.', basic: {}, ability: {} },
    'dev-senior': { trait: 'NANOMÁQUINAS', desc: 'A ultimate ativa por tempo limitado uma forma sem camisa com armadura e força aumentadas.', basic: {}, ability: {} },
  });
})();
