/* ============================================================
   DS FIGHTERS — Expansão Turbo: 5 novos kits + assinaturas.
   Carregado depois de powers.js. Linhas = assets/abilities/<id>.png.
   `fx` em um poder = efeitos de status aplicados ao acertar:
   blind (tela embaçada), shock (controles mexem sozinhos), chill
   (gelo: lentidão + golpes mais lentos), bleed / burn / poison
   (dano contínuo), vuln (+20% de dano recebido), lock (sem poderes),
   explode (explosão extra), stun (tontura), drain (rouba vida),
   meterBurn (queima energia do rival).
   ============================================================ */
Object.assign(POWERS, {
  kotlin: {
    element: 'kotlin',
    theme: 'Kotlin: velocidade, lambdas e cristais null-safe',
    powers: [
      { id: 'kbolt', name: 'Seta Kotlin', slot: 'simple', row: 0, kind: 'shot', dmg: 6, speed: 15, count: 2, spread: 0.1, cd: 32, sfx: 'whoosh', desc: 'Duas setas violeta e laranja muito rápidas.' },
      { id: 'lambda', name: 'Corte Lambda', slot: 'simple', row: 1, kind: 'dash', dmg: 10, speed: 19, cd: 38, sfx: 'dash', desc: 'Investida relâmpago em forma de { it -> }.' },
      { id: 'nullsafe', name: 'Cristal Null-Safe', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', delay: 12, dmg: 14, stun: 34, launch: -7, fx: { chill: 240 }, sfx: 'magic', desc: 'Cristais de gelo brotam sob o rival e o deixam lento.' },
      { id: 'coroutine', name: 'Corrotinas', slot: 'charge', meter: 1, row: 3, kind: 'barrage', dmg: 4, count: 7, homing: 0.55, sfx: 'whoosh', desc: 'Sete rajadas assíncronas teleguiadas.' },
      { id: 'kstorm', name: 'Chuva de Lambdas', slot: 'ultimate', row: 4, kind: 'rain', count: 8, dmg: 34, fx: { chill: 300 }, sfx: 'ultimate', desc: 'Triângulos Kotlin despencam e congelam a arena.' },
    ],
  },
  hacker: {
    element: 'hack',
    theme: 'Rootkit: furtividade, backdoor, malware e kernel panic',
    powers: [
      { id: 'ghost', name: 'Aproximação Fantasma', slot: 'simple', row: 0, kind: 'dash', dmg: 9, speed: 16, phase: true, cloak: 70, iFrames: 8, cd: 44, sfx: 'dash', desc: 'Avança quase invisível. Difícil de ler, com poucos quadros intangíveis.' },
      { id: 'backdoor', name: 'Backdoor', slot: 'simple', row: 1, kind: 'pillar', at: 'behind', delay: 8, dmg: 12, stun: 22, fx: { shock: 80, blind: 60 }, cd: 54, sfx: 'magic', desc: 'Abre um portal atrás do rival e acerta pelas costas.' },
      { id: 'malware', name: 'Malware', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 8, speed: 10, homing: 0.7, fx: { poison: 220, meterSlow: 280, slow: 90 }, sfx: 'magic', desc: 'Infecção: dano contínuo, lentidão e o medidor do rival enche bem mais devagar.' },
      { id: 'root', name: 'Escalada de Privilégio', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 280, dmgMult: 1.22, speedMult: 1.12, sfx: 'shield', desc: 'Vira root: mais dano e velocidade enquanto a aura durar.' },
      { id: 'panic', name: 'Kernel Panic', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 34, kernel: true, fx: { lock: 120, blind: 140, shock: 90 }, sfx: 'ultimate', desc: 'A tela do rival vira uma pane total: glitch, choque e sem poderes.' },
    ],
  },
  java: {
    element: 'java',
    theme: 'Java, JVM, café e Garbage Collector',
    powers: [
      { id: 'espresso', name: 'Grão Expresso', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 9, heavy: true, burn: 90, cd: 50, sfx: 'fire', desc: 'Um grão de café em chamas.' },
      { id: 'gc', name: 'Garbage Collector', slot: 'simple', row: 1, kind: 'pull', range: 300, dmg: 10, stun: 32, cd: 58, sfx: 'whoosh', desc: 'Vórtice que coleta o rival para perto.' },
      { id: 'jvm', name: 'JVM Aquecida', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 400, armor: true, dmgMult: 1.1, defMult: 0.82, heal: 6, sfx: 'shield', desc: 'Super armadura, mais dano e menos dano recebido.' },
      { id: 'soe', name: 'StackOverflowError', slot: 'charge', meter: 1, row: 3, kind: 'pillar', at: 'target', delay: 18, dmg: 14, launch: -8, fx: { explode: 2 }, sfx: 'explosion', desc: 'Uma torre de frames desaba e EXPLODE no rival.' },
      { id: 'beans', name: 'Meteoro de Beans', slot: 'ultimate', row: 4, kind: 'rain', count: 5, dmg: 28, burn: 120, fx: { explode: 2 }, sfx: 'ultimate', desc: 'Beans gigantes em chamas caem do céu.' },
    ],
  },
  merc: {
    element: 'cromo',
    theme: 'Implantes cibernéticos, esquiva e tempo desacelerado',
    powers: [
      { id: 'blink', name: 'Passo Fantasma', slot: 'simple', row: 0, kind: 'dash', dmg: 10, speed: 17, phase: true, iFrames: 8, cd: 40, sfx: 'dash', desc: 'Atravessa o rival com intangibilidade curta e rastro.' },
      { id: 'smart', name: 'Bala Inteligente', slot: 'simple', row: 1, kind: 'shot', dmg: 6, speed: 12, count: 3, spread: 0.25, homing: 0.6, cd: 44, sfx: 'whoosh', desc: 'Três balas que fazem curva até o alvo.' },
      { id: 'overclock', name: 'Overclock Neural', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 360, grant: 'overclock', invuln: 20, sfx: 'shield', desc: 'O tempo desacelera: +30% de velocidade e +25% de esquiva.' },
      { id: 'monowire', name: 'Monofio', slot: 'charge', meter: 1, row: 3, kind: 'beam', range: 270, dmg: 14, stun: 24, fx: { bleed: 300 }, sfx: 'whoosh', desc: 'Chicote monomolecular que causa SANGRAMENTO.' },
      { id: 'psycho', name: 'Ciberpsicose', slot: 'ultimate', row: 4, kind: 'rush', dmg: 40, hits: 8, teleport: true, fx: { bleed: 240 }, sfx: 'ultimate', desc: 'Oito cortes em tempo parado.' },
    ],
  },
  bhm: {
    element: 'trovao',
    theme: 'Raios e sombras do submundo',
    powers: [
      { id: 'plasma', name: 'Bola de Plasma', slot: 'simple', row: 0, kind: 'shot', dmg: 9, speed: 11, fx: { shock: 90 }, cd: 42, sfx: 'thunder_cast', desc: 'Esfera elétrica que ELETRIZA os controles.' },
      { id: 'torpedo', name: 'Torpedo Trovão', slot: 'simple', row: 1, kind: 'dash', dmg: 12, speed: 18, fx: { shock: 60 }, cd: 48, sfx: 'dash', desc: 'Voa como um raio horizontal pela arena.' },
      { id: 'clone', name: 'Clone das Sombras', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 13, speed: 7, pierce: true, big: true, multiHit: 2, fx: { blind: 160 }, sfx: 'magic', desc: 'Um clone sombrio avança e CEGA o rival.' },
      { id: 'portal', name: 'Portal do Submundo', slot: 'charge', meter: 1, row: 3, kind: 'shadowport', time: 120, burstDmg: 14, fx: { blind: 100 }, sfx: 'magic', desc: 'Afunda num portal de sombra e sai atrás ou por cima do rival. Soco ou chute na saída vira o golpe.' },
      { id: 'storm', name: 'Tempestade do Submundo', slot: 'ultimate', row: 4, kind: 'rain', count: 7, dmg: 38, fx: { shock: 200, blind: 120 }, sfx: 'ultimate', desc: 'Raios negros e azuis caem sobre o rival.' },
    ],
  },
  zoya: {
    element: 'kafka',
    theme: 'Filas, tópicos e entrega exatamente uma vez',
    powers: [
      { id: 'topic', name: 'Tópico Quente', slot: 'simple', row: 0, kind: 'shot', dmg: 12, speed: 11, cd: 40, sfx: 'magic', desc: 'Um envelope de mensagem atravessa a arena.' },
      { id: 'lag', name: 'Consumer Lag', slot: 'simple', row: 1, kind: 'pillar', at: 'target', delay: 10, dmg: 14, slow: 150, cd: 50, sfx: 'whoosh', desc: 'O rival fica preso na fila e anda mais devagar.' },
      { id: 'part', name: 'Partição', slot: 'charge', meter: 0, row: 2, kind: 'wall', time: 280, dmg: 9, sfx: 'heavy', desc: 'Duas paredes de commit seguram projéteis.' },
      { id: 'offset', name: 'Offset', slot: 'charge', meter: 1, row: 3, kind: 'pull', range: 380, dmg: 12, stun: 28, sfx: 'whoosh', desc: 'Rebobina o rival para perto.' },
      { id: 'once', name: 'Exactly-Once', slot: 'ultimate', row: 4, kind: 'barrage', dmg: 6, count: 7, homing: 0.5, finisher: 16, sfx: 'ultimate', desc: 'A fila inteira é entregue de uma vez só.' },
    ],
  },
  rin: {
    element: 'shader',
    theme: 'GPU, vértices e raster',
    powers: [
      { id: 'vert', name: 'Corte de Vértice', slot: 'simple', row: 0, kind: 'dash', dmg: 11, speed: 16, cd: 40, sfx: 'dash', desc: 'Investida luminosa em linha reta.' },
      { id: 'frag', name: 'Chuva de Fragmentos', slot: 'simple', row: 1, kind: 'shot', dmg: 7, speed: 11, count: 3, spread: 0.28, cd: 46, sfx: 'magic', desc: 'Três lascas de shader.' },
      { id: 'compute', name: 'Compute', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 300, speedMult: 1.4, dmgMult: 1.15, sfx: 'shield', desc: 'A GPU sobe o clock de movimento.' },
      { id: 'ray', name: 'Raio de Escudo', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 260, reflect: true, defMult: 0.6, sfx: 'shield', desc: 'Um escudo de luz devolve projéteis.' },
      { id: 'raster', name: 'Raster Infinito', slot: 'ultimate', row: 4, kind: 'blast', at: 'wave', dmg: 34, sfx: 'ultimate', desc: 'Faixas de luz varrem a arena.' },
    ],
  },
  noir: {
    element: 'cipher',
    theme: 'Cifra, prova e conhecimento zero',
    powers: [
      { id: 'hash', name: 'Hash', slot: 'simple', row: 0, kind: 'shot', dmg: 10, speed: 11, homing: 0.25, cd: 44, sfx: 'magic', desc: 'Orbe cifrado que busca o alvo.' },
      { id: 'keyx', name: 'Troca de Chave', slot: 'simple', row: 1, kind: 'dash', dmg: 11, speed: 15, cd: 42, sfx: 'dash', desc: 'Atravessa trocando de lado.' },
      { id: 'proof', name: 'Prova', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 300, reflect: true, dmgMult: 1.2, sfx: 'shield', desc: 'Runas refletem e aumentam o dano.' },
      { id: 'fog', name: 'Texto Cifrado', slot: 'charge', meter: 1, row: 3, kind: 'zone', at: 'target', time: 260, dmg: 0.1, slow: 36, fx: { blind: 80 }, sfx: 'magic', desc: 'Névoa que cega e deixa lento.' },
      { id: 'zk', name: 'Conhecimento Zero', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 36, fx: { blind: 180, lock: 80 }, sfx: 'ultimate', desc: 'O rival não vê o golpe chegar.' },
    ],
  },
});

Object.assign(ELEMENT_FX, {
  kotlin: { sheet: 'arcane', color: '#a97bff' },
  hack: { sheet: 'lightning', color: '#00ff66' },
  java: { sheet: 'fire', color: '#f89820' },
  cromo: { sheet: 'lightning', color: '#00f0ff' },
  trovao: { sheet: 'lightning', color: '#4da3ff' },
  lata: { sheet: 'lata', color: '#3ef0d8' },
  kafka: { sheet: 'arcane', color: '#c060d0' },
  shader: { sheet: 'lightning', color: '#2ad4dc' },
  cipher: { sheet: 'arcane', color: '#9aa6ff' },
});

/* Assinaturas: identidade de cada lutador (exibida na seleção).
   ability = efeitos aplicados a todo acerto de habilidade.
   dodge = chance de esquiva automática; stunMult = tontura;
   chainBonus = cadeias de combo maiores; lowHpRage = dano com pouca vida. */
const SIGNATURES = {
  du: { trait: 'MAGMA VIVO (queima + explosão + stun)', desc: 'Todo acerto queima forte, explode e enche a barra de tontura. Com pouca vida, +25% de dano.', ability: { burn: 120, explode: 3, stun: 8 }, lowHpRage: 1.25, stunMult: 1.2 },
  iales: { trait: 'TODOS OS STATUS', desc: 'Auto aim + roubo de kit + drena vida; golpes aplicam cegueira, choque, veneno, gelo, sangramento, lentidão, travamento e queimadura.', ability: { drain: 0.1, vuln: 80, shock: 40, blind: 40 } },
  felipinho: { trait: 'ÁGUA', desc: 'Habilidades deixam o rival lento e roubam vida.', ability: { slow: 90, drain: 0.1 } },
  stack: { trait: 'OVERCLOCK SECO', desc: 'Chip 1155, chave de fenda e pasta térmica. O clock sobe — e queima se passar do ponto.', ability: { burn: 30 } },
  gitmaster: { trait: 'CEGUEIRA', desc: 'Sombras embaçam a tela do rival.', ability: { blind: 120 } },
  bughunter: { trait: 'DANO CONTÍNUO', desc: 'Todo acerto de habilidade envenena.', ability: { poison: 120 } },
  frontend: { trait: 'ELÉTRICO', desc: 'Neon eletriza: os controles do rival se mexem sozinhos.', ability: { shock: 90 } },
  backend: { trait: 'STUN', desc: 'Enche a barra de tontura do rival mais rápido.', ability: { stun: 10 }, stunMult: 1.2 },
  devops: { trait: 'EXPLOSÃO', desc: 'Habilidades causam explosões extras.', ability: { explode: 3 } },
  qa: { trait: 'CORROSÃO', desc: 'Ácido deixa o rival VULNERÁVEL e envenenado.', ability: { vuln: 180, poison: 100 } },
  scrum: { trait: 'GELO / LENTIDÃO', desc: 'O tempo congela: habilidades deixam o rival lento.', ability: { chill: 150 } },
  fullstack: { trait: 'COMBOS', desc: 'Cadeias de combo com 2 golpes a mais.', ability: { meterBurn: 5 }, chainBonus: 2 },
  kotlin: { trait: 'RAPIDEZ + GELO', desc: 'A mais rápida do jogo; cristais causam lentidão.', ability: { chill: 80 }, chainBonus: 1 },
  hacker: { trait: 'ROOTKIT', desc: 'Some na aproximação, abre backdoor, infecta o medidor e derruba o kernel.', ability: { shock: 40, meterBurn: 5 } },
  java: { trait: 'TANQUE + EXPLOSÃO', desc: 'Armadura pesada; habilidades queimam e explodem.', ability: { burn: 90 } },
  merc: { trait: 'ESQUIVA', desc: 'Passo fantasma atravessa o rival; um desvio limpo devolve medidor.', ability: { bleed: 100 }, dodge: 0.1 },
  bhm: { trait: 'RAIO + SOMBRA', desc: 'Eletriza os controles, cega e atravessa o chão como um portal.', ability: { shock: 70 } },
  zoya: { trait: 'FILAS', desc: 'Mensagens que atrasam, puxam e atravessam a arena.', ability: { slow: 60 } },
  rin: { trait: 'SHADER', desc: 'Cortes de luz e velocidade de GPU.', ability: { chill: 40 } },
  noir: { trait: 'CIFRA', desc: 'Trava a leitura do rival e reflete o que vem de frente.', ability: { blind: 50 } },
};
