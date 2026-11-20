/* ============================================================
   BALANCEAMENTO DOS LUTADORES NORMAIS (fase 3, nov/2026)
   Feito por torneio CPU x CPU no motor real (tools/balance_sim.cjs):
   todos contra todos, 1 round, arena neutra, sem clima/pet.
   Antes: vitorias de 6% a 95% (desvio 24). Depois: 34% a 64% (desvio 5,4),
   validado com outra semente e 8.648 lutas.
   Cada lutador normal ganha um multiplicador de FORCA aplicado ao poder
   (dano) e a vida — < 1 = nerf, > 1 = buff. A vida continua limitada ao
   teto de 500 do jogo. Os secretos (liberados por codigo) ficam de fora.
   Pra refazer depois de mexer em kits:
     node tools/balance_sim.cjs --games 4 --out sim.json
   ============================================================ */
(() => {
  const FORCA = {
    'cyber-psicopata': 0.78,      /* v2 (arte e kit novos, leve buff): 45% -> ~53% */
    'nunes': 0.417,               /* torneio: 59% */
    'emilio': 0.425,              /* torneio: 47% */
    'engenheira-prompt': 0.449,   /* torneio: 53% */
    'meta': 0.549,                /* torneio: 53% */
    'gemini': 0.554,              /* torneio: 60% */
    'odette': 0.559,              /* torneio: 49% */
    'dev-senior': 0.574,          /* torneio: 46% */
    'henrico': 0.61,              /* torneio: 45% */
    'qwen': 0.678,                /* torneio: 54% */
    'urbano': 0.72,               /* torneio: 57% */
    'nimbo': 0.743,               /* torneio: 50% */
    'kotlin': 0.792,              /* torneio: 49% */
    'scrum': 0.793,               /* torneio: 43% */
    'thl': 0.822,                 /* torneio: 45% */
    'lobao': 0.829,               /* torneio: 48% */
    'mis': 0.865,                 /* torneio: 55% */
    'bhm': 0.878,                 /* torneio: 45% */
    'nina-vector': 0.883,         /* torneio: 52% */
    'merc': 0.902,                /* torneio: 64% */
    'gitmaster': 0.91,            /* torneio: 59% */
    'xeon': 0.939,                /* torneio: 53% */
    'rafael': 1.013,              /* torneio: 49% */
    'dandara-query': 1.051,       /* torneio: 43% */
    'dev-veterano': 1.087,        /* torneio: 48% */
    'guarda-digital': 1.09,       /* torneio: 51% */
    'hana': 1.102,                /* torneio: 54% */
    'stack': 1.161,               /* torneio: 50% */
    'john-vibe': 1.169,           /* torneio: 48% */
    'devops': 1.179,              /* torneio: 44% */
    'dev-virado': 1.199,          /* torneio: 54% */
    'hacker': 1.203,              /* torneio: 52% */
    'kira': 1.235,                /* torneio: 48% */
    'grika': 1.334,               /* torneio: 46% */
    'bughunter': 1.367,           /* torneio: 52% */
    'ponteiro': 1.412,            /* torneio: 44% */
    'lia': 1.427,                 /* torneio: 48% */
    'winx-exe': 1.558,            /* torneio: 48% */
    'java': 1.641,                /* torneio: 57% */
    'jess': 1.672,                /* torneio: 57% */
    'cracker': 1.776,             /* torneio: 49% */
    'frontend': 1.798,            /* torneio: 44% */
    'fullstack': 2.02,            /* torneio: 54% */
    'milena': 2.11,               /* torneio: 46% */
    'backend': 2.2,               /* torneio: 45% */
    'nexo': 2.2,                  /* torneio: 34% */
    'qa': 2.2,                    /* torneio: 53% */
  };
  for (const f of FIGHTERS) {
    const m = FORCA[f.id];
    if (!m || !f.stats) continue;
    f.stats.power = +((f.stats.power || 1) * m).toFixed(3);
    f.stats.hp = Math.round((f.stats.hp || 100) * m);
  }
})();
