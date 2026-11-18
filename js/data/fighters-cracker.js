/* DS Fighters — CRACKER, "O Hacker".
   Arte do dono (Pitoco-pet/.../Craker-personagem/): cabelo verde, oculos,
   roupa preta com detalhes verdes, tenis e um laptop de tela verde na mao.
   Zoner/rush hibrido tematico de invasao: pacote que envenena, exploit que
   expoe (vuln), dash de invasao intangivel, chuva de requisicoes (DDoS) e
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
      theme: 'cracker: invasao hacker — pacote venenoso, exploit (vuln), dash intangivel, chuva de requisicoes (DDoS) e ult rootkit (lock + glitch)',
      powers: [
        Object.assign({
          id: 'pacote-suspeito', name: 'Pacote Suspeito', slot: 'simple', row: 0,
          kind: 'shot', dmg: 9, speed: 11, cd: 50, sfx: 'magic',
          fx: { poison: 140, slow: 60 },
          desc: 'Projétil verde de dados: 9 de dano + VENENO (~2,3s) + LENTO.',
        }, visual(0, '#39FF6A')),
        Object.assign({
          id: 'exploit', name: 'Exploit', slot: 'simple', row: 1,
          kind: 'blast', at: 'target', dmg: 15, stun: 30, radius: 180, cd: 95, sfx: 'heavy',
          fx: { vuln: 150, glitch: 80 },
          desc: 'Quebra a defesa do alvo: 15 de dano + stun + VULNERÁVEL (+20% dano, 2,5s) + tela glitch.',
        }, visual(1, '#FF4B4B')),
        Object.assign({
          id: 'invasao', name: 'Invasão', slot: 'simple', row: 2,
          kind: 'dash', dmg: 12, speed: 19, phase: true, iFrames: 10, cd: 60, sfx: 'dash',
          fx: { shock: 30 },
          desc: 'Dash intangível (10f de invuln) atravessando o rival: 12 de dano + ELETRIZADO.',
        }, visual(2, '#FF6A6A')),
        Object.assign({
          id: 'ddos', name: 'Ataque DDoS', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 6, dmg: 18, cd: 120, sfx: 'hazard',
          fx: { blind: 120, slow: 140 },
          desc: 'Seis pacotes caem em cima do rival (~18 de dano): fica CEGO (~2s) + LENTO (~2,3s) pela sobrecarga.',
        }, visual(3, '#B9FF4A')),
        Object.assign({
          id: 'rootkit', name: 'Rootkit', slot: 'ultimate', row: 4,
          kind: 'rush', hits: 4, dmg: 22, teleport: true, cd: 150, sfx: 'ultimate',
          fx: { lock: 130, glitch: 160, vuln: 200 },
          desc: 'Sequência de 4 golpes de laptop que atravessa a tela: rival fica SEM PODERES (~2,2s) + TRAVAMENTO + VULNERÁVEL (3,3s).',
        }, visual(4, '#7DFFB0')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#39FF6A' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'MALWARE',
      desc: 'Hacker de invasão: pacote venenoso, exploit que deixa vulnerável, dash intangível, chuva de pacotes (cego + lento) e a ult rootkit que trava os poderes do rival (lock) com glitch na tela.',
      basic: {},
      ability: {},
    },
  });
})();
