/* DS Fighters V13 — Hana e Cyber-Psicopata. Arte enviada pelo proprietário em
   bugs/Novos-personagens/, recortada por tools/integrate_fighter.py (grid
   detectado por projeção de alpha). Carregado após o V12. */
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

  /* ================== HANA — a jardineira de código ================== */
  register('hana');
  FIGHTERS.push(
    {
      id: 'hana',
      name: 'HANA',
      title: 'A Jardineira de Código Vivo',
      bio: 'Dev de sistemas vivos que compila com luz do sol: cabelo vermelho longo, armadura verde com detalhes em preto e branco e garras de poda industrial. Onde ela pisa nasce API — e quem pisa sem permissão fica preso nas raízes.',
      colors: { skin: '#f0c8a8', hair: '#d02838', shirt: '#1f7a3d', pants: '#173022', shoes: '#101410', accent: '#ff7fb0' },
      traits: { longHair: true, metalClaws: true, organicCode: true },
      stats: { power: 1.24, speed: 1.18, weight: 0.92, hp: 132, meterRate: 1.15 },
      secret: false,
      quotes: {
        intro: ['Reguei o jardim pra você.', 'Toda função é uma semente.'],
        win: ['Colheita completa.', 'O jardim ficou limpo.'],
        special: ['SERRA DE PÉTALAS!', 'TIRO DE SEMENTES!', 'VINHA, PUXA!'],
        super: ['ÁRVORE SAKURA!!'],
      },
      moves: {
        punch: { dmg: 8, range: 54, startup: 3, active: 4, recovery: 8 },
        kick: { dmg: 12, range: 68, startup: 5, active: 4, recovery: 10 },
      },
      special: {
        name: 'Tiro de Sementes', type: 'projectile', cost: 25,
        proj: { row: 1, speed: 13, dmg: 7, w: 20, h: 16, color: '#7fe08a', shape: 'orb', visualSheet: 'hana', visualRow: 1 },
      },
      super: { name: 'Árvore Sakura', type: 'buff-rush', heal: 40, buff: { invincible: 150, dmgMult: 2 }, visualSheet: 'hana', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    hana: {
      element: 'flora',
      theme: 'pétalas cortantes, sementes teleguiadas, vinhas que puxam e floração que cura',
      powers: [
        Object.assign({
          id: 'petal-saw', name: 'Serra de Pétalas', slot: 'simple', row: 0,
          kind: 'shot', dmg: 15, speed: 9, stun: 22, cd: 44, pierce: false,
          fx: { slow: 40, bleed: 120 }, sfx: 'magic',
          desc: 'Disco giratório de pétalas que CORTA (sangramento) e desacelera o rival.',
        }, visual('hana', 0, '#ff7fb0')),
        Object.assign({
          id: 'seed-shot', name: 'Tiro de Sementes', slot: 'simple', row: 1,
          kind: 'shot', dmg: 8, speed: 13, stun: 10, cd: 32, count: 3, spread: 0.18,
          fx: { poison: 100 }, sfx: 'magic',
          desc: 'Trio de sementes brilhantes que ENVENENA o rival de média distância.',
        }, visual('hana', 1, '#7fe08a')),
        Object.assign({
          id: 'vine-pull', name: 'Puxão de Vinhas', slot: 'charge', meter: 0, row: 2,
          kind: 'pull', range: 380, dmg: 14, stun: 34, cd: 50, sfx: 'dash',
          fx: { vuln: 80 },
          desc: 'Vinha espinhosa agarra, puxa pra perto e deixa o rival VULNERÁVEL — setup de garras.',
        }, visual('hana', 2, '#3fae5a')),
        Object.assign({
          id: 'bloom-field', name: 'Campo de Floração', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 150, w: 240, dmg: 0.06, slow: 38, cd: 84, sfx: 'magic',
          fx: { drain: 0.08 },
          desc: 'Nuvem de pétalas: o rival atravessa devagar enquanto Hana DRENA vida dentro do campo.',
        }, visual('hana', 3, '#ff9ecb')),
        Object.assign({
          id: 'sakura-tree', name: 'Árvore Sakura', slot: 'ultimate', row: 4,
          kind: 'aura', time: 300, heal: 65, regen: 0.05, speedMult: 1.2, dmgMult: 1.2, defMult: 0.8, cd: 110,
          sfx: 'ultimate',
          desc: 'Árvore Sakura nasce no campo e floresce: cura Hana e a buffa com o poder do jardim.',
        }, visual('hana', 4, '#ff5f9e')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    flora: { sheet: 'hana', color: '#ff7fb0' },
    hana: { sheet: 'hana', color: '#ff7fb0' },
  });
  Object.assign(SIGNATURES, {
    hana: {
      trait: 'JARDIM ARMADO',
      desc: 'Projéteis leves de média distância e controle de espaço: pétalas que cortam, sementes em trio e vinhas que puxam o rival pra perto das garras.',
      basic: {},
      ability: {},
    },
  });

  /* ================== CYBER-PSICOPATA — o enforcement de SLA ================== */
  register('cyber-psicopata');
  FIGHTERS.push(
    {
      id: 'cyber-psicopata',
      name: 'CYBER-PSICOPATA',
      title: 'O Enforcement de SLA',
      bio: '96% máquina, 4% humano: corpo brutamontes de chrome, placas gunmetal, um único olho óptico vermelho e pod de foguetes no ombro. Cada acerto pesa — e quanto mais a luta dura, mais forte ele fica.',
      colors: { skin: '#8a8f96', hair: '#101216', shirt: '#1a1d22', pants: '#0e1013', shoes: '#0a0b0d', accent: '#ff2a2a' },
      traits: { chromeBody: true, rocketPod: true, singleRedOptic: true, heavyBrawler: true },
      stats: { power: 1.62, speed: 1.06, weight: 1.20, hp: 168, meterRate: 1.32 },
      secret: false,
      quotes: {
        intro: ['Contrato assinado. Bônus garantido.', 'Seu uptime acabou.'],
        win: ['SLA cumprido.', 'Peça nova já encomendada.'],
        special: ['INVESTIDA QUEBRA-CÓDIGO!', 'BOMBARDEIO ANTI-HACKER!', 'CHUTE FOGUETE!'],
        super: ['CIBERNEUROSE!!'],
      },
      moves: {
        punch: { dmg: 8, range: 54, startup: 6, active: 5, recovery: 12 },
        kick: { dmg: 12, range: 70, startup: 9, active: 5, recovery: 15 },
      },
      special: {
        name: 'Investida Quebra-Código', type: 'dash-strike', cost: 25,
        proj: { row: 0, speed: 15, dmg: 18, w: 30, h: 24, color: '#ff2a2a', shape: 'bolt', visualSheet: 'cyber-psicopata', visualRow: 0 },
      },
      super: { name: 'Ciberneurose', type: 'buff-rush', dmg: 26, buff: { invincible: 150, dmgMult: 2 }, visualSheet: 'cyber-psicopata', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    'cyber-psicopata': {
      element: 'chrome',
      theme: 'punhos hidráulicos, foguetes teleguiados e ciberneurose',
      powers: [
        Object.assign({
          id: 'codebreaker-charge', name: 'Investida Quebra-Código', slot: 'simple', row: 0,
          kind: 'dash', dmg: 20, speed: 16, stun: 28, cd: 46,
          fx: { vuln: 90, shock: 50 }, sfx: 'heavy',
          desc: 'Dash + soco hidráulico: quebra o guarda, ELETRIZA e deixa o rival vulnerável.',
        }, visual('cyber-psicopata', 0, '#ff2a2a')),
        Object.assign({
          id: 'antihacker-bombing', name: 'Bombardeio Anti-Hacker', slot: 'simple', row: 1,
          kind: 'barrage', dmg: 8, count: 6, homing: 0.45, stun: 16, cd: 52,
          fx: { burn: 130, meterSlow: 40 }, sfx: 'explosion',
          desc: 'Saraivada de foguetes: QUEIMA o chão e atrasa o medidor do rival com o EMP.',
        }, visual('cyber-psicopata', 1, '#ff6a2a')),
        Object.assign({
          id: 'rocket-kick', name: 'Chute Foguete', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 23, speed: 17, stun: 34, cd: 58,
          fx: { launch: -12, bleed: 110 }, sfx: 'dash',
          desc: 'Chute foguete que LANÇA contra a parede e deixa o rival SANGRANDO.',
        }, visual('cyber-psicopata', 2, '#ffb02a')),
        Object.assign({
          id: 'overload', name: 'Sobrecarga', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 400, speedMult: 1.4, dmgMult: 1.3, defMult: 0.75, heal: 15, cd: 80, sfx: 'shield',
          desc: 'Circuitos sobrecarregados: +velocidade, +força e menos dano recebido por alguns segundos.',
        }, visual('cyber-psicopata', 3, '#ff2a4a')),
        Object.assign({
          id: 'cyberneurosis', name: 'Ciberneurose', slot: 'ultimate', row: 4,
          kind: 'aura', time: 720, grant: 'overclock', speedMult: 1.35, dmgMult: 1.4, defMult: 0.8, heal: 20, regen: 0.04, cd: 120, sfx: 'ultimate',
          desc: 'Por 10 segundos: esquiva de habilidades, +soco e chute, +agilidade e +força. A hora do show.',
        }, visual('cyber-psicopata', 4, '#ff2035')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    chrome: { sheet: 'cyber-psicopata', color: '#ff2a2a' },
    'cyber-psicopata': { sheet: 'cyber-psicopata', color: '#ff2a2a' },
  });
  Object.assign(SIGNATURES, {
    'cyber-psicopata': {
      trait: 'TANK DE PRESSÃO',
      desc: 'Lento, mas cada acerto pesa; quanto mais a luta dura, mais forte fica com Sobrecarga e Ciberneurose.',
      basic: {},
      ability: {},
    },
  });
})();
