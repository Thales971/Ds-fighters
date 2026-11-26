/* DS Fighters — MILENA, "A Janela de Erro".
   Arte do dono (arte-fonte/milena-personagem/): cabelo roxo, jaqueta branca com detalhes
   pretos, calça preta, tênis branco e bastão verde; tema de janelas de
   alerta/erro do sistema. Zoner de suporte: projétil de alerta, varredura com
   o bastão, dash intangível e ult que derruba a "tela azul" no rival. */
(() => {
  const id = 'milena';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.85, walk: 0.85, jump: 0.85, crouch: 0.72, punch: 0.85, kick: 0.85, cpunch: 0.75, ckick: 0.75, jpunch: 0.85, jkick: 0.85, special: 0.85, hit: 0.8, block: 0.75, ko: 0.8, win: 0.85 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'MILENA',
      title: 'A Janela de Erro',
      bio: 'Cabelo roxo, jaqueta branca e o bastão verde na mão: ela aparece quando o sistema chia. Zoner de suporte que joga janelas de alerta no rival, varre com o bastão e, na ultimate, derruba a tela azul inteira em cima dele.',
      colors: { skin: '#F5DFC8', hair: '#7C3AED', shirt: '#F5F5F5', pants: '#17171C', shoes: '#EDEDED', accent: '#7DFF5E' },
      traits: {},
      stats: { power: 1.12, speed: 1.08, weight: 1.0, hp: 170, meterRate: 1.15 },
      secret: false,
      quotes: {
        intro: ['Erro 404: resistência não encontrada.', 'Alerta do sistema: invasor detectado.'],
        win: ['Sistema restaurado. O bug era você.', 'Patch aplicado com sucesso.'],
        lose: ['Conexão perdida...', 'Erro fatal: eu caí.'],
        taunt: ['Esse alerta é pra você.'],
        special: ['Alerta!', 'Bug encontrado!'],
        super: ['TELA AZUL DE KERNEL!!'],
      },
      moves: {
        punch: { dmg: 7, range: 56, startup: 5, active: 4, recovery: 10 },  /* bastonada (jab) */
        kick: { dmg: 11, range: 66, startup: 8, active: 4, recovery: 12 },   /* chute frontal */
      },
      special: {
        name: 'Alerta do Sistema', type: 'projectile', cost: 25,
        proj: { speed: 9, dmg: 10, w: 26, h: 22, color: '#FFE14D', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Tela Azul de Kernel', type: 'blast', dmg: 30, radius: 260 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'terra',
      theme: 'milena: janelas de alerta e erro — projétil que slow, varredura de bastão, dash intangível e ult tela azul (kernel panic)',
      powers: [
        Object.assign({
          id: 'alerta', name: 'Alerta do Sistema', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 9, cd: 55, sfx: 'magic',
          fx: { slow: 100, vuln: 150 },
          desc: 'Janela de alerta amarela (projétil). Aplica LENTO por ~1,7s + VULNERÁVEL (+20% dano, 2,5s) no impacto.',
        }, visual(0, '#FFE14D')),
        Object.assign({
          id: 'varredura-verde', name: 'Varredura Verde', slot: 'simple', row: 1,
          kind: 'blast', at: 'target', dmg: 16, stun: 30, radius: 170, cd: 100, sfx: 'heavy',
          fx: { chill: 180 },
          desc: 'Giro do bastão verde no alvo: 16 de dano + stun + GELANDO (dano extra de fogo/choque, ~3s).',
        }, visual(1, '#7DFF5E')),
        Object.assign({
          id: 'fuga-do-erro', name: 'Fuga do Erro', slot: 'simple', row: 2,
          kind: 'dash', dmg: 10, speed: 18, phase: true, iFrames: 12, cd: 55, sfx: 'dash',
          fx: { vuln: 90 },
          desc: 'Dash azul intangível (12f de invuln) atravessando o rival: 10 de dano + VULNERÁVEL por 1,5s.',
        }, visual(2, '#5EB8FF')),
        Object.assign({
          id: 'erros-em-cascata', name: 'Erros em Cascata', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 5, dmg: 14, cd: 120, sfx: 'hazard',
          fx: { glitch: 140, blind: 100, poison: 160 },
          desc: 'Cinco janelas de erro caem no rival: dano + TRAVAMENTO (~2,3s) + CEGO (~1,7s) + VENENO (~2,7s).',
        }, visual(3, '#FF4B4B')),
        Object.assign({
          id: 'tela-azul', name: 'Tela Azul de Kernel', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 40, radius: 260, kernel: true, cd: 150, sfx: 'ultimate',
          fx: { bleed: 300, blind: 60 },
          desc: 'KERNEL PANIC no rival: 30 de dano + stun + tela azul (BSOD) + SANGRAMENTO (~5s) + CEGO (~1s).',
        }, visual(4, '#3B6CFF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#7DFF5E' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'ALERTA DO SISTEMA',
      desc: 'Zoner de suporte com debuffs em cascata: alerta (lento + vulnerável), bastão (stun + gelando), dash intangível (vulnerável), chuva de erros (travamento + cego + veneno) e a ult tela azul (BSOD + sangramento + cego).',
      basic: {},
      ability: {},
    },
  });
})();
