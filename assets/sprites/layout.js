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
    "zoya": "assets/sprites/zoya.png",
    "rin": "assets/sprites/rin.png",
    "noir": "assets/sprites/noir.png",
    "scrum": "assets/sprites/scrum.png",
    "fullstack": "assets/sprites/fullstack.png",
    "thl": "assets/sprites/thl.png",
    "dolynho": "assets/sprites/dolynho.png",
    "lobao": "assets/sprites/lobao.png",
    "winx-exe": "assets/sprites/winx-exe.png",
    "kimi": "assets/sprites/kimi.png",
    "deepseek": "assets/sprites/deepseek.png",
    "dandara-query": "assets/sprites/dandara-query.png",
    "nina-vector": "assets/sprites/nina-vector.png",
    "gemini": "assets/sprites/gemini.png",
    "meta": "assets/sprites/meta.png",
    "mis": "assets/sprites/mis.png",
    "grika": "assets/sprites/grika.png",
    "dev-senior": "assets/sprites/dev-senior.png",
    "dev-senior-nano": "assets/sprites/dev-senior-nano.png"
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

/* Correções de recorte: algumas pranchas antigas têm células parciais em
   poses específicas. Reutiliza células completas sem alterar os PNGs. */
Object.assign(SPRITE_LAYOUT.perFighter, {
  'nina-vector': {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    rows: { jump: 0, crouch: 3, hit: 0, block: 0, win: 0, ko: 13 },
  },
  'winx-exe': {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    rows: { jump: 0, crouch: 0, hit: 0, block: 0, win: 0, ko: 13 },
  },
  gemini: { rows: { hit: 0, ko: 13 } },
  meta: { rows: { hit: 0, ko: 13 } },
  mis: { rows: { hit: 0, ko: 13 } },
  grika: {
    drawScale: 0.74,
    scaleByPose: { walk: 0.74, hit: 0.74, special: 0.74 },
    baseline: 246,
    rows: {
      idle: 0,
      walk: 1,
      jump: 2,
      crouch: 3,
      punch: 4,
      kick: 4,
      cpunch: 4,
      ckick: 4,
      jpunch: 4,
      jkick: 4,
      special: 4,
      hit: 0,
      block: 0,
      ko: 0,
      win: 0,
    },
    frameMap: {
      punch: [1, 1, 1, 1],
      kick: [2, 2, 2, 2],
      cpunch: [1, 1, 1, 1],
      ckick: [2, 2, 2, 2],
      jpunch: [1, 1, 1, 1],
      jkick: [2, 2, 2, 2],
      special: [1, 1, 1, 1],
    },
  },
  'dev-senior': { rows: { hit: 0, ko: 13 } },
  stack: {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    rows: { jump: 0, crouch: 3, hit: 0, ko: 13 },
    frameMap: { walk: [0, 1, 0, 1] },
  },
});
