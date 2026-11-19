/* ============================================================
   DOLYNHO — lutador SECRETO: so entra com o codigo proprio dele
   (a comparacao do codigo fica so em profile.js — nunca escrito
   aqui, nem em README, nem em mensagem de erro).
   Sprite (assets/sprites/dolynho.png), sheet de habilidades
   (assets/abilities/dolynho.png), retrato no atlas e vozes pt-BR
   ja existiam nos assets — faltava so a ficha na grade.
   Stats no nivel dos outros secretos top-tier (Du Magma /
   Felipinho Hydro): power/HP/meter altos, kit de "fizz" com
   muito stun (POWERS.dolynho em powers-v5.js + buff do v9).
   ============================================================ */
(() => {
  FIGHTERS.push({
    id: 'dolynho',
    name: 'DOLYNHO',
    title: 'O Amiguinho Explosivo',
    bio: 'O amiguinho que virou lenda: garrafa de guaran\u00e1, tampinha explosiva e um abra\u00e7o que d\u00e1 stun. Secret\u00e3o de verdade \u2014 s\u00f3 entra com c\u00f3digo.',
    colors: { skin: '#e8b88a', hair: '#241408', shirt: '#7a3a12', pants: '#2e1c0c', shoes: '#f2e2c0', accent: '#ffd24d' },
    traits: { kid: true, cap: 'forward' },
    /* BUFF no nivel do Du (1.38/1.02/1.25/138/1.38) e do Felipinho Hydro
       (1.44/1.24/1.0/142/1.55): power e meter no topo, HP alto, peso medio. */
    stats: { power: 1.44, speed: 1.24, weight: 1.10, hp: 145, meterRate: 1.55 },
    secret: true,
    quotes: {
      intro: ['Oi pessoal, eu sou o Dolynho, seu amiguinho!', 'Vai de guaran\u00e1, vai!'],
      win: ['Amizade que d\u00e1 stun!', 'Foi de abra\u00e7o e foi embora!'],
      special: ['GUARAN\u00c1 GELADO!', 'TAMPINHA NO AR!', 'ESPUMA AT\u00c9 O TETO!'],
      super: ['AMIZADE EXPLOSIVA!!'],
    },
    moves: {
      punch: { dmg: 6, range: 54, startup: 4, active: 4, recovery: 9 },
      kick: { dmg: 9, range: 66, startup: 7, active: 4, recovery: 12 },
    },
  });
})();
