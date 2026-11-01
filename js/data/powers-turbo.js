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
    theme: 'Kali Linux, Nmap, phishing e exploits',
    powers: [
      { id: 'nmap', name: 'Nmap Scan', slot: 'simple', row: 0, kind: 'pillar', at: 'target', delay: 10, dmg: 6, stun: 20, fx: { vuln: 300 }, cd: 50, sfx: 'magic', desc: 'Escaneia o rival: ele fica VULNERÁVEL (+20% de dano).' },
      { id: 'phish', name: 'Link de Phishing', slot: 'simple', row: 1, kind: 'pull', range: 400, dmg: 9, stun: 36, cd: 60, sfx: 'whoosh', desc: 'Um link malicioso puxa o rival para perto.' },
      { id: 'glitch', name: 'Glitch do Kali', slot: 'charge', meter: 0, row: 2, kind: 'shot', dmg: 10, speed: 10, fx: { blind: 200 }, sfx: 'magic', desc: 'Pacote corrompido: a tela do rival fica EMBAÇADA.' },
      { id: 'ddos', name: 'Ataque DDoS', slot: 'charge', meter: 1, row: 3, kind: 'shot', dmg: 14, speed: 4, multiHit: 4, pierce: true, big: true, fx: { shock: 180 }, sfx: 'thunder_cast', desc: 'Nuvem de pacotes: os controles do rival enlouquecem.' },
      { id: 'sudo', name: 'sudo rm -rf Dragão', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', dmg: 32, fx: { lock: 300, shock: 120 }, sfx: 'ultimate', desc: 'Dragão de código root: dano e rival SEM PODERES por 5 s.' },
    ],
  },
  java: {
    element: 'java',
    theme: 'Java, JVM, café e Garbage Collector',
    powers: [
      { id: 'espresso', name: 'Grão Expresso', slot: 'simple', row: 0, kind: 'shot', dmg: 11, speed: 9, heavy: true, burn: 120, cd: 46, sfx: 'fire', desc: 'Um grão de café em chamas.' },
      { id: 'gc', name: 'Garbage Collector', slot: 'simple', row: 1, kind: 'pull', range: 300, dmg: 10, stun: 32, cd: 58, sfx: 'whoosh', desc: 'Vórtice que coleta o rival para perto.' },
      { id: 'jvm', name: 'JVM Aquecida', slot: 'charge', meter: 0, row: 2, kind: 'aura', time: 400, armor: true, dmgMult: 1.1, defMult: 0.82, heal: 6, sfx: 'shield', desc: 'Super armadura, mais dano e menos dano recebido.' },
      { id: 'soe', name: 'StackOverflowError', slot: 'charge', meter: 1, row: 3, kind: 'pillar', at: 'target', delay: 18, dmg: 19, launch: -10, fx: { explode: 4 }, sfx: 'explosion', desc: 'Uma torre de frames desaba e EXPLODE no rival.' },
      { id: 'beans', name: 'Meteoro de Beans', slot: 'ultimate', row: 4, kind: 'rain', count: 5, dmg: 34, burn: 160, fx: { explode: 3 }, sfx: 'ultimate', desc: 'Beans gigantes em chamas caem do céu.' },
    ],
  },
  merc: {
    element: 'cromo',
    theme: 'Implantes cibernéticos, esquiva e tempo desacelerado',
    powers: [
      { id: 'blink', name: 'Passo Fantasma', slot: 'simple', row: 0, kind: 'dash', dmg: 9, speed: 21, cd: 34, sfx: 'dash', desc: 'Atravessa o rival deixando imagens residuais.' },
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
      { id: 'portal', name: 'Portal do Submundo', slot: 'charge', meter: 1, row: 3, kind: 'aura', time: 120, teleportBehind: true, invuln: 40, burstDmg: 12, fx: { blind: 120 }, sfx: 'dash', desc: 'Some num portal e reaparece atrás do rival.' },
      { id: 'storm', name: 'Tempestade do Submundo', slot: 'ultimate', row: 4, kind: 'rain', count: 7, dmg: 38, fx: { shock: 200, blind: 120 }, sfx: 'ultimate', desc: 'Raios negros e azuis caem sobre o rival.' },
    ],
  },
});

Object.assign(ELEMENT_FX, {
  kotlin: { sheet: 'arcane', color: '#a97bff' },
  hack: { sheet: 'lightning', color: '#00ff66' },
  java: { sheet: 'fire', color: '#f89820' },
  cromo: { sheet: 'lightning', color: '#00f0ff' },
  trovao: { sheet: 'lightning', color: '#4da3ff' },
});

/* Assinaturas: identidade de cada lutador (exibida na seleção).
   ability = efeitos aplicados a todo acerto de habilidade.
   dodge = chance de esquiva automática; stunMult = tontura;
   chainBonus = cadeias de combo maiores; lowHpRage = dano com pouca vida. */
const SIGNATURES = {
  du: { trait: 'EXPLOSÃO + FÚRIA', desc: 'Habilidades explodem e queimam. Com pouca vida, +25% de dano.', ability: { explode: 3, burn: 60 }, lowHpRage: 1.25 },
  iales: { trait: 'AUTO AIM + ROUBO', desc: 'Tudo persegue o alvo e rouba vida. Rouba as 5 habilidades do rival.', ability: { drain: 0.08 } },
  felipinho: { trait: 'ÁGUA', desc: 'Habilidades deixam o rival lento e roubam vida.', ability: { slow: 90, drain: 0.1 } },
  stack: { trait: 'RAPIDEZ', desc: 'Muito veloz; habilidades queimam energia do rival.', ability: { meterBurn: 6 } },
  gitmaster: { trait: 'CEGUEIRA', desc: 'Sombras embaçam a tela do rival.', ability: { blind: 120 } },
  bughunter: { trait: 'DANO CONTÍNUO', desc: 'Todo acerto de habilidade envenena.', ability: { poison: 200 } },
  frontend: { trait: 'ELÉTRICO', desc: 'Neon eletriza: os controles do rival se mexem sozinhos.', ability: { shock: 90 } },
  backend: { trait: 'STUN', desc: 'Enche a barra de tontura do rival 50% mais rápido.', ability: { stun: 14 }, stunMult: 1.5 },
  devops: { trait: 'EXPLOSÃO', desc: 'Habilidades causam explosões extras.', ability: { explode: 3 } },
  qa: { trait: 'CORROSÃO', desc: 'Ácido deixa o rival VULNERÁVEL e envenenado.', ability: { vuln: 180, poison: 100 } },
  scrum: { trait: 'GELO / LENTIDÃO', desc: 'O tempo congela: habilidades deixam o rival lento.', ability: { chill: 150 } },
  fullstack: { trait: 'COMBOS', desc: 'Cadeias de combo com 2 golpes a mais.', ability: { meterBurn: 5 }, chainBonus: 2 },
  kotlin: { trait: 'RAPIDEZ + GELO', desc: 'A mais rápida do jogo; cristais causam lentidão.', ability: { chill: 80 }, chainBonus: 1 },
  hacker: { trait: 'HACK DE STATUS', desc: 'Cegueira, controles eletrizados, vulnerável e sem poderes.', ability: { meterBurn: 8 } },
  java: { trait: 'TANQUE + EXPLOSÃO', desc: 'Armadura pesada; habilidades queimam e explodem.', ability: { burn: 90 } },
  merc: { trait: 'ESQUIVA', desc: '18% de chance de desviar sozinho; cortes causam sangramento.', ability: { bleed: 120 }, dodge: 0.18 },
  bhm: { trait: 'RAIO + SOMBRA', desc: 'Eletriza os controles e cega o rival.', ability: { shock: 70 } },
};
