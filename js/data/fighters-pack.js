/* Três lutadores novos. Carrega depois do balanceamento, então os números daqui valem.
   Maximilian é secreto: código RELOGIO, e também ADM. */
(() => {
  const frames = Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4]));
  const add = (id) => {
    SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
    SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, { frames });
  };
  const visual = (id, row, color) => ({ visualSheet: id + '-fx', visualRow: row, impactSheets: [], impactColor: color });

  add('lia');
  FIGHTERS.push({
    id: 'lia',
    name: 'LIA',
    title: 'A Entregadora do SESI',
    bio: 'Leva encomenda de skate entre a estação de Valinhos e o ginásio. O shape é o projétil. Chega antes do round pensar.',
    colors: { skin: '#e0b090', hair: '#1a120c', shirt: '#111111', pants: '#2a4a9a', shoes: '#f2f2f2', accent: '#f0c040' },
    stats: { power: 1.38, speed: 1.22, weight: 0.92, hp: 300, meterRate: 1.28 },
    secret: false,
    quotes: {
      intro: ['O shape chega antes de você.', 'Valinhos inteira cabe nesse corredor.'],
      win: ['Entrega feita. Sem atraso.', 'O chão era meu.'],
      special: ['Ollie!', 'Grind!', 'Kickflip!'],
      super: ['LINHA DO TREM!!'],
    },
    moves: {
      punch: { dmg: 6, range: 54, startup: 4, active: 3, recovery: 9 },
      kick: { dmg: 8, range: 68, startup: 6, active: 4, recovery: 11 },
    },
  });
  Object.assign(POWERS, {
    lia: {
      element: 'vento',
      theme: 'skate: projétil, avanço e área no chão',
      powers: [
        Object.assign({ id: 'ollie', name: 'Ollie', slot: 'simple', row: 0, kind: 'shot', dmg: 13, speed: 9, cd: 75, sfx: 'whoosh', fx: { slow: 90 }, desc: 'Manda o shape reto. O vento do shape atrasa quem bloqueia.' }, visual('lia', 0, '#f0c040')),
        Object.assign({ id: 'manual', name: 'Manual', slot: 'simple', row: 1, kind: 'dash', dmg: 9, speed: 16, iFrames: 6, cd: 90, sfx: 'dash', fx: { bleed: 120 }, desc: 'Avança por baixo — o asfalto risca quem encosta (sangramento).' }, visual('lia', 1, '#2a4a9a')),
        Object.assign({ id: 'grind', name: 'Grind', slot: 'charge', meter: 0, row: 2, kind: 'zone', at: 'self', time: 240, w: 180, dmg: 0.4, cd: 200, sfx: 'metal', fx: { bleed: 100, slow: 80 }, desc: 'Risca o chão. Quem pisa sangra e fica lento.' }, visual('lia', 2, '#ff7a2a')),
        Object.assign({ id: 'kickflip', name: 'Kickflip', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 16, speed: 8, seek: true, cd: 210, sfx: 'kick', fx: { slow: 100 }, desc: 'O shape gira, busca o alvo e volta com mais peso.' }, visual('lia', 3, '#f0c040')),
        Object.assign({ id: 'linha-do-trem', name: 'Linha do Trem', slot: 'ultimate', row: 4, kind: 'dash', dmg: 34, speed: 22, iFrames: 12, cd: 1100, sfx: 'ultimate', fx: { dizzy: 60 }, desc: 'Cruza a tela na linha do trem. Um hit só — e tontia no impacto.' }, visual('lia', 4, '#ffd27d')),
      ],
    },
  });

  add('nexo');
  FIGHTERS.push({
    id: 'nexo',
    name: 'NEXO',
    title: 'O Rádio do Morro',
    bio: 'Sobe a antena de madrugada e desce com o fone ainda chiando. O sinal atravessa guarda e vira parede.',
    colors: { skin: '#c89870', hair: '#3a2414', shirt: '#1f8a62', pants: '#143028', shoes: '#5a3a22', accent: '#5cffc0' },
    stats: { power: 1.28, speed: 1.06, weight: 1.04, hp: 305, meterRate: 1.12 },
    secret: false,
    quotes: {
      intro: ['Tá me ouvindo? Agora vai ouvir.', 'O morro inteiro está na frequência.'],
      win: ['Sinal limpo. Você caiu fora da área.', 'Pode desligar.'],
      special: ['Ping!', 'Pacote!', 'Firewall!'],
      super: ['ANTENA CHEIA!!'],
    },
    moves: {
      punch: { dmg: 7, range: 58, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 66, startup: 7, active: 4, recovery: 12 },
    },
  });
  Object.assign(POWERS, {
    nexo: {
      element: 'raio',
      theme: 'rádio: tiro que persegue, muralha e explosão de sinal',
      powers: [
        Object.assign({ id: 'ping', name: 'Ping', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 9, cd: 90, sfx: 'magic', fx: { shock: 90 }, desc: 'Um pulso curto em linha reta — estática que chicoteia (choque).' }, visual('nexo', 0, '#5cffc0')),
        Object.assign({ id: 'pacote', name: 'Pacote', slot: 'simple', row: 1, kind: 'shot', dmg: 11, speed: 7, seek: true, cd: 100, sfx: 'whoosh', fx: { slow: 110 }, desc: 'Pacote pesado teleguiado. Entrega lenta = alvo lento.' }, visual('nexo', 1, '#1f8a62')),
        Object.assign({ id: 'firewall', name: 'Firewall', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 13, speed: 8, cd: 180, sfx: 'shield', fx: { burn: 140 }, desc: 'Rajada larga de sinal quente. Queima quem atravessa.' }, visual('nexo', 2, '#7de0ff')),
        Object.assign({ id: 'handshake', name: 'Handshake', slot: 'charge', meter: 1, row: 3, kind: 'dash', dmg: 14, speed: 14, cd: 200, sfx: 'dash', fx: { shock: 120, slow: 80 }, desc: 'Fecha a distância — o aperto dá choque e trava o passo.' }, visual('nexo', 3, '#5cffc0')),
        Object.assign({ id: 'antena-cheia', name: 'Antena Cheia', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 30, stun: 24, radius: 190, cd: 1100, sfx: 'ultimate', fx: { vertigo: 100, shock: 140 }, desc: 'O morro responde: estouro, vertigem e estática no ar.' }, visual('nexo', 4, '#e8fff6')),
      ],
    },
  });

  add('maximilian');
  FIGHTERS.push({
    id: 'maximilian',
    name: 'MAXIMILIAN',
    title: 'O Mago da Hora',
    bio: 'Relojoeiro de cabelo branco e casaco vinho. O relógio de bolso manda no round. Secreto de propósito: não é para o campeonato normal.',
    colors: { skin: '#f0d2b0', hair: '#f4f4f4', shirt: '#f3e6d0', pants: '#6e2438', shoes: '#5a3a22', accent: '#e0b050' },
    stats: { power: 2.15, speed: 1.34, weight: 1.0, hp: 390, meterRate: 2.2 },
    secret: true,
    quotes: {
      intro: ['A hora é minha. A sua já passou.', 'Fica parado. Eu rebobino o resto.'],
      win: ['Rebobinado.', 'Você chegou tarde demais.'],
      special: ['Engrenagem!', 'Portal!', 'Estilhaço!'],
      super: ['MEIA-NOITE!!'],
    },
    moves: {
      punch: { dmg: 9, range: 64, startup: 4, active: 4, recovery: 8 },
      kick: { dmg: 12, range: 76, startup: 6, active: 5, recovery: 10 },
    },
  });
  Object.assign(POWERS, {
    maximilian: {
      element: 'tempo',
      theme: 'relogio: lentidão, portal e parada total',
      powers: [
        Object.assign({ id: 'relogio', name: 'Relógio', slot: 'simple', row: 0, kind: 'shot', dmg: 18, speed: 11, cd: 50, sfx: 'magic', fx: { slow: 90 }, desc: 'Ponteiro de luz. Aplica lentidão.' }, visual('maximilian', 0, '#3ee0ff')),
        Object.assign({ id: 'engrenagem', name: 'Engrenagem', slot: 'simple', row: 1, kind: 'shot', dmg: 12, speed: 8, seek: true, cd: 80, sfx: 'metal', fx: { bleed: 110 }, desc: 'Engrenagem que persegue e risca (sangramento).' }, visual('maximilian', 1, '#e0b050')),
        Object.assign({ id: 'portal', name: 'Portal', slot: 'charge', meter: 0, row: 2, kind: 'dash', dmg: 18, speed: 20, phase: true, iFrames: 14, cd: 160, sfx: 'dash', fx: { vertigo: 90 }, desc: 'Atravessa o rival intangível — a saída deixa vertigem.' }, visual('maximilian', 2, '#3ee0ff')),
        Object.assign({ id: 'estilhaco', name: 'Estilhaço', slot: 'charge', meter: 1, row: 3, kind: 'blast', at: 'target', dmg: 20, stun: 18, radius: 160, cd: 180, sfx: 'magic', fx: { bleed: 140, slow: 100 }, desc: 'O cubo quebra em cima do alvo: vidro que risca e atrasa.' }, visual('maximilian', 3, '#ffffff')),
        Object.assign({ id: 'rebobinar', name: 'Rebobinar', slot: 'ultimate', row: 4, kind: 'rewind', dmg: 0, cd: 700, sfx: 'ultimate', desc: 'O relógio anda PARA TRÁS: Maximilian volta 3 segundos no tempo — vida e posição restauradas.' }, visual('maximilian', 4, '#ffd27d')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    lia: { sheet: 'arcane', color: '#f0c040' },
    nexo: { sheet: 'lightning', color: '#5cffc0' },
    maximilian: { sheet: 'arcane', color: '#3ee0ff' },
  });
})();
