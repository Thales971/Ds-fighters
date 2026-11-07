/* DS Fighters V18 — EMILIO: o garoto da energia solar que se transforma
   numa raposa espiritual verde/azul. Arte do dono em
   bugs/Novos-personagens/ (emilio-*.jpg), recortada por
   tools/integrate_fighter.py. Forma normal + forma TRANSFORMADA
   (emilio-trans.png, ativada pela ultimate). Carregado apos o V17. */
(() => {
  const id = 'emilio';
  const tid = 'emilio-trans';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.files[tid] = `assets/sprites/${tid}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, special: 0.8, win: 0.75 },
  });
  SPRITE_LAYOUT.perFighter[tid] = Object.assign(SPRITE_LAYOUT.perFighter[tid] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, special: 0.8, win: 0.75 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'EMILIO',
      title: 'O Coração Solar',
      bio: 'Garoto do bairro novo de Nexo City. Descobriu cedo que a energia que corria nas linhas da cidade respondia a ele — treino de rua, caderno de sketches e um segredo: quando o peito esquenta demais, ele vira outra coisa. Uma raposa espiritual verde e azul que não pede licença.',
      colors: { skin: '#e8c39e', hair: '#6a4a28', shirt: '#1a1a20', pants: '#2a4a7a', shoes: '#101014', accent: '#ffd54a' },
      traits: { glowingFist: true, hairStyle: 'short' },
      stats: { power: 1.56, speed: 1.14, weight: 1.0, hp: 142, meterRate: 1.3 },
      secret: false,
      quotes: {
        intro: ['Esquenta, coração.', 'Se eu perder o controle... desvia.'],
        win: ['Ainda tô aprendendo.', 'A raposa quis ganhar, não eu.'],
        special: ['FLECHA SOLAR!', 'ESPIRAL!', 'CÚPULA!'],
        super: ['TRANSFORMAÇÃO SUPREMA!!'],
      },
      moves: {
        punch: { dmg: 7, range: 54, startup: 4, active: 4, recovery: 10 },
        kick: { dmg: 10, range: 68, startup: 6, active: 5, recovery: 12 },
      },
      special: {
        name: 'Flecha Solar', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 12, w: 26, h: 22, color: '#ffd54a', shape: 'bolt', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Transformação Suprema', type: 'transform', visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'energia',
      theme: 'energia solar amarela, espirais e a raposa espiritual verde/azul',
      powers: [
        Object.assign({
          id: 'solar-arrow', name: 'Flecha Solar', transName: 'Flecha Espiritual', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 11, seek: true, cd: 36,
          fx: { burn: 80 }, sfx: 'magic',
          desc: 'Flecha de energia solar AUTO-AIM que queima o rival.',
        }, visual(0, '#ffd54a')),
        Object.assign({
          id: 'double-spiral', name: 'Espiral Dupla', transName: 'Espiral da Raposa', slot: 'simple', row: 1,
          kind: 'shot', dmg: 13, speed: 8, pierce: true, multiHit: 2, cd: 58,
          fx: { slow: 90 }, sfx: 'magic',
          desc: 'Espiral dupla que ATRAVESSA o alvo e desacelera.',
        }, visual(1, '#ffb84a')),
        Object.assign({
          id: 'energy-dome', name: 'Cúpula de Energia', transName: 'Cúpula Ancestral', slot: 'charge', meter: 0, row: 2,
          kind: 'aura', time: 380, defMult: 0.5, reflect: true, heal: 12, regen: 0.04, cd: 80,
          sfx: 'shield',
          desc: 'Cúpula que REFLETE projéteis, reduz dano pela metade e regenera.',
        }, visual(2, '#ffe14d')),
        Object.assign({
          id: 'solar-meteor', name: 'Meteoro Solar', transName: 'Cometa Ancestral', slot: 'charge', meter: 1, row: 3,
          kind: 'pillar', at: 'target', delay: 10, dmg: 20, stun: 40, launch: -8, burn: 140, seek: true, cd: 90,
          sfx: 'thunder_cast',
          desc: 'Meteoro solar AUTO-AIM: dano em área, queimadura longa e stun.',
        }, visual(3, '#ff9a2a')),
        Object.assign({
          id: 'supreme-transformation', name: 'Transformação Suprema', transName: 'Despertar da Raposa', slot: 'ultimate', row: 4,
          kind: 'aura', time: 760, transform: 'trans', heal: 32, armor: true, hitDmg: 36, hitRadius: 260,
          dmgMult: 1.5, speedMult: 1.25, invuln: 60, teleportBehind: true, cleanse: true, regen: 0.03,
          cd: 120, sfx: 'ultimate',
          desc: 'TELEPORTE atrás do rival + invulnerabilidade na ativação. Vira a RAPOSA ESPIRITUAL por 12s: +50% de dano, +25% de velocidade, armadura, cura, regeneração e habilidades com a arte transformada. Só ele pode fazer isso.',
        }, visual(4, '#7dff5e')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    energia: { sheet: id, color: '#ffd54a' },
    [id]: { sheet: id, color: '#ffd54a' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'CORAÇÃO SOLAR',
      desc: 'Energia solar que queima e a transformação em raposa espiritual — dano e velocidade dobrados de perigo.',
      basic: {},
      ability: { burn: 40 },
    },
  });
})();
