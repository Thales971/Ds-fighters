/* DS Fighters V11-balance — pedido do dono:
   1. BHM e fraco mesmo bufado: kit reforcado + perfil de anti-spam CHAIN
      (as habilidades dele precisam encadear — pisos menores de recarga).
   2. Zoners de pressao ganham perfil HEAVY (pisos maiores) — menos spam. */
(() => {
  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  const up = (p, mult) => { if (p.dmg) p.dmg = Math.round(p.dmg * mult * 10) / 10; };

  /* BHM: poder de verdade + cadeia fluida */
  const b = FIGHTERS.find((f) => f.id === 'bhm');
  if (b) Object.assign(b.stats, { power: 1.50, speed: 1.26, weight: 1.02, hp: 150, meterRate: 1.42 });
  tone('bhm', (p) => {
    up(p, 1.18);
    /* o portal agora MACHUCA na saida (antes: zero dano) */
    if (p.id === 'portal') { p.dmg = 15; p.fx = Object.assign({}, p.fx, { bleed: 120 }); }
    /* a tempestade dele castiga mais */
    if (p.id === 'storm') p.dmg = 58;
  });
  POWERS.bhm.spamProfile = 'chain';

  /* lutadores de COMBO/CORPO A CORPO tambem encadeiam */
  ['nunes', 'emilio', 'urbano', 'felipinho', 'du', 'thl'].forEach((id) => {
    if (POWERS[id]) POWERS[id].spamProfile = 'chain';
  });

  /* zoners de pressao ficam HEAVY (menos spam de projetil) */
  ['iales', 'ponteiro', 'hacker', 'nina-vector', 'guarda-digital'].forEach((id) => {
    if (POWERS[id]) POWERS[id].spamProfile = 'heavy';
  });
})();
