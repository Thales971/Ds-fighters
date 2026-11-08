/* DS Fighters V9-balance — pedido do dono: melhorar os personagens ruins.
   Os 12 piores do campeonato (kotlin, xeon, merc, guarda-digital, hacker,
   nina-vector, dolynho, bughunter, devops, scrum, gitmaster e urbano) com
   stats de mid-tier e kits com muito mais dano. Carregado depois do v8. */
(() => {
  FIGHTERS.forEach((f) => {
    const patch = {
      kotlin:         { power: 1.45, speed: 1.30, weight: 0.86, hp: 136, meterRate: 1.30 },
      xeon:           { power: 1.45, speed: 1.12, weight: 1.04, hp: 134, meterRate: 1.28 },
      merc:           { power: 1.45, speed: 1.36, weight: 0.90, hp: 140, meterRate: 1.30 },
      'guarda-digital': { power: 1.45, speed: 1.20, weight: 1.06, hp: 150, meterRate: 1.32 },
      hacker:         { power: 1.42, speed: 1.26, weight: 0.94, hp: 134, meterRate: 1.30 },
      'nina-vector':  { power: 1.42, speed: 1.28, weight: 0.96, hp: 138, meterRate: 1.30 },
      dolynho:        { power: 1.40, speed: 1.16, weight: 1.10, hp: 140, meterRate: 1.28 },
      bughunter:      { power: 1.40, speed: 1.18, weight: 0.98, hp: 130, meterRate: 1.28 },
      devops:         { power: 1.42, speed: 1.10, weight: 1.12, hp: 136, meterRate: 1.26 },
      scrum:          { power: 1.40, speed: 1.18, weight: 0.96, hp: 132, meterRate: 1.30 },
      gitmaster:      { power: 1.42, speed: 1.24, weight: 0.92, hp: 132, meterRate: 1.30 },
      urbano:         { power: 1.56, speed: 1.10, weight: 1.20, hp: 156, meterRate: 1.36 },
      /* segunda leva: os piores apos o movimento no simulador */
      gemini:         { power: 1.62, speed: 1.26, weight: 1.06, hp: 178, meterRate: 1.42 },
      meta:          { power: 1.62, speed: 1.26, weight: 1.06, hp: 178, meterRate: 1.42 },
      odette:         { power: 1.60, speed: 1.22, weight: 1.08, hp: 184, meterRate: 1.42 },
      'engenheira-prompt': { power: 1.60, speed: 1.22, weight: 1.06, hp: 184, meterRate: 1.42 },
      'cyber-psicopata': { power: 1.58, speed: 1.24, weight: 1.10, hp: 180, meterRate: 1.40 },
      frontend:       { power: 1.44, speed: 1.20, weight: 0.96, hp: 140, meterRate: 1.30 },
      scrum:          { power: 1.44, speed: 1.20, weight: 0.96, hp: 136, meterRate: 1.32 },
      kotlin:         { power: 1.52, speed: 1.32, weight: 0.96, hp: 160, meterRate: 1.34 },
    }[f.id];
    if (patch) Object.assign(f.stats, patch);
  });

  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  const up = (p, mult) => { if (p.dmg) p.dmg = Math.round(p.dmg * mult * 10) / 10; if (p.finisher) p.finisher = Math.round(p.finisher * mult); };

  /* kotlin: coroutines finalmente compila */
  tone('kotlin', (p) => { up(p, 1.5); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.75)); });
  /* xeon: gelo+fogo pesado */
  tone('xeon', (p) => { up(p, 1.5); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.75)); });
  /* merc (Cromo VX): implantes afiados */
  tone('merc', (p) => { up(p, 1.25); if (p.id === 'psycho') { p.dmg = 58; p.hits = 10; } if (p.id === 'blink') p.dmg = 18; });
  /* guarda digital: firewall de verdade */
  tone('guarda-digital', (p) => { up(p, 1.4); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  /* hacker: invasao pesada */
  tone('hacker', (p) => { up(p, 1.45); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.75)); });
  /* nina vector: sincronia total */
  tone('nina-vector', (p) => { up(p, 1.45); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.75)); });
  /* dolynho: capeta na garrafa */
  tone('dolynho', (p) => { up(p, 1.3); if (p.id === 'dolynhault') { p.dmg = 54; } });
  /* bughunter: caca recompensada */
  tone('bughunter', (p) => { up(p, 1.35); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  /* devops: pipeline pesado */
  tone('devops', (p) => { up(p, 1.3); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  /* scrum: reunião longa */
  tone('scrum', (p) => { up(p, 1.3); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  /* gitmaster: merge pesado */
  tone('gitmaster', (p) => { up(p, 1.35); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.75)); });
  /* urbano: o tremor racha mais ainda */
  tone('urbano', (p) => { up(p, 1.2); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  /* segunda leva */
  tone('gemini', (p) => { up(p, 1.5); if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75)); });
  tone('meta', (p) => { up(p, 1.5); if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75)); });
  tone('odette', (p) => { up(p, 1.45); if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75)); });
  tone('engenheira-prompt', (p) => { up(p, 1.45); if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75)); });
  tone('cyber-psicopata', (p) => { up(p, 1.4); if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75)); });
  tone('frontend', (p) => { up(p, 1.25); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  tone('scrum', (p) => { up(p, 1.25); if (p.cd) p.cd = Math.max(20, Math.round(p.cd * 0.8)); });
  tone('kotlin', (p) => { up(p, 1.4); if (p.cd) p.cd = Math.max(16, Math.round(p.cd * 0.65)); });
})();
