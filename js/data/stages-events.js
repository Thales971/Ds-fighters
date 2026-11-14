/* Mapas de evento. Entram no elenco normal: Arcade e Versus jogam o ano inteiro.
   A skin do menu só liga na janela do Events. */
const EVENT_STAGE = (id, name, event, weather, fauna, ambient, blurb, tint) => ({
  id, name, group: event === 'natal' ? 'Natal' : 'Halloween', event, pixel: true,
  image: `assets/maps/events/${id}-mid.png`,
  weather, fauna, ambient, blurb, tint,
  layers: [
    { src: `assets/maps/events/${id}-far.png`, speed: 0.16 },
    { src: `assets/maps/events/${id}-mid.png`, speed: 0.42 },
    { src: `assets/maps/events/${id}-near.png`, speed: 0.78 },
  ],
  props: [
    { cell: 0, x: 48, y: 250, flash: true },
    { cell: 4, x: 910, y: 150, flash: true },
    { cell: 5, x: 80, y: 300, fall: true },
  ],
});

STAGE_LIST.push(
  EVENT_STAGE('natal-praca', 'Praça de Natal', 'natal', ['snow', 'clear', 'wind'], ['birds', 'squirrel', 'dog'], 'amb_parque-lago', 'Praça nevada. Árvore e lago congelado.', '#d7e7ff'),
  EVENT_STAGE('natal-salao', 'Salão de Natal', 'natal', ['snow', 'clear', 'fireflies'], ['cat', 'fireflies'], 'amb_biblioteca-noturna', 'Salão com árvore e neve na janela.', '#f0d8a8'),
  EVENT_STAGE('natal-telhado', 'Telhado Nevando', 'natal', ['snow', 'wind', 'hail'], ['birds', 'pigeons'], 'amb_telhado-escola', 'Telhado gelado. Pombos na cumeeira.', '#c5d8ee'),
  EVENT_STAGE('halloween-rua', 'Rua das Abóboras', 'halloween', ['darkfog', 'fog', 'eclipse'], ['bat', 'cat'], 'amb_rua-centro-noite', 'Rua com abóbora e neblina sombria.', '#6a3a78'),
  EVENT_STAGE('halloween-cemiterio', 'Cemitério da Neblina', 'halloween', ['darkfog', 'fog', 'wind'], ['bat', 'cat'], 'amb_night', 'Lápides, morcego e neblina roxa.', '#3a2848'),
  EVENT_STAGE('halloween-mansao', 'Mansão Assombrada', 'halloween', ['darkfog', 'eclipse', 'clear'], ['bat', 'fireflies'], 'amb_night', 'Salão da mansão. Teia e vela.', '#4a2840')
);
