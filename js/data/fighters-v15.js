/* DS Fighters V15 — Engenheira de Prompt e Boneco de Treino.
   Arte do dono em bugs/Novos-personagens/, recortada por
   tools/integrate_fighter.py. Carregado após o V14. */
(() => {
  const register = (id) => {
    SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
    SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
      frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    });
  };
  const visual = (id, row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  /* ================== ENGENHEIRA DE PROMPT ================== */
  register('engenheira-prompt');
  FIGHTERS.push(
    {
      id: 'engenheira-prompt',
      name: 'ENGENHEIRA DE PROMPT',
      title: 'A Arquiteta de Instruções',
      bio: 'Engenheira de prompts de cabelo violeta, casaco roxo e visor futurista: escreve instruções que viram realidade. Cada habilidade dela é um prompt executado na cara do rival.',
      colors: { skin: '#eec4a8', hair: '#7a3fd0', shirt: '#1a1424', pants: '#241a30', shoes: '#141020', accent: '#b96bff' },
      traits: { promptEngineer: true, visor: true, hairStyle: 'long' },
      stats: { power: 1.44, speed: 1.22, weight: 0.96, hp: 146, meterRate: 1.30 },
      secret: false,
      quotes: {
        intro: ['Deixa que eu escrevo o final.', 'Prompt aceito. Executando.'],
        win: ['Resposta gerada.', 'Refinamento concluído.'],
        special: ['TOKEN BOMBA!', 'JANELA DE CONTEXTO!', 'ALUCINAÇÃO!'],
        super: ['PROMPT SUPREMO!!'],
      },
      moves: {
        punch: { dmg: 9, range: 56, startup: 3, active: 4, recovery: 8 },
        kick: { dmg: 13, range: 68, startup: 5, active: 4, recovery: 10 },
      },
      special: {
        name: 'Token Bomba', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 11, dmg: 12, w: 24, h: 20, color: '#b96bff', shape: 'orb', visualSheet: 'engenheira-prompt', visualRow: 0 },
      },
      super: { name: 'Prompt Supremo', type: 'aoe', dmg: 30, radius: 220, visualSheet: 'engenheira-prompt', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    'engenheira-prompt': {
      element: 'ia',
      theme: 'tokens, janelas de contexto e alucinações executáveis',
      powers: [
        Object.assign({
          id: 'token-bomb', name: 'Token Bomba', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 11, stun: 16, cd: 42,
          fx: { meterSlow: 35 }, sfx: 'magic',
          desc: 'Token comprimido queexplode e atrasa o medidor do rival.',
        }, visual('engenheira-prompt', 0, '#b96bff')),
        Object.assign({
          id: 'context-window', name: 'Janela de Contexto', slot: 'simple', row: 1,
          kind: 'dash', dmg: 15, speed: 14, stun: 24, cd: 48,
          fx: { vuln: 70 }, sfx: 'dash',
          desc: 'Avanço em janela de contexto que deixa o rival VULNERÁVEL.',
        }, visual('engenheira-prompt', 1, '#8fd0ff')),
        Object.assign({
          id: 'hallucination', name: 'Alucinação', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 14, dmg: 20, stun: 28, launch: -7, cd: 70,
          fx: { blind: 80 }, sfx: 'explosion',
          desc: 'O rival vê o que não existe: dano e CEGUEIRA no ponto marcado.',
        }, visual('engenheira-prompt', 2, '#ff7fd0')),
        Object.assign({
          id: 'context-overflow', name: 'Estouro de Contexto', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 110, w: 220, dmg: 0.10, slow: 32, cd: 80,
          fx: { meterSlow: 45 }, sfx: 'magic',
          desc: 'Zona de overflow: dano contínuo, lentidão e medidor travado.',
        }, visual('engenheira-prompt', 3, '#b96bff')),
        Object.assign({
          id: 'supreme-prompt', name: 'Prompt Supremo', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 38, launch: -9, radius: 220, cd: 126,
          fx: { paralyze: 25, vuln: 60 }, sfx: 'ultimate',
          desc: 'O prompt perfeito: dano massivo, paralisia curta e vulnerabilidade.',
        }, visual('engenheira-prompt', 4, '#ffb0ff')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    ia: { sheet: 'engenheira-prompt', color: '#b96bff' },
    'engenheira-prompt': { sheet: 'engenheira-prompt', color: '#b96bff' },
  });
  Object.assign(SIGNATURES, {
    'engenheira-prompt': {
      trait: 'INSTRUÇÕES EXECUTÁVEIS',
      desc: 'Cada acerto é um prompt: atrasa medidores, cega, desacelera e a ultimate paralisa.',
      basic: {},
      ability: {},
    },
  });

  /* ================== BONECO DE TREINO ================== */
  register('boneco-treino');
  FIGHTERS.push(
    {
      id: 'boneco-treino',
      name: 'BONECO DE TREINO',
      title: 'Madeira de Lei',
      bio: 'O boneco de madeira do dojo: apanha sem reclamar, nunca desiste e é o sparring perfeito do treinamento.',
      colors: { skin: '#c8a06a', hair: '#6a4a28', shirt: '#8a6a40', pants: '#7a5a34', shoes: '#5a4020', accent: '#d8b98a' },
      traits: { trainingDummy: true, wooden: true },
      stats: { power: 0.8, speed: 0.7, weight: 1.4, hp: 400, meterRate: 0.5 },
      secret: false,
      quotes: { intro: ['...'], win: ['...'], special: ['...'], super: ['...'] },
      moves: {
        punch: { dmg: 3, range: 46, startup: 8, active: 4, recovery: 16 },
        kick: { dmg: 4, range: 58, startup: 10, active: 4, recovery: 18 },
      },
      special: { name: 'Rangido', type: 'projectile', cost: 50, proj: { row: 0, speed: 6, dmg: 4, w: 20, h: 16, color: '#d8b98a', shape: 'orb' } },
      super: { name: 'Tombo', type: 'aoe', dmg: 8, radius: 160 },
    },
  );
  Object.assign(POWERS, {
    'boneco-treino': {
      element: 'madeira',
      theme: 'sparring de madeira — quase não reage',
      powers: [
        Object.assign({ id: 'rangido', name: 'Rangido', slot: 'simple', row: 0, kind: 'shot', dmg: 4, speed: 6, stun: 8, cd: 90, fx: {}, sfx: 'magic', desc: 'Lascas de madeira voam.' }, visual('engenheira-prompt', 0, '#d8b98a')),
        Object.assign({ id: 'balanco', name: 'Balanço', slot: 'simple', row: 1, kind: 'dash', dmg: 5, speed: 6, stun: 10, cd: 100, fx: {}, sfx: 'dash', desc: 'O boneco se inclina pra frente.' }, visual('engenheira-prompt', 1, '#d8b98a')),
        Object.assign({ id: 'tomba', name: 'Tombo', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 30, dmg: 6, stun: 10, cd: 120, fx: {}, sfx: 'explosion', desc: 'Cai pesado no ponto marcado.' }, visual('engenheira-prompt', 2, '#d8b98a')),
        Object.assign({ id: 'poeira', name: 'Poeira de Serragem', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 80, w: 180, dmg: 0.02, slow: 15, cd: 130, fx: {}, sfx: 'magic', desc: 'Serragem no ar.' }, visual('engenheira-prompt', 3, '#d8b98a')),
        Object.assign({ id: 'desmorona', name: 'Desmorona', slot: 'ultimate', row: 4, kind: 'blast', at: 'self', dmg: 8, stun: 12, radius: 160, cd: 200, fx: {}, sfx: 'explosion', desc: 'O boneco desmorona em cima do rival.' }, visual('engenheira-prompt', 4, '#d8b98a')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    madeira: { sheet: 'engenheira-prompt', color: '#d8b98a' },
    'boneco-treino': { sheet: 'engenheira-prompt', color: '#d8b98a' },
  });
  Object.assign(SIGNATURES, {
    'boneco-treino': { trait: 'SPARRING', desc: 'Feito de madeira: apanha, aguenta e quase não revida.', basic: {}, ability: {} },
  });
})();
