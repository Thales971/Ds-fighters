/* DS Fighters V13-balance — pedido do dono: "dá uma boa balanceada nos
   personagens que estão ruins". Os 12 piores do campeonato com reforço
   pesado: stats de mid-tier, kits +25-45% e melhorias mecânicas (teleguia,
   área, hits). Com o FIX do dash (velocidade constante na janela de hit),
   os lutadores de dash finalmente alcançam o alvo. */
(() => {
  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  const up = (p, mult) => { if (p.dmg) p.dmg = Math.round(p.dmg * mult * 10) / 10; };

  FIGHTERS.forEach((f) => {
    const patch = {
      scrum:           { power: 1.50, speed: 1.24, weight: 0.96, hp: 148, meterRate: 1.38 },
      'dandara-query': { power: 1.50, speed: 1.20, weight: 1.00, hp: 150, meterRate: 1.38 },
      'dev-veterano':  { power: 1.52, speed: 1.14, weight: 1.14, hp: 154, meterRate: 1.40 },
      merc:            { power: 1.52, speed: 1.32, weight: 0.94, hp: 148, meterRate: 1.42 },
      mis:             { power: 1.52, speed: 1.22, weight: 1.00, hp: 150, meterRate: 1.40 },
      'nina-vector':   { power: 1.48, speed: 1.30, weight: 0.98, hp: 146, meterRate: 1.38 },
      'guarda-digital':{ power: 1.50, speed: 1.22, weight: 1.08, hp: 156, meterRate: 1.40 },
      gemini:          { power: 1.54, speed: 1.26, weight: 1.04, hp: 152, meterRate: 1.42 },
      meta:            { power: 1.54, speed: 1.26, weight: 1.04, hp: 152, meterRate: 1.42 },
      odette:          { power: 1.52, speed: 1.22, weight: 1.06, hp: 154, meterRate: 1.42 },
      'engenheira-prompt': { power: 1.52, speed: 1.24, weight: 1.04, hp: 154, meterRate: 1.42 },
      'cyber-psicopata':   { power: 1.50, speed: 1.26, weight: 1.10, hp: 156, meterRate: 1.40 },
    }[f.id];
    if (patch) Object.assign(f.stats, patch);
  });

  /* SCRUM: reunião que acaba em poker pesado */
  tone('scrum', (p) => { up(p, 1.3); if (p.kind === 'shot') p.seek = true; if (p.id === 'poker') p.radius = 300; });
  /* DANDARA: queries mais amplas */
  tone('dandara-query', (p) => { up(p, 1.3); if (p.kind === 'shot') { p.seek = true; p.count = p.count || 2; } if (p.kind === 'blast') p.radius = 290; });
  /* DEV VETERANO: o legado bate mais */
  tone('dev-veterano', (p) => { up(p, 1.28); if (p.kind === 'shot') p.seek = true; if (p.kind === 'blast') p.radius = 290; });
  /* MERC (Cromo VX): implantes afiados de novo */
  tone('merc', (p) => { up(p, 1.3); if (p.id === 'psycho') { p.dmg = 62; p.hits = 12; } if (p.id === 'monowire') p.pierce = true; });
  /* MIS: o bug que vira feature */
  tone('mis', (p) => { up(p, 1.3); if (p.kind === 'shot') p.seek = true; if (p.kind === 'zone') { p.w = 220; p.dmg = (p.dmg || 0.1) * 2; } });
  /* NINA VECTOR: sincronia total */
  tone('nina-vector', (p) => { up(p, 1.3); if (p.kind === 'shot') { p.seek = true; p.count = p.count || 2; } if (p.id === 'full-synchrony') p.dmg = 40; });
  /* GUARDA DIGITAL: bloqueio que machuca */
  tone('guarda-digital', (p) => { up(p, 1.25); if (p.id === 'security-blitz') p.seek = true; if (p.id === 'digital-fine') p.pierce = true; if (p.id === 'total-lockdown') { p.radius = 330; p.dmg = 42; } });
  /* GEMINI/META: espelhos que refletem dano de verdade */
  ['gemini', 'meta'].forEach((id) => tone(id, (p) => {
    up(p, 1.25);
    if (p.kind === 'shot') { p.seek = true; p.count = p.count || 2; }
    if (p.kind === 'blast') p.radius = 300;
    if (p.kind === 'zone') { p.w = 220; p.dmg = (p.dmg || 0.1) * 2; }
  }));
  /* ODETTE: a dança da morte */
  tone('odette', (p) => { up(p, 1.25); if (p.kind === 'blast' || p.kind === 'pillar') p.radius = 290; if (p.kind === 'shot') p.seek = true; });
  /* ENGENHEIRA: prompts que executam */
  tone('engenheira-prompt', (p) => {
    up(p, 1.22);
    if (p.id === 'context-overflow') { p.dmg = 0.2; p.w = 240; p.time = 540; }
    if (p.id === 'supreme-prompt') p.radius = 330;
  });
  /* CYBER-PSICOPATA: a fúria não perdoa */
  tone('cyber-psicopata', (p) => { up(p, 1.25); if (p.kind === 'rush') p.hits = 14; if (p.kind === 'blast') p.radius = 280; });

  /* perfil de anti-spam: os reforçados encadeiam */
  ['dandara-query', 'mis', 'odette', 'cyber-psicopata', 'engenheira-prompt', 'gemini', 'meta'].forEach((id) => {
    if (POWERS[id]) POWERS[id].spamProfile = 'chain';
  });
})();
