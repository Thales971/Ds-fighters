/* DS Fighters — STELLA, a Maga do Front-end (nov/2026). Arte do dono
   (arte-fonte/personagens/Maga Front *.jpg): maria-chiquinhas douradas,
   tiara, laço vermelho e varinha de estrela. poses ->
   tools/integrate_fighter.py stella; poderes -> tools/build_stella_fx.py.
   Zoner fofa e chata: lua que corta, chuva de estrelas, coracoes que curam,
   anel que puxa o rival e a ult exclusiva HOT RELOAD que recarrega TUDO. */
(() => {
  const id = 'stella';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v73-stella-franja';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: { skipRaised: true },
    /* ko deitada e o chute no ar sobem um membro no eixo da cabeça:
       o chapéu ia parar no pé. Nas outras poses a cabeça medida segura o acessório. */
    accHide: ['ko', 'jkick'],
  });
  const visual = (row, color) => ({ visualSheet: id, visualRow: row, impactSheets: ['stella-extra'], impactColor: color });

  FIGHTERS.push({
    id,
    name: 'STELLA',
    title: 'A Maga do Front-end',
    bio: 'Transforma qualquer layout quebrado numa obra de arte com um giro da varinha. Centraliza div na primeira tentativa, joga a lua do CSS em quem atrapalha e, quando o deploy aperta, faz um HOT RELOAD e volta com tudo carregado.',
    colors: { skin: '#FCE3D0', hair: '#F2C24A', shirt: '#F6F6FA', pants: '#4A7BE0', shoes: '#C4161C', accent: '#FFD23A' },
    traits: { twinTails: true, tiara: true, wand: true },
    stats: { power: 1.08, speed: 1.15, weight: 0.88, hp: 150, meterRate: 1.3 },
    secret: false,
    quotes: {
      intro: ['Vou centralizar você... no chão!', 'Pelo poder do CSS!'],
      win: ['Pixel perfect!', 'display: vitoria;'],
      lose: ['O layout... quebrou...', 'Esqueci o !important...'],
      taunt: ['Seu z-index é baixo demais.'],
      special: ['LUA DO CSS!', 'CHUVA DE ESTRELAS!', 'CORAÇÕES DE CRISTAL!', 'ANEL HIPNÓTICO!'],
      super: ['HOT RELOAD!!'],
    },
    moves: {
      punch: { dmg: 7, range: 64, startup: 5, active: 4, recovery: 9 },
      kick: { dmg: 11, range: 70, startup: 8, active: 5, recovery: 11 },
    },
    special: { name: 'Lua do CSS', type: 'projectile', cost: 25, proj: { row: 0, speed: 12, dmg: 10, w: 28, h: 28, color: '#7DF0FF', shape: 'orb', visualSheet: id, visualRow: 0 } },
    super: { name: 'Hot Reload', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'arcano',
      theme: 'front-end: lua do CSS, chuva de estrelas, coracoes que curam, anel que puxa e o hot reload',
      powers: [
        Object.assign({ id: 'lua-css', name: 'Lua do CSS', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 12, cd: 48, sfx: 'magic', fx: { chill: 120, slow: 50 },
          desc: 'Meia-lua de cristal: CONGELANDO + LENTO.' }, visual(0, '#7DF0FF')),
        Object.assign({ id: 'chuva-estrelas', name: 'Chuva de Estrelas', slot: 'simple', row: 1, kind: 'rain', count: 5, dmg: 14, cd: 70, sfx: 'magic', fx: { vuln: 90 },
          desc: '5 estrelas caem do céu em cima do rival: VULNERÁVEL.' }, visual(1, '#FFB347')),
        Object.assign({ id: 'coracoes-cristal', name: 'Corações de Cristal', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 240, heal: 18, regen: 0.04, invuln: 30, cd: 110, sfx: 'shield',
          desc: 'Corações dourados a envolvem: cura na hora, regenera por 4s e fica intocável por meio segundo.' }, visual(2, '#FFE14D')),
        Object.assign({ id: 'anel-hipnotico', name: 'Anel Hipnótico', slot: 'charge', meter: 1, row: 3, kind: 'pull', range: 420, dmg: 10, stun: 40, cd: 90, sfx: 'magic', fx: { dizzy: 40 },
          desc: 'Anéis de luz PUXAM o rival pra perto dela e deixam TONTO.' }, visual(3, '#D79BFF')),
        Object.assign({ id: 'hot-reload', name: 'Hot Reload', slot: 'ultimate', row: 4, kind: 'hotreload', dmg: 24, cd: 150, sfx: 'ultimate',
          desc: 'EXCLUSIVA: um círculo estelar explode no rival e a Stella RECARREGA TUDO — poderes simples prontos e as duas barras de carga cheias na hora.' }, visual(4, '#FFD23A')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#FFD23A' } });
  Object.assign(SIGNATURES, { [id]: { trait: 'PIXEL PERFECT', desc: 'Lua que congela, estrelas do céu, corações que curam, anel que puxa e a ult que recarrega todos os poderes.', basic: {}, ability: {} } });
})();
