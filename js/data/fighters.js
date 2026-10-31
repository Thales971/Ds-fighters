/* ============================================================
   DS FIGHTERS — Os 12 lutadores (tema: desenvolvimento de sistemas)
   Cada lutador define paleta, traços físicos (para o sprite
   procedural), atributos, golpes, special e super, além de falas.
   ============================================================ */

const FIGHTERS = [
  {
    id: 'du',
    name: 'DU',
    title: 'O Deus do Código (estilo Kratos)',
    bio: 'Careca, barba enorme e óculos. A fúria dele compila em runtime.',
    colors: { skin: '#d9a066', hair: '#3a2a1a', shirt: '#7a1f1f', pants: '#4a3524', shoes: '#2a1c10', accent: '#ffd27d' },
    traits: { bald: true, beard: 'full', glasses: 'square', muscular: true, scar: true },
    stats: { power: 1.25, speed: 0.9, weight: 1.2 },
    quotes: {
      intro: ['BOY... digo... código. Vamos nessa.', 'A barba cresce. A fúria compila.'],
      win: ['Meu código é impecável, garoto.', 'Você foi depreciado.'],
      special: ['LÂMINA DO CAOS!', 'SENTirá a fúria do build!'],
      super: ['FÚRIA DO DEUS DO CÓDIGO!!'],
    },
    moves: {
      punch: { dmg: 6, range: 52, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 64, startup: 8, active: 4, recovery: 14 },
    },
    special: {
      name: 'Lâmina do Caos', type: 'projectile', cost: 25,
      proj: { speed: 9, dmg: 12, w: 26, h: 20, color: '#ff5030', shape: 'axe', pierce: false },
    },
    super: {
      name: 'Fúria do Deus do Código', type: 'melee-rush', dmg: 26, hits: 4,
    },
  },
  {
    id: 'iales',
    name: 'IALES',
    title: 'All For One do Desenvolvimento',
    bio: 'Rouba e acumula poderes de outros devs. Cada special é um poder diferente.',
    colors: { skin: '#e8c39e', hair: '#111111', shirt: '#1a1a22', pants: '#101018', shoes: '#000', accent: '#b26bff' },
    traits: { hairStyle: 'slick', suit: true, tubes: true, multipleEyes: true },
    stats: { power: 1.05, speed: 1.0, weight: 1.0 },
    quotes: {
      intro: ['Todos os seus poderes... são meus agora.', 'Eu coleciono habilidades como coleciono bugs.'],
      win: ['Mais um poder para a minha coleção.', 'Seu talento foi... roubado.'],
      special: ['PODER ROUBADO!', 'ISSO AQUI ERA SEU!', 'DEIXE-ME USAR ISSO!'],
      super: ['ALL FOR ONE — TODOS OS PODERES!'],
    },
    moves: {
      punch: { dmg: 5, range: 50, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 8, range: 62, startup: 8, active: 4, recovery: 13 },
    },
    special: {
      name: 'Poder Roubado', type: 'cycle-projectile', cost: 20,
      cycle: [
        { label: 'FIREWALL', speed: 8, dmg: 10, w: 22, h: 22, color: '#ff7b1c', shape: 'fire' },
        { label: 'RAIO DE DEPLOY', speed: 13, dmg: 12, w: 10, h: 30, color: '#ffe14d', shape: 'bolt' },
        { label: 'DDoS', speed: 6, dmg: 8, w: 26, h: 26, color: '#7dff5e', shape: 'orb', multi: 3 },
        { label: 'VOID NULL', speed: 10, dmg: 14, w: 24, h: 24, color: '#b26bff', shape: 'void' },
      ],
    },
    super: {
      name: 'ALL FOR ONE', type: 'multi-projectile', dmg: 8, count: 8,
    },
  },
  {
    id: 'felipinho',
    name: 'FELIPINHO',
    title: 'O Nerd do GTA (estilo San Andreas)',
    bio: 'Aparência de nerd, mas luta e fala como personagem de GTA. Mods é com ele.',
    colors: { skin: '#c98e5f', hair: '#2b1c10', shirt: '#3fae5a', pants: '#3a6ea8', shoes: '#f2f2f2', accent: '#ffe14d' },
    traits: { nerd: true, glasses: 'round', cap: 'backwards', chain: true },
    stats: { power: 0.95, speed: 1.15, weight: 0.9 },
    quotes: {
      intro: ['E aí, doido! Igualzinho no GTA V, tá ligado?', 'CJ approves essa luta.'],
      win: ['Wasted... não, pera, VOCÊ que tomó o wasted!', 'GG, easy. Igual no online.'],
      special: ['É O CARRO, MANO!', 'CHEAT DE CARRO ATIVADO!'],
      super: ['MODO DEUS DO GTA — CJ Mode!!'],
    },
    moves: {
      punch: { dmg: 5, range: 48, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 8, range: 60, startup: 7, active: 4, recovery: 12 },
    },
    special: {
      name: 'Carro Cheat', type: 'projectile', cost: 25,
      proj: { speed: 12, dmg: 16, w: 56, h: 26, color: '#3fae5a', shape: 'car' },
    },
    super: {
      name: 'Modo Deus (GTA)', type: 'buff-rush', dmg: 20, buff: { invincible: 1600, dmgMult: 2 },
    },
  },
  {
    id: 'stack',
    name: 'STACK OVERFLOW',
    title: 'O Oráculo Verde',
    bio: 'Sua resposta aceita cura e seu downvote derruba.',
    colors: { skin: '#eab98a', hair: '#6b4a2f', shirt: '#e8862e', pants: '#3d3d3d', shoes: '#222', accent: '#58cc02' },
    traits: { beard: 'short', glasses: 'square', robe: true },
    stats: { power: 1.0, speed: 0.95, weight: 1.0 },
    quotes: {
      intro: ['Já procurou isso? A resposta está aceita.', 'Mark my words: essa luta vai ter accepted answer.'],
      win: ['Resposta aceita. Upvote pra você... não, pera.'],
      special: ['RESPOSTA ACEITA!', 'COPIEI ESSE CÓDIGO!'],
      super: ['COPY-PASTE MASSIVO!'],
    },
    moves: {
      punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 62, startup: 8, active: 4, recovery: 13 },
    },
    special: {
      name: 'Resposta Aceita', type: 'projectile', cost: 25, heal: 6,
      proj: { speed: 8, dmg: 11, w: 30, h: 22, color: '#58cc02', shape: 'check' },
    },
    super: {
      name: 'Copy-Paste Massivo', type: 'multi-projectile', dmg: 7, count: 6,
    },
  },
  {
    id: 'gitmaster',
    name: 'GIT MASTER',
    title: 'O Ninja dos Commits',
    bio: 'Some e reaparece num piscar de olhos. Nunca deixa rastro.',
    colors: { skin: '#d9a066', hair: '#222', shirt: '#23272e', pants: '#16181d', shoes: '#f85149', accent: '#f85149' },
    traits: { hood: true, mask: true },
    stats: { power: 0.9, speed: 1.35, weight: 0.8 },
    quotes: {
      intro: ['Você não me viu chegar.', 'git commit -m "luta" --force'],
      win: ['Commitado: vitória. Push na sua cara.'],
      special: ['GIT DASH!', 'RESET --HARD NA SUA CARA!'],
      super: ['REBASE INTERATIVO!'],
    },
    moves: {
      punch: { dmg: 4, range: 46, startup: 3, active: 3, recovery: 8 },
      kick: { dmg: 7, range: 58, startup: 6, active: 3, recovery: 11 },
    },
    special: {
      name: 'Git Dash', type: 'dash-strike', cost: 20, dmg: 10, range: 120,
    },
    super: {
      name: 'Rebase Interativo', type: 'melee-rush', dmg: 24, hits: 5,
    },
  },
  {
    id: 'bughunter',
    name: 'BUG HUNTER',
    title: 'A Caçadora de Defeitos',
    bio: 'Encontra o bug antes dele existir. Sua lupa queima.',
    colors: { skin: '#f0c8a0', hair: '#ff7b1c', shirt: '#2d6cdf', pants: '#1f3a5f', shoes: '#111', accent: '#ffd700' },
    traits: { ponytail: true, visor: true, armor: true },
    stats: { power: 1.0, speed: 1.1, weight: 0.95 },
    quotes: {
      intro: ['Achamos o bug. E o bug é você.', 'Não é bug, é feature... da minha vitória.'],
      win: ['Bug corrigido: você. Status: derrotado.'],
      special: ['BUG REPORT!', 'REPRODUÇÃO 100%!'],
      super: ['HOTFIX EM ÁREA!'],
    },
    moves: {
      punch: { dmg: 5, range: 50, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 8, range: 60, startup: 7, active: 4, recovery: 12 },
    },
    special: {
      name: 'Bug Report', type: 'projectile', cost: 25, stun: 600,
      proj: { speed: 10, dmg: 9, w: 22, h: 22, color: '#ffd700', shape: 'bug' },
    },
    super: {
      name: 'Hotfix em Área', type: 'aoe', dmg: 22, radius: 220,
    },
  },
  {
    id: 'frontend',
    name: 'FRONT DEV',
    title: 'A Estilista do CSS',
    bio: 'Pinta a tela de gradientes e joga caixas de layout no inimigo.',
    colors: { skin: '#f2c9a0', hair: '#ff4fa3', shirt: '#7b61ff', pants: '#2b2b3a', shoes: '#fff', accent: '#00e0ff' },
    traits: { hairStyle: 'long', glasses: 'round', stylish: true },
    stats: { power: 0.9, speed: 1.1, weight: 0.85 },
    quotes: {
      intro: [' Essa luta vai ficar LINDA. Like e share!', 'centralizado com flexbox, pô!'],
      win: ['#vitória { display: block; }'],
      special: ['GRADIENTE ANIMADO!', 'BOX-SHADOW NO OLHO!'],
      super: ['CSS ULTRA INSTINCT!'],
    },
    moves: {
      punch: { dmg: 5, range: 48, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 7, range: 58, startup: 7, active: 4, recovery: 11 },
    },
    special: {
      name: 'Caixa de Layout', type: 'projectile', cost: 25,
      proj: { speed: 7, dmg: 10, w: 30, h: 30, color: '#00e0ff', shape: 'box', rotate: true },
    },
    super: {
      name: 'CSS Ultra Instinct', type: 'multi-projectile', dmg: 6, count: 7,
    },
  },
  {
    id: 'backend',
    name: 'BACK DEV',
    title: 'O Servidor de Aço',
    bio: 'Musculoso, mora no servidor. Um erro 500 seu e acabou.',
    colors: { skin: '#b5793f', hair: '#151515', shirt: '#20242b', pants: '#101216', shoes: '#000', accent: '#ff3b30' },
    traits: { muscular: true, beard: 'full', tank: true },
    stats: { power: 1.3, speed: 0.8, weight: 1.3 },
    quotes: {
      intro: ['Bem-vindo ao servidor. Check-in: agora. Check-out: nunca.', 'Meu backend aguenta 1 milhão de requisições... e 1 milhão de socos.'],
      win: ['HTTP 200: você foi processado.'],
      special: ['500 INTERNAL SERVER ERROR!', 'SOBRECARGA NO SERVIDOR!'],
      super: ['DDoS DE SOCOS!'],
    },
    moves: {
      punch: { dmg: 8, range: 52, startup: 6, active: 4, recovery: 12 },
      kick: { dmg: 11, range: 64, startup: 9, active: 4, recovery: 15 },
    },
    special: {
      name: 'Erro 500', type: 'projectile', cost: 25,
      proj: { speed: 6, dmg: 14, w: 36, h: 26, color: '#ff3b30', shape: 'server', heavy: true },
    },
    super: {
      name: 'DDoS de Socos', type: 'melee-rush', dmg: 28, hits: 3,
    },
  },
  {
    id: 'devops',
    name: 'DEVOPS',
    title: 'O Mestre do Pipeline',
    bio: 'Tudo automatizado: até a surra. CI/CD de socos.',
    colors: { skin: '#e0b090', hair: '#4a3a2a', shirt: '#0e7a5f', pants: '#23303a', shoes: '#f5c542', accent: '#f5c542' },
    traits: { helmet: true, vest: true },
    stats: { power: 1.0, speed: 1.05, weight: 1.0 },
    quotes: {
      intro: ['Pipeline iniciado: build, test, deploy... de soco.', 'Se quebrou o build, eu quebro você.'],
      win: ['Deploy em produção: vitória. Zero downtime.'],
      special: ['PIPELINE DE SOCOS!', 'BUILD PASSOU!'],
      super: ['DEPLOY CONTÍNUO!'],
    },
    moves: {
      punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 8, range: 62, startup: 8, active: 4, recovery: 13 },
    },
    special: {
      name: 'Pipeline', type: 'projectile', cost: 25, multiHit: 3,
      proj: { speed: 9, dmg: 5, w: 24, h: 24, color: '#f5c542', shape: 'gear', multiHit: 3 },
    },
    super: {
      name: 'Deploy Contínuo', type: 'multi-projectile', dmg: 6, count: 9,
    },
  },
  {
    id: 'qa',
    name: 'QA TESTER',
    title: 'O Fiscal de Qualidade',
    bio: 'Testa tudo. Se falhar o teste, leva stun longo.',
    colors: { skin: '#f0c8a0', hair: '#5a3a1a', shirt: '#ffffff', pants: '#37474f', shoes: '#263238', accent: '#e53935' },
    traits: { clipboard: true, vest: true, hairStyle: 'bun' },
    stats: { power: 0.95, speed: 1.0, weight: 1.0 },
    quotes: {
      intro: ['Vou rodar o teste... em você.', 'Critério de aceite: você derrotado.'],
      win: ['Teste aprovado: minha vitória. Bug seu: derrota.'],
      special: ['TESTE FALHOU!', 'REPRODUZINDO O KO!'],
      super: ['SUÍTE DE TESTES COMPLETA!'],
    },
    moves: {
      punch: { dmg: 5, range: 48, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 8, range: 60, startup: 7, active: 4, recovery: 12 },
    },
    special: {
      name: 'Teste Falhou', type: 'projectile', cost: 25, stun: 900,
      proj: { speed: 8, dmg: 8, w: 26, h: 26, color: '#e53935', shape: 'clipboard' },
    },
    super: {
      name: 'Suíte de Testes', type: 'aoe', dmg: 24, radius: 200,
    },
  },
  {
    id: 'scrum',
    name: 'SCRUM MASTER',
    title: 'O Facilitador Ágil',
    bio: 'Daily de 15 minutos... de porrada. E ainda cura um pouco.',
    colors: { skin: '#d9a066', hair: '#2f2f2f', shirt: '#4054b2', pants: '#2e3440', shoes: '#1c1f26', accent: '#a3be8c' },
    traits: { suit: true, glasses: 'square', beard: 'short' },
    stats: { power: 0.9, speed: 1.1, weight: 0.9 },
    quotes: {
      intro: ['Daily rápido: 3 rounds. Impedimentos? Nenhum.', 'Vamos fazer essa sprint até o KO.'],
      win: ['Sprint completa. Retrospectiva: você perdeu feio.'],
      special: ['DAILY STANDUP!', 'BLOQUEIO REMOVIDO!'],
      super: ['PLANNING POKER!'],
    },
    moves: {
      punch: { dmg: 5, range: 48, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 7, range: 58, startup: 7, active: 4, recovery: 11 },
    },
    special: {
      name: 'Daily Standup', type: 'heal-strike', cost: 30, heal: 12, dmg: 8, range: 90,
    },
    super: {
      name: 'Planning Poker', type: 'aoe', dmg: 20, radius: 240, heal: 8,
    },
  },
  {
    id: 'fullstack',
    name: 'FULLSTACK',
    title: 'O Que Faz Tudo',
    bio: 'Front, back, banco, deploy... e ainda sobra soco.',
    colors: { skin: '#e8b98f', hair: '#3b2a1a', shirt: '#6d28d9', pants: '#1f2937', shoes: '#e5e7eb', accent: '#22d3ee' },
    traits: { hoodie: true, glasses: 'square', beard: 'short' },
    stats: { power: 1.0, speed: 1.0, weight: 1.0 },
    quotes: {
      intro: ['Eu faço o front, o back... e o KO.', 'É fullstack: até a derrota é completa.'],
      win: ['Deploy completo: frontend, backend e vitória.'],
      special: ['DEPLOY SIMULTÂNEO!', 'FRONT + BACK + SOCO!'],
      super: ['MONOLITO PERFEITO!'],
    },
    moves: {
      punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 62, startup: 8, active: 4, recovery: 13 },
    },
    special: {
      name: 'Deploy Simultâneo', type: 'projectile', cost: 25,
      proj: { speed: 8, dmg: 9, w: 24, h: 24, color: '#22d3ee', shape: 'layers', multi: 3 },
    },
    super: {
      name: 'Monolito Perfeito', type: 'multi-projectile', dmg: 7, count: 8,
    },
  },
  {
    id: 'senpai',
    name: 'SENPAI DO SENAI',
    title: 'O Professor Lendário',
    bio: 'Ensina, corrige e dá aula de luta. A apostila dele é pesada.',
    colors: { skin: '#d9a066', hair: '#555', shirt: '#1d4ed8', pants: '#334155', shoes: '#111827', accent: '#facc15' },
    traits: { glasses: 'square', beard: 'short', cardigan: true, chalk: true },
    stats: { power: 1.1, speed: 0.95, weight: 1.05 },
    quotes: {
      intro: ['Abrem a apostila, página 42: capítulo de luta.', 'Quem não fez a lição, vai tomar lição de soco.'],
      win: ['Nota 10 na prova de vida. Studio:_derrota.'],
      special: ['APOSTILA PESADA!', 'EXERCÍCIO DE FIXAÇÃO!'],
      super: ['PROVA FINAL!'],
    },
    moves: {
      punch: { dmg: 6, range: 54, startup: 5, active: 4, recovery: 10 },
      kick: { dmg: 9, range: 64, startup: 8, active: 4, recovery: 13 },
    },
    special: {
      name: 'Apostila Pesada', type: 'projectile', cost: 25,
      proj: { speed: 7, dmg: 13, w: 34, h: 26, color: '#facc15', shape: 'book', heavy: true },
    },
    super: {
      name: 'Prova Final', type: 'melee-rush', dmg: 25, hits: 4,
    },
  },
];
