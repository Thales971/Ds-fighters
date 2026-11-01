/* ============================================================
   DS FIGHTERS — V5: Dolynho e THL.
   Cinco poderes por lutador usando somente os kinds executados em
   fighter.js. Este arquivo é carregado depois de powers-v4.js.
   ============================================================ */
Object.assign(POWERS, {
  dolynho: {
    element: 'fizz',
    theme: 'Seu amiguinho: guaraná, espuma e bastante stun',
    powers: [
      {
        id: 'bottleburst', name: 'Rajada de Garrafa', slot: 'simple', row: 0,
        kind: 'shot', dmg: 10, speed: 10, stun: 20, cd: 38,
        fx: { stun: 10, slow: 70 }, sfx: 'water',
        desc: 'Arremessa uma garrafa gaseificada que deixa o rival tonto e lento.',
      },
      {
        id: 'fizzdash', name: 'Soco do Amiguinho', slot: 'simple', row: 1,
        kind: 'dash', dmg: 15, speed: 16, stun: 26, cd: 46,
        fx: { stun: 12, chill: 110 }, sfx: 'dash',
        desc: 'Investida de espuma com impacto pesado e controle de ritmo.',
      },
      {
        id: 'capgeyser', name: 'Pilar da Tampinha', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 12, dmg: 18, stun: 46, launch: -7,
        slow: 90, fx: { stun: 16, chill: 180, blind: 65 }, sfx: 'explosion',
        desc: 'A pressão da garrafa explode sob o alvo e o mantém no lugar.',
      },
      {
        id: 'foamwave', name: 'Onda Salta-Tampinha', slot: 'charge', meter: 1, row: 3,
        kind: 'shot', ground: true, dmg: 13, speed: 8, pierce: true, heavy: true,
        stun: 34, slow: 120, fx: { stun: 10, slow: 120 }, sfx: 'water',
        desc: 'Uma onda baixa que pula pela arena e interrompe a passada.',
      },
      {
        id: 'dolynhault', name: 'Amizade Explosiva', slot: 'ultimate', row: 4,
        kind: 'blast', at: 'target', dmg: 42, stun: 58, launch: -10,
        fx: { stun: 24, chill: 150, vuln: 100 }, heal: 8, sfx: 'ultimate',
        desc: 'A explosão final de gás atordoa, congela o ritmo e abre a guarda.',
      },
    ],
  },
  thl: {
    element: 'tactical',
    theme: 'Vigilância tática, leitura de campo e controle de ameaça',
    powers: [
      {
        id: 'expose', name: 'Expose Tático', slot: 'simple', row: 0,
        kind: 'shot', dmg: 10, speed: 10, seek: true, stun: 18, cd: 42,
        fx: { vuln: 180, blind: 70, meterSlow: 150 }, sfx: 'whoosh',
        desc: 'Um disparo de reconhecimento expõe a ameaça e atrasa seu medidor.',
      },
      {
        id: 'bleedstep', name: 'Passo de Sangria', slot: 'simple', row: 1,
        kind: 'dash', dmg: 16, speed: 17, stun: 24, cd: 44,
        fx: { bleed: 240, vuln: 100, slow: 70 }, sfx: 'dash',
        desc: 'Avanço curto e preciso que abre um corte difícil de fechar.',
      },
      {
        id: 'suppressionzone', name: 'Zona de Supressão', slot: 'charge', meter: 0, row: 2,
        kind: 'zone', at: 'target', time: 300, dmg: 0.12, slow: 62,
        fx: { chill: 120, vuln: 150, meterSlow: 180 }, sfx: 'heavy',
        desc: 'Marca o chão: quem permanece ali fica lento, vulnerável e sem ritmo.',
      },
      {
        id: 'skullpillar', name: 'Insígnia Caveira', slot: 'charge', meter: 1, row: 3,
        kind: 'pillar', at: 'target', delay: 14, dmg: 19, stun: 38, launch: -5,
        slow: 90, fx: { vuln: 180, blind: 110, bleed: 160, meterSlow: 180 },
        sfx: 'explosion',
        desc: 'A caveira tática cai sobre o alvo e reúne todos os dados de abertura.',
      },
      {
        id: 'lockdownbarrage', name: 'Barrage Lockdown', slot: 'ultimate', row: 4,
        kind: 'barrage', dmg: 7, count: 8, homing: 0.6, stun: 20, finisher: 24,
        fx: { vuln: 180, lock: 90, bleed: 180 }, sfx: 'ultimate',
        desc: 'Rajada de supressão que deixa o rival vulnerável e sem poderes por instantes.',
      },
    ],
  },
});

/* As folhas são conhecidas pelo renderer atual; arte dedicada pode ser ligada
   depois sem mudar o contrato dos poderes. */
Object.assign(ELEMENT_FX, {
  fizz: { sheet: 'water', color: '#84ef43' },
  tactical: { sheet: 'impact', color: '#d6d9df' },
});

Object.assign(SIGNATURES, {
  dolynho: {
    trait: 'STUN / ESPUMA',
    desc: 'Cada habilidade aumenta a tontura e reduz o ritmo do rival.',
    ability: { stun: 8, slow: 70 },
    stunMult: 1.08,
  },
  thl: {
    trait: 'EXPOSE / LOCKDOWN',
    desc: 'Lê a ameaça, causa sangramento e acumula vulnerabilidade, lentidão e travas táticas.',
    ability: { vuln: 90, bleed: 70, slow: 55 },
  },
});

FIGHTERS.push(
  {
    id: 'dolynho',
    name: 'DOLYNHO',
    title: 'Seu Amiguinho',
    bio: 'Garrafinha verde de guaraná, tampa branca, olhos grandes, luvas brancas e tênis vermelhos. Seu amiguinho chegou com bolhas e bastante stun!',
    colors: { skin: '#35a85a', hair: '#eeeeee', shirt: '#35a85a', pants: '#35a85a', shoes: '#d83232', accent: '#84ef43' },
    traits: { bottleCap: 'white', gloves: 'white', shoes: 'red', mascotBottle: true },
    stats: { power: 1.08, speed: 1.03, weight: 1.0, hp: 126, meterRate: 1.1 },
    secret: false,
    quotes: {
      intro: ['Oi pessoal, eu sou o Dolynho, seu amiguinho!', 'Seu amiguinho chegou!'],
      win: ['Amizade que dá stun!', 'Foi um abraço gaseificado!'],
      special: ['GUARANÁ!', 'TAMPINHA!', 'ESPUMA NA CARA!'],
      super: ['AMIZADE EXPLOSIVA!!'],
    },
    moves: {
      punch: { dmg: 6, range: 52, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 64, startup: 7, active: 4, recovery: 12 },
    },
    special: { name: 'Rajada de Garrafa', type: 'projectile', cost: 25, proj: { speed: 10, dmg: 10, w: 24, h: 20, color: '#84ef43', shape: 'orb' } },
    super: { name: 'Amizade Explosiva', type: 'melee-rush', dmg: 28, hits: 5 },
  },
  {
    id: 'thl',
    name: 'THL TACTICAL VIGILANTE',
    title: 'O Vigilante de Lockdown',
    bio: 'Vigilante tático com insígnia de caveira e colete preto e cinza. Lê o campo, expõe a ameaça e não deixa brechas.',
    colors: { skin: '#c48f70', hair: '#1b1b1f', shirt: '#25282e', pants: '#15171b', shoes: '#111217', accent: '#d6d9df' },
    traits: { tacticalSkull: true, vest: 'black-grey', facePhoto: true },
    stats: { power: 1.36, speed: 1.0, weight: 1.1, hp: 140, meterRate: 1.35 },
    secret: false,
    quotes: {
      intro: ['A área está sob controle.', 'Você foi identificado como ameaça.'],
      win: ['Ameaça neutralizada.', 'Relatório encerrado.'],
      special: ['EXPOSE!', 'PASSO DE SANGRIA!', 'LOCKDOWN!'],
      super: ['BARRAGE LOCKDOWN!!'],
    },
    moves: {
      punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 11 },
      kick: { dmg: 9, range: 62, startup: 7, active: 4, recovery: 13 },
    },
    special: { name: 'Expose Tático', type: 'projectile', cost: 25, proj: { speed: 10, dmg: 10, w: 24, h: 18, color: '#d6d9df', shape: 'bolt' } },
    super: { name: 'Barrage Lockdown', type: 'multi-projectile', dmg: 7, count: 8 },
  },
);

/* Amostra controlada CPU: Caça-Bugs e Kairo ficaram sem vitórias nas duas
   primeiras amostras contra quatro arquétipos. Reforço moderado, preservando
   o top 3 secreto e a identidade de cada kit; não transforma taxas em garantia. */
FIGHTERS.forEach((fighter) => {
  if (fighter.id === 'bughunter') {
    Object.assign(fighter.stats, { power: 1.03, hp: 112, meterRate: 1.14 });
    fighter.moves.punch.range = 54;
    fighter.moves.kick.range = 66;
    fighter.moves.kick.recovery = 10;
  }
  if (fighter.id === 'scrum') {
    Object.assign(fighter.stats, { power: 1.14, hp: 118, meterRate: 1.25 });
    fighter.moves.kick.dmg = 8;
    fighter.moves.kick.range = 64;
    fighter.moves.kick.recovery = 10;
  }
});
POWERS.bughunter.powers.forEach((power) => {
  if (power.id === 'report') { power.dmg = 10; power.cd = 44; power.speed = 10; }
  if (power.id === 'lens') { power.range = 380; power.dmg = 12; power.cd = 54; }
  if (power.id === 'swarm') power.speed = 6;
  if (power.id === 'antidote') power.heal = 27;
});
POWERS.scrum.powers.forEach((power) => {
  if (power.id === 'timebox') { power.range = 280; power.cd = 48; }
  if (power.id === 'postit') power.cd = 38;
  if (power.id === 'poker') power.dmg = 36;
});
