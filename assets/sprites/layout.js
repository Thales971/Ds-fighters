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
    "nina-vector": "assets/sprites/nina-vector.png"
  }
};

/* Folhas refinadas têm quatro fases; folhas legadas mantêm o timing original. */
SPRITE_LAYOUT.perFighter = Object.fromEntries(['urbano', 'stack', 'qwen', 'thl', 'dolynho', 'lobao'].map((id) => [id, {
  frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
}]));

/* V7: Kimi, DeepSeek e Dandara usam 4x8; Winx foi migrada para 4x15 na V8. */
const V7_POSE_ROWS = { idle: 0, walk: 1, jump: 2, crouch: 3, block: 3, punch: 4, cpunch: 4, jpunch: 4, kick: 5, ckick: 5, jkick: 5, special: 6, hit: 7, ko: 7, win: 0 };
['kimi', 'deepseek', 'dandara-query'].forEach((id) => {
  SPRITE_LAYOUT.perFighter[id] = {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    rows: V7_POSE_ROWS,
  };
});

/* V8: Winx e Nina têm uma linha real para cada pose do motor. */
['winx-exe', 'nina-vector'].forEach((id) => {
  SPRITE_LAYOUT.perFighter[id] = {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
  };
});
