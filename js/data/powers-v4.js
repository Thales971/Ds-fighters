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
    theme: 'Fruta do tremor: racha o ar, sacode o chão, trava forte e arremessa longe',
    powers: [
      { id: 'quakefist', name: 'Soco Sísmico', slot: 'simple', row: 0, kind: 'quake', range: 230, dmg: 19, lock: 42, kx: 28, launch: -11, fx: { stun: 18 }, cd: 60, sfx: 'heavy', desc: 'Racha o ar longe na frente do punho: TRAVA forte (tontura) e joga o rival longe.' },
      { id: 'tremorwave', name: 'Onda de Tremor', slot: 'simple', row: 1, kind: 'blast', at: 'wave', dmg: 16, stun: 40, launch: -9, cd: 48, sfx: 'explosion', desc: 'Onda sísmica longa pelo chão: mais dano e atordoa quem cruzou.' },
      { id: 'airgrab', name: 'Agarrar o Céu', slot: 'charge', meter: 0, row: 2, kind: 'quake', range: 380, pullFirst: true, dmg: 21, lock: 46, kx: 30, launch: -13, fx: { stun: 18 }, cd: 64, sfx: 'heavy', desc: 'Puxa de longe, trava pesado e arremessa à queima-roupa.' },
      { id: 'quakearmor', name: 'Bolha do Tremor', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 340, armor: true, burstDmg: 18, fx: { stun: 10 }, sfx: 'shield', desc: 'Armadura de tremor: aguenta golpes, explode e atordoa quem encostar.' },
      { id: 'quakeult', name: 'Terremoto Total', slot: 'ultimate', row: 4, kind: 'quake', range: 900, both: true, dmg: 46, lock: 60, kx: 34, launch: -16, screen: true, fx: { stun: 22 }, sfx: 'ultimate', desc: 'Racha o ar dos dois lados: dano massivo, trava longa e lança todo mundo.' },
    ],
  },
  xeon: {
    element: 'termico',
    theme: 'Gelo e fogo: lentidão, queimadura e choque térmico',
    powers: [
      { id: 'icespear', name: 'Lança de Gelo', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 11, cd: 42, impactSheet: 'water', impactColor: '#7fd4ff', fx: { chill: 160 }, sfx: 'magic', desc: 'Cristal veloz que deixa o rival LENTO (gelo).' },
      { id: 'flamefist', name: 'Punho Flamejante', slot: 'simple', row: 1, kind: 'dash', dmg: 12, speed: 15, cd: 46, impactSheet: 'fire', impactColor: '#ff6a1c', burn: 180, sfx: 'fire', desc: 'Investida em chamas que QUEIMA (dano contínuo).' },
      { id: 'glacier', name: 'Prisão Glacial', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 12, dmg: 14, stun: 70, launch: 0, impactSheet: 'water', impactColor: '#7fd4ff', fx: { chill: 220 }, sfx: 'magic', desc: 'Cristais brotam sob o rival e o CONGELAM no lugar.' },
      { id: 'firewall', name: 'Muralha de Fogo', slot: 'charge', meter: 1, row: 3, kind: 'zone', time: 240, dmg: 3, burn: 120, impactSheet: 'fire', impactColor: '#ff6a1c', sfx: 'fire', desc: 'Faixa de fogo no chão que queima quem pisar.' },
      { id: 'thermal', name: 'Choque Térmico', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 36, impactSheets: ['water', 'fire'], impactColor: '#f5f1d0', fx: { chill: 120, burn: 200, thermal: 7, explode: 8 }, sfx: 'ultimate', desc: 'Congela e explode em vapor: gelo + fogo ao mesmo tempo.' },
    ],
  },
  qwen: {
    element: 'ia',
    theme: 'Deusa das IAs: tokens, contexto infinito, multimodal e mistura de especialistas',
    autoAim: true,
    powers: [
      { id: 'token', name: 'Token Teleguiado', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 11, count: 3, spread: 0.3, seek: true, fx: { drain: 0.06 }, cd: 34, sfx: 'magic', desc: 'Três tokens que sempre trovano o alvo e roubam um pouco de vida.' },
      { id: 'context', name: 'Contexto de 1M', slot: 'simple', row: 1, kind: 'beam', range: 900, dmg: 18, stun: 34, seek: true, cd: 58, fx: { vuln: 240, meterSlow: 160 }, sfx: 'thunder_cast', desc: 'Raio que atravessa a arena: VULNERÁVEL, lento no medidor e atordoa.' },
      { id: 'multimodal', name: 'Multimodal', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 11, speed: 8, count: 3, spread: 0.5, seek: true, pierce: true, fx: { blind: 160, shock: 100, lock: 60 }, sfx: 'magic', desc: 'Olho, som e imagem: CEGA, ELETRIZA e bloqueia poderes por instantes.' },
      { id: 'moe', name: 'Mistura de Especialistas', slot: 'charge', meter: 1, row: 3, kind: 'barrage', dmg: 8, count: 10, seek: true, finisher: 24, fx: { vuln: 160 }, sfx: 'ultimate', desc: 'Dez especialistas atacam em sequência, vulnerável no fim.' },
      { id: 'thinking', name: 'Modo Pensamento: Astra', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 56, transform: 'astra', time: 780, fx: { lock: 300, vuln: 300, blind: 120 }, heal: 26, sfx: 'ultimate', desc: 'Golpe garantido massivo: trava poderes, cega e deixa vulnerável; vira QWEN ASTRA por 13s (+35% dano, +18% velocidade).' },
    ],
  },
});

/* 2ª ultimate do IALES (tecla 6): só com 4+ poderes acumulados no All For One. */
POWERS.iales.powers.push({
  id: 'afo2', name: 'All For One: Ação Final', slot: 'ultimate', row: 7, kind: 'afo2', needAfo: 4, dmg: 40, perAfo: 6,
  sfx: 'ultimate', desc: 'Precisa de 4+ poderes acumulados: braço colossal de IAs, acerto garantido, cura e drena energia. Mais forte a cada acúmulo.',
});
POWERS.iales.powers.forEach((p) => {
  if (p.id === 'prompt') { p.dmg = 8; p.cd = 34; }
  if (p.id === 'dragon') { p.dmg = 21; p.cd = 80; }
  if (p.id === 'afo') { p.dmg = 7; p.count = 12; p.finisher = 30; }
});
/* ET 1155 mais forte */
POWERS.stack.powers.forEach((p) => {
  if (p.id === 'chip') { p.dmg = 15; p.cd = 34; p.fx = Object.assign({}, p.fx, { stun: 8 }); }
  if (p.id === 'driver') { p.dmg = 16; p.cd = 32; }
  if (p.id === 'seco') { p.time = 300; p.dmgMult = 1.32; p.speedMult = 1.35; }
  if (p.id === 'paste') { p.time = 320; p.dmg = 0.13; p.slow = 45; }
  if (p.id === 'debloat') { p.dmg = 39; }
});

Object.assign(ELEMENT_FX, {
  tremor: { sheet: 'impact', color: '#e8f6ff' },
  termico: { sheet: 'fire', color: '#7fd4ff' },
});

Object.assign(SIGNATURES, {
  urbano: { trait: 'TREMOR / TRAVA FORTE', desc: 'Golpes de perto racham o ar, enchem a barra de tontura e arremessam longe.', ability: { stun: 16 }, stunMult: 1.25 },
  xeon: { trait: 'GELO + FOGO', desc: 'Alterna lentidão e queimadura; com os dois ao mesmo tempo, o choque térmico dá dano extra.', ability: { chill: 70, burn: 70 } },
  qwen: { trait: 'AUTO AIM + ROUBO + TRAVA + MEDIDOR', desc: 'Tudo persegue o alvo, rouba vida, deixa vulnerável e atrasa o medidor; a ultimate trava poderes e cega.', ability: { vuln: 120, drain: 0.08, meterSlow: 80, lock: 40 } },
});
if (SIGNATURES.stack) SIGNATURES.stack.ability = Object.assign({}, SIGNATURES.stack.ability, { stun: 6 });

FIGHTERS.push(
  {
    id: 'urbano',
    name: 'URBANO TREMOR',
    title: 'O Homem que Racha o Ar',
    bio: 'Jovem de cabelo curto castanho, sem barba, jaqueta de couro preta fechada, camisa cinza e jeans escuros. Comeu a fruta do tremor: cada soco racha o ar, trava o rival e o manda longe.',
    colors: { skin: '#d9a77f', hair: '#e8e8e8', shirt: '#f3f3f3', pants: '#2a2f45', shoes: '#111', accent: '#bfe9ff' },
    traits: { coat: true },
    stats: { power: 1.32, speed: 1.0, weight: 1.2, hp: 134, meterRate: 1.2 },
    quotes: {
      intro: ['Esse mundo vai tremer.', 'Fica parado... ou não, tanto faz.'],
      win: ['Rachou, né?', 'O chão ainda tá tremendo.'],
      special: ['SOCO SÍSMICO!', 'TREME!'],
      super: ['TERREMOTO TOTAL!!'],
    },
    moves: {
      punch: { dmg: 9, range: 58, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 13, range: 68, startup: 7, active: 4, recovery: 12 },
    },
    special: { name: 'Soco Sísmico', type: 'projectile', cost: 25, proj: { speed: 9, dmg: 12, w: 24, h: 18, color: '#e8f6ff', shape: 'bolt' } },
    super: { name: 'Terremoto Total', type: 'melee-rush', dmg: 34, hits: 4 },
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
    // Ranking permanente = stats.power puro, ordenado em ordem decrescente;
    // status temporários (incluindo Astra) não mudam esta classificação.
    // Os três primeiros são intencionais e sem empate: IALES 1.50,
    // Felipinho 1.40 e Qwen 1.39. Isto descreve uma hierarquia de atributo,
    // não uma promessa de vitória universal em toda matchup/arena.
    // V6: kit mais apelão (mais dano, drain, lock, cegueira) mantendo o ranking.
    stats: { power: 1.39, speed: 1.24, weight: 0.98, hp: 140, meterRate: 1.5 },
    secret: true,
    quotes: {
      intro: ['Já processei todos os seus movimentos.', 'Contexto carregado. Você perdeu.'],
      win: ['Resposta gerada.', 'Pensei antes. Você não.'],
      special: ['TOKEN!', 'CONTEXTO DE UM MILHÃO!', 'MULTIMODAL!'],
      super: ['MODO PENSAMENTO!!'],
    },
    moves: {
      punch: { dmg: 7, range: 54, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 11, range: 66, startup: 6, active: 4, recovery: 11 },
    },
    special: { name: 'Token', type: 'projectile', cost: 25, proj: { speed: 11, dmg: 10, w: 18, h: 18, color: '#8f7bff', shape: 'orb' } },
    super: { name: 'Modo Pensamento', type: 'multi-projectile', dmg: 9, count: 10 },
  },
);

/* reforços de atributos */
FIGHTERS.forEach((f) => {
  if (f.id === 'iales') { f.stats.power = 1.55; f.stats.hp = 150; f.stats.meterRate = 1.65; f.bio += ' Agora com uma 2ª ultimate: All For One: Ação Final (tecla 6).'; }
  if (f.id === 'stack') { f.stats.power = Math.max(f.stats.power || 1, 1.16); f.stats.hp = Math.max(f.stats.hp || 100, 118); f.stats.speed = Math.max(f.stats.speed || 1, 1.08); }
});

if (typeof Profile !== 'undefined' && !Profile.SECRET_IDS.includes('qwen')) Profile.SECRET_IDS.push('qwen');
