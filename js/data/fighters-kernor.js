/* DS Fighters — KERNOR, o chefe final do torneio (nov/2026).
   Arte do dono (arte-fonte/kernor-chefe-torneio/): colosso de pedra negra com chifres,
   olho vermelho e aureola. poses -> tools/integrate_fighter.py kernor;
   poderes -> tools/build_kernor_fx.py (atlas 4x10 + extra).
   Chefe: 10 habilidades, resiste a debuffs (duram 40% menos), muita vida e
   peso. Ataques de padrao de chefe final: campo de espinhos com buracos
   seguros, leque de laminas, meteoros, orbes que perseguem e buraco negro.
   Secreto (desbloqueio por codigo), fora do online. */
(() => {
  const id = 'kernor';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v74-kernor';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: { dy: 36 }, /* a aureola e o primeiro pixel: o chapeu senta nos chifres, abaixo do anel */
    accHide: ['ko', 'jkick', 'kick'],
  });
  const visual = (row, color) => ({ visualSheet: id, visualRow: row, impactSheets: ['kernor-extra'], impactColor: color });

  FIGHTERS.push({
    id,
    name: 'KERNOR',
    title: 'O Colosso do Núcleo',
    bio: 'Dizem que ele é o processo que nunca termina: um colosso de pedra negra com uma auréola de luz e um olho vermelho que enxerga cada bug do sistema. Guarda a Fortaleza do Dev no fim do torneio. Quem chega até ele precisa aprender os padrões — ou cair.',
    colors: { skin: '#3a3a40', hair: '#1a1a1e', shirt: '#2a2a30', pants: '#222228', shoes: '#18181c', accent: '#ff2a4a' },
    traits: { horns: true, halo: true, stone: true },
    stats: { power: 3.9, speed: 1.0, weight: 1.35, hp: 500, meterRate: 1.45 }, /* top 2 do jogo: ~96% contra os normais (so o Iales acima) */
    statusResist: 0.5, /* todo status negativo dura METADE nele */
    secret: true,
    boss: true,
    quotes: {
      intro: ['PROCESSO KERNOR INICIADO.', 'Você chegou longe demais.'],
      win: ['Processo encerrado.', 'Volte quando compilar.'],
      lose: ['Impossível... um SIGKILL...', 'O núcleo... cedeu...'],
      taunt: ['Aprenda o padrão. Ou caia.'],
      special: ['OLHO DO NÚCLEO!', 'SERRA!', 'PUNHO DA TERRA!', 'MURALHA!', 'METEOROS!', 'ORBES!', 'ESPINHOS!', 'RAIO DO BUG!'],
      super: ['PÂNICO DO NÚCLEO!!', 'BURACO NEGRO!!'],
    },
    moves: {
      punch: { dmg: 10, range: 66, startup: 7, active: 5, recovery: 13 },
      kick: { dmg: 15, range: 80, startup: 10, active: 6, recovery: 16 },
    },
    special: { name: 'Olho do Núcleo', type: 'beam', cost: 25, proj: { row: 0, speed: 0, dmg: 14, w: 30, h: 20, color: '#ff2a4a', shape: 'beam', visualSheet: id, visualRow: 0 } },
    super: { name: 'Pânico do Núcleo', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'kernel',
      theme: 'chefe final: laser, serra, punho da terra, muralha, leque de lâminas, meteoros, orbes, espinhos, raio e buraco negro',
      powers: [
        Object.assign({ id: 'olho-nucleo', name: 'Olho do Núcleo', slot: 'simple', row: 0, kind: 'beam', range: 520, dmg: 12, cd: 50, sfx: 'thunder_cast', fx: { burn: 90, vuln: 60 },
          desc: 'Laser do olho vermelho pela arena: QUEIMA e deixa VULNERÁVEL.' }, visual(0, '#ff2a4a')),
        Object.assign({ id: 'disco-serra', name: 'Disco Serra', slot: 'simple', row: 1, kind: 'shot', dmg: 9, speed: 10, boomerang: true, cd: 58, sfx: 'whoosh', fx: { bleed: 120 },
          desc: 'Serra que vai e VOLTA: SANGRANDO.' }, visual(1, '#ff7ad9')),
        Object.assign({ id: 'punho-terra', name: 'Punho da Terra', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', big: true, dmg: 20, stun: 30, launch: -11, delay: 22, cd: 70, sfx: 'heavy', fx: { dizzy: 30 },
          desc: 'Um punho de pedra sai do chão embaixo do rival: LANÇA e deixa TONTO.' }, visual(2, '#c8c0b8')),
        Object.assign({ id: 'muralha-servidores', name: 'Muralha de Servidores', slot: 'charge', meter: 1, row: 3, kind: 'wall', time: 360, dmg: 12, cd: 100, sfx: 'shield',
          desc: 'Ergue uma muralha de servidores: BLOQUEIA projéteis e empurra quem estiver colado.' }, visual(3, '#ff3a3a')),
        Object.assign({ id: 'panico-nucleo', name: 'Pânico do Núcleo', slot: 'ultimate', row: 4, kind: 'kradial', dmg: 7, cd: 140, sfx: 'ultimate', fx: { lock: 60, vuln: 120 },
          desc: 'ULT: 8 lâminas de luz em leque (inclusive pra cima): SEM PODERES + VULNERÁVEL. Pule entre elas!' }, visual(4, '#ff2a4a')),
        Object.assign({ id: 'chuva-meteoros', name: 'Chuva de Meteoros', slot: 'extra', row: 5, kind: 'rain', count: 6, dmg: 18, cd: 120, sfx: 'explosion', fx: { burn: 100 },
          desc: '6 meteoros caem em cima do rival, com aviso: QUEIMANDO.' }, visual(5, '#ff6a2a')),
        Object.assign({ id: 'orbes-perseguidores', name: 'Orbes Perseguidores', slot: 'extra', row: 6, kind: 'barrage', count: 5, dmg: 3, seek: true, homing: 0.5, cd: 110, sfx: 'magic', fx: { shock: 60 },
          desc: '5 orbes de espinho que perseguem o rival: ELETRIZADO.' }, visual(6, '#ff4a6a')),
        Object.assign({ id: 'campo-espinhos', name: 'Campo de Espinhos', slot: 'extra', row: 7, kind: 'kspikes', dmg: 6, cd: 130, sfx: 'heavy', fx: { slow: 60 },
          desc: 'Espinhos brotam em fileira de uma ponta à outra, com BURACOS seguros: ache o buraco ou pule.' }, visual(7, '#d8d0d8')),
        Object.assign({ id: 'raio-do-bug', name: 'Raio do Bug', slot: 'extra', row: 8, kind: 'pillar', at: 'target', dmg: 14, stun: 24, launch: -6, delay: 26, cd: 90, sfx: 'thunder_cast', fx: { lock: 50, shock: 60 },
          desc: 'Uma mira trava no rival e o raio cai: SEM PODERES + ELETRIZADO.' }, visual(8, '#ff2a2a')),
        Object.assign({ id: 'buraco-negro', name: 'Buraco Negro', slot: 'ultimate', row: 9, kind: 'kblackhole', dmg: 22, cd: 160, sfx: 'ultimate', zoneTall: 1.35,
          desc: 'ULT 2: abre um buraco negro que PUXA o rival por ~3s (dano contínuo, LENTO, SEM PODERES) e termina numa explosão que não dá pra bloquear.' }, visual(9, '#a35bff')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, { kernel: { sheet: id, color: '#ff2a4a' }, [id]: { sheet: id, color: '#ff2a4a' } });
  Object.assign(SIGNATURES, { [id]: { trait: 'CHEFE FINAL', desc: '10 habilidades, resiste a efeitos (duram 50% menos) e ataca em padrões: espinhos com buracos, leque de lâminas, meteoros, orbes e buraco negro.', basic: {}, ability: {} } });
})();
