/* DS Fighters V14 — Grika reformulada (novo design) e Guarda Digital.
   Arte do dono em bugs/Novos-personagens/, recortada por
   tools/integrate_fighter.py (flood-fill + grid por projeção).
   Carregado após o V13. */
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

  /* ================== GRIKA — a sonhadora sombria (reformulada) ================== */
  register('grika');
  FIGHTERS.push(
    {
      id: 'grika',
      name: 'GRIKA, A SONHADORA SOMBRIA',
      title: 'A Voz Debaixo da Cama',
      bio: 'Gótica de cabelo violeta longo, top curto, shorts, botas altas e guardas de braço. Seus pesadelos ganham garras, correntes de sombra e uma singularidade que engole o chão.',
      colors: { skin: '#e4c7bf', hair: '#6a2fae', shirt: '#201c28', pants: '#16151d', shoes: '#100f15', accent: '#a24ce8' },
      traits: { gothic: true, nightmare: true, longHair: true },
      stats: { power: 1.30, speed: 1.05, weight: 1.0, hp: 130, meterRate: 1.16 },
      secret: false,
      quotes: {
        intro: ['Apague a luz. O sonho começa.', 'Não olhe para o fundo.'],
        win: ['O pesadelo era seu.', 'Acorde quando puder.'],
        special: ['GARRA DO PESADELO!', 'NOITE SEM FIM!', 'SOMBRA, PRENDA!'],
        super: ['SINGULARIDADE DO PESADELO!'],
      },
      moves: {
        punch: { dmg: 6, range: 52, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 9, range: 64, startup: 7, active: 4, recovery: 12 },
      },
      special: {
        name: 'Estilhaço Onírico', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 9, dmg: 13, w: 26, h: 22, color: '#9d4ce9', shape: 'orb', visualSheet: 'grika', visualRow: 0 },
      },
      super: { name: 'Singularidade do Pesadelo', type: 'aoe', dmg: 30, radius: 210, visualSheet: 'grika', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    grika: {
      element: 'sombra',
      theme: 'trevas violeta, garras oníricas e singularidade sombria',
      powers: [
        Object.assign({
          id: 'nightmare-shard', name: 'Estilhaço Onírico', slot: 'simple', row: 0,
          kind: 'shot', dmg: 13, speed: 9, stun: 18, cd: 44,
          fx: { slow: 50 }, sfx: 'magic',
          desc: 'Fragmento de pesadelo que DESACELERA o rival por um instante.',
        }, visual('grika', 0, '#b252f0')),
        Object.assign({
          id: 'eclipse-lunge', name: 'Investida do Eclipse', slot: 'simple', row: 1,
          kind: 'dash', dmg: 16, speed: 13, stun: 22, cd: 48,
          fx: { vuln: 80 }, sfx: 'dash',
          desc: 'Cruza a arena num arco violeta e deixa o rival VULNERÁVEL.',
        }, visual('grika', 1, '#8d42cf')),
        Object.assign({
          id: 'nightmare-claw', name: 'Garra do Pesadelo', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 14, dmg: 21, stun: 28, launch: -8, cd: 72,
          fx: { blind: 70 }, sfx: 'explosion',
          desc: 'Garra de sombra golpeia o ponto marcado e CEGA brevemente.',
        }, visual('grika', 2, '#cc90ff')),
        Object.assign({
          id: 'sleep-chains', name: 'Correntes do Sono', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 90, w: 210, dmg: 0.12, slow: 30, cd: 80,
          fx: { meterSlow: 40 }, sfx: 'magic',
          desc: 'Correntes prendem o chão: dano contínuo, lentidão e medidor atrasado.',
        }, visual('grika', 3, '#7f35bd')),
        Object.assign({
          id: 'nightmare-singularity', name: 'Singularidade do Pesadelo', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 36, launch: -8, radius: 210, cd: 126,
          fx: { paralyze: 30, vuln: 60 }, sfx: 'ultimate',
          desc: 'Buraco negro no ponto marcado: dano massivo, paralisia curta e vulnerabilidade.',
        }, visual('grika', 4, '#c06bff')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    sombra: { sheet: 'grika', color: '#a24ce8' },
    grika: { sheet: 'grika', color: '#a24ce8' },
  });
  Object.assign(SIGNATURES, {
    grika: {
      trait: 'PESADELO',
      desc: 'Ataques de sombra controlam o espaço: lentidão, cegueira e a singularidade paralisa por uma janela limitada.',
      basic: {},
      ability: {},
    },
  });

  /* ================== GUARDA DIGITAL — a sentinela do perímetro ================== */
  register('guarda-digital');
  FIGHTERS.push(
    {
      id: 'guarda-digital',
      name: 'GUARDA DIGITAL',
      title: 'A Sentinela do Perímetro',
      bio: 'Agente de segurança cibernética de cabelo escuro e traje preto-azul: patrulha a arena com tiros de firewall, prende invasores no campo de detenção e multa quem tenta escapar.',
      colors: { skin: '#e8c4a8', hair: '#1a1620', shirt: '#101826', pants: '#0c1220', shoes: '#0a0e18', accent: '#2ad4ff' },
      traits: { digitalGuard: true, energyBlast: true, hairStyle: 'long' },
      stats: { power: 1.22, speed: 1.08, weight: 1.0, hp: 136, meterRate: 1.14 },
      secret: false,
      quotes: {
        intro: ['Perímetro protegido.', 'Identificação, por favor.'],
        win: ['Invasor contido.', 'Registro no log.'],
        special: ['TIRO DE FIREWALL!', 'BLITZ DE SEGURANÇA!', 'CAMPO DE DETENÇÃO!'],
        super: ['LOCKDOWN TOTAL!'],
      },
      moves: {
        punch: { dmg: 6, range: 52, startup: 4, active: 4, recovery: 9 },
        kick: { dmg: 9, range: 64, startup: 6, active: 4, recovery: 11 },
      },
      special: {
        name: 'Tiro de Firewall', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 12, dmg: 11, w: 22, h: 18, color: '#2ad4ff', shape: 'bolt', visualSheet: 'guarda-digital', visualRow: 0 },
      },
      super: { name: 'Lockdown Total', type: 'aoe', dmg: 26, radius: 240, visualSheet: 'guarda-digital', visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    'guarda-digital': {
      element: 'neon',
      theme: 'tiros de firewall, blitz de patrulha e campos de detenção',
      powers: [
        Object.assign({
          id: 'firewall-shot', name: 'Tiro de Firewall', slot: 'simple', row: 0,
          kind: 'shot', dmg: 11, speed: 12, stun: 14, cd: 40,
          fx: { lock: 60 }, sfx: 'neon',
          desc: 'Tiro de firewall que TRAVA os comandos do rival por um instante.',
        }, visual('guarda-digital', 0, '#2ad4ff')),
        Object.assign({
          id: 'security-blitz', name: 'Blitz de Segurança', slot: 'simple', row: 1,
          kind: 'dash', dmg: 15, speed: 14, stun: 30, cd: 48,
          fx: { shock: 40 }, sfx: 'dash',
          desc: 'Patulha relâmpago que ELETRIZA e atordoa no contato.',
        }, visual('guarda-digital', 1, '#48dfff')),
        Object.assign({
          id: 'detention-field', name: 'Campo de Detenção', slot: 'charge', meter: 0, row: 2,
          kind: 'zone', at: 'target', time: 120, w: 220, dmg: 0.08, slow: 35, cd: 78,
          fx: { meterSlow: 45 }, sfx: 'neon',
          desc: 'Campo de detenção: dano contínuo, lentidão e medidor atrasado.',
        }, visual('guarda-digital', 2, '#2ad4ff')),
        Object.assign({
          id: 'digital-fine', name: 'Multa Digital', slot: 'charge', meter: 1, row: 3,
          kind: 'shot', dmg: 10, speed: 11, stun: 20, cd: 60,
          fx: { meterSlow: 60, drain: 0.06 }, sfx: 'magic',
          desc: 'Multa digital que DRENA o medidor do invasor.',
        }, visual('guarda-digital', 3, '#7fe0ff')),
        Object.assign({
          id: 'total-lockdown', name: 'Lockdown Total', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'self', dmg: 26, stun: 40, launch: -9, radius: 240, cd: 128,
          fx: { paralyze: 40, lock: 70 }, sfx: 'ultimate',
          desc: 'Lockdown em área: dano forte, paralisia curta e comandos travados.',
        }, visual('guarda-digital', 4, '#2ad4ff')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    'guarda-digital': { sheet: 'guarda-digital', color: '#2ad4ff' },
  });
  Object.assign(SIGNATURES, {
    'guarda-digital': {
      trait: 'SENTINELA',
      desc: 'Controle de perímetro: tiros que travam comandos, campo de detenção e multa que drena o medidor.',
      basic: {},
      ability: {},
    },
  });
})();
