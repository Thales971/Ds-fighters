/* ============================================================
   DS FIGHTERS — 5 habilidades por lutador.
   Ordem fixa dos slots: [H1 simples, H2 simples, H3 carga A, H4 carga B, ULT].
   `row` = linha do spritesheet assets/abilities/<id>.png (4 quadros de 128px).
   Tipos (kind): shot, pillar, dash, aura, beam, blast, rush, rain, pull,
   steal, wall, zone, barrage. O executor genérico fica em fighter.js.
   Campos comuns: dmg, stun, poison, burn, slow, launch, heal, cd (recarga em frames).
   ============================================================ */
const SLOT_KEYS = ['H1', 'H2', 'H3', 'H4', 'ULT'];

const POWERS = {
  du: {
    element: 'magma',
    theme: 'Machado, fúria guerreira, magma e PHP',
    powers: [
      { id: 'axe', name: 'Machado $_POST', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 10, boomerang: true, homing: 0.25, heavy: true, burn: 120, cd: 46, sfx: 'axe', desc: 'Arremessa o machado de magma, que volta para a mão.' },
      { id: 'geyser', name: 'Erupção de Magma', slot: 'simple', row: 1, kind: 'pillar', dmg: 13, at: 'target', delay: 16, burn: 180, launch: -8, cd: 70, sfx: 'fire', desc: 'O chão explode em lava sob o adversário.' },
      { id: 'rage', name: 'Fúria do Guerreiro', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 480, dmgMult: 1.55, armor: true, speedMult: 1.15, heal: 10, burstDmg: 8, sfx: 'ultimate', desc: 'Super armadura, +55% de dano e cura.' },
      { id: 'quake', name: 'Composer Quake', slot: 'charge', meter: 1, row: 3, kind: 'shot', ground: true, dmg: 17, speed: 8, multiHit: 2, pierce: true, launch: -9, height: 'low', heavy: true, sfx: 'explosion', desc: 'Onda sísmica de basalto pelo chão. Golpe baixo.' },
      { id: 'apoc', name: 'Fatal Error: Apocalipse PHP', slot: 'ultimate', row: 4, kind: 'rush', dmg: 44, hits: 5, teleport: true, finisherPillars: 3, sfx: 'ultimate', desc: 'Salta no inimigo e parte o mundo com um machado colossal.' },
    ],
  },
  iales: {
    element: 'ia',
    theme: 'IAs, código, roubo e acumulação de poderes (auto aim)',
    autoAim: true,
    powers: [
      { id: 'prompt', name: 'Prompt Teleguiado', slot: 'simple', row: 0, kind: 'shot', dmg: 7, speed: 9, count: 3, spread: 0.35, seek: true, cd: 40, sfx: 'magic', desc: 'Três orbes neurais que sempre encontram o alvo.' },
      { id: 'dragon', name: 'Dragão de Fogo Rust', slot: 'simple', row: 1, kind: 'shot', dmg: 19, speed: 8, seek: true, pierce: true, multiHit: 3, heavy: true, big: true, burn: 240, cd: 90, sfx: 'dragon', desc: 'Um dragão memory-safe de fogo que persegue e queima.' },
      { id: 'steal', name: 'Ctrl+C dos Poderes', slot: 'charge', meter: 0, row: 2, kind: 'steal', time: 600, dmg: 8, sfx: 'steal', desc: 'Acerto garantido: rouba as 5 habilidades do rival por 10 s.' },
      { id: 'neural', name: 'Rede Neural', slot: 'charge', meter: 1, row: 3, kind: 'pillar', at: 'target', delay: 6, dmg: 17, stun: 60, seek: true, sfx: 'thunder_cast', desc: 'Neurônios elétricos prendem o alvo onde ele estiver.' },
      { id: 'afo', name: 'All For One: Merge Total', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 6, count: 10, seek: true, finisher: 26, sfx: 'ultimate', desc: 'Funde todos os poderes acumulados numa rajada de IAs.' },
    ],
  },
  felipinho: {
    element: 'agua',
    theme: 'Água, ondas e React',
    powers: [
      { id: 'bubble', name: 'Bolha useState', slot: 'simple', row: 0, kind: 'shot', dmg: 8, speed: 7, homing: 0.55, trap: 48, cd: 48, sfx: 'water', desc: 'Prende o adversário numa bolha de estado.' },
      { id: 'wave', name: 'Onda Re-render', slot: 'simple', row: 1, kind: 'shot', ground: true, dmg: 12, speed: 9, pierce: true, slow: 120, push: 10, cd: 56, sfx: 'water', desc: 'Onda pelo chão que empurra e deixa lento.' },
      { id: 'vdom', name: 'Escudo Virtual DOM', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 420, reflect: true, defMult: 0.5, heal: 14, regen: 0.04, sfx: 'shield', desc: 'Reflete projéteis, metade do dano e regeneração.' },
      { id: 'hook', name: 'Hook de Água', slot: 'charge', meter: 1, row: 3, kind: 'pull', range: 420, dmg: 12, stun: 40, sfx: 'water', desc: 'Chicote de água que puxa o rival para um combo.' },
      { id: 'tsunami', name: 'Tsunami React 19', slot: 'ultimate', row: 4, kind: 'blast', at: 'wave', dmg: 40, push: 16, launch: -10, sfx: 'ultimate', desc: 'Um tsunami atravessa a arena inteira.' },
    ],
  },
  stack: {
    element: 'lata',
    theme: 'Soquete 1155, overclock seco e o sedan no morro',
    powers: [
      { id: 'chip', name: 'Chip 1155', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 11, heavy: true, cd: 42, sfx: 'heavy', desc: 'Arremessa um processador quadrado de soquete antigo.' },
      { id: 'driver', name: 'Chave de Fenda', slot: 'simple', row: 1, kind: 'rush', dmg: 18, hits: 4, cd: 48, imgFx: 'lata', sfx: 'whoosh', desc: 'Quatro batidas de chave. A última lança.' },
      { id: 'seco', name: 'Overclock Seco', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 260, dmgMult: 1.22, speedMult: 1.18, overheat: true, sfx: 'fire', desc: 'Aura de calor. Aperte de novo para cortar; se durar até o fim, superaquece.' },
      { id: 'paste', name: 'Pasta Térmica', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 320, dmg: 0.16, slow: 70, imgFx: 'lata', sfx: 'water', desc: 'Poça de pasta no chão. Gruda e deixa lento.' },
      { id: 'liso', name: 'LISO!', slot: 'ultimate', row: 4, kind: 'sedan', dmg: 24, sfx: 'ultimate', desc: 'O sedan branco cruza o morro verde. LISO na largada, SECO no impacto.' },
    ],
  },
  gitmaster: {
    element: 'sombra',
    theme: 'Sombras e branches',
    powers: [
      { id: 'shuriken', name: 'Shuriken de Branch', slot: 'simple', row: 0, kind: 'shot', dmg: 8, speed: 12, count: 2, spread: 0.18, cd: 40, sfx: 'whoosh', desc: 'Duas shurikens rápidas.' },
      { id: 'gdash', name: 'Git Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 11, speed: 15, cd: 44, sfx: 'dash', desc: 'Investida cortante.' },
      { id: 'branch', name: 'Branch Sombria', slot: 'charge', meter: 0, row: 2, kind: 'beam', range: 280, dmg: 16, poison: 240, sfx: 'magic', desc: 'Tentáculos de branches que envenenam.' },
      { id: 'stash', name: 'git stash', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 240, invuln: 50, teleportBehind: true, speedMult: 1.35, sfx: 'dash', desc: 'Some na fumaça e reaparece atrás do rival.' },
      { id: 'rebase', name: 'Rebase Interativo', slot: 'ultimate', row: 4, kind: 'rush', dmg: 38, hits: 7, teleport: true, sfx: 'ultimate', desc: 'Sete cortes reescrevendo o histórico do rival.' },
    ],
  },
  bughunter: {
    element: 'veneno',
    theme: 'Insetos, lupa e hotfix',
    powers: [
      { id: 'report', name: 'Bug Report', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 9, stun: 30, homing: 0.2, cd: 52, sfx: 'magic', desc: 'Besouro dourado que atordoa.' },
      { id: 'lens', name: 'Lupa Solar', slot: 'simple', row: 1, kind: 'beam', range: 300, dmg: 10, burn: 120, cd: 60, sfx: 'fire', desc: 'Raio concentrado que queima.' },
      { id: 'swarm', name: 'Enxame de Bugs', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 14, speed: 4, multiHit: 4, pierce: true, poison: 300, big: true, sfx: 'magic', desc: 'Nuvem lenta de bugs venenosos.' },
      { id: 'antidote', name: 'Antídoto', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 240, heal: 22, cleanse: true, sfx: 'shield', desc: 'Cura e remove venenos e lentidão.' },
      { id: 'hotfix', name: 'Hotfix em Área', slot: 'ultimate', row: 4, kind: 'blast', at: 'self', radius: 260, dmg: 34, sfx: 'explosion', desc: 'Explosão dourada em volta de si.' },
    ],
  },
  frontend: {
    element: 'neon',
    theme: 'Neon, CSS e animação',
    powers: [
      { id: 'box', name: 'Caixa de Layout', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 9, cd: 42, sfx: 'magic', desc: 'Cubo neon giratório.' },
      { id: 'flex', name: 'Flexbox Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 10, speed: 14, cd: 46, sfx: 'dash', desc: 'Investida em neon rosa.' },
      { id: 'gradient', name: 'Gradiente Animado', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 420, speedMult: 1.4, dmgMult: 1.25, sfx: 'shield', desc: 'Mais velocidade e dano.' },
      { id: 'keyframe', name: '@keyframes', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 8, speed: 10, count: 3, spread: 0.3, homing: 0.6, sfx: 'magic', desc: 'Três diamantes teleguiados.' },
      { id: 'ultra', name: 'CSS Ultra Instinct', slot: 'ultimate', row: 4, kind: 'blast', at: 'self', radius: 300, dmg: 32, sfx: 'ultimate', desc: 'Ondas neon por toda a arena.' },
    ],
  },
  backend: {
    element: 'terra',
    theme: 'Pedra, servidores e cache',
    powers: [
      { id: 'e500', name: 'Erro 500', slot: 'simple', row: 0, kind: 'shot', dmg: 12, speed: 7, heavy: true, cd: 56, sfx: 'explosion', desc: 'Bloco de erro pesado que vence outros projéteis.' },
      { id: 'query', name: 'Query Pesada', slot: 'simple', row: 1, kind: 'beam', range: 170, dmg: 15, launch: -8, cd: 60, sfx: 'heavy', desc: 'Soco de rocha de curto alcance que lança.' },
      { id: 'firewall', name: 'Firewall de Pedra', slot: 'charge', meter: 0, row: 2, kind: 'wall', time: 360, dmg: 10, sfx: 'explosion', desc: 'Ergue uma muralha que bloqueia projéteis.' },
      { id: 'cache', name: 'Armadura de Cache', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 420, armor: true, defMult: 0.5, sfx: 'shield', desc: 'Super armadura e metade do dano.' },
      { id: 'meteor', name: 'Chuva de Meteoros', slot: 'ultimate', row: 4, kind: 'rain', count: 6, dmg: 36, sfx: 'explosion', desc: 'Meteoros caem sobre o rival.' },
    ],
  },
  devops: {
    element: 'metal',
    theme: 'Engrenagens, containers e pipelines',
    powers: [
      { id: 'gear', name: 'Engrenagem CI', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 9, multiHit: 2, cd: 48, sfx: 'axe', desc: 'Serra dourada de dois acertos.' },
      { id: 'rollback', name: 'Rollback', slot: 'simple', row: 1, kind: 'dash', dmg: 10, speed: 14, cd: 46, sfx: 'dash', desc: 'Investida em esteira de perigo.' },
      { id: 'container', name: 'Container Drop', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 24, dmg: 18, stun: 30, sfx: 'heavy', desc: 'Um container despenca sobre o alvo.' },
      { id: 'k8s', name: 'Escudo de Cluster', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 360, defMult: 0.45, reflect: true, sfx: 'shield', desc: 'Placas de metal refletem projéteis.' },
      { id: 'cdeploy', name: 'Deploy Contínuo', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 5, count: 8, homing: 0.7, finisher: 0, sfx: 'explosion', desc: 'Oito foguetes teleguiados.' },
    ],
  },
  qa: {
    element: 'acido',
    theme: 'Ácido, testes e cobertura',
    powers: [
      { id: 'tube', name: 'Tubo de Ensaio', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 8, arc: true, poison: 260, cd: 40, sfx: 'water', desc: 'Lança ácido em parábola.' },
      { id: 'fail', name: 'Teste Falhou', slot: 'simple', row: 1, kind: 'pillar', at: 'target', delay: 16, dmg: 11, stun: 44, cd: 56, sfx: 'block', desc: 'Um X vermelho carimba e atordoa.' },
      { id: 'puddle', name: 'Poça de Ácido', slot: 'charge', meter: 0, row: 2, kind: 'zone', at: 'target', time: 320, dmg: 0.2, slow: 34, sfx: 'water', desc: 'Poça que corrói e deixa lento.' },
      { id: 'coverage', name: 'Cobertura 100%', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 420, defMult: 0.5, heal: 8, sfx: 'shield', desc: 'Escudo de testes: metade do dano.' },
      { id: 'regress', name: 'Suíte de Regressão', slot: 'ultimate', row: 4, kind: 'rain', count: 8, dmg: 38, poison: 300, sfx: 'explosion', desc: 'Chuva ácida sobre o rival.' },
    ],
  },
  scrum: {
    element: 'tempo',
    theme: 'Tempo, sprints e planning',
    powers: [
      { id: 'postit', name: 'Post-it', slot: 'simple', row: 0, kind: 'shot', dmg: 6, speed: 10, count: 3, spread: 0.3, cd: 42, sfx: 'whoosh', desc: 'Três post-its afiados.' },
      { id: 'timebox', name: 'Timebox', slot: 'simple', row: 1, kind: 'beam', range: 190, dmg: 12, slow: 120, cd: 56, sfx: 'whoosh', desc: 'Ponteiro do relógio que deixa lento.' },
      { id: 'sprint', name: 'Sprint', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 420, speedMult: 1.5, meterGain: 30, sfx: 'shield', desc: 'Velocidade extrema e energia.' },
      { id: 'freeze', name: 'Congelar Sprint', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 10, speed: 8, stun: 75, homing: 0.4, sfx: 'magic', desc: 'Congela o rival no tempo.' },
      { id: 'poker', name: 'Planning Poker', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 32, heal: 12, sfx: 'ultimate', desc: 'Cartas explodem no alvo e curam o Scrum.' },
    ],
  },
  fullstack: {
    element: 'arcano',
    theme: 'Camadas arcanas e monolitos',
    powers: [
      { id: 'twin', name: 'Deploy Simultâneo', slot: 'simple', row: 0, kind: 'shot', dmg: 8, speed: 9, count: 2, spread: 0.2, cd: 44, sfx: 'magic', desc: 'Dois cristais, alto e baixo.' },
      { id: 'merge', name: 'Merge Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 11, speed: 14, cd: 46, sfx: 'dash', desc: 'Investida arcana.' },
      { id: 'trace', name: 'Stack Trace', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 420, dmgMult: 1.3, reflect: true, sfx: 'shield', desc: 'Runas refletem projéteis e aumentam o dano.' },
      { id: 'monolith', name: 'Monolito', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 18, speed: 7, heavy: true, pierce: true, multiHit: 2, big: true, sfx: 'heavy', desc: 'Pilar de pedra rúnica atravessa tudo.' },
      { id: 'perfect', name: 'Monolito Perfeito', slot: 'ultimate', row: 4, kind: 'pillar', at: 'target', delay: 18, dmg: 38, launch: -11, big: true, sfx: 'ultimate', desc: 'Um monolito gigante esmaga o alvo.' },
    ],
  },
};

/* Cores e sheets genéricos (pacote retrô) por elemento. */
const ELEMENT_FX = {
  magma: { sheet: 'fire', color: '#ff6a1c' },
  ia: { sheet: 'arcane', color: '#c77dff' },
  agua: { sheet: 'water', color: '#3ecbff' },
  vento: { sheet: 'arcane', color: '#dff7ff' },
  sombra: { sheet: 'chaos', color: '#ff3355' },
  veneno: { sheet: 'chaos', color: '#9dff4a' },
  neon: { sheet: 'lightning', color: '#ff4fd8' },
  terra: { sheet: 'impact', color: '#c08a4a' },
  metal: { sheet: 'lightning', color: '#ffd24d' },
  acido: { sheet: 'chaos', color: '#7dff5e' },
  tempo: { sheet: 'arcane', color: '#7de0ff' },
  arcano: { sheet: 'arcane', color: '#b26bff' },
};
