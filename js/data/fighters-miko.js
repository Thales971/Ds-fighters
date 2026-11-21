/* DS Fighters — MIKO, a sacerdotisa (nov/2026). Arte do dono
   (bugs/Novos-personagens/Miko *.jpg): kimono branco, hakama vermelho, gohei
   e ofudas. poses -> tools/integrate_fighter.py miko; poderes ->
   tools/build_miko_fx.py. Controle sagrado: selo que paralisa, flecha que
   atravessa, barreira kekkai, portal torii e a ult exclusiva KITSUNE que
   PURIFICA (tira os buffs do rival e limpa os debuffs dela). */
(() => {
  const id = 'miko';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v71-miko';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true, /* gohei/ofuda em volta da cabeca */
    accHide: ['ko', 'kick', 'jkick'],
  });
  const visual = (row, color) => ({ visualSheet: id, visualRow: row, impactSheets: ['miko-extra'], impactColor: color });

  FIGHTERS.push({
    id,
    name: 'MIKO',
    title: 'A Sacerdotisa do Santuário',
    bio: 'Guardiã do santuário da colina: com o gohei e uma pilha de ofudas ela sela qualquer bug, ergue barreiras e abre portais pelos torii. Quando a raposa de nove caudas responde ao chamado, nenhum buff do rival sobrevive.',
    colors: { skin: '#F8E0CC', hair: '#120E12', shirt: '#F4F2EE', pants: '#B4161E', shoes: '#6B4422', accent: '#FFD27D' },
    traits: { longHair: true, gohei: true, ofuda: true },
    stats: { power: 1.1, speed: 1.12, weight: 0.9, hp: 155, meterRate: 1.25 },
    secret: false,
    quotes: {
      intro: ['O santuário está protegido.', 'Que os espíritos me guiem.'],
      win: ['Purificado.', 'Que a paz volte ao santuário.'],
      lose: ['O selo... rompeu...', 'Perdão, kami-sama...'],
      taunt: ['Seu bug já tem selo.'],
      special: ['OFUDA!', 'HAMAYA!', 'KEKKAI!', 'PORTAL TORII!'],
      super: ['KITSUNE, VENHA!!'],
    },
    moves: {
      punch: { dmg: 7, range: 58, startup: 5, active: 4, recovery: 9 },
      kick: { dmg: 12, range: 72, startup: 8, active: 5, recovery: 12 },
    },
    special: { name: 'Ofuda Selante', type: 'projectile', cost: 25, proj: { row: 0, speed: 11, dmg: 9, w: 24, h: 30, color: '#FFE89A', shape: 'orb', visualSheet: id, visualRow: 0 } },
    super: { name: 'Kitsune de Nove Caudas', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'arcano',
      theme: 'santuario: ofuda que sela, hamaya, barreira kekkai, portal torii e a kitsune que purifica',
      powers: [
        Object.assign({ id: 'ofuda-selante', name: 'Ofuda Selante', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 11, cd: 54, sfx: 'magic', fx: { paralyze: 36 },
          desc: 'Pergaminho sagrado que SELA o rival: fica PARALISADO por um instante.' }, visual(0, '#FFE89A')),
        Object.assign({ id: 'hamaya', name: 'Hamaya', slot: 'simple', row: 1, kind: 'shot', dmg: 12, speed: 17, pierce: true, cd: 60, sfx: 'whoosh', fx: { vuln: 90 },
          desc: 'Flecha sagrada muito rápida que ATRAVESSA e deixa VULNERÁVEL.' }, visual(1, '#FFC23A')),
        Object.assign({ id: 'kekkai', name: 'Kekkai', slot: 'charge', meter: 0, row: 2, kind: 'wall', time: 300, dmg: 10, cd: 100, sfx: 'shield',
          desc: 'Ergue uma barreira de ofudas na frente: BLOQUEIA projéteis e empurra quem estiver colado.' }, visual(2, '#E8C27A')),
        Object.assign({ id: 'portal-torii', name: 'Portal Torii', slot: 'charge', meter: 1, row: 3, kind: 'shadowport', burstDmg: 16, cd: 80, sfx: 'magic', fx: { dizzy: 30 },
          desc: 'Some num torii e reaparece atrás (ou em cima) do rival; caindo em cima: 16 de dano + TONTO.' }, visual(3, '#FF6A3A')),
        Object.assign({ id: 'kitsune', name: 'Kitsune de Nove Caudas', slot: 'ultimate', row: 4, kind: 'kitsune', dmg: 28, heal: 12, cd: 150, sfx: 'ultimate',
          desc: 'EXCLUSIVA: a raposa sagrada ataca e PURIFICA — o rival perde TODOS os buffs (aura, armadura, reflexo, overclock...) e a Miko limpa os próprios debuffs e cura um pouco.' }, visual(4, '#FFF2C4')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#FFE89A' } });
  Object.assign(SIGNATURES, { [id]: { trait: 'SANTUÁRIO', desc: 'Selo que paralisa, flecha que atravessa, barreira, portal e a kitsune que apaga os buffs do rival.', basic: {}, ability: {} } });
})();
