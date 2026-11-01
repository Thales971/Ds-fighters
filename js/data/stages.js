/* ============================================================
   DS FIGHTERS — 26 cenários.
   - 10 animados originais (spritesheet em assets/stages, STAGE_SHEETS)
   - 10 do pacote retrô (assets/maps/NN-*.jpg)
   - 6 novos de tecnologia (assets/maps/<id>.jpg)
   Cada mapa define: clima possível, fauna, mecânica exclusiva (mechanics.js),
   gravidade/atrito e o tom de luz usado no pós-processamento.
   ============================================================ */
const STAGE_EXTRA = {
  '01-centro-de-dados': { weather: ['clear', 'storm'], fauna: [], mech: 'overheat', tint: '#3fd0ff' },
  '02-chuva-de-codigo': { weather: ['rain', 'storm'], fauna: [], mech: 'glyphs', tint: '#3dff7a' },
  '03-laboratorio-95': { weather: ['clear', 'rain'], fauna: [], mech: 'bsod', tint: '#5fa8ff' },
  '04-neon-city-exe': { weather: ['rain', 'storm', 'wind'], fauna: ['bat'], mech: 'neonsign', tint: '#ff4fd8' },
  '05-fight-exe': { weather: ['clear', 'storm'], fauna: [], mech: 'glitch', tint: '#ff3b5c' },
  '06-fabrica-de-bugs': { weather: ['clear', 'rain'], fauna: ['bee', 'butterfly'], mech: 'conveyor', tint: '#ffb03b' },
  '07-placa-mae': { weather: ['clear', 'storm'], fauna: [], mech: 'pulse', tint: '#39ffb0' },
  '08-startup-3am': { weather: ['rain', 'clear'], fauna: ['bat'], mech: 'coffee', tint: '#ffc36b' },
  '09-deploy-nas-nuvens': { weather: ['wind', 'storm'], fauna: ['bird'], mech: 'gusts', tint: '#a8e4ff' },
  '10-arena-git': { weather: ['clear', 'wind', 'storm'], fauna: ['bird'], mech: 'revert', tint: '#ff8a3b' },
  '11-oficina-latas': { weather: ['clear', 'wind'], fauna: [], mech: 'bench', tint: '#ffc36b', embers: true },
  '12-terminal-fosforo': { weather: ['clear', 'rain'], fauna: [], mech: 'scroll', tint: '#3dff7a' },
  '13-metro-pacotes': { weather: ['clear', 'wind', 'storm'], fauna: [], mech: 'train', tint: '#9ab0c8' },
  '14-catedral-sql': { weather: ['clear', 'storm'], fauna: ['bird'], mech: 'query', tint: '#d2b4ff' },
};

const STAGE_LIST = [
  ...(typeof STAGE_SHEETS !== 'undefined' ? STAGE_SHEETS : []).map((s) => Object.assign({
    id: s.id, name: s.name, sheet: s.sheet, cols: s.cols, rows: s.rows, frames: s.frames, fps: s.fps,
    frameW: s.frameW, frameH: s.frameH, group: 'Clássicos animados',
  }, STAGE_EXTRA[s.id] || { weather: ['clear'], fauna: [], mech: null, tint: '#ffffff' })),
  { id: '01-neon-rooftop', name: 'Telhado Neon', image: 'assets/maps/01-neon-rooftop.jpg', group: 'Pacote retrô', weather: ['rain', 'storm', 'wind'], fauna: ['bat', 'bird'], mech: 'spotlight', tint: '#ff4fd8' },
  { id: '02-volcanic-forge', name: 'Forja Vulcânica', image: 'assets/maps/02-volcanic-forge.jpg', group: 'Pacote retrô', weather: ['clear', 'wind'], fauna: [], mech: 'lava', tint: '#ff6a1c', embers: true },
  { id: '03-underwater-lab', name: 'Laboratório Submarino', image: 'assets/maps/03-underwater-lab.jpg', group: 'Pacote retrô', weather: ['clear'], fauna: ['fish', 'fish'], mech: 'lowgrav', tint: '#3ecbff', gravity: 0.72, bubbles: true },
  { id: '04-storm-temple', name: 'Templo da Tempestade', image: 'assets/maps/04-storm-temple.jpg', group: 'Pacote retrô', weather: ['storm'], fauna: ['bird'], mech: 'lightning', tint: '#ffe14d' },
  { id: '05-chaos-citadel', name: 'Cidadela do Caos', image: 'assets/maps/05-chaos-citadel.jpg', group: 'Pacote retrô', weather: ['storm', 'wind', 'clear'], fauna: ['bat'], mech: 'rift', tint: '#ff3355', embers: true },
  { id: '06-sakura-dojo', name: 'Dojo Sakura', image: 'assets/maps/06-sakura-dojo.jpg', group: 'Pacote retrô', weather: ['clear', 'wind', 'rain'], fauna: ['bird', 'butterfly', 'bee'], mech: 'gong', tint: '#ffb3d1', petals: true },
  { id: '07-sky-islands', name: 'Ilhas do Céu', image: 'assets/maps/07-sky-islands.jpg', group: 'Pacote retrô', weather: ['wind', 'clear', 'storm'], fauna: ['bird', 'butterfly'], mech: 'highjump', tint: '#a8e4ff', gravity: 0.82 },
  { id: '08-crystal-cavern', name: 'Caverna de Cristal', image: 'assets/maps/08-crystal-cavern.jpg', group: 'Pacote retrô', weather: ['clear'], fauna: ['bat'], mech: 'bounce', tint: '#c77dff' },
  { id: '09-orbital-core', name: 'Núcleo Orbital', image: 'assets/maps/09-orbital-core.jpg', group: 'Pacote retrô', weather: ['clear'], fauna: [], mech: 'lowgrav', tint: '#7de0ff', gravity: 0.62 },
  { id: '10-digital-forest', name: 'Floresta Digital', image: 'assets/maps/10-digital-forest.jpg', group: 'Pacote retrô', weather: ['rain', 'clear', 'wind'], fauna: ['bee', 'butterfly', 'bird'], mech: 'regen', tint: '#7dff9a', fireflies: true },
  { id: 'spring', name: 'Floresta Spring Boot', image: 'assets/maps/spring.jpg', group: 'Tecnologia', weather: ['clear', 'rain', 'wind', 'storm'], fauna: ['bee', 'bee', 'butterfly', 'bird'], mech: 'bees', tint: '#8dff5e', fireflies: true },
  { id: 'hive', name: 'Colmeia JavaScript', image: 'assets/maps/hive.jpg', group: 'Tecnologia', weather: ['clear', 'rain'], fauna: ['bee', 'bee', 'bee'], mech: 'honey', tint: '#ffcf3b' },
  { id: 'docker', name: 'Porto dos Containers', image: 'assets/maps/docker.jpg', group: 'Tecnologia', weather: ['clear', 'wind', 'rain', 'storm'], fauna: ['bird', 'bird'], mech: 'containers', tint: '#ff9a5c' },
  { id: 'kernel', name: 'Ártico do Kernel', image: 'assets/maps/kernel.jpg', group: 'Tecnologia', weather: ['snow', 'wind', 'storm'], fauna: [], mech: 'ice', tint: '#9dffcf', friction: 0.93 },
  { id: 'rust', name: 'Fundição Rust', image: 'assets/maps/rust.jpg', group: 'Tecnologia', weather: ['clear', 'wind'], fauna: [], mech: 'molten', tint: '#ff7a2a', embers: true },
  { id: 'python', name: 'Pântano Python', image: 'assets/maps/python.jpg', group: 'Tecnologia', weather: ['rain', 'storm', 'clear'], fauna: ['butterfly', 'bee', 'bat'], mech: 'serpent', tint: '#5cff8d', fireflies: true },
  { id: 'kotlin', name: 'Ilha Kotlin', image: 'assets/maps/kotlin.jpg', group: 'Expansão Turbo', weather: ['clear', 'wind', 'rain', 'storm'], fauna: ['bird', 'bird', 'butterfly'], mech: 'tide', tint: '#ff9a5c' },
  { id: 'kali', name: 'Covil do Kali', image: 'assets/maps/kali.jpg', group: 'Expansão Turbo', weather: ['clear', 'rain', 'storm'], fauna: ['bat'], mech: 'hack', tint: '#00ff66' },
  { id: 'java', name: 'Torrefação JVM', image: 'assets/maps/java.jpg', group: 'Expansão Turbo', weather: ['clear'], fauna: [], mech: 'gc', tint: '#f89820', embers: true },
  { id: 'chrome', name: 'Cidade Cromada', image: 'assets/maps/chrome.jpg', group: 'Expansão Turbo', weather: ['rain', 'storm', 'clear'], fauna: ['bird'], mech: 'drones', tint: '#ff4fd8' },
  { id: 'sesi', name: 'Quadra SESI Valinhos', image: 'assets/maps/sesi.jpg', group: 'Expansão V4', weather: ['clear'], fauna: [], mech: 'sesi', tint: '#e30613' },
  { id: 'sesi-patio', name: 'Pátio SESI Valinhos', image: 'assets/maps/sesi-patio.jpg', group: 'Expansão V4', weather: ['clear'], fauna: [], mech: 'sesi', tint: '#ffcf95' },
];

/* Compatibilidade com código antigo. */
const STAGES = STAGE_LIST;

const WEATHER_INFO = {
  clear: { name: 'Céu limpo', icon: '☀', desc: 'Sem efeitos.' },
  rain: { name: 'Chuva', icon: '☂', desc: 'Água e raio +15%, fogo -15%. Chão escorregadio.' },
  wind: { name: 'Ventania', icon: '≋', desc: 'Rajadas empurram lutadores e projéteis.' },
  storm: { name: 'Tempestade', icon: 'ϟ', desc: 'Chuva + vento + raios na arena. Raio +25%.' },
  snow: { name: 'Nevasca', icon: '❄', desc: 'Movimento 8% mais lento. Gelo +20%.' },
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
