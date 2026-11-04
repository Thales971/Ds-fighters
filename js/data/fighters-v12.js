/* DS Fighters V12 — Dev Veterano (Kaíke): veterano blindado com duas pistolas
   anti-bug, soco de 1TB, correntes de aço e a Turbina de Socos.
   Arte enviada pelo proprietário em bugs/Novos-personagens/, recortada por
   tools/integrate_dev_veterano.py. Carregado após o V11. */
(() => {
  const id = 'dev-veterano';
  SPRITE_LAYOUT.files[id] = 'assets/sprites/dev-veterano.png';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
  });

  const visual = (row, color) => ({
    visualSheet: id,
    visualRow: row,
    impactSheets: [],
    impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'DEV VETERANO',
      title: 'O Veterano de Produção',
      bio: 'Veterano blindado de ombros largos e duas pistolas anti-bug. Resolve incidente no braço: tiro certeiro que faz sangrar, soco de 1TB que trava qualquer sistema por um segundo e correntes de aço que puxam o rival pra briga de perto.',
      colors: { skin: '#c9986d', hair: '#2a2620', shirt: '#3a3f47', pants: '#23262b', shoes: '#15171b', accent: '#7fe08a' },
      traits: { veteran: true, dualPistols: true, chains: true, heavyBrawler: true },
      stats: { power: 1.30, speed: 1.00, weight: 1.06, hp: 134, meterRate: 1.15 },
      secret: false,
      quotes: {
        intro: ['Já apaguei incidente pior que você.', 'Postmortem depois da luta.'],
        win: ['Incidente resolvido.', 'Fecha o ticket.'],
        special: ['TIRO ANTI-BUG!', 'SOCO DE 1TB!', 'CORRENTE, PUXA!'],
        super: ['TURBINA DE SOCOS!!'],
      },
      moves: {
        punch: { dmg: 6, range: 52, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 10, range: 66, startup: 7, active: 4, recovery: 12 },
      },
      special: {
        name: 'Tiro Anti-Bug', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 11, dmg: 12, w: 26, h: 20, color: '#7fe08a', shape: 'bolt', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Turbina de Socos', type: 'melee-rush', dmg: 32, hits: 7, visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'veterano',
      theme: 'pistolas anti-bug, soco de 1TB, correntes de aço e rajada de socos',
      powers: [
        Object.assign({
          id: 'antibug-shot', name: 'Tiro Anti-Bug', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 11, stun: 14, cd: 42,
          fx: { bleed: 140 }, sfx: 'fire',
          desc: 'Tiro certeiro das duas pistolas que causa sangramento contínuo.',
        }, visual(0, '#7fe08a')),
        Object.assign({
          id: 'one-tb-punch', name: 'Soco de 1TB', slot: 'simple', row: 1,
          kind: 'pillar', at: 'target', delay: 10, dmg: 18, stun: 30, launch: -6, cd: 62,
          fx: { paralyze: 60 }, sfx: 'heavy',
          desc: 'Soco pesado que sobrecarrega o rival: paralisia de 1 segundo.',
        }, visual(1, '#6fd0ff')),
        Object.assign({
          id: 'steel-chains', name: 'Correntes de Aço', slot: 'charge', meter: 0, row: 2,
          kind: 'pull', range: 380, dmg: 13, stun: 34, cd: 55, sfx: 'dash',
          desc: 'Investida de correntes: agarra o rival no caminho e o puxa para perto.',
        }, visual(2, '#ffb03b')),
        Object.assign({
          id: 'antibug-volley', name: 'Saraivada Anti-Bug', slot: 'charge', meter: 1, row: 3,
          kind: 'barrage', dmg: 6, count: 6, homing: 0.35, stun: 16, cd: 78,
          fx: { bleed: 100 }, sfx: 'fire',
          desc: 'Rajada de projéteis anti-bug teleguiados; cada acerto sangra.',
        }, visual(3, '#7fe08a')),
        Object.assign({
          id: 'punch-turbine', name: 'Turbina de Socos', slot: 'ultimate', row: 4,
          kind: 'rush', dmg: 32, hits: 7, cd: 130,
          fx: { lock: 40 }, sfx: 'ultimate',
          desc: 'Avança e descarrega uma turbina de socos de perto — dano alto, só à queima-roupa.',
        }, visual(4, '#6fd0ff')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    veterano: { sheet: 'dev-veterano', color: '#7fe08a' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'VETERANO DE PRODUÇÃO',
      desc: 'Tiros anti-bug causam sangramento; o soco de 1TB paralisa por 1 segundo; correntes puxam o rival para perto.',
      basic: {},
      ability: {},
    },
  });
})();
