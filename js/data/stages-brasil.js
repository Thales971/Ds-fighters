/* Paisagens brasileiras. Entram no Arcade e no Versus o ano inteiro.
   Maré alta só nos mapas cujo piso encontra a água. */
const BRASIL_STAGE = (id, name, weather, fauna, ambient, blurb, tint, mech) => ({
  id, name, group: 'Brasil', pixel: true, mech: mech || null,
  image: `assets/maps/brasil/${id}-mid.png`,
  weather, fauna, ambient, blurb, tint,
  layers: [
    { src: `assets/maps/brasil/${id}-far.png`, speed: 0.16 },
    { src: `assets/maps/brasil/${id}-mid.png`, speed: 0.42 },
    { src: `assets/maps/brasil/${id}-near.png`, speed: 0.78 },
  ],
  props: [
    { cell: 0, x: 48, y: 250, flash: true },
    { cell: 4, x: 910, y: 150, flash: true },
    { cell: 5, x: 80, y: 300, fall: true },
  ],
});

STAGE_LIST.push(
  BRASIL_STAGE('campos-jordao', 'Vila de Campos do Jordão', ['snow', 'wind', 'hail'], ['bird', 'bird'], 'amb_park', 'Rua de pinheiros sob nevasca. Calçada de madeira.', '#d7e7ff'),
  BRASIL_STAGE('serra-neblina', 'Mirante da Serra', ['darkfog', 'fog', 'wind'], ['bird', 'bat'], 'amb_night', 'Serra do Mar na neblina. O mirante continua claro.', '#9eb4e8'),
  BRASIL_STAGE('manguezal', 'Manguezal', ['fireflies', 'rain', 'darkfog'], ['bird', 'fish'], 'amb_represa', 'Passarela entre raízes, vagalumes e água escura.', '#6a8f78', 'tide'),
  BRASIL_STAGE('paraty', 'Cais de Paraty', ['rain', 'wind', 'leaves'], ['bird', 'fish'], 'amb_market', 'Pedras coloniais, barcos vazios e chuva no cais.', '#e7c27a', 'tide'),
  BRASIL_STAGE('doca-amazonas', 'Doca do Amazonas', ['rain', 'storm', 'leaves'], ['bird', 'butterfly', 'fish'], 'amb_parque-lago', 'Trapiche de madeira e a mata na outra margem.', '#7ec8a0', 'tide'),
  BRASIL_STAGE('lencois', 'Lençóis Maranhenses', ['heatwave', 'wind'], ['bird', 'bird'], 'amb_park', 'Dunas brancas, lagoas azuis e ar quente.', '#f0d8a8'),
  BRASIL_STAGE('iguacu', 'Passarela do Iguaçu', ['rain', 'fog', 'wind'], ['bird', 'butterfly'], 'amb_represa', 'Deck de madeira de frente para as quedas.', '#9ec8ee'),
  BRASIL_STAGE('chapada', 'Mirante da Chapada', ['heatwave', 'wind', 'leaves'], ['bird', 'butterfly'], 'amb_park', 'Cânion vermelho e vento quente.', '#e09060'),
  BRASIL_STAGE('tijuca', 'Trilha da Tijuca', ['leaves', 'rain', 'wind'], ['bird', 'butterfly', 'bee'], 'amb_park', 'Mata atlântica, folhas caindo e um riacho na beira.', '#7dff6a'),
  BRASIL_STAGE('cafezal', 'Terreiro do Café', ['heatwave', 'leaves', 'wind'], ['bird', 'bee'], 'amb_cafe', 'Pátio de secagem e pés de café nas coxilhas.', '#c4784a'),
  BRASIL_STAGE('sitio-manga', 'Sítio da Mangueira', ['leaves', 'wind', 'rainbow'], ['bird', 'butterfly', 'bee'], 'amb_park', 'Terreiro de terra, mangueira e caixa d’água.', '#d6a45a'),
  BRASIL_STAGE('varzea', 'Campinho da Várzea', ['wind', 'leaves', 'rain'], ['bird', 'butterfly'], 'amb_quadra-areia', 'Campo de terra, vento e refletores do bairro.', '#7ec86a'),
  BRASIL_STAGE('beco-batman', 'Beco do Batman', ['rainbow', 'wind', 'leaves'], ['butterfly', 'bird', 'bee'], 'amb_market', 'Beco de muros coloridos, sem letreiro.', '#ff9ad5'),
  BRASIL_STAGE('santa-teresa', 'Parada de Santa Teresa', ['rain', 'wind', 'leaves'], ['bird', 'butterfly'], 'amb_estacao-valinhos', 'Ponto do bonde e as casas na ladeira.', '#ffd23a'),
  BRASIL_STAGE('arcos-lapa', 'Arcos da Lapa', ['fireflies', 'darkfog', 'fog'], ['bat', 'bird'], 'amb_night', 'Aqueduto iluminado e vagalumes. A praça não fica preta.', '#c9b6ff'),
  BRASIL_STAGE('ibirapuera', 'Parque Ibirapuera', ['rainbow', 'wind', 'leaves'], ['bird', 'butterfly', 'bee'], 'amb_park', 'Gramado, lago ao fundo e o pavilhão.', '#7ec8ff'),
  BRASIL_STAGE('teatro-amazonas', 'Largo do Teatro', ['rain', 'wind', 'leaves'], ['bird', 'butterfly'], 'amb_market', 'Praça do Teatro Amazonas debaixo de chuva leve.', '#e7a15a'),
  BRASIL_STAGE('bonito', 'Rio de Bonito', ['rainbow', 'wind', 'leaves'], ['fish', 'bird', 'butterfly'], 'amb_represa', 'Deck sobre a água clara. Os peixes passam embaixo.', '#7ee0d0', 'tide'),
  BRASIL_STAGE('ouro-preto', 'Largo de Ouro Preto', ['fog', 'wind', 'leaves'], ['bird', 'butterfly'], 'amb_market', 'Igreja barroca, ladeira de pedra e neblina.', '#e7c27a'),
  BRASIL_STAGE('jericoacoara', 'Duna de Jeri', ['wind', 'heatwave', 'leaves'], ['bird', 'bird'], 'amb_park', 'Areia, coqueiros e ventania no fim da duna.', '#ffd27a')
);
