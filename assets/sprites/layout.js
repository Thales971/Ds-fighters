/* Gerado por tools/pack-roster.mjs — não edite à mão. */
const SPRITE_LAYOUT = {
  "frameW": 320,
  "frameH": 260,
  "cols": 4,
  "baseline": 246,
  "drawScale": 1,
  "poses": [
    "idle",
    "walk",
    "jump",
    "crouch",
    "punch",
    "kick",
    "cpunch",
    "ckick",
    "jpunch",
    "jkick",
    "special",
    "hit",
    "block",
    "ko",
    "win"
  ],
  "frames": {
    "idle": 4,
    "walk": 4,
    "jump": 2,
    "crouch": 2,
    "punch": 4,
    "kick": 4,
    "cpunch": 2,
    "ckick": 3,
    "jpunch": 3,
    "jkick": 3,
    "special": 2,
    "hit": 2,
    "block": 2,
    "ko": 2,
    "win": 2
  },
  "files": {
    "du": "assets/sprites/du.png",
    "iales": "assets/sprites/iales.png",
    "felipinho": "assets/sprites/felipinho.png",
    "stack": "assets/sprites/stack.png",
    "gitmaster": "assets/sprites/gitmaster.png",
    "bughunter": "assets/sprites/bughunter.png",
    "frontend": "assets/sprites/frontend.png",
    "backend": "assets/sprites/backend.png",
    "devops": "assets/sprites/devops.png",
    "qa": "assets/sprites/qa.png",
    "kotlin": "assets/sprites/kotlin.png",
    "hacker": "assets/sprites/hacker.png",
    "java": "assets/sprites/java.png",
    "merc": "assets/sprites/merc.png",
    "xeon": "assets/sprites/xeon.png",
    "urbano": "assets/sprites/urbano.png",
    "qwen": "assets/sprites/qwen.png",
    "qwen-astra": "assets/sprites/qwen-astra.png",
    "bhm": "assets/sprites/bhm.png",
    "scrum": "assets/sprites/scrum.png",
    "fullstack": "assets/sprites/fullstack.png",
    "thl": "assets/sprites/thl.png",
    "dolynho": "assets/sprites/dolynho.png",
    "lobao": "assets/sprites/lobao.png",
    "winx-exe": "assets/sprites/winx-exe.png",
    "dandara-query": "assets/sprites/dandara-query.png",
    "nina-vector": "assets/sprites/nina-vector.png",
    "gemini": "assets/sprites/gemini.png",
    "meta": "assets/sprites/meta.png",
    "mis": "assets/sprites/mis.png",
    "dev-senior": "assets/sprites/dev-senior.png",
    "dev-senior-nano": "assets/sprites/dev-senior-nano.png",
    "dev-veterano": "assets/sprites/dev-veterano.png",
    "hana": "assets/sprites/hana.png",
    "cyber-psicopata": "assets/sprites/cyber-psicopata.png",
    "grika": "assets/sprites/grika.png",
    "guarda-digital": "assets/sprites/guarda-digital.png"
  }
};

/* Folhas refinadas têm quatro fases; folhas legadas mantêm o timing original. */
SPRITE_LAYOUT.perFighter = Object.fromEntries(['urbano', 'stack', 'qwen', 'thl', 'dolynho', 'lobao'].map((id) => [id, {
  frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
}]));

/* V7/V10/V11: folhas expandidas para 4x15 (uma linha por pose) — sem rows custom. */

/* V8: Winx e Nina têm uma linha real para cada pose do motor. */
['winx-exe', 'nina-vector'].forEach((id) => {
  SPRITE_LAYOUT.perFighter[id] = {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
  };
});

/* V12: normalizacao visual das folhas refinadas (mis, nina, gemini, meta). Todas as poses delas ocupam a celula inteira (198px de altura, ate
   304px de largura), enquanto o elenco classico bloqueia/agacha a ~115-124px.
   Resultado: ao defender, agachar, atacar agachado ou tomar porrada elas
   pareciam GIGANTES. poseScale e aplicado pelo blit com pivo no PE: encolhe a
   silhueta sem tirar ninguem do chao. */
/* V12o: normalizacao COMPLETA — elas ainda ficavam grandes em diversas
   poses (walk/punch/kick/special/win a 198px de altura cheia vs ~145-170
   do elenco classico). Todas as poses de acao na faixa do elenco, pivo no pe. */
['mis', 'gemini', 'meta'].forEach((id) => {
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    poseScale: {
      block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8,
      walk: 0.85, punch: 0.85, kick: 0.85, jpunch: 0.85, jkick: 0.85,
      special: 0.8, win: 0.75,
    },
  });
});
/* Nina e uma composicao piloto+mecha: normalizacao mais suave. */
SPRITE_LAYOUT.perFighter['nina-vector'] = Object.assign(SPRITE_LAYOUT.perFighter['nina-vector'] || {}, {
  poseScale: { block: 0.8, crouch: 0.8, walk: 0.85, hit: 0.8 },
});

/* V12m: as DEMAIS folhas refinadas (dev-senior, dev-senior-nano, dandara,
   winx) tem o mesmo defeito: hit/win em altura cheia (198px vs ~172/144 do
   elenco classico) — ao tomar dano ou vencer elas pareciam GIGANTES.
   Mesmo tratamento das outras: pose compacta com pivo no pe. */
['dev-senior', 'dev-senior-nano', 'dandara-query', 'winx-exe'].forEach((id) => {
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, win: 0.75 },
  });
});

/* Fim do layout. */
