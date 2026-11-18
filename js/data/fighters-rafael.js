/* DS Fighters — RAFAEL, "A Lâmina Pesada".
   Arte do dono (Pitoco-pet/Rafael-personagem/): cabelo loiro curto, outfit
   verde-escuro sem manga com armadura preta e uma arma preta pesada
   (espadona) segurada com as duas maos. Bruiser lento e pesado: cada golpe
   causa muito dano e debuffs; abaixo de 35% de vida entra em FÚRIA e causa
   ainda mais dano (hook lowHpRage). Todas as poses olham pra direita. */
(() => {
  const id = 'rafael';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.95, walk: 0.95, jump: 0.92, crouch: 0.8, punch: 0.95, kick: 0.98, cpunch: 0.82, ckick: 0.85, jpunch: 0.92, jkick: 0.92, special: 0.95, hit: 0.9, block: 0.85, ko: 0.88, win: 0.95 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'RAFAEL',
      title: 'A Lâmina Pesada',
      bio: 'Cabelo loiro, armadura preta sobre roupa verde e uma espadona preta enorme nas duas mãos: bruiser lento que cada golpe faz pesar. Sangra, atordoa e, com pouca vida, entra em fúria e causa ainda mais dano.',
      colors: { skin: '#F5DFC8', hair: '#E8C95A', shirt: '#1E4D2B', pants: '#101014', shoes: '#2A2A32', accent: '#C0392B' },
      traits: {},
      stats: { power: 1.3, speed: 0.85, weight: 1.3, hp: 210, meterRate: 0.95 },
      secret: false,
      quotes: {
        intro: ['A lâmina pesa... e cai.', 'Ninguém segura o Rafael.'],
        win: ['Fim de jogo.', 'Peso demais pra sua defesa.'],
        lose: ['...a lâmina cansou.', 'Vou afiar e volto.'],
        taunt: ['Vem encarar a lâmina.'],
        special: ['CORTE!', 'PESO!'],
        super: ['IMPACTO DEVASTADOR!!'],
      },
      moves: {
        punch: { dmg: 10, range: 60, startup: 6, active: 4, recovery: 12 },  /* coronhada da arma (jab) */
        kick: { dmg: 15, range: 74, startup: 10, active: 4, recovery: 14 },  /* chute com a arma de lado */
      },
      special: {
        name: 'Golpe de Lâmina', type: 'melee-rush', dmg: 15, hits: 1,
        proj: { speed: 0, dmg: 15, w: 36, h: 36, color: '#C0392B', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Impacto Devastador', type: 'melee-rush', dmg: 18, hits: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'terra',
      theme: 'rafael: espadona pesada — corte que sangra, slam no chao em area, investida com knockback, chuva de laminas e ult de impacto devastador',
      powers: [
        Object.assign({
          id: 'golpe-de-lamina', name: 'Golpe de Lâmina', slot: 'simple', row: 0,
          kind: 'blast', at: 'target', dmg: 20, stun: 40, launch: -8, radius: 200, cd: 95, sfx: 'heavy',
          fx: { bleed: 140 },
          desc: 'Corte pesado no alvo: 20 de dano + stun + SANGRAMENTO (~2,3s).',
        }, visual(0, '#C0392B')),
        Object.assign({
          id: 'slam-no-chao', name: 'Slam no Chão', slot: 'simple', row: 1,
          kind: 'blast', at: 'self', dmg: 14, stun: 30, radius: 210, cd: 110, sfx: 'explosion',
          fx: { shock: 40, slow: 100 },
          desc: 'Espadona no chao: dano em area ao redor (14) + ELETRIZADO + LENTO.',
        }, visual(1, '#FFD24D')),
        Object.assign({
          id: 'investida-brutal', name: 'Investida Brutal', slot: 'simple', row: 2,
          kind: 'dash', dmg: 16, speed: 15, stun: 30, kx: 14, cd: 90, whiffRecovery: 20, sfx: 'dash',
          fx: { vuln: 150 },
          desc: 'Investida com a arma: 16 de dano + stun + knockback forte + VULNERÁVEL (2,5s). Errou? recovery longo.',
        }, visual(2, '#5EB8FF')),
        Object.assign({
          id: 'chuva-de-laminas', name: 'Chuva de Lâminas', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 6, dmg: 22, cd: 130, sfx: 'hazard',
          fx: { bleed: 160, slow: 80 },
          desc: 'Seis laminas caem no rival (~22 de dano): SANGRAMENTO (~2,7s) + LENTO.',
        }, visual(3, '#FFB03B')),
        Object.assign({
          id: 'impacto-devastador', name: 'Impacto Devastador', slot: 'ultimate', row: 4,
          kind: 'rush', hits: 4, dmg: 22, teleport: true, cd: 150, whiffRecovery: 20, sfx: 'ultimate',
          fx: { explode: 3, bleed: 240, vuln: 200 },
          desc: 'Sequencia de 4 golpes de espadona que atravessa a tela terminando em rachadura: explosao + SANGRAMENTO (~4s) + VULNERAVEL (3,3s).',
        }, visual(4, '#FF5A3C')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#C0392B' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'FÚRIA DA LÂMINA',
      desc: 'Bruiser pesado: golpes que sangram e atordoam, slam em area, investida com knockback e ult devastadora. Abaixo de 35% de vida entra em FÚRIA: +25% de dano (lowHpRage).',
      basic: {},
      ability: {},
      lowHpRage: 1.25,   /* Fúria: +25% dano abaixo de 35% de vida */
    },
  });
})();
