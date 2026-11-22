/* DS Fighters — CAPTCHA GUARD (nov/2026). So libera com LOGIN (conta por email).
   Arte do dono (Pitoco-pet/Rafael-personagem/Captcha-guard-personagem/):
   segurança de armadura cromada, visor azul e pistola de plasma.
     poses   -> tools/integrate_fighter.py captcha-guard
     poderes -> tools/build_captcha_fx.py (atlas 4x5 + estouro de impacto)
   Kit de "prove que você é humano": tiro que ELETRIZA, orbes "selecione os
   ônibus" que perseguem, Rate Limit que trava o medidor do rival, escudo
   Firewall Humano que devolve projéteis e a ULT "ACESSO NEGADO": um raio que
   cruza a arena, ELETRIZA e deixa VULNERÁVEL. Acima da média de propósito
   (recompensa por criar conta). */
(() => {
  const id = 'captcha-guard';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v82-captcha';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true,
    accHide: ['ko', 'jkick'],
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['captcha-guard-extra'], impactColor: color,
  });

  FIGHTERS.push({
    id,
    name: 'CAPTCHA GUARD',
    title: 'O Segurança do Login',
    bio: 'Fica na porta de todo site perguntando se você é humano. Já barrou um milhão de robôs e não tem paciência pra quem erra os semáforos. Armadura cromada, visor azul e uma pistola de plasma que só dispara depois de verificar o alvo. Só trabalha pra quem tem conta.',
    colors: { skin: '#8A5A3C', hair: '#16161A', shirt: '#9AA3B0', pants: '#1C1D22', shoes: '#141418', accent: '#3FB8FF' },
    traits: { beard: true, visor: true, armor: true },
    stats: { power: 2.45, speed: 1.12, weight: 1.06, hp: 340, meterRate: 1.32 }, /* ~62% contra os normais (balance-final.js) */
    secret: false,
    loginReward: true,
    quotes: {
      intro: ['Prove que você é humano.', 'Selecione todos os perdedores.'],
      win: ['Verificação concluída.', 'Acesso liberado. Pra mim.'],
      lose: ['Falha na verificação...', 'Era um robô... o tempo todo...'],
      taunt: ['Clique nos semáforos.'],
      special: ['VERIFICANDO!', 'SELECIONE OS ÔNIBUS!', 'RATE LIMIT!', 'FIREWALL!'],
      super: ['ACESSO NEGADO!!'],
    },
    moves: {
      punch: { dmg: 8, range: 68, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 12, range: 80, startup: 8, active: 5, recovery: 13 },
    },
    special: {
      name: 'Tiro de Verificação', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 15, dmg: 12, w: 30, h: 16, color: '#3FB8FF', shape: 'bolt', visualSheet: id, visualRow: 0 },
    },
    super: { name: 'Acesso Negado', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'eletrico',
      theme: 'captcha: tiro de verificação, "selecione os ônibus", rate limit, firewall humano e acesso negado',
      powers: [
        Object.assign({
          id: 'tiro-verificacao', name: 'Tiro de Verificação', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 15, cd: 46, sfx: 'thunder_cast',
          fx: { shock: 60 },
          desc: 'Bala de plasma muito rápida: ELETRIZA o rival.',
        }, visual(0, '#3FB8FF')),
        Object.assign({
          id: 'selecione-onibus', name: 'Selecione os Ônibus', slot: 'simple', row: 1,
          kind: 'shot', count: 3, spread: 0.22, dmg: 5, speed: 11, seek: true, cd: 62, sfx: 'magic',
          fx: { slow: 50 },
          desc: '3 orbes elétricos que perseguem o rival: cada um deixa LENTO.',
        }, visual(1, '#7FD8FF')),
        Object.assign({
          id: 'rate-limit', name: 'Rate Limit', slot: 'charge', meter: 0, row: 2,
          kind: 'zone', time: 300, dmg: 0.1, slow: 60, cd: 110, sfx: 'hazard',
          fx: { meterSlow: 60 },
          desc: '"Muitas tentativas!": vórtice no rival por ~5s, dano contínuo, LENTO e o medidor dele quase não carrega.',
        }, visual(2, '#4A7BFF')),
        Object.assign({
          id: 'firewall-humano', name: 'Firewall Humano', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 240, reflect: true, defMult: 0.65, heal: 12, cd: 120, sfx: 'shield',
          desc: 'Escudo de verificação por 4s: DEVOLVE projéteis, reduz o dano recebido e cura um pouco.',
        }, visual(3, '#58C8FF')),
        Object.assign({
          id: 'acesso-negado', name: 'Acesso Negado', slot: 'ultimate', row: 4,
          kind: 'beam', range: 620, dmg: 34, stun: 40, launch: -8, cd: 150, sfx: 'ultimate',
          fx: { shock: 90, vuln: 120 },
          desc: 'ULT: raio de plasma que cruza a arena: ELETRIZA e deixa VULNERÁVEL. Robô não passa.',
        }, visual(4, '#9FE8FF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#3FB8FF' } });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'VERIFICAÇÃO HUMANA',
      desc: 'Atirador de controle: bala rápida que eletriza, orbes teleguiados, vórtice que trava o medidor, escudo que devolve e um raio de ponta a ponta.',
      basic: {},
      ability: {},
    },
  });
})();
