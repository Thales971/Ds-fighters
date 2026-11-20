/* Palcos V21. Cada um tem parallax, clima, luz, som e o drama do motor. */
STAGE_LIST.push(
  {
    id: 'estacao-valinhos', name: 'Estação Valinhos', group: 'Valinhos', pixel: true, torcida: { rows: [{ y: 345, scale: 0.36, x0: 0, x1: 240 }, { y: 345, scale: 0.36, x0: 590, x1: 900, gap: 1.6 }] },
    image: 'assets/maps/v21/estacao-valinhos-mid.png',
    weather: ['clear', 'wind', 'rain'], fauna: ['pigeons'], tint: '#e7b078', ambient: 'amb_estacao-valinhos', motes: true,
    layers: [
      { src: 'assets/maps/v21/estacao-valinhos-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/estacao-valinhos-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/estacao-valinhos-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'feira-valinhos', name: 'Feira de Valinhos', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/feira-valinhos-mid.png',
    weather: ['clear', 'wind', 'rain'], fauna: ['pigeons', 'dog'], tint: '#ffb15a', ambient: 'amb_feira-valinhos', motes: true,
    layers: [
      { src: 'assets/maps/v21/feira-valinhos-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/feira-valinhos-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/feira-valinhos-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'represa', name: 'Represa', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/represa-mid.png',
    weather: ['clear', 'rain', 'wind', 'hail', 'fog'], fauna: ['birds', 'dragonfly', 'fish', 'frog'], tint: '#7ec8e0', ambient: 'amb_represa', mech: 'tide', motes: true,
    layers: [
      { src: 'assets/maps/v21/represa-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/represa-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/represa-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], fireflies: true
  },
  {
    id: 'rua-centro-noite', name: 'Rua do Centro à Noite', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/rua-centro-noite-mid.png',
    weather: ['clear', 'rain', 'fireflies', 'eclipse', 'darkfog'], fauna: ['cat'], tint: '#9aa0ff', ambient: 'amb_rua-centro-noite', motes: true, lights: [{ x: 160, y: 110, r: 110, color: '255,220,150' }, { x: 800, y: 110, r: 110, color: '255,220,150' }],
    layers: [
      { src: 'assets/maps/v21/rua-centro-noite-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/rua-centro-noite-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/rua-centro-noite-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], neon: true
  },
  {
    id: 'quadra-areia', name: 'Quadra de Areia', group: 'Valinhos', pixel: true, torcida: { rows: [{ y: 290, scale: 0.3, x0: 0, x1: 130 }, { y: 290, scale: 0.3, x0: 830, x1: 960 }] },
    image: 'assets/maps/v21/quadra-areia-mid.png',
    weather: ['clear', 'wind', 'heatwave'], fauna: ['dog'], tint: '#f0d090', ambient: 'amb_quadra-areia', motes: true,
    layers: [
      { src: 'assets/maps/v21/quadra-areia-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/quadra-areia-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/quadra-areia-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'arquibancada', name: 'Arquibancada do Ginásio', group: 'Valinhos', pixel: true, torcida: { rows: [{ y: 230, scale: 0.22, gap: 1.1 }, { y: 262, scale: 0.26, gap: 1.05 }, { y: 294, scale: 0.3 }] },
    image: 'assets/maps/v21/arquibancada-mid.png',
    weather: ['clear', 'wind', 'confetti'], fauna: ['pigeons'], tint: '#e8e8f0', ambient: 'amb_arquibancada', motes: true,
    layers: [
      { src: 'assets/maps/v21/arquibancada-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/arquibancada-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/arquibancada-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'oficina-senai', name: 'Oficina SENAI', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/oficina-senai-mid.png',
    weather: ['clear', 'wind'], fauna: ['cat'], tint: '#c6dbeb', ambient: 'amb_oficina-senai', motes: true,
    layers: [
      { src: 'assets/maps/v21/oficina-senai-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/oficina-senai-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/oficina-senai-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], sparks: true
  },
  {
    id: 'terminal-onibus', name: 'Terminal de Ônibus', group: 'Valinhos', pixel: true, torcida: { rows: [{ y: 345, scale: 0.36, x0: 0, x1: 300, gap: 1.3 }, { y: 345, scale: 0.36, x0: 620, x1: 900, gap: 1.5 }] },
    image: 'assets/maps/v21/terminal-onibus-mid.png',
    weather: ['clear', 'rain', 'wind', 'hail', 'fog'], fauna: ['pigeons'], tint: '#b9c6d4', ambient: 'amb_terminal-onibus', motes: true,
    layers: [
      { src: 'assets/maps/v21/terminal-onibus-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/terminal-onibus-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/terminal-onibus-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'cafe-madrugada', name: 'Café da Madrugada', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/cafe-madrugada-mid.png',
    weather: ['clear', 'rain', 'fireflies'], fauna: ['cat'], tint: '#ffb07a', ambient: 'amb_cafe-madrugada', motes: true, lights: [{ x: 300, y: 130, r: 120, color: '255,200,130' }, { x: 660, y: 130, r: 120, color: '255,200,130' }],
    layers: [
      { src: 'assets/maps/v21/cafe-madrugada-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/cafe-madrugada-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/cafe-madrugada-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'corredor-datacenter', name: 'Corredor do Datacenter', group: 'Código', pixel: true,
    image: 'assets/maps/v21/corredor-datacenter-mid.png',
    weather: ['clear', 'darkfog'], fauna: ['fireflies'], tint: '#7de0ff', ambient: 'amb_corredor-datacenter', motes: true,
    layers: [
      { src: 'assets/maps/v21/corredor-datacenter-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/corredor-datacenter-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/corredor-datacenter-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], neon: true
  },
  {
    id: 'sala-deploy', name: 'Sala de Deploy', group: 'Código', pixel: true,
    image: 'assets/maps/v21/sala-deploy-mid.png',
    weather: ['clear', 'fog'], fauna: ['fireflies'], tint: '#9ad0ff', ambient: 'amb_sala-deploy', motes: true,
    layers: [
      { src: 'assets/maps/v21/sala-deploy-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/sala-deploy-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/sala-deploy-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], neon: true
  },
  {
    id: 'hackerspace', name: 'Hackerspace', group: 'Código', pixel: true,
    image: 'assets/maps/v21/hackerspace-mid.png',
    weather: ['clear', 'rain', 'fog'], fauna: ['cat'], tint: '#c080ff', ambient: 'amb_hackerspace', motes: true,
    layers: [
      { src: 'assets/maps/v21/hackerspace-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/hackerspace-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/hackerspace-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], neon: true
  },
  {
    id: 'telhado-escola', name: 'Telhado da Escola', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/telhado-escola-mid.png',
    weather: ['clear', 'wind', 'leaves', 'rain'], fauna: ['birds', 'cat', 'squirrel', 'butterflies'], tint: '#ffd0a0', ambient: 'amb_telhado-escola', motes: true,
    layers: [
      { src: 'assets/maps/v21/telhado-escola-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/telhado-escola-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/telhado-escola-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'ponte-rio', name: 'Ponte do Rio', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/ponte-rio-mid.png',
    weather: ['clear', 'rain', 'wind', 'leaves', 'hail', 'rainbow'], fauna: ['birds', 'seagull', 'dragonfly', 'fish'], tint: '#8fb4c8', ambient: 'amb_ponte-rio', mech: 'tide', motes: true,
    layers: [
      { src: 'assets/maps/v21/ponte-rio-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/ponte-rio-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/ponte-rio-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'parque-lago', name: 'Parque do Lago', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/parque-lago-mid.png',
    weather: ['clear', 'wind', 'leaves', 'rainbow'], fauna: ['birds', 'dragonfly', 'dog', 'butterflies', 'fish', 'squirrel'], tint: '#b7e39a', ambient: 'amb_parque-lago', mech: 'tide', motes: true,
    layers: [
      { src: 'assets/maps/v21/parque-lago-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/parque-lago-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/parque-lago-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], fireflies: true
  },
  {
    id: 'mercado-municipal', name: 'Mercado Municipal', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/mercado-municipal-mid.png',
    weather: ['clear', 'wind'], fauna: ['pigeons', 'cat'], tint: '#ffd29a', ambient: 'amb_mercado-municipal', motes: true,
    layers: [
      { src: 'assets/maps/v21/mercado-municipal-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/mercado-municipal-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/mercado-municipal-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'estudio-pixel', name: 'Estúdio de Pixel', group: 'Código', pixel: true,
    image: 'assets/maps/v21/estudio-pixel-mid.png',
    weather: ['clear', 'fireflies'], fauna: ['fireflies'], tint: '#ff9ad5', ambient: 'amb_estudio-pixel', motes: true,
    layers: [
      { src: 'assets/maps/v21/estudio-pixel-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/estudio-pixel-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/estudio-pixel-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ], neon: true
  },
  {
    id: 'antena-morro', name: 'Antena no Morro', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/antena-morro-mid.png',
    weather: ['wind', 'storm', 'clear', 'fireflies', 'aurora'], fauna: ['birds', 'fireflies'], tint: '#9ecfff', ambient: 'amb_antena-morro', motes: true,
    layers: [
      { src: 'assets/maps/v21/antena-morro-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/antena-morro-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/antena-morro-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'biblioteca-noturna', name: 'Biblioteca Noturna', group: 'Código', pixel: true,
    image: 'assets/maps/v21/biblioteca-noturna-mid.png',
    weather: ['clear', 'fireflies', 'eclipse', 'darkfog'], fauna: ['cat', 'fireflies'], tint: '#f0d8a8', ambient: 'amb_biblioteca-noturna', motes: true, lights: [{ x: 480, y: 130, r: 210, color: '255,210,140', pulse: 0.6 }],
    layers: [
      { src: 'assets/maps/v21/biblioteca-noturna-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/biblioteca-noturna-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/biblioteca-noturna-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  },
  {
    id: 'pista-skate', name: 'Pista de Skate', group: 'Valinhos', pixel: true,
    image: 'assets/maps/v21/pista-skate-mid.png',
    weather: ['clear', 'wind', 'leaves'], fauna: ['dog', 'pigeons'], tint: '#ffb080', ambient: 'amb_pista-skate', motes: true,
    layers: [
      { src: 'assets/maps/v21/pista-skate-far.png', speed: 0.16 },
      { src: 'assets/maps/v21/pista-skate-mid.png', speed: 0.42 },
      { src: 'assets/maps/v21/pista-skate-near.png', speed: 0.78 }
    ],
    props: [
      { cell: 0, x: 48, y: 250, flash: true },
      { cell: 4, x: 910, y: 150, flash: true },
      { cell: 2, x: 96, y: 360 },
      { cell: 2, x: 860, y: 360 },
      { cell: 5, x: 70, y: 300, fall: true }
    ]
  }
);
