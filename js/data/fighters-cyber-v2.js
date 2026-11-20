/* DS Fighters — CYBER-PSICOPATA v2 (nov/2026).
   Arte nova do dono (bugs/Novos-personagens/Ciber v2 *.jpg):
     poses   -> tools/integrate_fighter.py cyber-psicopata
     poderes -> tools/build_ciber_fx.py (atlas animado + explosao de impacto)
   Carregado DEPOIS de todas as camadas antigas de balanceamento (v9..v13) e
   ANTES do balance-v14: o kit aqui e definitivo (nada de "tone" por cima) e
   o multiplicador de FORCA do v14 continua valendo pros stats. */
(() => {
  const id = 'cyber-psicopata';
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v63-ciber';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
  });

  const f = FIGHTERS.find((x) => x.id === id);
  if (f) {
    f.title = 'O Enforcement de SLA';
    f.bio = '96% máquina, 4% humano: um brutamontes de chrome com visor vermelho, punho hidráulico, canhão de plasma no braço e pod de mísseis. Lento pra começar, impossível de parar depois — e quando entra em Ciberneurose, pega fogo.';
    f.stats = { power: 1.5, speed: 1.26, weight: 1.12, hp: 160, meterRate: 1.4 };
    f.quotes = {
      intro: ['Contrato assinado. Bônus garantido.', 'Seu uptime acabou.'],
      win: ['SLA cumprido.', 'Peça nova já encomendada.'],
      lose: ['Falha crítica... reiniciando...', 'Garantia vencida.'],
      taunt: ['Vem. Eu tenho armadura.'],
      special: ['CANHÃO DE PLASMA!', 'BOMBARDEIO ANTI-HACKER!', 'CHUTE FOGUETE!', 'PISÃO SÍSMICO!'],
      super: ['CIBERNEUROSE!!'],
    };
  }

  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['cyber-psicopata-hit'], impactColor: color,
  });

  POWERS[id] = {
    element: 'chrome',
    theme: 'canhão de plasma, mísseis teleguiados, chute foguete, pisão sísmico e ciberneurose em chamas',
    powers: [
      Object.assign({
        id: 'canhao-plasma', name: 'Canhão de Plasma', slot: 'simple', row: 0,
        kind: 'shot', dmg: 15, speed: 12, big: true, cd: 46, sfx: 'fire',
        fx: { burn: 120 },
        desc: 'O braço vira canhão: bola de plasma pesada que QUEIMA.',
      }, visual(0, '#ff6a1c')),
      Object.assign({
        id: 'antihacker-bombing', name: 'Bombardeio Anti-Hacker', slot: 'simple', row: 1,
        kind: 'barrage', dmg: 7, count: 6, homing: 0.45, seek: true, stun: 16, cd: 54, sfx: 'explosion',
        fx: { burn: 90, meterSlow: 40 },
        desc: '6 mísseis teleguiados do pod do ombro: explodem, QUEIMAM e o EMP atrasa o medidor do rival.',
      }, visual(1, '#ff8a2a')),
      Object.assign({
        id: 'rocket-kick', name: 'Chute Foguete', slot: 'charge', meter: 0, row: 2,
        kind: 'dash', dmg: 22, speed: 17, stun: 34, cd: 58, sfx: 'dash',
        fx: { launch: -12, burn: 80 },
        desc: 'Propulsor ligado: atravessa a arena num rastro azul e LANÇA o rival com onda de choque.',
      }, visual(2, '#4aa8ff')),
      Object.assign({
        id: 'pisao-sismico', name: 'Pisão Sísmico', slot: 'charge', meter: 1, row: 3,
        kind: 'pillar', at: 'target', big: true, dmg: 24, stun: 30, launch: -10, delay: 22, cd: 80, sfx: 'explosion',
        fx: { slow: 90, vuln: 90 },
        desc: 'Pisa tão forte que o chão estoura embaixo do rival: LANÇA, deixa LENTO e VULNERÁVEL.',
      }, visual(3, '#ffb02a')),
      Object.assign({
        id: 'cyberneurosis', name: 'Ciberneurose', slot: 'ultimate', row: 4,
        kind: 'aura', time: 600, grant: 'overclock', speedMult: 1.3, dmgMult: 1.35, defMult: 0.8, heal: 20, regen: 0.03,
        hitDmg: 20, hitRadius: 260, hitStun: 40, cd: 120, sfx: 'ultimate', auraScale: 2.45, auraDy: -26,
        desc: 'Explode em chamas ao ativar (dano em volta) e passa 10s em fúria: esquiva de habilidades, +força, +velocidade e menos dano recebido.',
      }, visual(4, '#ff2035')),
    ],
  };

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'TANK DE PRESSÃO',
      desc: 'Pesado e resistente: plasma e mísseis de longe, chute foguete e pisão sísmico de perto; na Ciberneurose vira uma fornalha.',
      basic: {},
      ability: {},
    },
  });
})();
