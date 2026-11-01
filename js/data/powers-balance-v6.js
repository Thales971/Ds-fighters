/* ============================================================
   DS FIGHTERS — Balanceamento V6.
   Reforço dos lutadores mais fracos (Kael JVM, Ada Assert, Cromo VX,
   Yumi, Kage, Mira) com stats novos e mais efeitos de status nos kits.
   BHM NOIR vira estilo Noob Saibot: sombra, clone e teleporte atrás.
   Carregado depois de powers-v6.js.
   ============================================================ */

/* ---------- stats ---------- */
FIGHTERS.forEach((f) => {
  const patch = {
    java:      { power: 1.02, speed: 0.95, weight: 1.16, hp: 122, meterRate: 1.18 },
    qa:        { power: 1.26, speed: 1.1,  weight: 1.04, hp: 126, meterRate: 1.18 },
    merc:      { power: 1.06, speed: 1.3,  weight: 0.9,  hp: 114, meterRate: 1.1 },
    kotlin:    { power: 1.06, speed: 1.4,  weight: 0.82, hp: 112, meterRate: 1.12 },
    gitmaster: { power: 1.12, speed: 1.3,  weight: 0.88, hp: 114, meterRate: 1.12 },
    frontend:  { power: 1.3,  speed: 1.2,  weight: 0.96, hp: 132, meterRate: 1.24 },
    bhm:       { power: 1.28, speed: 1.2,  weight: 1.0,  hp: 142, meterRate: 1.28 },
    devops:    { power: 1.16, speed: 1.05, weight: 1.1,  hp: 122, meterRate: 1.1 },
    fullstack: { power: 1.14, speed: 1.05, weight: 1.0,  hp: 118, meterRate: 1.1 },
    scrum:     { power: 1.14, speed: 1.14, weight: 0.94, hp: 116, meterRate: 1.25 },
    backend:   { power: 1.16, speed: 0.94, weight: 1.24, hp: 130, meterRate: 1.08 },
    bughunter: { power: 1.0,  speed: 1.1,  weight: 0.95, hp: 106, meterRate: 1.1 },
  }[f.id];
  if (patch) Object.assign(f.stats, patch);
});

/* ---------- assinaturas ---------- */
Object.assign(SIGNATURES, {
  java: {
    trait: 'TANQUE + JIT + FÚRIA',
    desc: 'Armadura pesada, queima e explosão. Com pouca vida, o dano sobe (JIT compilando em fúria).',
    ability: { burn: 110, explode: 2 }, lowHpRage: 1.35,
  },
  qa: {
    trait: 'CORROSÃO TOTAL',
    desc: 'Ácido deixa o rival VULNERÁVEL, envenenado e lento. Quanto mais testes, mais corrosão.',
    ability: { vuln: 200, poison: 140, slow: 50 },
  },
  merc: {
    trait: 'ESQUIVA + SANGRAMENTO',
    desc: 'Passo fantasma atravessa o rival; desvios causam sangramento. Esquiva automática maior.',
    ability: { bleed: 140 }, dodge: 0.14,
  },
  kotlin: {
    trait: 'RAPIDEZ + GELO + CONGELAR',
    desc: 'A mais rápida do jogo; cristais congelam e dejan o rival lento. Cadeias maiores.',
    ability: { chill: 110 }, chainBonus: 1,
  },
  gitmaster: {
    trait: 'SOMBRA + VENENO + CEGUEIRA',
    desc: 'Shurikens envenenam, sombras cegam e ele some na fumaça atrás do rival.',
    ability: { poison: 120, blind: 60 },
  },
  frontend: {
    trait: 'NEON ELÉTRICO',
    desc: 'Neon eletriza os controles do rival (teclas se mexem sozinhas) e causa explosões de luz.',
    ability: { shock: 110, explode: 2 },
  },
  bhm: {
    trait: 'CLONE DAS SOMBRAS (estilo Noob Saibot)',
    desc: 'Afunda na sombra, reaparece atrás do rival e invoca clones sombrios que atacam junto. Cega e eletriza.',
    ability: { blind: 90, shock: 80 }, dodge: 0.08,
  },
  devops: {
    trait: 'PIPELINE + EXPLOSÃO',
    desc: 'Containers e foguetes explodem; acertos dejan o rival vulnerável por instantes.',
    ability: { explode: 3, vuln: 80 },
  },
  fullstack: {
    trait: 'MONOLITO + COMBO',
    desc: 'Camadas arcanas refletem projéteis; combos com 2 golpes a mais e queimadura.',
    ability: { burn: 70, meterBurn: 5 }, chainBonus: 2,
  },
  scrum: {
    trait: 'SPRINT + GELO',
    desc: 'Tempo acelerado: mais velocidade e energia; habilidades congelen (lentidão) e atordoam.',
    ability: { chill: 100, stun: 6 }, stunMult: 1.15,
  },
  backend: {
    trait: 'SERVIDOR DE AÇO',
    desc: 'Muralha e armadura pesada; golpes de rocha dejan o rival vulnerável e lançam longe.',
    ability: { vuln: 120, explode: 2 },
  },
  bughunter: {
    trait: 'ENXAME VENENOSO',
    desc: 'Bugs causam veneno forte, lentidão e queimadura solar. Antídoto cura tudo.',
    ability: { poison: 160, slow: 60, burn: 60 },
  },
});

/* ---------- kits reforçados (mais efeitos de status por acerto) ---------- */
Object.assign(POWERS, {
  java: {
    element: 'java',
    theme: 'Java, JVM, café e Garbage Collector — tanque que esquenta com a luta',
    powers: [
      { id: 'espresso', name: 'Grão Expresso', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 9, heavy: true, burn: 120, cd: 48, sfx: 'fire', desc: 'Grão de café em chamas: queima forte.' },
      { id: 'gc', name: 'Garbage Collector', slot: 'simple', row: 1, kind: 'pull', range: 320, dmg: 12, stun: 36, fx: { vuln: 100 }, cd: 56, sfx: 'whoosh', desc: 'Vórtice que puxa o rival e deixa vulnerável.' },
      { id: 'jvm', name: 'JVM Aquecida', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 440, armor: true, dmgMult: 1.15, defMult: 0.78, heal: 8, sfx: 'shield', desc: 'Super armadura, +15% dano, menos dano recebido e cura.' },
      { id: 'soe', name: 'StackOverflowError', slot: 'charge', meter: 1, row: 3, kind: 'pillar', at: 'target', delay: 18, dmg: 17, launch: -9, fx: { explode: 3, burn: 120 }, sfx: 'explosion', desc: 'Torre de frames desaba, explode e queima.' },
      { id: 'beans', name: 'Meteoro de Beans', slot: 'ultimate', row: 4, kind: 'rain', count: 6, dmg: 32, burn: 160, fx: { explode: 3, vuln: 160 }, sfx: 'ultimate', desc: 'Beans gigantes em chamas: explosão + queimadura + vulnerável.' },
    ],
  },
  qa: {
    element: 'acido',
    theme: 'Ácido, testes e cobertura — corrosão total',
    powers: [
      { id: 'tube', name: 'Tubo de Ensaio', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 8, arc: true, poison: 300, fx: { vuln: 120 }, cd: 40, sfx: 'water', desc: 'Ácido em arco: veneno + vulnerável.' },
      { id: 'fail', name: 'Teste Falhou', slot: 'simple', row: 1, kind: 'pillar', at: 'target', delay: 16, dmg: 13, stun: 50, fx: { vuln: 160, slow: 80 }, cd: 54, sfx: 'block', desc: 'X vermelho: atordoa, vulnerável e lento.' },
      { id: 'puddle', name: 'Poça de Ácido', slot: 'charge', meter: 0, row: 2, kind: 'zone', at: 'target', time: 360, dmg: 0.24, slow: 40, fx: { poison: 120, vuln: 120 }, sfx: 'water', desc: 'Poça corrosiva: dano contínuo + veneno + vulnerável + lento.' },
      { id: 'coverage', name: 'Cobertura 100%', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 460, defMult: 0.45, heal: 10, sfx: 'shield', desc: 'Escudo de testes: 45% do dano e cura.' },
      { id: 'regress', name: 'Suíte de Regressão', slot: 'ultimate', row: 4, kind: 'rain', count: 9, dmg: 40, poison: 340, fx: { vuln: 200, slow: 100 }, sfx: 'explosion', desc: 'Chuva ácida: veneno forte + vulnerável + lento.' },
    ],
  },
  merc: {
    element: 'cromo',
    theme: 'Implantes cibernéticos, esquiva e tempo desacelerado',
    powers: [
      { id: 'blink', name: 'Passo Fantasma', slot: 'simple', row: 0, kind: 'dash', dmg: 11, speed: 17, phase: true, iFrames: 10, fx: { bleed: 120 }, cd: 38, sfx: 'dash', desc: 'Atravessa o rival com intangibilidade e causa sangramento.' },
      { id: 'smart', name: 'Bala Inteligente', slot: 'simple', row: 1, kind: 'shot', dmg: 7, speed: 12, count: 3, spread: 0.25, homing: 0.65, fx: { bleed: 90 }, cd: 42, sfx: 'whoosh', desc: 'Três balas em curva que sangram.' },
      { id: 'overclock', name: 'Overclock Neural', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 400, grant: 'overclock', invuln: 24, speedMult: 1.15, sfx: 'shield', desc: 'Tempo desacelera: +30% velocidade, +25% esquiva e i-frames.' },
      { id: 'monowire', name: 'Monofio', slot: 'charge', meter: 1, row: 3, kind: 'beam', range: 290, dmg: 16, stun: 26, fx: { bleed: 360, vuln: 120 }, sfx: 'whoosh', desc: 'Chicote monomolecular: sangramento longo + vulnerável.' },
      { id: 'psycho', name: 'Ciberpsicose', slot: 'ultimate', row: 4, kind: 'rush', dmg: 42, hits: 8, teleport: true, fx: { bleed: 300, shock: 100 }, sfx: 'ultimate', desc: 'Oito cortes em tempo parado: sangra e eletriza.' },
    ],
  },
  bhm: {
    element: 'sombra',
    theme: 'Noob Saibot style: clone das sombras, portal e teleporte atrás do rival',
    powers: [
      { id: 'plasma', name: 'Bola Sombria', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 11, fx: { shock: 100, blind: 60 }, cd: 40, sfx: 'thunder_cast', desc: 'Esfera negra: eletriza e cega.' },
      { id: 'shadowdash', name: 'Passo das Sombras', slot: 'simple', row: 1, kind: 'dash', dmg: 13, speed: 19, phase: true, cloak: 90, iFrames: 10, fx: { blind: 80 }, cd: 44, sfx: 'dash', desc: 'Some na sombra ao avançar: intangível e cega.' },
      { id: 'clone', name: 'Clone das Sombras', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 15, speed: 7, pierce: true, big: true, multiHit: 3, fx: { blind: 200, shock: 80 }, sfx: 'magic', desc: 'Clone sombrio atravessa a arena: cega e eletriza várias vezes.' },
      { id: 'portal', name: 'Portal Sombrio', slot: 'charge', meter: 1, row: 3, kind: 'shadowport', time: 140, burstDmg: 16, fx: { blind: 140, bleed: 120 }, sfx: 'magic', desc: 'Afunda na sombra e sai atrás ou por cima do rival com golpe pesado.' },
      { id: 'storm', name: 'Eclipse Sombrio', slot: 'ultimate', row: 4, kind: 'rain', count: 8, dmg: 40, fx: { shock: 240, blind: 160, lock: 90 }, sfx: 'ultimate', desc: 'Raios negros caem: eletriza, cega e bloqueia poderes do rival.' },
    ],
  },
  gitmaster: {
    element: 'sombra',
    theme: 'Sombras, branches e veneno — some e reaparece atrás',
    powers: [
      { id: 'shuriken', name: 'Shuriken de Branch', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 13, count: 2, spread: 0.18, poison: 160, cd: 38, sfx: 'whoosh', desc: 'Duas shurikens rápidas e venenosas.' },
      { id: 'gdash', name: 'Git Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 12, speed: 16, fx: { blind: 60 }, cd: 42, sfx: 'dash', desc: 'Investida cortante que deixa o rival cego por instantes.' },
      { id: 'branch', name: 'Branch Sombria', slot: 'charge', meter: 0, row: 2, kind: 'beam', range: 300, dmg: 17, poison: 280, fx: { slow: 80 }, sfx: 'magic', desc: 'Tentáculos de branch: veneno forte e lento.' },
      { id: 'stash', name: 'git stash', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 260, invuln: 60, teleportBehind: true, speedMult: 1.4, fx: { blind: 100 }, sfx: 'dash', desc: 'Some na fumaça, fica intangível e reaparece atrás do rival.' },
      { id: 'rebase', name: 'Rebase Interativo', slot: 'ultimate', row: 4, kind: 'rush', dmg: 40, hits: 7, teleport: true, fx: { poison: 200, blind: 120 }, sfx: 'ultimate', desc: 'Sete cortes reescrevendo o rival: veneno + cegueira.' },
    ],
  },
  frontend: {
    element: 'neon',
    theme: 'Neon, CSS e animação — eletriza a tela do rival',
    powers: [
      { id: 'box', name: 'Caixa de Layout', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 9, fx: { shock: 80 }, cd: 40, sfx: 'magic', desc: 'Cubo neon giratório que eletriza.' },
      { id: 'flex', name: 'Flexbox Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 11, speed: 15, fx: { shock: 100, explode: 2 }, cd: 44, sfx: 'dash', desc: 'Investida rosa neon: choque + explosão de luz.' },
      { id: 'gradient', name: 'Gradiente Animado', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 440, speedMult: 1.45, dmgMult: 1.3, sfx: 'shield', desc: 'Mais velocidade e dano.' },
      { id: 'keyframe', name: '@keyframes', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 9, speed: 10, count: 3, spread: 0.3, homing: 0.65, fx: { shock: 120, blind: 60 }, sfx: 'magic', desc: 'Três diamantes teleguiados: choque + cegueira leve.' },
      { id: 'ultra', name: 'CSS Ultra Instinct', slot: 'ultimate', row: 4, kind: 'blast', at: 'self', radius: 320, dmg: 36, fx: { shock: 220, blind: 140, explode: 3 }, sfx: 'ultimate', desc: 'Ondas neon pela arena: eletriza, cega e explode.' },
    ],
  },
  devops: {
    element: 'metal',
    theme: 'Engrenagens, containers e pipelines — explosivo e tanudo',
    powers: [
      { id: 'gear', name: 'Engrenagem CI', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 9, multiHit: 2, fx: { vuln: 80 }, cd: 46, sfx: 'axe', desc: 'Serra dourada de dois acertos: vulnerável.' },
      { id: 'rollback', name: 'Rollback', slot: 'simple', row: 1, kind: 'dash', dmg: 11, speed: 15, fx: { explode: 2, bleed: 100 }, cd: 44, sfx: 'dash', desc: 'Investida na esteira: explosão + sangramento.' },
      { id: 'container', name: 'Container Drop', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 24, dmg: 20, stun: 34, fx: { vuln: 140, explode: 2 }, sfx: 'heavy', desc: 'Container despenca: stun + vulnerável + explosão.' },
      { id: 'k8s', name: 'Escudo de Cluster', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 380, defMult: 0.4, reflect: true, sfx: 'shield', desc: 'Placas de metal: 40% do dano e reflete projéteis.' },
      { id: 'cdeploy', name: 'Deploy Contínuo', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 6, count: 9, homing: 0.7, finisher: 18, fx: { explode: 3, vuln: 160 }, sfx: 'explosion', desc: 'Nove foguetes teleguiados + explosão final vulnerável.' },
    ],
  },
  fullstack: {
    element: 'arcano',
    theme: 'Camadas arcanas e monolito — combos longos e queimadura',
    powers: [
      { id: 'twin', name: 'Deploy Simultâneo', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 9, count: 2, spread: 0.2, burn: 100, cd: 42, sfx: 'magic', desc: 'Dois cristais, alto e baixo, que queimam.' },
      { id: 'merge', name: 'Merge Dash', slot: 'simple', row: 1, kind: 'dash', dmg: 12, speed: 15, fx: { burn: 120, explode: 2 }, cd: 44, sfx: 'dash', desc: 'Investida arcana com queima e explosão.' },
      { id: 'trace', name: 'Stack Trace', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 440, dmgMult: 1.35, reflect: true, sfx: 'shield', desc: 'Runas refletem projéteis e +35% dano.' },
      { id: 'monolith', name: 'Monolito Perfeito', slot: 'charge', meter: 1, row: 3, kind: 'wall', time: 380, dmg: 12, fx: { burn: 140, slow: 60 }, sfx: 'heavy', desc: 'Muralha arcana que queima e deixa lento quem encostar.' },
      { id: 'fullstackult', name: 'Monolito Vivo', slot: 'ultimate', row: 4, kind: 'blast', at: 'self', radius: 340, dmg: 38, fx: { burn: 200, vuln: 160, explode: 3 }, sfx: 'ultimate', desc: 'O monolito explode tudo ao redor: queima + vulnerável + explosão.' },
    ],
  },
});

/* Visual do BHM permanece o original — apenas o kit é estilo Noob Saibot. */
Object.assign(ELEMENT_FX, {
  sombra: { sheet: 'chaos', color: '#8a2be2' },
});
