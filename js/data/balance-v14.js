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
    'cyber-psicopata': 0.88,      /* v2 (arte e kit novos, leve buff): 45% -> ~53% */
    'nunes': 0.417,               /* torneio: 59% */
    'emilio': 0.425,              /* torneio: 47% */
    'engenheira-prompt': 0.449,   /* torneio: 53% */
    'meta': 0.549,                /* torneio: 53% */
    'gemini': 0.554,              /* torneio: 60% */
    'odette': 0.559,              /* torneio: 49% */
    'dev-senior': 0.9,          /* torneio: 46% */
    'henrico': 0.61,              /* torneio: 45% */
    'qwen': 0.678,                /* torneio: 54% */
    'urbano': 0.72,               /* torneio: 57% */
    'nimbo': 0.86,               /* torneio: 50% */
    'kotlin': 0.792,              /* torneio: 49% */
    'scrum': 0.793,               /* torneio: 43% */
    'thl': 0.822,                 /* torneio: 45% */
    'lobao': 0.829,               /* torneio: 48% */
    'mis': 0.865,                 /* torneio: 55% */
    'bhm': 0.878,                 /* torneio: 45% */
    'nina-vector': 0.883,         /* torneio: 52% */
    'merc': 0.902,                /* torneio: 64% */
    'gitmaster': 1.0,            /* torneio: 59% */
    'xeon': 0.939,                /* torneio: 53% */
    'rafael': 1.3,              /* torneio: 49% */
    'dandara-query': 1.051,       /* torneio: 43% */
    'dev-veterano': 1.16,        /* torneio: 48% */
    'guarda-digital': 1.09,       /* torneio: 51% */
    'hana': 1.102,                /* torneio: 54% */
    'stack': 1.161,               /* torneio: 50% */
    'john-vibe': 1.3,           /* torneio: 48% */
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
    'lyra': 2.3,                 /* nova (maga do JS): ~51% */
    'larper': 2.25,                /* nova (veneno): ~50% */
    'domador': 2.05,              /* novo (pgAdmin): ~50% */
    'stella': 2.25,               /* nova (maga do front-end): ~50% */
    'kuno': 1.7,                  /* nova (kunoichi): ~50% */
    'miko': 2.55,                 /* nova (sacerdotisa): ~50% */
    'jester': 2.9,                /* novo (bobo): ~46% CPU x CPU — as irritacoes (tela cega/girando,
                                     controle eletrizado, botoes embaralhados) pesam mais contra gente */
  };
  /* nov/2026 (pedido do dono, depois de jogar): buff no Dev Senior (as
     nanomaquinas davam ~14 de dano), Nimbo, Rafael, Dev Veterano, Lyra,
     Larper, Cyber, Kage Commit e John; o Ponteiro perde so DANO (vida igual). */
  const DANO = {
    'ponteiro': 0.8,
    'nunes': 1.32, /* PR 127: so dano (a vida dele cura no fogo; mais vida = loop pior) */
  };
  /* AJUSTE GERAL (nov/2026, pedido do dono): torneio CPU x CPU de TODOS os
     normais (5.724 lutas por rodada, 2 rodadas com sementes diferentes).
     Antes: 20%..87% de vitorias (desvio 14,3). Depois: desvio ~8. Multiplica
     forca (dano) e vida por cima do FORCA. Os de codigo ficam de fora.
     Refazer: node tools/balance_sim.cjs --games 2 --out sim.json */
  /* PR 127 (um por um): mais fracos sobem (Nunes, Nexus, Urbano, Ponteiro,
     Merc, Jess, Lia, Odette, DevOps, Dev Virado, Nina, QA, Dandara, Gemini,
     Guarda, Backend, Mis); Dev Senior e Henrico descem de leve; Stella e
     Domador voltam como estavam; nenhum nerf passa de 15%. */
  const AJUSTE = {
    'qwen': 0.85,
    'cracker': 0.85,
    'jester': 0.85,
    'xeon': 0.85,
    'miko': 0.882,
    'java': 0.928,
    'dev-senior': 0.88,
    'dev-veterano': 0.94,
    'larper': 0.94,
    'lyra': 0.94,
    'nexo': 1.12,
    'nimbo': 0.94,
    'grika': 0.944,
    'rafael': 0.952,
    'gitmaster': 1.022,
    'guarda-digital': 1.08,
    'kira': 1.022,
    'nina-vector': 1.12,
    'bughunter': 1.036,
    'merc': 1.14,
    'jess': 1.26,
    'frontend': 1.051,
    'scrum': 1.07,
    'hacker': 1.076,
    'devops': 1.3,
    'mis': 1.12,
    'meta': 1.082,
    'stack': 1.085,
    'milena': 1.087,
    'winx-exe': 1.088,
    'odette': 1.2,
    'hana': 1.092,
    'nunes': 1.2,
    'engenheira-prompt': 1.179,
    'kuno': 1.18,
    'thl': 1.182,
    'fullstack': 1.218,
    'dandara-query': 1.3,
    'emilio': 1.234,
    'urbano': 1.36,
    'backend': 1.3,
    'bhm': 1.267,
    'lia': 1.42,
    'dev-virado': 1.5,
    'ponteiro': 1.08,
    'gemini': 1.06,
  };
  for (const f of FIGHTERS) {
    const m = (FORCA[f.id] || 1) * (AJUSTE[f.id] || 1);
    if (m === 1 || !f.stats || f.secret) continue;
    f.stats.power = +((f.stats.power || 1) * m * (DANO[f.id] || 1)).toFixed(3);
    f.stats.hp = Math.round((f.stats.hp || 100) * m);
  }
})();
