/* ============================================================
   DS FIGHTERS — V7: Winx.EXE, Kimi, DeepSeek e Dandara Query.
   Extensão isolada; carregada depois de V6. O efeito glitch é curto,
   temporário e com teto no motor, sem congelar a simulação.
   ============================================================ */
Object.assign(POWERS, {
  'winx-exe': {
    element: 'winx',
    theme: 'interferência de interface, janelas e falhas de sistema',
    powers: [
      { id: 'kernel-ping', name: 'Kernel Ping', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 11, stun: 18, cd: 40, fx: { glitch: 80, meterSlow: 45 }, sfx: 'neon', desc: 'Disparo ciano que provoca um microtravamento e atrasa o medidor.' },
      { id: 'pixel-shift', name: 'Pixel Shift', slot: 'simple', row: 1, kind: 'dash', dmg: 14, speed: 15, stun: 22, cd: 48, fx: { glitch: 90, slow: 55 }, sfx: 'dash', desc: 'Avanço de pixels que cruza a guarda e causa falhas breves.' },
      { id: 'window-stack', name: 'Window Stack', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 12, dmg: 19, stun: 28, launch: -7, cd: 72, fx: { glitch: 105 }, sfx: 'explosion', desc: 'Uma pilha de janelas cai sobre a posição atual do rival.' },
      { id: 'cursor-sweep', name: 'Cursor Sweep', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 150, dmg: 0.1, slow: 55, cd: 88, fx: { glitch: 75, meterSlow: 65 }, sfx: 'neon', desc: 'Área digital que atrasa os comandos e reduz a velocidade por pouco tempo.' },
      { id: 'task-manager', name: 'Task Manager', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 8, count: 6, homing: 0.45, stun: 22, finisher: 20, cd: 120, fx: { glitch: 125, lock: 35 }, sfx: 'ultimate', desc: 'Rajada de janelas ciano; a falha de controles é curta e tem duração máxima.' },
    ],
  },
  'dandara-query': {
    element: 'database',
    theme: 'consultas, transações seguras e precisão de banco de dados',
    powers: [
      { id: 'select-query', name: 'SELECT Rápido', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 10, stun: 16, cd: 42, fx: { meterSlow: 50 }, sfx: 'whoosh', desc: 'Uma consulta precisa marca o rival e reduz o ganho de medidor.' },
      { id: 'join-step', name: 'JOIN de Aço', slot: 'simple', row: 1, kind: 'dash', dmg: 14, speed: 14, stun: 21, cd: 50, fx: { vuln: 55 }, sfx: 'dash', desc: 'Entra na distância de golpe com um avanço calculado.' },
      { id: 'table-master', name: 'Tabela Mestra', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 14, dmg: 18, stun: 27, launch: -6, cd: 74, fx: { vuln: 65, meterSlow: 50 }, sfx: 'explosion', desc: 'Coluna de dados que revela a abertura do adversário.' },
      { id: 'transaction', name: 'Transação Segura', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 156, dmg: 0.08, slow: 58, cd: 88, fx: { slow: 65, vuln: 45 }, sfx: 'metal', desc: 'Zona breve de controle que cobra caro por ficar parada.' },
      { id: 'full-backup', name: 'Backup Total', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 8, count: 6, homing: 0.4, stun: 22, finisher: 19, cd: 120, fx: { vuln: 95, meterSlow: 80 }, sfx: 'ultimate', desc: 'Uma sequência ordenada de consultas termina com um backup explosivo.' },
    ],
  },
});

Object.assign(ELEMENT_FX, {
  winx: { sheet: 'neon', color: '#48dfff' },
  database: { sheet: 'metal', color: '#58d08b' },
});

Object.assign(SIGNATURES, {
  'winx-exe': { trait: 'INTERFERÊNCIA', desc: 'Habilidades aplicam um travamento visual e uma falha curta de comandos, sempre com limite de duração.', basic: { glitch: 12 }, ability: { glitch: 55, meterSlow: 28 } },
  'dandara-query': { trait: 'QUERY PRECISA', desc: 'Acertos calculados reduzem o ganho de medidor e abrem vulnerabilidades breves.', basic: { meterSlow: 16 }, ability: { vuln: 28, meterSlow: 24 } },
});

FIGHTERS.push(
  {
    id: 'winx-exe', name: 'WINX.EXE', title: 'A Guardiã do Desktop',
    bio: 'Lutadora anime original de interface ciano e azul: abre janelas de energia e causa pequenas falhas temporárias no controle.',
    colors: { skin: '#e9bba2', hair: '#1765d9', shirt: '#12264d', pants: '#18264a', shoes: '#172d51', accent: '#48dfff' },
    traits: { desktopWindow: true, digital: true },
    stats: { power: 1.38, speed: 1.12, weight: 0.98, hp: 138, meterRate: 1.28 },
    secret: true,
    quotes: { intro: ['Desktop carregado!', 'Janela de batalha aberta.'], win: ['Sistema estável: vitória.', 'Você caiu fora da janela.'], special: ['KERNEL PING!', 'PIXEL SHIFT!', 'WINDOW STACK!'], super: ['TASK MANAGER!!'] },
    moves: { punch: { dmg: 6, range: 50, startup: 4, active: 4, recovery: 9 }, kick: { dmg: 9, range: 64, startup: 7, active: 4, recovery: 11 } },
    special: { name: 'Kernel Ping', type: 'projectile', cost: 25, proj: { speed: 11, dmg: 10, w: 24, h: 18, color: '#48dfff', shape: 'bolt' } },
    super: { name: 'Task Manager', type: 'multi-projectile', dmg: 8, count: 6 },
  },
  {
    id: 'dandara-query', name: 'DANDARA QUERY', title: 'A Guardiã dos Dados',
    bio: 'Mulher adulta do interior serrano do RJ, dreads presos, bota e roupa de trabalho; especialista em banco de dados e consultas precisas.',
    colors: { skin: '#a95f38', hair: '#23170f', shirt: '#22553b', pants: '#334458', shoes: '#4c3c31', accent: '#58d08b' },
    traits: { dreadlocks: true, databaseSpecialist: true },
    stats: { power: 1.15, speed: 1.02, weight: 1.04, hp: 130, meterRate: 1.16 },
    secret: false,
    quotes: { intro: ['Consulta preparada.', 'Aqui é direto da serra.'], win: ['Dados íntegros.', 'Query encerrada.'], special: ['SELECT RÁPIDO!', 'JOIN DE AÇO!'], super: ['BACKUP TOTAL!!'] },
    moves: { punch: { dmg: 6, range: 51, startup: 5, active: 4, recovery: 10 }, kick: { dmg: 9, range: 66, startup: 7, active: 4, recovery: 12 } },
    special: { name: 'SELECT Rápido', type: 'projectile', cost: 25, proj: { speed: 10, dmg: 10, w: 24, h: 18, color: '#58d08b', shape: 'bolt' } },
    super: { name: 'Backup Total', type: 'multi-projectile', dmg: 8, count: 6 },
  },
);
