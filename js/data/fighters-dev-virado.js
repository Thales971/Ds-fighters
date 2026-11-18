/* DS Fighters — DEV VIRADO, "O Que Virou a Noite".
   Ficha do dono: rushdown velocista puro, o mais rápido do roster — TODO ataque
   forte dele é um dash. Entra, corta, sai. Caneta esferográfica branca como
   punhal. Passiva "Última Caneca": abaixo de 25% de vida fica +15% mais rápido
   e os dashes custam 5f a menos (hooks lowHpSpeed/lowHpDash no fighter.js). */
(() => {
  const id = 'dev-virado';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.85, walk: 0.88, jump: 0.85, crouch: 0.72, punch: 0.85, kick: 0.88, cpunch: 0.75, ckick: 0.78, jpunch: 0.85, jkick: 0.85, special: 0.85, hit: 0.82, block: 0.75, ko: 0.8, win: 0.85 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'DEV VIRADO',
      title: 'O Que Virou a Noite',
      bio: 'Rushdown velocista puro: o mais rápido do roster e todo ataque forte dele é um dash. Pele pálida, olhos arregalados de olheira, moletom teal manchado de café e a caneta branca na mão direita, segurada como punhal. Entra, corta, sai — e se errar o dash, apanha.',
      colors: { skin: '#F2E3D5', hair: '#14100E', shirt: '#0F766E', pants: '#3A3F45', shoes: '#7A5230', accent: '#5EEAD4' },
      traits: {},
      stats: { power: 1.0, speed: 1.55, weight: 0.82, hp: 163, meterRate: 1.15 },
      secret: false,
      quotes: {
        intro: ['Já virou a noite. Você não.', 'Na minha máquina funciona.'],
        win: ['Deploy feito. Sem teste. Achismo.', 'Rollback? Nunca ouvi falar.'],
        lose: ['Rollback...', 'Era pra funcionar na minha máquina...'],
        taunt: ['Na minha máquina funciona.'],
        special: ['Commit!', 'Push!', 'Merge!'],
        super: ['DEPLOY! DE SEXTA! À NOITE!'],
      },
      moves: {
        punch: { dmg: 8, range: 50, startup: 4, active: 4, recovery: 8 },   /* canetada (jab): encadeia 2x */
        kick: { dmg: 14, range: 62, startup: 8, active: 4, recovery: 12 },  /* chute frontal; agachado = rasteira */
      },
      special: {
        name: 'Commit Push', type: 'melee-rush', dmg: 16, hits: 1,
        proj: { speed: 0, dmg: 16, w: 30, h: 30, color: '#ff2d55', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Deploy de Sexta à Noite', type: 'melee-rush', dmg: 20, hits: 5 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'terra',
      theme: 'dev virado: 4 dashes de alto risco (custo baixo, recovery longo se errar) + ult de deploy em sexta à noite',
      spamProfile: 'chain',
      powers: [
        Object.assign({
          id: 'commit-push', name: 'Commit Push', slot: 'simple', row: 0,
          kind: 'dash', dmg: 16, speed: 20, cd: 70, whiffRecovery: 20, sfx: 'dash',
          fx: { bleed: 180, vuln: 120 },
          desc: 'Dash cortante com rastro vermelho: 16 de dano + sangramento (3s) + alvo VULNERÁVEL (+20% dano, 2s). Errou? recovery longo.',
        }, visual(0, '#ff2d55')),
        Object.assign({
          id: 'rebase', name: 'Rebase', slot: 'simple', row: 1,
          kind: 'rush', hits: 2, dmg: 17, teleport: true, cd: 115, whiffRecovery: 20, sfx: 'dash',
          fx: { blind: 90 },
          desc: 'Dois dashes encadeados automáticos: ~34 de dano massivo e a tela do oponente fica turva por 1,5s.',
        }, visual(1, '#7dd3fc')),
        Object.assign({
          id: 'force-merge', name: 'Force Merge', slot: 'simple', row: 2,
          kind: 'dash', dmg: 20, speed: 22, stun: 30, kx: 12, cd: 95, whiffRecovery: 20, sfx: 'heavy',
          fx: { shock: 30 },
          desc: 'Investida de ombro: 20 de dano + knockback forte + atordoamento de 0,5s.',
        }, visual(2, '#fbbf24')),
        Object.assign({
          id: 'hotfix', name: 'Hotfix', slot: 'simple', row: 3,
          kind: 'dash', dmg: 18, speed: 14, stun: 24, launch: -9, cd: 125, whiffRecovery: 20, sfx: 'heavy',
          fx: { vuln: 240 },
          desc: 'Uppercut lançador: 18 de dano, joga o oponente pro ar; enquanto cai ele fica VULNERÁVEL (+20% dano).',
        }, visual(3, '#f87171')),
        Object.assign({
          id: 'deploy-sexta', name: 'Deploy de Sexta à Noite', slot: 'ultimate', row: 4,
          kind: 'rush', hits: 5, dmg: 20, teleport: true, cd: 150, sfx: 'ultimate',
          fx: { bleed: 36000, explode: 3 },
          desc: 'Sequência de 5 dashes com afterimages (~100 de dano se tudo conectar, o oponente atravessa a tela) terminando em explosão. Aplica sangramento permanente (até o fim da luta).',
        }, visual(4, '#ffe14d')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#ff2d55' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'ÚLTIMA CANECA',
      desc: 'Rushdown puro: todo ataque forte é um dash de alto risco. Abaixo de 25% de vida, +15% de velocidade e dashes custam 5f a menos (pânico de deadline).',
      basic: {},
      ability: {},
      chainBonus: 1,      /* canetada encadeia 2x */
      lowHpSpeed: 1.15,   /* Última Caneca: +15% speed abaixo de 25% */
      lowHpDash: true,    /* Última Caneca: dashes -5f de cooldown abaixo de 25% */
    },
  });
})();
