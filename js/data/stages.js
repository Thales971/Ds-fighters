/* ============================================================
   DS FIGHTERS — catálogo original + expansões anexadas ao fim.
   - 10 animados originais (spritesheet em assets/stages, STAGE_SHEETS)
   - 10 do pacote retrô (assets/maps/NN-*.jpg)
   - 6 novos de tecnologia (assets/maps/<id>.jpg)
   Cada mapa define: clima possível, fauna, mecânica exclusiva (mechanics.js),
   gravidade/atrito e o tom de luz usado no pós-processamento.
   ============================================================ */
const STAGE_EXTRA = {
  '01-centro-de-dados': { weather: ['clear', 'storm', 'fog', 'darkfog'], fauna: ['bat'], mech: 'overheat', tint: '#3fd0ff', code: true, motes: true },
  '02-chuva-de-codigo': { weather: ['rain', 'storm'], fauna: ['bat'], mech: 'glyphs', tint: '#3dff7a', code: true, motes: true },
  '03-laboratorio-95': { weather: ['clear', 'rain', 'fog'], fauna: ['fireflies'], mech: 'bsod', tint: '#5fa8ff', sparks: true, motes: true },
  '04-neon-city-exe': { weather: ['rain', 'storm', 'wind'], fauna: ['bat'], mech: 'neonsign', tint: '#ff4fd8', neon: true, glitch: true },
  '05-fight-exe': { weather: ['clear', 'storm'], fauna: ['bat'], mech: 'glitch', tint: '#ff3b5c', glitch: true, neon: true, motes: true },
  '06-fabrica-de-bugs': { weather: ['clear', 'rain', 'fog'], fauna: ['bee', 'butterfly'], mech: 'conveyor', tint: '#ffb03b', sparks: true, fireflies: true },
  '07-placa-mae': { weather: ['clear', 'storm'], fauna: ['fireflies'], mech: 'pulse', tint: '#39ffb0', neon: true, sparks: true, motes: true },
  '08-startup-3am': { weather: ['rain', 'clear'], fauna: ['bat'], mech: 'coffee', tint: '#ffc36b', motes: true },
  '09-deploy-nas-nuvens': { weather: ['wind', 'storm'], fauna: ['bird'], mech: 'gusts', tint: '#a8e4ff', motes: true },
  '10-arena-git': { weather: ['clear', 'wind', 'storm'], fauna: ['bird'], mech: 'revert', tint: '#ff8a3b', sparks: true, motes: true },
  '11-oficina-latas': { weather: ['clear', 'wind'], fauna: ['cat'], mech: 'bench', tint: '#ffc36b', embers: true, sparks: true, motes: true },
  '12-terminal-fosforo': { weather: ['clear', 'rain'], fauna: ['bat'], mech: 'scroll', tint: '#3dff7a', code: true, motes: true },
  '13-metro-pacotes': { weather: ['clear', 'wind', 'storm'], fauna: ['pigeons'], mech: 'train', tint: '#9ab0c8', sparks: true, motes: true },
  '14-catedral-sql': { weather: ['clear', 'storm'], fauna: ['bird'], mech: 'query', tint: '#d2b4ff', motes: true },
};

const STAGE_LIST = [
  ...(typeof STAGE_SHEETS !== 'undefined' ? STAGE_SHEETS : []).filter((s) => s.id !== '10-arena-git' /* retirado a pedido do dono (nov/2026) */).map((s) => Object.assign({}, s, {
    id: s.id, name: s.name, sheet: s.sheet, cols: s.cols, rows: s.rows, frames: s.frames, fps: s.fps,
    frameW: s.frameW, frameH: s.frameH, group: 'Clássicos animados',
  }, STAGE_EXTRA[s.id] || { weather: ['clear'], fauna: [], mech: null, tint: '#ffffff' })),
  { id: '01-neon-rooftop', name: 'Telhado Neon', image: 'assets/maps/01-neon-rooftop.jpg', group: 'Pacote retrô', weather: ['rain', 'storm', 'wind'], fauna: ['bat', 'bird'], mech: 'spotlight', tint: '#ff4fd8', neon: true, glitch: true },
  { id: '02-volcanic-forge', name: 'Forja Vulcânica', image: 'assets/maps/02-volcanic-forge.jpg', group: 'Pacote retrô', weather: ['clear', 'wind', 'heatwave'], fauna: ['bat'], mech: 'lava', tint: '#ff6a1c', embers: true, sparks: true, motes: true },
  { id: '03-underwater-lab', name: 'Laboratório Submarino', image: 'assets/maps/03-underwater-lab.jpg', group: 'Pacote retrô', weather: ['clear', 'bubbles'], fauna: ['fish', 'fish'], mech: 'lowgrav', tint: '#3ecbff', gravity: 0.72, bubbles: true, motes: true, lights: [{ x: 480, y: 90, r: 260, color: '80,200,255', pulse: 0.5 }] },
  { id: '04-storm-temple', name: 'Templo da Tempestade', image: 'assets/maps/04-storm-temple.jpg', group: 'Pacote retrô', weather: ['storm'], fauna: ['bird'], mech: 'lightning', tint: '#ffe14d', motes: true },
  { id: '05-chaos-citadel', name: 'Cidadela do Caos', image: 'assets/maps/05-chaos-citadel.jpg', group: 'Pacote retrô', weather: ['storm', 'wind', 'clear'], fauna: ['bat'], mech: 'rift', tint: '#ff3355', embers: true },
  { id: '06-sakura-dojo', name: 'Dojo Sakura', image: 'assets/maps/06-sakura-dojo.jpg', group: 'Pacote retrô', weather: ['clear', 'wind', 'rain', 'bubbles'], fauna: ['bird', 'butterfly', 'bee'], mech: 'gong', tint: '#ffb3d1', petals: true },
  { id: '07-sky-islands', name: 'Ilhas do Céu', image: 'assets/maps/07-sky-islands.jpg', group: 'Pacote retrô', weather: ['wind', 'clear', 'storm'], fauna: ['bird', 'butterfly'], mech: 'highjump', tint: '#a8e4ff', gravity: 0.82 },
  { id: '08-crystal-cavern', name: 'Caverna de Cristal', image: 'assets/maps/08-crystal-cavern.jpg', group: 'Pacote retrô', weather: ['clear'], fauna: ['bat'], mech: 'bounce', tint: '#c77dff' },
  { id: '09-orbital-core', name: 'Núcleo Orbital', image: 'assets/maps/09-orbital-core.jpg', group: 'Pacote retrô', weather: ['clear', 'aurora', 'eclipse', 'fireflies'], fauna: ['bat', 'fireflies'], mech: 'lowgrav', tint: '#7de0ff', gravity: 0.62, motes: true },
  { id: '10-digital-forest', name: 'Floresta Digital', image: 'assets/maps/10-digital-forest.jpg', group: 'Pacote retrô', weather: ['rain', 'clear', 'wind'], fauna: ['bee', 'butterfly', 'bird'], mech: 'regen', tint: '#7dff9a', fireflies: true },
  { id: 'spring', name: 'Floresta Spring Boot', image: 'assets/maps/spring.jpg', group: 'Tecnologia', weather: ['clear', 'rain', 'wind', 'storm'], fauna: ['bee', 'bee', 'butterfly', 'bird'], mech: 'bees', tint: '#8dff5e', fireflies: true },
  { id: 'hive', name: 'Colmeia JavaScript', image: 'assets/maps/hive.jpg', group: 'Tecnologia', weather: ['clear', 'rain'], fauna: ['bee', 'bee', 'bee'], mech: 'honey', tint: '#ffcf3b' },
  { id: 'docker', name: 'Porto dos Containers', image: 'assets/maps/docker.jpg', group: 'Tecnologia', weather: ['clear', 'wind', 'rain', 'storm'], fauna: ['bird', 'bird'], mech: 'containers', tint: '#ff9a5c' },
  { id: 'kernel', name: 'Ártico do Kernel', image: 'assets/maps/kernel.jpg', group: 'Tecnologia', weather: ['snow', 'wind', 'storm', 'aurora'], fauna: ['bird'], mech: 'ice', tint: '#9dffcf', friction: 0.93, motes: true, lights: [{ x: 480, y: 80, r: 280, color: '150,200,255', pulse: 0.3 }] },
  { id: 'rust', name: 'Fundição Rust', image: 'assets/maps/rust.jpg', group: 'Tecnologia', weather: ['clear', 'wind', 'heatwave'], fauna: ['bat'], mech: 'molten', tint: '#ff7a2a', embers: true, motes: true },
  { id: 'python', name: 'Pântano Python', image: 'assets/maps/python.jpg', group: 'Tecnologia', weather: ['rain', 'storm', 'clear'], fauna: ['butterfly', 'bee', 'bat'], mech: 'serpent', tint: '#5cff8d', fireflies: true },
  { id: 'kotlin', name: 'Ilha Kotlin', image: 'assets/maps/kotlin.jpg', group: 'Expansão Turbo', weather: ['clear', 'wind', 'rain', 'storm'], fauna: ['bird', 'bird', 'butterfly'], mech: 'tide', tint: '#ff9a5c' },
  { id: 'kali', name: 'Covil do Kali', image: 'assets/maps/kali.jpg', group: 'Expansão Turbo', weather: ['clear', 'rain', 'storm'], fauna: ['bat'], mech: 'hack', tint: '#00ff66' },
  { id: 'java', name: 'Torrefação JVM', image: 'assets/maps/java.jpg', group: 'Expansão Turbo', weather: ['clear', 'wind'], fauna: ['bat'], mech: 'gc', tint: '#f89820', embers: true, motes: true },
  { id: 'chrome', name: 'Cidade Cromada', image: 'assets/maps/chrome.jpg', group: 'Expansão Turbo', weather: ['rain', 'storm', 'clear'], fauna: ['bird'], mech: 'drones', tint: '#ff4fd8' },
  { id: 'sesi', name: 'Quadra SESI Valinhos', image: 'assets/maps/sesi.jpg', group: 'Expansão V4', weather: ['clear', 'wind', 'rain'], fauna: ['pigeons', 'dog'], mech: 'sesi', tint: '#e30613', torcida: { rows: [{ y: 160, scale: 0.21, x0: 0, x1: 225, gap: 1.1 }, { y: 160, scale: 0.21, x0: 415, x1: 830, gap: 1.1 }] }, motes: true },
  { id: 'sesi-patio', name: 'Pátio SESI Valinhos', image: 'assets/maps/sesi-patio.jpg', group: 'Expansão V4', weather: ['clear', 'wind', 'leaves', 'rain', 'bubbles'], fauna: ['pigeons', 'dog'], mech: 'sesi', tint: '#ffcf95', torcida: { rows: [{ y: 330, scale: 0.3, x0: 0, x1: 210 }, { y: 330, scale: 0.3, x0: 770, x1: 960 }] }, motes: true },
  { id: 'senai-valinhos', name: 'Oficina SENAI Valinhos', image: 'assets/maps/senai-valinhos.jpg', group: 'Expansão V4', weather: ['clear', 'rain', 'wind'], fauna: ['pigeons', 'cat'], mech: 'pulse', tint: '#c6dbeb', motes: true },
  { id: 'japan', name: 'Jardim do Sol Nascente', image: 'assets/maps/japan.jpg', group: 'Expansão V5', weather: ['clear', 'wind', 'bubbles'], fauna: ['bird', 'butterfly'], mech: 'gong', tint: '#ffc28b', petals: true },
  { id: 'cyberpunk', name: 'Distrito Neon 2077', image: 'assets/maps/cyberpunk.jpg', group: 'Expansão V5', weather: ['rain', 'clear', 'storm', 'fog'], fauna: ['bat'], mech: 'neonsign', tint: '#b09aff', motes: true, lights: [{ x: 240, y: 150, r: 130, color: '255,80,220' }, { x: 720, y: 150, r: 130, color: '80,240,255' }] },
  { id: 'dojo-noite', name: 'Dojo à Noite', image: 'assets/maps/dojo-noite.jpg', group: 'Novos V6', weather: ['clear', 'rain', 'fireflies', 'eclipse'], fauna: ['bat', 'fireflies'], mech: 'gong', tint: '#ff9a5c', motes: true, lights: [{ x: 200, y: 140, r: 120, color: '255,190,110' }, { x: 760, y: 140, r: 120, color: '255,190,110' }] },
  { id: 'treino-dojo', name: 'Dojo de Treino', image: 'assets/maps/treino-dojo.jpg', group: 'Novos V6', weather: ['clear'], fauna: ['cat'], mech: null, tint: '#d8b98a', motes: true },
  { id: 'circo', name: 'Circo Abandonado', image: 'assets/maps/circo.jpg', group: 'Novos V6', weather: ['clear', 'wind', 'confetti', 'fireworks', 'bubbles'], fauna: ['pigeons'], mech: 'spotlight', tint: '#ffb03b', torcida: { rows: [{ y: 398, scale: 0.36, x0: 0, x1: 330, gap: 1.15 }, { y: 398, scale: 0.36, x0: 610, x1: 960, gap: 1.15 }] }, motes: true, lights: [{ x: 240, y: 110, r: 150, color: '255,120,80' }, { x: 720, y: 110, r: 150, color: '120,180,255' }] },
  { id: 'pizzaria', name: 'Pizzaria à Noite', image: 'assets/maps/pizzaria.jpg', group: 'Novos V6', weather: ['clear', 'rain', 'fireflies'], fauna: ['cat'], mech: 'coffee', tint: '#ff6a2a', motes: true, lights: [{ x: 480, y: 120, r: 180, color: '255,170,90' }] },
];

STAGE_LIST.push(
  { id: 'area-de-trabalho', name: 'Área de Trabalho', image: 'assets/maps/area-de-trabalho.jpg', group: 'Expansão V7', weather: ['clear', 'rain', 'fog'], fauna: ['cat'], mech: 'pulse', tint: '#4db9ff', motes: true },
  { id: 'abismo-das-baleias', name: 'Abismo das Baleias', image: 'assets/maps/abismo-das-baleias.jpg', group: 'Expansão V7', weather: ['clear', 'bubbles'], fauna: ['fish', 'fish'], mech: 'tide', tint: '#2aaedc', bubbles: true, lights: [{ x: 480, y: 90, r: 260, color: '60,170,255', pulse: 0.5 }] },
  { id: 'vale-do-cache', name: 'Vale do Cache', image: 'assets/maps/vale-do-cache.jpg', group: 'Expansão V7', weather: ['clear', 'wind', 'heatwave'], fauna: ['bird'], mech: 'query', tint: '#d6a45a', fireflies: true },
  { id: 'pos-codigocalipse', name: 'Pós-Codigocalipse', image: 'assets/maps/pos-codigocalipse.jpg', group: 'Expansão V8', weather: ['clear', 'storm', 'aurora', 'eclipse', 'fireflies', 'darkfog'], fauna: ['bat'], mech: 'glitch', tint: '#a783ff', embers: true, motes: true },
  /* Mapas novos do dono (arte-fonte/mapas-novos/ -> tools/build_mapas_novos.py), cada um com clima EXCLUSIVO */
  { id: 'metropole-dia-noite', name: 'Metrópole Dia & Noite', image: 'assets/maps/metropole-dia-noite.jpg', group: 'Novos do Dono', weather: ['diaenoite', 'diaenoite', 'clear'], fauna: ['birds'], tint: '#ff4b6b', motes: true, lights: [{ x: 480, y: 200, r: 160, color: '255,60,60', pulse: 0.8 }] },
  { id: 'churrasco-laje', name: 'Churrasco na Laje', image: 'assets/maps/churrasco-laje.jpg', group: 'Novos do Dono', weather: ['churrasco', 'churrasco', 'clear', 'fireflies'], fauna: ['cat'], tint: '#ffb06b', ambient: 'amb_cafe', motes: true, lights: [{ x: 540, y: 260, r: 200, color: '255,150,60', pulse: 0.5 }] },
  { id: 'datacenter-abandonado', name: 'Data Center Abandonado', image: 'assets/maps/datacenter-abandonado.jpg', group: 'Novos do Dono', weather: ['apagao', 'apagao', 'darkfog', 'clear'], fauna: ['bat'], tint: '#5dffb0', ambient: 'amb_corredor-datacenter', motes: true, sparks: true },
);

/* Compatibilidade com código antigo. */
const STAGES = STAGE_LIST;

const WEATHER_INFO = {
  clear: { name: 'Céu limpo', icon: '☀', desc: 'Sem efeitos.' },
  rain: { name: 'Chuva', icon: '☂', desc: 'Água e raio +15%, fogo -15%. Chão escorregadio.' },
  wind: { name: 'Ventania', icon: '≋', desc: 'Rajadas empurram lutadores e projéteis.' },
  storm: { name: 'Tempestade', icon: 'ϟ', desc: 'Chuva + vento + raios na arena. Raio +25%.' },
  snow: { name: 'Nevasca', icon: '❄', desc: 'Movimento 8% mais lento. Gelo +20%.' },
  aurora: { name: 'Aurora Boreal', icon: '✧', desc: 'Faixas ciano e violeta no céu. Ganho de medidor +8% para ambos.' },
  heatwave: { name: 'Onda de Calor', icon: '♨', desc: 'Fogo/magma +8%; água/gelo −5%. Sem dano ambiental.' },
  fireflies: { name: 'Noite de Vagalumes', icon: '✦', desc: 'Noite mágica: medidor +6%.' },
  leaves: { name: 'Chuva de Folhas', icon: '❦', desc: 'Chão de folhas: dashes 10% mais longos.' },
  hail: { name: 'Granizo', icon: '❄', desc: 'Pedras de gelo: lasca de 2 em quem fica no chão.' },
  eclipse: { name: 'Eclipse', icon: '🌑', desc: 'Escuridão: medidor +10%.' },
  rainbow: { name: 'Arco-Íris', icon: '🌈', desc: 'Pós-chuva: cura lenta para TODOS os lutadores.' },
  fog: { name: 'Neblina', icon: '☁', desc: 'Bancos de neblina na arena — a visão fica embaçada para todos.' },
  darkfog: { name: 'Neblina Sombria', icon: '☾', desc: 'Névoa roxa só no fundo da arena. O lutador continua nítido.' },
  confetti: { name: 'Confete', icon: '🎊', desc: 'Serpentina e confete caindo. Só visual, sem empurrar nem machucar.' },
  fireworks: { name: 'Fogos', icon: '🎆', desc: 'Fogos no céu. Só visual, sem escurecer a arena.' },
  diaenoite: { name: 'Virada Dia & Noite', icon: '🌗', desc: 'O laser divisor do meio dispara de tempos em tempos. Do lado do DIA o medidor enche 10% mais rápido.' },
  churrasco: { name: 'Cheiro de Churrasco', icon: '🍖', desc: 'Fumaça e brasas: cura lenta para os dois e, de vez em quando, sai um espetinho (energia) no chão.' },
  apagao: { name: 'Apagão', icon: '💡', desc: 'As luzes piscam e caem: no apagão a tela escurece e um surto elétrico dá choque em quem estiver no chão.' },
  bubbles: { name: 'Bolhas de Sabão', icon: '🫧', desc: 'Bolhas sobem pela arena e estouram em quem encosta: cada bolha estourada dá +1,5 de ultimate.' },
};

const MECH_INFO = {
  tide: 'MARÉ ALTA: ondas empurram os lutadores para um lado.',
  hack: 'INVASÃO: um lutador é hackeado e fica com os controles eletrizados.',
  gc: 'GARBAGE COLLECTOR: limpa projéteis e zonas e puxa todos ao centro.',
  drones: 'DRONES: disparos do céu miram um lutador.',
  sesi: 'TORCIDA DO SESI: bolas de futsal caem da galeria e o sinal do intervalo enche a energia de todos.',
  overheat: 'SUPERAQUECIMENTO: zonas do piso esquentam e queimam.',
  glyphs: 'CHUVA DE CÓDIGO: colunas de glifos caem e deixam lento.',
  bsod: 'TELA AZUL: o sistema trava os dois e solta energia.',
  neonsign: 'LETREIRO SOLTO: letreiros neon despencam na arena.',
  glitch: 'GLITCH: os lutadores trocam de lugar de repente.',
  conveyor: 'ESTEIRA: o piso arrasta os lutadores.',
  pulse: 'PULSO ELÉTRICO: corrente corre pelo chão. Pule!',
  coffee: 'CAFÉ DAS 3H: cafés caem e dão velocidade.',
  gusts: 'RAJADAS: vento muito forte que troca de direção.',
  revert: 'GIT REVERT: as posições voltam 3 segundos no tempo.',
  spotlight: 'HOLOFOTE: quem fica na luz causa +25% de dano.',
  lava: 'ERUPÇÕES: o chão expele lava.',
  lowgrav: 'BAIXA GRAVIDADE: pulos longos e flutuantes.',
  lightning: 'FÚRIA DO CÉU: raios caem com aviso.',
  rift: 'FENDA DO CAOS: fendas dão buff ou maldição aleatória.',
  gong: 'GONGO: a cada toque, todos ganham energia.',
  highjump: 'CORRENTE DE AR: pulos mais altos.',
  bounce: 'CRISTAIS: projéteis ricocheteiam nas bordas.',
  regen: 'BIOMA VIVO: quem não ataca regenera devagar.',
  bees: 'ENXAME: abelhas perseguem quem apanhou por último.',
  honey: 'MEL: poças de mel deixam lento.',
  containers: 'GUINDASTE: containers despencam com sombra de aviso.',
  ice: 'GELO: o chão escorrega muito.',
  molten: 'METAL DERRETIDO: cadinhos derramam metal quente.',
  serpent: 'SERPENTE: a cobra do pântano ataca as bordas.',
  bench: 'BANCADA: peças caem da prateleira.',
  scroll: 'SCROLL: colunas de texto empurram para o lado.',
  train: 'TREM: o vagão empurra a plataforma.',
  query: 'QUERY: um feixe marca quem está no centro.',
};

/* Mapas estáticos viram loops animados de 24 quadros (tools/animate-maps.py). */
if (typeof MAP_ANIM !== 'undefined') {
  STAGE_LIST.forEach((s) => { const a = MAP_ANIM[s.id]; if (a) Object.assign(s, a); });
}
