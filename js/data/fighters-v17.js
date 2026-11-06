/* DS Fighters V17 — John the Vibe Coder: herdeiro do fuzil, discipulo do Du.
   Inimigo do Lobao. One-For-All style: socos com efeitos variados.
   Arte do dono em bugs/Novos-personagens/, recortada por
   tools/integrate_fighter.py. Carregado apos o V16. */
(() => {
  const id = 'john-vibe';
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
      name: 'JOHN THE VIBE CODER',
      title: 'O Herdeiro do Fuzil',
      bio: 'Discípulo do Dev Veterano. Nasceu na periferia de Nexo City, entrou na milícia dev ainda moleque. Sem nenhum dom, só teimosia — herdou as duas pistolas de treino do mestre e a doutrina: disciplina, distância, nunca desperdiçar tiro. Odeia quem rouba o que não construiu. Fala pouco, mira melhor.',
      colors: { skin: '#d4a97e', hair: '#1a1418', shirt: '#e8e4dc', pants: '#1a1a20', shoes: '#101014', accent: '#f0c84a' },
      traits: { veteran: true, dualPistols: true, glowingFist: true, hairStyle: 'short' },
      stats: { power: 1.36, speed: 1.10, weight: 1.05, hp: 140, meterRate: 1.20 },
      secret: false,
      quotes: {
        intro: ['Treino é a única coisa que ninguém te rouba.', 'Dez horas por dia. Sem desculpa.'],
        win: ['Isso foi construído, não herdado.', 'Disciplina vence dom.'],
        special: ['SOCO VIBRACIONAL!', 'CARGA DE FUZIL!', 'MÃO QUE MIRA!'],
        super: ['HERANÇA DO FUZIL!!'],
      },
      moves: {
        punch: { dmg: 7, range: 54, startup: 4, active: 5, recovery: 10 },
        kick: { dmg: 10, range: 68, startup: 6, active: 5, recovery: 12 },
      },
      special: {
        name: 'Soco Vibracional', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 11, dmg: 12, w: 26, h: 22, color: '#f0c84a', shape: 'bolt', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Herança do Fuzil', type: 'melee-rush', dmg: 34, hits: 6, visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'vibe',
      theme: 'socos vibracionais, fuzil herdado e disciplina de aço',
      powers: [
        Object.assign({
          id: 'vibe-punch', name: 'Soco Vibracional', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 11, seek: true, stun: 16, cd: 40,
          fx: { shock: 50, vuln: 40 }, sfx: 'heavy',
          desc: 'Soco de energia vibracional AUTO-AIM que eletriza e deixa vulnerável.',
        }, visual(0, '#f0c84a')),
        Object.assign({
          id: 'rifle-charge', name: 'Carga de Fuzil', slot: 'simple', row: 1,
          kind: 'dash', dmg: 17, speed: 15, stun: 26, cd: 46,
          fx: { bleed: 100, burn: 60 }, sfx: 'dash',
          desc: 'Investida com as duas pistolas: SANGRA e QUEIMA no contato.',
        }, visual(1, '#ff8a3a')),
        Object.assign({
          id: 'aim-fist', name: 'Mão que Mira', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 12, dmg: 21, stun: 32, launch: -8, cd: 68,
          fx: { paralyze: 40, lock: 50 }, sfx: 'explosion',
          desc: 'Punho de precisão: PARALISA e TRAVA os poderes do alvo.',
        }, visual(2, '#f0c84a')),
        Object.assign({
          id: 'doctrine', name: 'Doutrina do Mestre', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 360, dmgMult: 1.3, speedMult: 1.2, defMult: 0.75, heal: 15, cd: 88,
          sfx: 'shield',
          desc: 'A doutrina do Dev Veterano: +30% dano, +20% velocidade, −25% dano recebido e cura.',
        }, visual(3, '#f0e0a0')),
        Object.assign({
          id: 'rifle-inheritance', name: 'Herança do Fuzil', slot: 'ultimate', row: 4,
          kind: 'rush', dmg: 34, hits: 6, cd: 122,
          fx: { bleed: 120, burn: 100, vuln: 80 }, sfx: 'ultimate',
          desc: 'Sequência de 6 socos com as duas pistolas: sangra, queima e deixa vulnerável.',
        }, visual(4, '#ffaa3a')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    vibe: { sheet: id, color: '#f0c84a' },
    [id]: { sheet: id, color: '#f0c84a' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'HERDEIRO DO FUZIL',
      desc: 'Socos vibracionais que eletrizam, sangram, queimam e paralisam. O treino é a única coisa que ninguém rouba.',
      basic: {},
      ability: {},
    },
  });
})();

/* ================== NIMBO — o Portador Rachado ================== */
(() => {
  const id = 'nimbo';
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
      name: 'NIMBO',
      title: 'O Portador Rachado',
      bio: 'Discípulo de Thales, o Arquiteto. Recebeu uma cópia fraca da Colheita do Ruído — o corpo racha a cada habilidade roubada, veias cinza de energia que se espalham. O prognóstico era apodrecer. O Arquiteto o recolheu não pra curar, mas pra ensinar: o poder de roubar pode devolver o que foi tirado.',
      colors: { skin: '#d8c4b4', hair: '#e8e8e8', shirt: '#1a1a22', pants: '#121218', shoes: '#0c0c10', accent: '#a0a0c0' },
      traits: { crackedVeins: true, longHair: true, tatteredCape: true, harvestCopy: true },
      stats: { power: 1.38, speed: 1.12, weight: 0.96, hp: 134, meterRate: 1.20 },
      secret: false,
      quotes: {
        intro: ['O Ruído me deu isso. Eu não pedi.', 'A deterioração é a minha barra de vida.'],
        win: ['Isso foi devolvido, não roubado.', 'A tempestade responde a controle.'],
        special: [' Rachadura!', 'TEMPESTADE INTERNA!', 'COLHEITA FRACA!'],
        super: ['TEMPESTADE DEVIADA!!'],
      },
      moves: {
        punch: { dmg: 6, range: 52, startup: 4, active: 4, recovery: 9 },
        kick: { dmg: 9, range: 66, startup: 6, active: 4, recovery: 11 },
      },
      special: {
        name: 'Rachadura', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 11, w: 24, h: 20, color: '#a0a0c0', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Tempestade Desviada', type: 'aoe', dmg: 32, radius: 220, visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'ruido',
      theme: 'rachaduras de energia cinza, tempestade interna e a Colheita fraca',
      powers: [
        Object.assign({
          id: 'crack-shot', name: 'Rachadura', slot: 'simple', row: 0,
          kind: 'shot', dmg: 11, speed: 10, seek: true, stun: 16, cd: 40,
          fx: { slow: 40 }, sfx: 'magic',
          desc: 'Projétil de energia cinza AUTO-AIM que desacelera o rival.',
        }, visual(0, '#a0a0c0')),
        Object.assign({
          id: 'internal-storm', name: 'Tempestade Interna', slot: 'simple', row: 1,
          kind: 'dash', dmg: 15, speed: 14, stun: 24, cd: 46,
          fx: { shock: 60, vuln: 60 }, sfx: 'dash',
          desc: 'A tempestade dentro dele explode: avanço que ELETRIZA e deixa VULNERÁVEL.',
        }, visual(1, '#c0c0e0')),
        Object.assign({
          id: 'weak-harvest', name: 'Colheita Fraca', slot: 'charge', meter: 0, row: 2,
          kind: 'steal', time: 480, dmg: 10, cd: 80,
          fx: { blind: 100, lock: 60 }, sfx: 'steal',
          desc: 'Cópia fraca da Colheita: rouba 5 poderes por 8s mas CEGA e TRAVA o próprio uso.',
        }, visual(2, '#8080a0')),
        Object.assign({
          id: 'give-back', name: 'Devolver', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 300, heal: 25, dmgMult: 1.2, speedMult: 1.15, defMult: 0.8, cd: 90,
          sfx: 'shield',
          desc: 'O poder ao contrário: DEVOLVE vida e buffa — a tempestade responde a controle.',
        }, visual(3, '#e0e0ff')),
        Object.assign({
          id: 'redirected-storm', name: 'Tempestade Desviada', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 32, stun: 36, launch: -9, radius: 220, cd: 126,
          fx: { paralyze: 30, shock: 120, slow: 80 }, sfx: 'ultimate',
          desc: 'A tempestade é desviada para o alvo: dano massivo + paralisia curta + choque + lentidão.',
        }, visual(4, '#c0c0e0')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    ruido: { sheet: id, color: '#a0a0c0' },
    [id]: { sheet: id, color: '#a0a0c0' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'PORTADOR RACHADO',
      desc: 'Cópia fraca da Colheita que rouba poderes ao custo do próprio corpo — mas aprendeu a devolver.',
      basic: {},
      ability: {},
    },
  });
})();
