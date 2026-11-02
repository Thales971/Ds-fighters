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
  kimi: {
    element: 'kimi',
    theme: 'ondas suaves, fitas d’água e passos ágeis',
    powers: [
      { id: 'aqua-palm', name: 'Palma Turquesa', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 10, stun: 15, cd: 38, fx: { chill: 45 }, sfx: 'water', desc: 'Uma esfera rasa de água que desacelera o avanço.' },
      { id: 'tidal-step', name: 'Passo da Maré', slot: 'simple', row: 1, kind: 'dash', dmg: 13, speed: 15, stun: 20, cd: 46, fx: { slow: 65 }, sfx: 'dash', desc: 'Investida curta acompanhada por uma fita de água.' },
      { id: 'moon-spray', name: 'Chuva de Orvalho', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 14, dmg: 17, stun: 26, launch: -6, cd: 68, fx: { chill: 85, slow: 50 }, sfx: 'water', desc: 'Uma coluna de gotas sobe sob o oponente.' },
      { id: 'ribbon-current', name: 'Corrente de Fita', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 150, dmg: 0.09, slow: 70, cd: 84, fx: { chill: 55 }, sfx: 'water', desc: 'Faixa escorregadia que dificulta a aproximação.' },
      { id: 'sea-of-calm', name: 'Mar Sereno', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 34, stun: 42, launch: -8, radius: 220, cd: 118, fx: { chill: 100, vuln: 65 }, sfx: 'ultimate', desc: 'Onda circular forte, seguida por um breve choque de frio.' },
    ],
  },
  deepseek: {
    element: 'deepseek',
    theme: 'exploração abissal e golpes com cauda de baleia',
    powers: [
      { id: 'bubble-probe', name: 'Sonda de Bolhas', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 9, stun: 16, cd: 42, fx: { slow: 55 }, sfx: 'water', desc: 'Bolhas profundas que perseguem um pouco o rival.' },
      { id: 'fluke-sweep', name: 'Rabo da Baleia', slot: 'simple', row: 1, kind: 'dash', dmg: 16, speed: 13, stun: 24, cd: 52, fx: { chill: 55 }, sfx: 'heavy', desc: 'Uma varrida de cauda pesada, com alcance curto.' },
      { id: 'whale-rise', name: 'Ascensão Abissal', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 15, dmg: 18, stun: 29, launch: -9, cd: 76, fx: { chill: 75 }, sfx: 'explosion', desc: 'Um jato do fundo do mar ergue o alvo.' },
      { id: 'undertow', name: 'Corrente de Retorno', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 144, dmg: 0.1, slow: 62, cd: 86, fx: { chill: 65, slow: 60 }, sfx: 'water', desc: 'Corrente local que puxa o ritmo do oponente para baixo.' },
      { id: 'whale-song', name: 'Canto das Profundezas', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 8, count: 6, homing: 0.35, stun: 24, finisher: 22, cd: 122, fx: { chill: 85, vuln: 55 }, sfx: 'ultimate', desc: 'Pulsos sonoros em sequência, com um golpe final de cauda.' },
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
  kimi: { sheet: 'gelo', color: '#62e4d4' },
  deepseek: { sheet: 'gelo', color: '#298dff' },
  database: { sheet: 'metal', color: '#58d08b' },
});

Object.assign(SIGNATURES, {
  'winx-exe': { trait: 'INTERFERÊNCIA', desc: 'Habilidades aplicam um travamento visual e uma falha curta de comandos, sempre com limite de duração.', basic: { glitch: 12 }, ability: { glitch: 55, meterSlow: 28 } },
  kimi: { trait: 'FLUXO D’ÁGUA', desc: 'Golpes leves deixam resfriamento curto; habilidades controlam o espaço sem congelar a luta.', basic: { chill: 14 }, ability: { slow: 28 } },
  deepseek: { trait: 'CORRENTE ABISSAL', desc: 'Cauda de baleia com peso e alcance; seus pulsos esfriam o oponente.', basic: { slow: 16 }, ability: { chill: 32 } },
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
    id: 'kimi', name: 'KIMI', title: 'A Dançarina da Maré',
    bio: 'Lutadora anime adulta de cabelo verde-água, fitas de água e golpes ágeis de curto alcance.',
    colors: { skin: '#edc3a5', hair: '#47d3b4', shirt: '#e9f2df', pants: '#207e79', shoes: '#e7eee8', accent: '#62e4d4' },
    traits: { hairStyle: 'long', waterRibbon: true },
    stats: { power: 1.16, speed: 1.14, weight: 0.91, hp: 122, meterRate: 1.12 },
    secret: false,
    quotes: { intro: ['Vamos no meu ritmo.', 'A maré virou.'], win: ['Respira, acabou.', 'Fluxo perfeito.'], special: ['PALMA TURQUESA!', 'PASSO DA MARÉ!'], super: ['MAR SERENO!!'] },
    moves: { punch: { dmg: 5, range: 50, startup: 3, active: 4, recovery: 8 }, kick: { dmg: 8, range: 63, startup: 6, active: 4, recovery: 10 } },
    special: { name: 'Palma Turquesa', type: 'projectile', cost: 25, proj: { speed: 10, dmg: 9, w: 22, h: 18, color: '#62e4d4', shape: 'orb' } },
    super: { name: 'Mar Sereno', type: 'aoe', dmg: 34, radius: 220 },
  },
  {
    id: 'deepseek', name: 'DEEP SEEK', title: 'A Voz do Abismo',
    bio: 'Combatente anime aquática, cabelo azul profundo e cauda de baleia que varre o chão com peso e alcance.',
    colors: { skin: '#e9c9bd', hair: '#123c85', shirt: '#174f8d', pants: '#173a70', shoes: '#d9eef9', accent: '#298dff' },
    traits: { whaleTail: true, deepSea: true },
    stats: { power: 1.18, speed: 1.06, weight: 1.08, hp: 132, meterRate: 1.18 },
    secret: false,
    quotes: { intro: ['Descendo para o abismo.', 'A baleia ouviu você.'], win: ['O silêncio voltou.', 'Fim da exploração.'], special: ['SONDA DE BOLHAS!', 'RABO DA BALEIA!'], super: ['CANTO DAS PROFUNDEZAS!!'] },
    moves: { punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 }, kick: { dmg: 10, range: 74, startup: 8, active: 4, recovery: 13 } },
    special: { name: 'Sonda de Bolhas', type: 'projectile', cost: 25, proj: { speed: 9, dmg: 10, w: 28, h: 22, color: '#298dff', shape: 'orb', seek: true } },
    super: { name: 'Canto das Profundezas', type: 'multi-projectile', dmg: 8, count: 6 },
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
