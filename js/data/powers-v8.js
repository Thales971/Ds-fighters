/*
 * DS Fighters V8 — correção autoral da Winx.EXE e Nina Vector/Kestrel-09.
 * Cada golpe leva visualSheet/visualRow, usado pela HUD, pelo Canvas e pelo online.
 */
(() => {
  const winx = FIGHTERS.find((f) => f.id === 'winx-exe');
  if (winx) {
    winx.bio = 'Guardiã de janelas digitais: projeta pulsos, cortes de pixel e impactos próprios, sem depender de efeitos genéricos.';
    winx.moves = {
      punch: { dmg: 6, range: 50, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 9, range: 64, startup: 7, active: 4, recovery: 11 },
    };
    winx.special = {
      name: 'Kernel Ping', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 11, dmg: 10, w: 24, h: 20, color: '#43e4ff', shape: 'orb', visualSheet: 'winx-exe', visualRow: 0 },
    };
    winx.super = { name: 'Task Manager', type: 'multi-projectile', dmg: 7, count: 5, visualSheet: 'winx-exe', visualRow: 4 };
    winx.quotes = {
      intro: ['Desktop carregado.'], win: ['Sistema estável: vitória.'],
      special: ['KERNEL PING!', 'PIXEL SHIFT!', 'WINDOW STACK!'], super: ['TASK MANAGER!'],
    };
  }

  const winxVisual = (row) => ({ visualSheet: 'winx-exe', visualRow: row, impactSheets: [], impactColor: '#45e6ff' });
  Object.assign(POWERS, {
    'winx-exe': {
      element: 'winx', theme: 'janelas de energia, traços de pixel e cortes de sistema',
      powers: [
        Object.assign({ id: 'kernel-ping', name: 'Kernel Ping', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 11, stun: 17, cd: 42, fx: { glitch: 84, meterSlow: 36 }, sfx: 'neon', desc: 'Um pulso de pixel ciano que explode no contato e causa microtravamento.' }, winxVisual(0)),
        Object.assign({ id: 'pixel-shift', name: 'Pixel Shift', slot: 'simple', row: 1, kind: 'dash', dmg: 13, speed: 14, stun: 20, cd: 50, phase: true, iFrames: 7, fx: { glitch: 78, slow: 42 }, sfx: 'dash', desc: 'A Winx corta a arena em um rastro de fragmentos ciano e magenta.' }, winxVisual(1)),
        Object.assign({ id: 'window-stack', name: 'Window Stack', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 15, dmg: 18, stun: 27, launch: -7, cd: 74, fx: { glitch: 92 }, sfx: 'explosion', desc: 'Painéis translúcidos empilham-se e caem sobre a posição do adversário.' }, winxVisual(2)),
        Object.assign({ id: 'cursor-sweep', name: 'Cursor Sweep', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 132, dmg: 0.08, slow: 46, cd: 90, fx: { glitch: 72, meterSlow: 46 }, sfx: 'neon', desc: 'Um arco de seleção digital varre o chão e embaralha comandos brevemente.' }, winxVisual(3)),
        Object.assign({ id: 'task-manager', name: 'Task Manager', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 7, count: 5, homing: 0.36, stun: 21, finisher: 18, cd: 122, fx: { glitch: 110, lock: 24 }, sfx: 'ultimate', desc: 'Cinco janelas convergem numa descarga ciano-magenta; o breve travamento expira rápido.' }, winxVisual(4)),
      ],
    },
    'nina-vector': {
      element: 'mecha', theme: 'piloto e guardião mecânico Kestrel-09',
      powers: [
        { id: 'servo-jab', name: 'Servo Jab', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 11, stun: 16, cd: 40, sfx: 'metal', desc: 'Um punho articulado avança em linha curta, com impacto teal e âmbar.', visualSheet: 'nina-vector', visualRow: 0, impactSheets: [], impactColor: '#53ddc9' },
        { id: 'railstep', name: 'Railstep', slot: 'simple', row: 1, kind: 'dash', dmg: 13, speed: 14, stun: 20, cd: 48, phase: true, iFrames: 6, sfx: 'dash', desc: 'Nina avança enquanto o Kestrel impulsiona a trilha dos propulsores.', visualSheet: 'nina-vector', visualRow: 1, impactSheets: [], impactColor: '#e99a43' },
        { id: 'kestrel-spear', name: 'Kestrel Spear', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 16, dmg: 17, stun: 26, launch: -7, cd: 74, sfx: 'explosion', desc: 'Uma estocada sincronizada do braço mecânico atinge a posição marcada.', visualSheet: 'nina-vector', visualRow: 2, impactSheets: [], impactColor: '#e3af52' },
        { id: 'lock-on-grid', name: 'Lock-on Grid', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 126, dmg: 0.08, slow: 42, cd: 88, fx: { meterSlow: 36 }, sfx: 'metal', desc: 'O visor do Kestrel desenha uma grade curta que limita a mobilidade.', visualSheet: 'nina-vector', visualRow: 3, impactSheets: [], impactColor: '#52d9c1' },
        { id: 'full-synchrony', name: 'Full Synchrony', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 7, count: 5, homing: 0.32, stun: 21, finisher: 19, cd: 122, sfx: 'ultimate', desc: 'Nina e Kestrel-09 sincronizam cinco disparos e um golpe final.', visualSheet: 'nina-vector', visualRow: 4, impactSheets: [], impactColor: '#e8a447' },
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    winx: { sheet: 'ai-symbols', color: '#45e6ff' },
    mecha: { sheet: 'metal', color: '#53ddc9' },
  });
  Object.assign(SIGNATURES, {
    'nina-vector': { trait: 'LINK KESTREL-09', desc: 'Piloto e guardião mecânico atacam juntos; efeitos de combate têm arte própria.' },
  });

  FIGHTERS.push({
    id: 'nina-vector', name: 'NINA VECTOR', title: 'Pilota do Kestrel-09',
    bio: 'Lutadora adulta de cabelo curto e óculos, sincronizada com seu guardião biomecânico original Kestrel-09.',
    colors: { skin: '#a76847', hair: '#174751', shirt: '#e9e6dc', pants: '#29313c', shoes: '#283441', accent: '#4ed7c2' },
    traits: { glasses: 'round', pilot: true, mechaCompanion: 'kestrel-09' },
    stats: { power: 1.08, speed: 1.05, weight: 1.06, hp: 120, meterRate: 1.08 },
    secret: false,
    quotes: { intro: ['Kestrel, em formação.'], win: ['Vínculo estável.'], special: ['SERVO JAB!', 'RAILSTEP!'], super: ['FULL SYNCHRONY!'] },
    moves: { punch: { dmg: 6, range: 50, startup: 4, active: 4, recovery: 9 }, kick: { dmg: 8, range: 62, startup: 6, active: 4, recovery: 11 } },
    special: { name: 'Servo Jab', type: 'projectile', cost: 25, proj: { row: 0, speed: 11, dmg: 9, w: 24, h: 20, color: '#53ddc9', shape: 'fist', visualSheet: 'nina-vector', visualRow: 0 } },
    super: { name: 'Full Synchrony', type: 'multi-projectile', dmg: 7, count: 5, visualSheet: 'nina-vector', visualRow: 4 },
  });
})();
