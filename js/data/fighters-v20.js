/* DS Fighters V20 — PONTEIRO, o Relojoeiro Quebrado.
   Controle/tempo: não vence no dano, vence por nunca deixar você agir na
   hora certa. Arte do dono em bugs/Novos-personagens/ (ponteiro-*.jpg),
   recortada por tools/integrate_fighter.js. */
(() => {
  const id = 'ponteiro';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, special: 0.8, win: 0.75 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'PONTEIRO',
      title: 'O Relojoeiro Quebrado',
      bio: 'Relojoeiro que perdeu a família num acidente e passou 30 anos tentando rebobinar o relógio daquela noite. Enlouqueceu, mas o cubo ciano que ele encontrou fala com ele — e o tempo realmente obedece. A máscara de osso esconde o rosto que ele não quer mais ver.',
      colors: { skin: '#E8E4D8', hair: '#1A1F3A', shirt: '#1A1F3A', pants: '#141830', shoes: '#0e1020', accent: '#00FFFF' },
      traits: { boneMask: true, hood: true, floatingCube: true, gears: true, tall: true },
      stats: { power: 1.34, speed: 0.98, weight: 1.00, hp: 300, meterRate: 1.60 },
      secret: false,
      quotes: {
        intro: ['O tempo é meu cliente mais fiel.', 'Você está atrasado. Sempre esteve.'],
        win: ['O relógio nunca mentiu pra mim.', 'Rebobinado.'],
        special: ['PÊNDULO!', 'ENGRENAGENS!', 'A HORA ERRADA!'],
        super: ['PARE O RELÓGIO!!'],
      },
      moves: {
        punch: { dmg: 6, range: 56, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 9, range: 70, startup: 7, active: 4, recovery: 12 },
      },
      special: {
        name: 'Pêndulo', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 9, dmg: 11, w: 26, h: 22, color: '#00FFFF', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Parar o Relógio', type: 'freeze', visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'tempo',
      theme: 'controle de tempo: lentidão, congelamento e sentinelas de engrenagem',
      powers: [
        Object.assign({
          id: 'pendulo', name: 'Pêndulo', slot: 'simple', row: 0,
          kind: 'shot', dmg: 11, speed: 9, seek: false, cd: 90,
          fx: { slow: 120 }, sfx: 'magic',
          desc: 'Projétil ciano que aplica 30% de LENTIDÃO por 2 segundos.',
        }, visual(0, '#00FFFF')),
        Object.assign({
          id: 'robo-corda', name: 'Robô de Corda', slot: 'simple', row: 1,
          kind: 'wall', time: 720, dmg: 8, cd: 360, sfx: 'metal',
          desc: 'Invoca sentinela de engrenagem com escudo circular que BLOQUEIA projéteis por 12s.',
        }, visual(1, '#D8A03D')),
        Object.assign({
          id: 'fenda-temporal', name: 'Fenda Temporal', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 13, speed: 18, phase: true, iFrames: 14, cd: 240, sfx: 'dash',
          desc: 'Blink curto com rastro ciano — atravessa o rival intangível.',
        }, visual(2, '#00FFFF')),
        Object.assign({
          id: 'ampulheta', name: 'Ampulheta', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 600, w: 210, dmg: 0.08, slow: 60, cd: 300, sfx: 'magic',
          fx: { freeze: 90 },
          desc: 'Armadilha no chão: CONGELA quem pisar por 1,5 segundos.',
        }, visual(3, '#E8E4D8')),
        Object.assign({
          id: 'parar-relogio', name: 'Parar o Relógio', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 60, radius: 300, cd: 1350, sfx: 'ultimate',
          fx: { freeze: 180, paralyze: 180, slow: 240, meterSlow: 240 },
          desc: 'CONGELA o oponente por 3 segundos — só Ponteiro age. A hora é dele.',
        }, visual(4, '#00FFFF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    tempo: { sheet: 'arcano', color: '#00FFFF' },
    [id]: { sheet: id, color: '#00FFFF' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'CAMPO LENTO',
      desc: 'Oponentes perto dele sofrem 15% de lentidão SEMPRE; habilidades atrasam, congelam e travam o tempo.',
      basic: {},
      ability: { slow: 90 },
    },
  });
})();
