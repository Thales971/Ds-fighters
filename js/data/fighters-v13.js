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
      stats: { power: 1.16, speed: 1.15, weight: 0.92, hp: 124, meterRate: 1.12 },
      secret: false,
      quotes: {
        intro: ['Reguei o jardim pra você.', 'Toda função é uma semente.'],
        win: ['Colheita completa.', 'O jardim ficou limpo.'],
        special: ['SERRA DE PÉTALAS!', 'TIRO DE SEMENTES!', 'VINHA, PUXA!'],
        super: ['ÁRVORE SAKURA!!'],
      },
      moves: {
        punch: { dmg: 5, range: 50, startup: 3, active: 4, recovery: 8 },
        kick: { dmg: 8, range: 62, startup: 6, active: 4, recovery: 10 },
      },
      special: {
        name: 'Tiro de Sementes', type: 'projectile', cost: 25,
        proj: { row: 1, speed: 13, dmg: 7, w: 20, h: 16, color: '#7fe08a', shape: 'orb', visualSheet: 'hana', visualRow: 1 },
      },
      super: { name: 'Árvore Sakura', type: 'aoe', dmg: 30, radius: 220, visualSheet: 'hana', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    hana: {
      element: 'flora',
      theme: 'pétalas cortantes, sementes teleguiadas, vinhas que puxam e floração que cura',
      powers: [
        Object.assign({
          id: 'petal-saw', name: 'Serra de Pétalas', slot: 'simple', row: 0,
          kind: 'shot', dmg: 13, speed: 9, stun: 22, cd: 46, pierce: false,
          fx: { slow: 40 }, sfx: 'magic',
          desc: 'Disco giratório de pétalas que avança cortando; bloqueável, mas empurra e desacelera.',
        }, visual('hana', 0, '#ff7fb0')),
        Object.assign({
          id: 'seed-shot', name: 'Tiro de Sementes', slot: 'simple', row: 1,
          kind: 'shot', dmg: 7, speed: 13, stun: 10, cd: 34, count: 3, spread: 0.18,
          fx: {}, sfx: 'magic',
          desc: 'Projéteis rápidos de dano baixo; o trio de sementes brilhantes cobre a média distância.',
        }, visual('hana', 1, '#7fe08a')),
        Object.assign({
          id: 'vine-pull', name: 'Puxão de Vinhas', slot: 'charge', meter: 0, row: 2,
          kind: 'pull', range: 380, dmg: 12, stun: 32, cd: 52, sfx: 'dash',
          desc: 'Vinha espinhosa agarra o oponente e puxa pra perto — setup perfeito pra garras.',
        }, visual('hana', 2, '#3fae5a')),
        Object.assign({
          id: 'bloom-field', name: 'Campo de Floração', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 150, w: 240, dmg: 0.05, slow: 38, cd: 88, sfx: 'magic',
          desc: 'Nuvem de pétalas cobre a área: Hana recupera terreno enquanto o rival atravessa devagar.',
        }, visual('hana', 3, '#ff9ecb')),
        Object.assign({
          id: 'sakura-tree', name: 'Árvore Sakura', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 40, launch: -9, radius: 220, cd: 128,
          heal: 24, fx: { vuln: 60 }, sfx: 'ultimate',
          desc: 'Árvore nasce no ponto marcado, cresce e explode em floração — dano em área devastador.',
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
      stats: { power: 1.42, speed: 0.85, weight: 1.25, hp: 150, meterRate: 1.2 },
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
          kind: 'dash', dmg: 18, speed: 15, stun: 26, cd: 48,
          fx: { vuln: 45 }, sfx: 'heavy',
          desc: 'Dash rápido + soco hidráulico de dano alto; deixa o rival vulnerável.',
        }, visual('cyber-psicopata', 0, '#ff2a2a')),
        Object.assign({
          id: 'antihacker-bombing', name: 'Bombardeio Anti-Hacker', slot: 'simple', row: 1,
          kind: 'barrage', dmg: 7, count: 6, homing: 0.45, stun: 16, cd: 56,
          fx: { burn: 110 }, sfx: 'explosion',
          desc: 'Saraivada de foguetes teleguiados em rajadas de três; explosões deixam o chão em chamas.',
        }, visual('cyber-psicopata', 1, '#ff6a2a')),
        Object.assign({
          id: 'rocket-kick', name: 'Chute Foguete', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 20, speed: 17, stun: 30, cd: 62,
          fx: { launch: -12 }, sfx: 'dash',
          desc: 'Dash com propulsão e chute que lança o oponente contra a parede.',
        }, visual('cyber-psicopata', 2, '#ffb02a')),
        Object.assign({
          id: 'overload', name: 'Sobrecarga', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 300, speedMult: 1.3, dmgMult: 1.2, defMult: 0.85, cd: 92, sfx: 'shield',
          desc: 'Circuitos sobrecarregados: +velocidade, +força e menos dano recebido por alguns segundos.',
        }, visual('cyber-psicopata', 3, '#ff2a4a')),
        Object.assign({
          id: 'cyberneurosis', name: 'Ciberneurose', slot: 'ultimate', row: 4,
          kind: 'aura', time: 600, grant: 'overclock', speedMult: 1.25, dmgMult: 1.3, cd: 140, sfx: 'ultimate',
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
