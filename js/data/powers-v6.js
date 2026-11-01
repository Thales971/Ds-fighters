/* ============================================================
   DS FIGHTERS — V6: LOBÃO.
   Lutador de wrestling tema lobo (estilo Beowulf), inspirado nas
   fotos em inspiracao/. Forte de perto (agarroes e golpes de
   wrestling), fraco de longe (cadeira lancada). Ultimate: MODO
   SELVAGEM — dobra dano e velocidade e ganha esquiva (estilo Cromo).
   Carregado depois de powers-v5.js.
   ============================================================ */
Object.assign(POWERS, {
  lobao: {
    element: 'lobo',
    theme: 'Wrestling de lobo: agarrões de perto, cadeira de longe, modo selvagem',
    powers: [
      {
        id: 'chairthrow', name: 'Cadeira Voadora', slot: 'simple', row: 0,
        kind: 'shot', dmg: 9, speed: 12, cd: 38, heavy: true,
        fx: { bleed: 60 }, sfx: 'heavy',
        desc: 'Lança uma cadeira de plástico. De longe acerta, mas é fraca e previsível.',
      },
      {
        id: 'wildgrab', name: 'Agarrão Selvagem', slot: 'simple', row: 1,
        kind: 'quake', range: 130, pullFirst: true, dmg: 16, lock: 30, kx: 20, launch: -9, cd: 52,
        fx: { bleed: 120, stun: 8 }, sfx: 'heavy',
        desc: 'Puxa o rival para perto rachando o ar e trava: golpe pesado de wrestling.',
      },
      {
        id: 'wolfsuplex', name: 'Suplex do Lobo', slot: 'charge', meter: 0, row: 2,
        kind: 'quake', range: 170, dmg: 22, lock: 42, kx: 26, launch: -13, cd: 78,
        fx: { bleed: 150, stun: 12 }, sfx: 'explosion',
        desc: 'Golpe devastador de perto: trava tudo na frente e arremessa longe.',
      },
      {
        id: 'chairrain', name: 'Chuva de Cadeiras', slot: 'charge', meter: 1, row: 3,
        kind: 'rain', count: 6, dmg: 8, cd: 90, sfx: 'explosion',
        desc: 'Cadeiras caem do céu na arena inteira. Longa distância, mas cada uma tira pouco.',
      },
      {
        id: 'wildmode', name: 'MODO SELVAGEM', slot: 'ultimate', row: 4,
        kind: 'aura', time: 720, dmgMult: 1.5, speedMult: 1.8, dodge: 0.1,
        hitDmg: 30, hitStun: 46, hitLaunch: -11, hitRadius: 300,
        burstDmg: 10, sfx: 'ultimate',
        desc: 'Explosão verde e branca de alcance local: golpe de 30 se o rival estiver perto; 12 s de dano x1,5, +80% velocidade e 10% de esquiva, sem armadura permanente.',
      },
    ],
  },
});

Object.assign(ELEMENT_FX, {
  lobo: { sheet: 'chaos', color: '#3ee06a' },
});

Object.assign(SIGNATURES, {
  lobao: {
    trait: 'SELVAGEM DE PERTO',
    desc: 'Agarrões causam corte. O Modo Selvagem aumenta o dano em 50%, acelera e dá esquiva, sem armadura permanente.',
    ability: { bleed: 60 },
  },
});

FIGHTERS.push({
  id: 'lobao',
  name: 'LOBÃO',
  title: 'O Lutador Selvagem',
  bio: 'Lutador humano de wrestling inspirado no amigo das fotos: cabelo curto castanho, rosto natural, roupa verde e branca, gola de pele e cadeira vermelha. Forte de perto com agarrões e suplex; a cadeira pressiona à distância sem dominar a arena.',
  colors: { skin: '#d0a581', hair: '#33281f', shirt: '#165833', pants: '#eceee5', shoes: '#3a3231', accent: '#a09c83' },
  traits: { furCollar: true, jacket: 'green-fur', gloves: 'dark-wraps' },
  stats: { power: 1.34, speed: 1.0, weight: 1.3, hp: 150, meterRate: 1.2 },
  secret: false,
  quotes: {
    intro: ['Auuu! O lobo chegou!', 'Segura que eu vou de suplex!'],
    win: ['Auuuu! Vitória selvagem!', 'O ring é meu!'],
    special: ['AGARRÃO SELVAGEM!', 'SUPLEX DO LOBO!', 'CADEIRA NA CARA!'],
    super: ['MODO SELVAGEM!! AUUUU!!'],
  },
  moves: {
    punch: { dmg: 8, range: 58, startup: 5, active: 4, recovery: 10 },
    kick: { dmg: 12, range: 70, startup: 8, active: 4, recovery: 13 },
  },
  special: { name: 'Cadeira Voadora', type: 'projectile', cost: 25, proj: { speed: 12, dmg: 9, w: 30, h: 24, color: '#c4cad4', shape: 'orb', heavy: true } },
  super: { name: 'MODO SELVAGEM', type: 'melee-rush', dmg: 30, hits: 5 },
});
