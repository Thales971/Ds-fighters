/* DS Fighters — CRACKER, "O Hacker".
   Arte do dono (Pitoco-pet/.../Craker-personagem/): cabelo verde, oculos,
   roupa preta com detalhes verdes, tenis e um laptop de tela verde na mao.
   Zoner/rush hibrido tematico de invasao: pacote que envenena, exploit que
   expoe (vuln), blink de invasao, jaula de quarentena, chuva de requisicoes (DDoS) e
   ult rootkit que trava os poderes do rival. */
(() => {
  const id = 'cracker';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.88, walk: 0.88, jump: 0.86, crouch: 0.74, punch: 0.88, kick: 0.9, cpunch: 0.76, ckick: 0.78, jpunch: 0.86, jkick: 0.86, special: 0.88, hit: 0.84, block: 0.78, ko: 0.82, win: 0.88 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'CRACKER',
      title: 'O Hacker',
      bio: 'Cabelo verde, oculos e o laptop de tela verde na mão: entra no sistema do rival sem pedir permissão. Pacote que envenena, exploit que expõe, dash intangível de invasão e a ultimate rootkit que trava tudo do oponente.',
      colors: { skin: '#F5DFC8', hair: '#1FA83C', shirt: '#101018', pants: '#181822', shoes: '#EDEDED', accent: '#39FF6A' },
      traits: {},
      stats: { power: 1.1, speed: 1.12, weight: 0.95, hp: 175, meterRate: 1.1 },
      secret: false,
      quotes: {
        intro: ['Sistema aberto. Entra.', 'Sua rede não me aguenta.'],
        win: ['Acesso concedido.', 'Backup corrompido com sucesso.'],
        lose: ['Conexão recusada...', 'O firewall me pegou.'],
        taunt: ['Vai rodar meu exploit?'],
        special: ['EXECUTANDO!', 'Injetando pacote!'],
        super: ['ROOTKIT ATIVADO!!'],
      },
      moves: {
        punch: { dmg: 8, range: 54, startup: 5, active: 4, recovery: 9 },   /* tecladaço (jab) */
        kick: { dmg: 12, range: 64, startup: 8, active: 4, recovery: 12 },  /* chute com o laptop fechado */
      },
      special: {
        name: 'Pacote Suspeito', type: 'melee-rush', dmg: 13, hits: 1,
        proj: { speed: 0, dmg: 13, w: 28, h: 28, color: '#39FF6A', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Rootkit', type: 'melee-rush', dmg: 15, hits: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'veneno',
      theme: 'cracker: hacker de controle — pacote venenoso (shot), roubo de kit (steal), blink (teleporte), quarentena (jaula/zona) e ult DDoS massivo (barrage)',
      powers: [
        Object.assign({
          id: 'pacote-suspeito', name: 'Pacote Suspeito', slot: 'simple', row: 0,
          kind: 'shot', dmg: 9, speed: 11, cd: 50, sfx: 'magic',
          fx: { poison: 140, slow: 60 },
          desc: 'Projétil verde de dados: 9 de dano + VENENO (~2,3s) + LENTO.',
        }, visual(0, '#39FF6A')),
        Object.assign({
          id: 'roubo-de-dados', name: 'Roubo de Dados', slot: 'simple', row: 1,
          kind: 'steal', range: 150, dmg: 8, time: 420, blockable: true, cd: 95, sfx: 'steal',
          fx: { glitch: 120 },
          desc: 'Invasão a curta distância: 8 de dano e ROUBA O KIT do rival por 7s (você usa os poderes dele) + TRAVAMENTO na tela.',
        }, visual(1, '#FFD24D')),
        Object.assign({
          id: 'blink', name: 'Blink', slot: 'simple', row: 2,
          kind: 'shadowport', burstDmg: 14, cd: 70, sfx: 'magic',
          fx: { glitch: 60 },
          desc: 'Teleporte hacker: some e reaparece atrás (ou em cima) do rival; cair em cima dá 14 de dano + TRAVAMENTO.',
        }, visual(2, '#4AE3FF')),
        Object.assign({
          /* id mantido ('firewall') pra nao quebrar perfis/testes; o nome mudou:
             hacker nao queima ninguem — ele ISOLA o rival numa jaula de codigo. */
          id: 'firewall', name: 'Quarentena', slot: 'charge', meter: 0, row: 3,
          kind: 'zone', time: 320, dmg: 0.12, slow: 50, cd: 120, sfx: 'hazard', zoneTall: 1.35,
          fx: { lock: 24, glitch: 90 },
          desc: 'Jaula de código no rival por ~5s: dano contínuo + LENTO + SEM PODERES enquanto estiver preso lá dentro.',
        }, visual(3, '#B9FF4A')),
        Object.assign({
          id: 'ddos-massivo', name: 'DDoS Massivo', slot: 'ultimate', row: 4,
          kind: 'barrage', count: 12, dmg: 3, seek: true, cd: 150, sfx: 'ultimate',
          fx: { lock: 150, glitch: 200, blind: 120 },
          desc: '12 pacotes teleguiados caem no rival (~36 de dano): rival fica SEM PODERES (~2,5s) + TRAVAMENTO + CEGO.',
        }, visual(4, '#FF6AFF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#39FF6A' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'MALWARE',
      desc: 'Hacker de controle: pacote venenoso de longe, rouba o kit do rival de perto, blink pra trás do alvo, jaula de quarentena e ult DDoS massivo (lock + glitch + cego).',
      basic: {},
      ability: {},
    },
  });
})();
