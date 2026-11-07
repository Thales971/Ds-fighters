/* DS Fighters V8-balance — pedido do dono: melhorar Emilio, Nunes, Urbano,
   BHM, Vigilante (THL tático), Du, Felipinho e Cromo VX (merc).
   Stats mais fortes + kits com mais dano/efeito. Carregado depois do v7. */
(() => {
  /* ---------- stats ---------- */
  FIGHTERS.forEach((f) => {
    const patch = {
      emilio:     { power: 1.62, speed: 1.16, weight: 1.00, hp: 150, meterRate: 1.34 },
      nunes:      { power: 1.66, speed: 1.16, weight: 1.04, hp: 156, meterRate: 1.38 },
      urbano:     { power: 1.52, speed: 1.08, weight: 1.20, hp: 152, meterRate: 1.34 },
      bhm:        { power: 1.38, speed: 1.22, weight: 1.00, hp: 144, meterRate: 1.28 },
      thl:        { power: 1.54, speed: 1.10, weight: 1.10, hp: 154, meterRate: 1.44 },
      du:         { power: 1.58, speed: 1.10, weight: 1.22, hp: 154, meterRate: 1.48 },
      felipinho:  { power: 1.62, speed: 1.26, weight: 1.00, hp: 154, meterRate: 1.58 },
      merc:       { power: 1.30, speed: 1.34, weight: 0.90, hp: 128, meterRate: 1.24 },
    }[f.id];
    if (patch) Object.assign(f.stats, patch);
  });

  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  const up = (p, mult) => { if (p.dmg) p.dmg = Math.round(p.dmg * mult * 10) / 10; if (p.finisher) p.finisher = Math.round(p.finisher * mult); };

  /* ---------- kits ---------- */
  /* EMILIO: energia solar mais forte e ultimate mais generosa */
  tone('emilio', (p) => {
    up(p, 1.15);
    if (p.id === 'solar-arrow') p.fx.burn = 120;
    if (p.id === 'solar-meteor') { p.burn = 180; p.stun = 50; }
    if (p.id === 'supreme-transformation') { p.time = 820; p.heal = 38; p.hitDmg = 42; p.hitRadius = 280; }
  });

  /* NUNES: cozinha mais quente — zonas mais longas e dolorosas */
  tone('nunes', (p) => {
    up(p, 1.12);
    if (p.id === 'incendiary-bang') p.zone = Object.assign(p.zone || {}, { time: 560, burn: 260, dmg: 0.15 });
    if (p.id === 'fireball') p.zone = Object.assign(p.zone || {}, { time: 420, burn: 220 });
    if (p.id === 'flame-wall') { p.time = 500; p.dmg = 16; p.burn = 240; }
    if (p.id === 'flame-dash') { p.dmg = 18; p.fireTrail = 380; }
    if (p.id === 'phoenix-rebirth') { p.heal = 26; p.time = 720; }
  });

  /* URBANO: o tremor racha mais */
  tone('urbano', (p) => {
    up(p, 1.2);
    if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.85));
  });

  /* BHM: nerfado apos ficar em 2o no campeonato (pedido do dono) — sombras
     mais leves que o v8 original, um pouco acima do v7 */
  tone('bhm', (p) => {
    up(p, 1.0);
    if (p.id === 'storm') { p.count = 10; p.dmg = 50; }
    if (p.id === 'portal') p.burstDmg = 20;
  });

  /* VIGILANTE (THL): tático mais letal */
  tone('thl', (p) => {
    up(p, 1.18);
    if (p.id === 'expose') { p.stun = 24; p.fx.vuln = 220; }
    if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.88));
  });

  /* DU: magma mais furioso */
  tone('du', (p) => {
    up(p, 1.1);
    if (p.id === 'rage') { p.dmgMult = 1.8; p.heal = 22; }
    if (p.id === 'apoc') { p.dmg = 66; p.hits = 8; }
  });

  /* FELIPINHO: ondas mais fortes */
  tone('felipinho', (p) => {
    up(p, 1.12);
    if (p.id === 'vdom' && p.heal) p.heal = 22;
  });

  /* CROMO VX (merc): cibernético mais afiado */
  tone('merc', (p) => {
    up(p, 1.15);
    if (p.id === 'psycho') { p.dmg = 50; p.hits = 9; }
    if (p.id === 'monowire') p.dmg = 20;
    if (p.id === 'blink') p.dmg = 14;
  });
})();
