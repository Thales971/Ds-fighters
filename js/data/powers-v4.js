/* ============================================================
   DS FIGHTERS — V4: Urbano, Xeon, Qwen (secreta), 2ª ultimate do IALES
   e reforços de balanceamento. Carregado depois de powers-turbo.js.
   Novos tipos de habilidade (fighter.js):
     quake — soco que racha o ar: trava o rival (lock) e depois o arremessa longe.
     afo2  — All For One: Ação Final (IALES), cresce com os poderes acumulados.
   ============================================================ */
Object.assign(POWERS, {
  urbano: {
    element: 'tremor',
    theme: 'Fruta do tremor: racha o ar, sacode o chão e arremessa longe',
    powers: [
      { id: 'quakefist', name: 'Soco Sísmico', slot: 'simple', row: 0, kind: 'quake', range: 150, dmg: 13, lock: 26, kx: 22, launch: -10, cd: 70, sfx: 'heavy', desc: 'Racha o ar na frente do punho: TRAVA o rival e depois o joga para longe.' },
      { id: 'tremorwave', name: 'Onda de Tremor', slot: 'simple', row: 1, kind: 'blast', at: 'wave', dmg: 10, stun: 22, cd: 56, sfx: 'explosion', desc: 'Onda sísmica que corre pelo chão e derruba.' },
      { id: 'airgrab', name: 'Agarrar o Céu', slot: 'charge', meter: 0, row: 2, kind: 'quake', range: 360, pullFirst: true, dmg: 16, lock: 34, kx: 26, launch: -12, sfx: 'heavy', desc: 'Puxa o rival rachando o ar e solta um tremor à queima-roupa.' },
      { id: 'quakearmor', name: 'Bolha do Tremor', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 300, armor: true, burstDmg: 14, sfx: 'shield', desc: 'Armadura de tremor: aguenta golpes e explode quem estiver perto.' },
      { id: 'quakeult', name: 'Terremoto Total', slot: 'ultimate', row: 4, kind: 'quake', range: 900, both: true, dmg: 38, lock: 46, kx: 30, launch: -15, screen: true, sfx: 'ultimate', desc: 'Racha o ar dos dois lados da tela: todo mundo no chão é travado e lançado.' },
    ],
  },
  xeon: {
    element: 'termico',
    theme: 'Gelo e fogo: lentidão, queimadura e choque térmico',
    powers: [
      { id: 'icespear', name: 'Lança de Gelo', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 11, cd: 42, fx: { chill: 160 }, sfx: 'magic', desc: 'Cristal veloz que deixa o rival LENTO (gelo).' },
      { id: 'flamefist', name: 'Punho Flamejante', slot: 'simple', row: 1, kind: 'dash', dmg: 12, speed: 15, cd: 46, burn: 180, sfx: 'fire', desc: 'Investida em chamas que QUEIMA (dano contínuo).' },
      { id: 'glacier', name: 'Prisão Glacial', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 12, dmg: 14, stun: 70, launch: 0, fx: { chill: 220 }, sfx: 'magic', desc: 'Cristais brotam sob o rival e o CONGELAM no lugar.' },
      { id: 'firewall', name: 'Muralha de Fogo', slot: 'charge', meter: 1, row: 3, kind: 'zone', time: 240, dmg: 3, burn: 120, sfx: 'fire', desc: 'Faixa de fogo no chão que queima quem pisar.' },
      { id: 'thermal', name: 'Choque Térmico', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 36, fx: { chill: 120, burn: 200, explode: 8 }, sfx: 'ultimate', desc: 'Congela e explode em vapor: gelo + fogo ao mesmo tempo.' },
    ],
  },
  qwen: {
    element: 'ia',
    theme: 'Deusa das IAs: tokens, contexto infinito, multimodal e mistura de especialistas',
    autoAim: true,
    powers: [
      { id: 'token', name: 'Token Teleguiado', slot: 'simple', row: 0, kind: 'shot', dmg: 8, speed: 10, count: 2, spread: 0.3, seek: true, cd: 36, sfx: 'magic', desc: 'Dois tokens que sempre encontram o alvo.' },
      { id: 'context', name: 'Contexto de 1M', slot: 'simple', row: 1, kind: 'beam', range: 760, dmg: 14, stun: 24, seek: true, cd: 64, fx: { vuln: 180 }, sfx: 'thunder_cast', desc: 'Raio que atravessa a arena inteira e deixa VULNERÁVEL.' },
      { id: 'multimodal', name: 'Multimodal', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 9, speed: 8, count: 3, spread: 0.5, seek: true, pierce: true, fx: { blind: 120, shock: 60 }, sfx: 'magic', desc: 'Olho, som e imagem: CEGA e ELETRIZA os controles.' },
      { id: 'moe', name: 'Mistura de Especialistas', slot: 'charge', meter: 1, row: 3, kind: 'barrage', dmg: 6, count: 8, seek: true, finisher: 16, sfx: 'ultimate', desc: 'Oito especialistas atacam em sequência e o melhor finaliza.' },
      { id: 'thinking', name: 'Modo Pensamento: Astra', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 44, transform: 'astra', time: 720, fx: { lock: 240, vuln: 240 }, heal: 20, sfx: 'ultimate', desc: 'Pensa antes de agir: golpe garantido que trava os poderes do rival e a transforma na QWEN ASTRA adulta por 12s (+30% dano, +15% velocidade).' },
    ],
  },
});

/* 2ª ultimate do IALES (tecla 6): só com 4+ poderes acumulados no All For One. */
POWERS.iales.powers.push({
  id: 'afo2', name: 'All For One: Ação Final', slot: 'ultimate', row: 4, kind: 'afo2', needAfo: 4, dmg: 30, perAfo: 4,
  sfx: 'ultimate', desc: 'Precisa de 4+ poderes acumulados: braço colossal de IAs, acerto garantido, cura e drena energia. Mais forte a cada acúmulo.',
});
POWERS.iales.powers.forEach((p) => {
  if (p.id === 'prompt') { p.dmg = 8; p.cd = 34; }
  if (p.id === 'dragon') { p.dmg = 21; p.cd = 80; }
  if (p.id === 'afo') { p.dmg = 7; p.count = 12; p.finisher = 30; }
});
/* ET 1155 mais forte */
POWERS.stack.powers.forEach((p) => {
  if (p.id === 'chip') { p.dmg = 14; p.cd = 36; p.fx = Object.assign({}, p.fx, { stun: 10 }); }
  if (p.id === 'driver') { p.dmg = 15; p.cd = 34; }
});

Object.assign(ELEMENT_FX, {
  tremor: { sheet: 'impact', color: '#e8f6ff' },
  termico: { sheet: 'fire', color: '#7fd4ff' },
});

Object.assign(SIGNATURES, {
  urbano: { trait: 'TREMOR / ARREMESSO', desc: 'Golpes de habilidade rachando o ar travam e lançam o rival muito longe.', ability: { stun: 8 } },
  xeon: { trait: 'GELO + FOGO', desc: 'Alterna lentidão e queimadura; com os dois ao mesmo tempo, o choque térmico dá dano extra.', ability: { chill: 70, burn: 70 } },
  qwen: { trait: 'AUTO AIM + TRAVA', desc: 'Habilidades sempre perseguem o alvo; deixa vulnerável e trava poderes.', ability: { vuln: 90 } },
});
if (SIGNATURES.stack) SIGNATURES.stack.ability = Object.assign({}, SIGNATURES.stack.ability, { stun: 6 });

FIGHTERS.push(
  {
    id: 'urbano',
    name: 'URBANO TREMOR',
    title: 'O Homem que Racha o Ar',
    bio: 'Brutamontes de bigode e barba, casaco aberto. Comeu a fruta do tremor: cada soco racha o ar, trava o rival e o manda longe.',
    colors: { skin: '#d9a77f', hair: '#e8e8e8', shirt: '#f3f3f3', pants: '#2a2f45', shoes: '#111', accent: '#bfe9ff' },
    traits: { coat: true },
    stats: { power: 1.16, speed: 0.92, weight: 1.2, hp: 122, meterRate: 1.05 },
    quotes: {
      intro: ['Esse mundo vai tremer.', 'Fica parado... ou não, tanto faz.'],
      win: ['Rachou, né?', 'O chão ainda tá tremendo.'],
      special: ['SOCO SÍSMICO!', 'TREME!'],
      super: ['TERREMOTO TOTAL!!'],
    },
    moves: {
      punch: { dmg: 7, range: 54, startup: 5, active: 4, recovery: 11 },
      kick: { dmg: 10, range: 64, startup: 8, active: 4, recovery: 13 },
    },
    special: { name: 'Soco Sísmico', type: 'projectile', cost: 25, proj: { speed: 9, dmg: 9, w: 24, h: 18, color: '#e8f6ff', shape: 'bolt' } },
    super: { name: 'Terremoto Total', type: 'melee-rush', dmg: 28, hits: 4 },
  },
  {
    id: 'xeon',
    name: 'XEON',
    title: 'A Rainha Térmica',
    bio: 'Cabelo metade gelo, metade chama. Congela com uma mão e queima com a outra — e o choque térmico não perdoa.',
    colors: { skin: '#f1cfb6', hair: '#cfe8ff', shirt: '#2a6bd8', pants: '#15161c', shoes: '#eee', accent: '#ff6a2a' },
    traits: { hairStyle: 'long' },
    stats: { power: 1.06, speed: 1.12, weight: 0.96, hp: 110, meterRate: 1.1 },
    quotes: {
      intro: ['Gelo ou fogo? Os dois.', 'Vou baixar sua temperatura... e subir.'],
      win: ['Choque térmico, querido.', 'Derreteu.'],
      special: ['LANÇA DE GELO!', 'PUNHO FLAMEJANTE!'],
      super: ['CHOQUE TÉRMICO!!'],
    },
    moves: {
      punch: { dmg: 5, range: 50, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 8, range: 62, startup: 6, active: 4, recovery: 11 },
    },
    special: { name: 'Lança de Gelo', type: 'projectile', cost: 25, proj: { speed: 11, dmg: 8, w: 22, h: 12, color: '#7fd4ff', shape: 'bolt' } },
    super: { name: 'Choque Térmico', type: 'multi-projectile', dmg: 7, count: 6 },
  },
  {
    id: 'qwen',
    name: 'QWEN ASTRA',
    title: 'A Deusa dos Tokens',
    bio: 'Heroína de anime de cabelos violeta e olhos de holograma. Lê um milhão de tokens de contexto e nunca erra o alvo.',
    colors: { skin: '#f5d6c6', hair: '#6b4bff', shirt: '#2a1f5c', pants: '#1b1640', shoes: '#fff', accent: '#8f7bff' },
    traits: { hairStyle: 'long' },
    stats: { power: 1.34, speed: 1.2, weight: 0.98, hp: 132, meterRate: 1.42 },
    secret: true,
    quotes: {
      intro: ['Já processei todos os seus movimentos.', 'Contexto carregado. Você perdeu.'],
      win: ['Resposta gerada.', 'Pensei antes. Você não.'],
      special: ['TOKEN!', 'CONTEXTO DE UM MILHÃO!', 'MULTIMODAL!'],
      super: ['MODO PENSAMENTO!!'],
    },
    moves: {
      punch: { dmg: 6, range: 52, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 9, range: 64, startup: 6, active: 4, recovery: 11 },
    },
    special: { name: 'Token', type: 'projectile', cost: 25, proj: { speed: 10, dmg: 8, w: 18, h: 18, color: '#8f7bff', shape: 'orb' } },
    super: { name: 'Modo Pensamento', type: 'multi-projectile', dmg: 8, count: 8 },
  },
);

/* reforços de atributos */
FIGHTERS.forEach((f) => {
  if (f.id === 'iales') { f.stats.power = 1.5; f.stats.hp = 150; f.stats.meterRate = 1.65; f.bio += ' Agora com uma 2ª ultimate: All For One: Ação Final (tecla 6).'; }
  if (f.id === 'stack') { f.stats.power = Math.max(f.stats.power || 1, 1.16); f.stats.hp = Math.max(f.stats.hp || 100, 118); f.stats.speed = Math.max(f.stats.speed || 1, 1.08); }
});

if (typeof Profile !== 'undefined' && !Profile.SECRET_IDS.includes('qwen')) Profile.SECRET_IDS.push('qwen');
