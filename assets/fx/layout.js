/* Gerado por tools/gen-fx.mjs — troque o PNG, mantenha este recorte.
   Cada sheet tem 8 colunas e 5 linhas de frames 96×96.
   Fundo transparente. O jogo lê o clipe pelo nome, não pela cor. */
const FX_LAYOUT = {
  frameW: 96,
  frameH: 96,
  cols: 8,
  clips: {
    projectile: { row: 0, frames: 8 },
    impact: { row: 1, frames: 6 },
    aura: { row: 2, frames: 8 },
    ultimate: { row: 3, frames: 8 },
    flash: { row: 4, frames: 4 },
  },
  sheets: {
    fogo: 'assets/fx/fogo.png',
    gelo: 'assets/fx/gelo.png',
    raio: 'assets/fx/raio.png',
    vento: 'assets/fx/vento.png',
    sombra: 'assets/fx/sombra.png',
    veneno: 'assets/fx/veneno.png',
    neon: 'assets/fx/neon.png',
    terra: 'assets/fx/terra.png',
    metal: 'assets/fx/metal.png',
    acido: 'assets/fx/acido.png',
    tempo: 'assets/fx/tempo.png',
    arcano: 'assets/fx/arcano.png',
    espirito: 'assets/fx/espirito.png',
  },
};
