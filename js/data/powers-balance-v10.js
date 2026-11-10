/* DS Fighters V10-balance — pedido do dono: balancear a vida de TODOS os
   personagens. Compressao linear da faixa de vida em jogo [354, 900] para
   [400, 560]: a ordem de tanquicidade e preservada, mas os extremos somem
   (o Ponteiro tinha 2.5x a vida do Fullstack). O boneco de treino (1200)
   fica fora — ele e dummy de treino. Carregado por ultimo. */
(() => {
  const HP = {
"du": 144, // 462 -> 432
      "iales": 166, // 690 -> 498
      "felipinho": 144, // 462 -> 432
      "stack": 142, // 438 -> 426
      "gitmaster": 137, // 396 -> 411
      "bughunter": 137, // 390 -> 411
      "backend": 137, // 390 -> 411
      "devops": 139, // 408 -> 417
      "qa": 136, // 378 -> 408
      "scrum": 139, // 408 -> 417
      "fullstack": 133, // 354 -> 399
      "kotlin": 146, // 480 -> 438
      "hacker": 138, // 402 -> 414
      "java": 135, // 366 -> 405
      "bhm": 141, // 432 -> 423
      "gemini": 151, // 534 -> 453
      "meta": 151, // 534 -> 453
      "mis": 142, // 438 -> 426
      "dev-senior": 143, // 450 -> 429
      "urbano": 144, // 468 -> 432
      "xeon": 138, // 402 -> 414
      "qwen": 139, // 414 -> 417
      "thl": 144, // 462 -> 432
      "lobao": 143, // 450 -> 429
      "winx-exe": 141, // 432 -> 423
      "dandara-query": 137, // 390 -> 411
      "nina-vector": 139, // 414 -> 417
      "dev-veterano": 141, // 432 -> 423
      "hana": 137, // 396 -> 411
      "cyber-psicopata": 152, // 540 -> 456
      "grika": 142, // 444 -> 426
      "guarda-digital": 143, // 450 -> 429
      "engenheira-prompt": 153, // 552 -> 459
      "odette": 153, // 552 -> 459
      "nimbo": 140, // 426 -> 420
      "emilio": 143, // 450 -> 429
      "nunes": 144, // 468 -> 432
      "ponteiro": 187, // 900 -> 561
  };
  FIGHTERS.forEach((f) => { if (HP[f.id] != null) f.stats.hp = HP[f.id]; });
})();
