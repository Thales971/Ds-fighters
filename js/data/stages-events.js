/* Mapas de evento. Entram no elenco normal: Arcade e Versus jogam o ano inteiro.
   A skin do menu só liga na janela do Events. */
const EVENT_GROUP = {
  natal: 'Natal', halloween: 'Halloween', carnaval: 'Carnaval', pascoa: 'Páscoa',
  junina: 'Festa Junina', criancas: 'Dia das Crianças', anonovo: 'Ano Novo',
};
const EVENT_STAGE = (id, name, event, weather, fauna, ambient, blurb, tint, mech) => ({
  id, name, group: EVENT_GROUP[event] || event, event, pixel: true, mech: mech || null, swim: mech === 'tide',
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
  EVENT_STAGE('natal-salao', 'Salão de Natal', 'natal', ['snow', 'clear', 'fireflies'], ['cat', 'fireflies'], 'amb_cafe', 'Lareira, árvore e janela com neve.', '#f0d8a8'),
  EVENT_STAGE('natal-telhado', 'Telhado Nevando', 'natal', ['snow', 'wind', 'hail'], ['birds', 'pigeons'], 'amb_telhado-escola', 'Telhado gelado. Pombos na cumeeira.', '#c5d8ee'),
  EVENT_STAGE('halloween-rua', 'Rua das Abóboras', 'halloween', ['darkfog', 'clear', 'fog'], ['bat', 'cat'], 'amb_rua-centro-noite', 'Casas, lampiões e abóboras acesas.', '#ff9a3c'),
  EVENT_STAGE('halloween-cemiterio', 'Cemitério da Neblina', 'halloween', ['darkfog', 'clear', 'wind'], ['bat', 'cat'], 'amb_night', 'Portão, lápides e lua cheia.', '#9eb4e8'),
  EVENT_STAGE('halloween-mansao', 'Mansão Assombrada', 'halloween', ['darkfog', 'clear', 'eclipse'], ['bat', 'fireflies'], 'amb_night', 'Escadaria, lustre e retratos.', '#e7c27a'),
  EVENT_STAGE('carnaval-sambodromo', 'Sambódromo', 'carnaval', ['confetti', 'clear', 'wind'], ['bird', 'butterfly'], 'amb_arquibancada', 'Avenida do samba. Arquibancada e carros alegóricos.', '#ffd23a'),
  EVENT_STAGE('carnaval-bloco', 'Bloco de Rua', 'carnaval', ['confetti', 'clear', 'wind'], ['bird', 'butterfly', 'dog'], 'amb_feira-valinhos', 'Rua fechada, bateria e bandeirinhas.', '#ff4f8b'),
  EVENT_STAGE('carnaval-ladeiras', 'Ladeiras de Olinda', 'carnaval', ['clear', 'confetti', 'wind'], ['bird', 'butterfly'], 'amb_market', 'Igreja no alto e chão de pedra.', '#ff9a3c'),
  EVENT_STAGE('pascoa-bosque', 'Bosque dos Coelhos', 'pascoa', ['clear', 'leaves', 'rainbow'], ['bird', 'butterfly', 'bee'], 'amb_parque-lago', 'Bosque florido. Ovos nas bordas.', '#ffb3d1'),
  EVENT_STAGE('pascoa-chocolate', 'Fábrica de Chocolate', 'pascoa', ['clear', 'heatwave', 'fireflies'], ['butterfly', 'bee'], 'amb_cafe', 'Rio de chocolate e doces nas máquinas.', '#e7a15a'),
  EVENT_STAGE('pascoa-jardim', 'Jardim Florido', 'pascoa', ['clear', 'rainbow', 'leaves'], ['butterfly', 'bee', 'bird'], 'amb_park', 'Fonte, tulipas e canteiros.', '#7dff6a'),
  EVENT_STAGE('junina-arraial', 'Arraial', 'junina', ['clear', 'fireflies', 'wind'], ['bird', 'butterfly'], 'amb_market', 'Fogueira, bandeirinhas e barracas.', '#ff9a3c'),
  EVENT_STAGE('junina-roca', 'Quadrilha na Roça', 'junina', ['clear', 'wind', 'leaves'], ['bird', 'butterfly', 'bee'], 'amb_park', 'Milharal, celeiro e terreiro.', '#d6a45a'),
  EVENT_STAGE('junina-quermesse', 'Quermesse', 'junina', ['fireworks', 'clear', 'fireflies'], ['bat', 'bird'], 'amb_night', 'Noite de balões, lanternas e fogos.', '#ffd23a'),
  EVENT_STAGE('criancas-parque', 'Parque de Diversões', 'criancas', ['clear', 'wind', 'rainbow'], ['bird', 'butterfly'], 'amb_park', 'Roda-gigante, carrossel e barracas.', '#7ec8ff'),
  EVENT_STAGE('criancas-loja', 'Loja de Brinquedos', 'criancas', ['clear', 'fireflies'], ['butterfly', 'bee'], 'amb_cafe', 'Prateleiras de ursos, blocos e trens.', '#ffb3d1'),
  EVENT_STAGE('criancas-playground', 'Playground da Escola', 'criancas', ['clear', 'wind', 'leaves'], ['bird', 'butterfly', 'bee'], 'amb_park', 'Escorrega, balanço e pátio de terra.', '#7dff6a'),
  EVENT_STAGE('anonovo-copacabana', 'Copacabana', 'anonovo', ['fireworks', 'clear', 'wind'], ['bird', 'fish'], 'amb_represa', 'Calçadão, palmeiras e fogos no mar.', '#7ec8ff', 'tide'),
  EVENT_STAGE('anonovo-paulista', 'Terraço da Paulista', 'anonovo', ['fireworks', 'clear', 'wind'], ['bird', 'bat'], 'amb_night', 'Terraço iluminado e o skyline.', '#ffe14a'),
  EVENT_STAGE('anonovo-reveillon', 'Réveillon à Beira-mar', 'anonovo', ['fireworks', 'wind', 'clear'], ['bird', 'fish'], 'amb_represa', 'Píer, lanternas e fogos na praia.', '#ffd23a', 'tide')
);
