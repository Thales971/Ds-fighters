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
        kind: 'rain', count: 6, dmg: 26, cd: 90, sfx: 'explosion',
        desc: 'Cadeiras caem do céu na arena inteira. Longa distância, mas cada uma tira pouco.',
      },
      {
        id: 'wildmode', name: 'MODO SELVAGEM', slot: 'ultimate', row: 4,
        kind: 'aura', time: 480, dmgMult: 2.0, speedMult: 1.8, armor: true, dodge: 0.18,
        burstDmg: 10, sfx: 'ultimate',
        desc: 'Escudo verde e branco: dobra o dano, +80% de velocidade, armadura e esquiva selvagem por 8 s.',
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
    desc: 'Agarrões causam corte. O Modo Selvagem dobra dano/velocidade e dá esquiva.',
    ability: { bleed: 60 },
  },
});

FIGHTERS.push({
  id: 'lobao',
  name: 'LOBÃO',
  title: 'O Lutador Selvagem',
  bio: 'Wrestler tema lobo: jaqueta verde com gola de pele, rosto de lobo com presas e olhos âmbar. Pancadaria de perto que arremessa; de longe só manda cadeira. No modo selvagem dobra tudo e desvia dos golpes.',
  colors: { skin: '#8d6248', hair: '#0e0a08', shirt: '#1e7a34', pants: '#eef0e8', shoes: '#f4f6ef', accent: '#155c28' },
  traits: { wolfEars: true, fangs: true, amberEyes: true, furCollar: true, jacket: 'green-fur', gloves: 'white-green', facePhoto: true },
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
