/* DS Fighters V7-balance — pedido do dono:
   - Qwen e Winx.exe: nao sao mais personagens de codigo — power entre 1.50 e
     1.70, kit menos apelao (menos auto-aim/dreno/trava).
   - Du e Felipinho melhorados.
   - Buff nos personagens normais mais fracos do campeonato (stack, bhm,
     gemini, meta, mis, grika, engenheira-prompt, odette, thl, dev-senior):
     stats maiores e dano das habilidades +20%.
   Carregado depois de fighters-v18.js. */
(() => {
  /* ---------- stats ---------- */
  FIGHTERS.forEach((f) => {
    const patch = {
      qwen:              { power: 1.56, speed: 1.20, weight: 0.98, hp: 146, meterRate: 1.40 },
      'winx-exe':        { power: 1.52, speed: 1.14, weight: 0.98, hp: 144, meterRate: 1.32 },
      du:                { power: 1.50, speed: 1.06, weight: 1.22, hp: 148, meterRate: 1.45 },
      felipinho:         { power: 1.55, speed: 1.24, weight: 1.0,  hp: 148, meterRate: 1.55 },
      /* fracos do campeonato */
      stack:             { power: 1.54, speed: 1.24, weight: 1.00, hp: 146, meterRate: 1.40 },
      bhm:               { power: 1.48, speed: 1.26, weight: 1.00, hp: 158, meterRate: 1.42 },
      gemini:            { power: 1.54, speed: 1.26, weight: 0.96, hp: 142, meterRate: 1.38 },
      meta:              { power: 1.54, speed: 1.26, weight: 0.96, hp: 142, meterRate: 1.38 },
      mis:               { power: 1.55, speed: 1.18, weight: 0.98, hp: 146, meterRate: 1.38 },
      grika:             { power: 1.52, speed: 1.16, weight: 1.02, hp: 148, meterRate: 1.36 },
      'engenheira-prompt': { power: 1.52, speed: 1.18, weight: 0.96, hp: 146, meterRate: 1.38 },
      odette:            { power: 1.52, speed: 1.18, weight: 0.98, hp: 146, meterRate: 1.38 },
      thl:               { power: 1.46, speed: 1.04, weight: 1.10, hp: 148, meterRate: 1.40 },
      'dev-senior':      { power: 1.50, speed: 1.08, weight: 1.12, hp: 150, meterRate: 1.38 },
    }[f.id];
    if (patch) Object.assign(f.stats, patch);
  });

  /* assinatura do IALES: dreno de vida pesado — o campeao se cura em todo acerto */
  if (SIGNATURES.iales) Object.assign(SIGNATURES.iales, { ability: { drain: 0.25, vuln: 150, shock: 90, blind: 90, bleed: 90 } });

  /* ---------- kits menos apeloes (Qwen/Winx) ---------- */
  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  /* ---------- IALES: o campeao indiscutivel ---------- */
  FIGHTERS.forEach((f) => {
    if (f.id !== 'iales') return;
    Object.assign(f.stats, { power: 2.60, speed: 1.36, weight: 1.05, hp: 230, meterRate: 2.7 });
  });
  tone('iales', (p) => {
    if (p.dmg) p.dmg = Math.round(p.dmg * 1.5 * 10) / 10;
    if (p.cd) p.cd = Math.max(12, Math.round(p.cd * 0.65));
    if (p.id === 'virus') { p.multiHit = 3; p.fx.freeze = 160; }
    if (p.id === 'format') { p.dmg = 58; p.radius = 300; }
    if (p.id === 'afo') { p.count = 18; p.finisher = 50; }
    if (p.id === 'afo2') { p.dmg = 250; p.perAfo = 12; }
  });

  /* Qwen: menos dreno, trava e medidor queimado em TODAS as habilidades. */
  tone('qwen', (p) => {
    if (p.fx) {
      if (p.fx.drain) p.fx.drain *= 0.6;
      if (p.fx.lock) p.fx.lock = Math.round(p.fx.lock * 0.6);
      if (p.fx.meterSlow) p.fx.meterSlow = Math.round(p.fx.meterSlow * 0.6);
      if (p.fx.meterBurn) p.fx.meterBurn = Math.round(p.fx.meterBurn * 0.6);
      if (p.fx.blind) p.fx.blind = Math.round(p.fx.blind * 0.7);
    }
  });
  if (SIGNATURES.qwen) {
    Object.assign(SIGNATURES.qwen, { ability: { vuln: 70, drain: 0.04, meterSlow: 40, lock: 20 } });
  }
  /* Winx: efeitos de travar controles mais curtos. */
  tone('winx-exe', (p) => {
    if (p.fx) {
      if (p.fx.lock) p.fx.lock = Math.round(p.fx.lock * 0.6);
      if (p.fx.glitch) p.fx.glitch = Math.round(p.fx.glitch * 0.7);
      if (p.fx.shock) p.fx.shock = Math.round(p.fx.shock * 0.7);
    }
  });

  /* ---------- kits dos fracos: dano +45% no total (2 passadas) ---------- */
  ['stack', 'bhm', 'gemini', 'meta', 'mis', 'grika', 'engenheira-prompt', 'odette', 'thl', 'dev-senior'].forEach((id) => {
    tone(id, (p) => {
      if (p.dmg) p.dmg = Math.round(p.dmg * 1.2 * 10) / 10;
      if (p.finisher) p.finisher = Math.round(p.finisher * 1.2);
    });
  });
  /* Os 7 do fundao do campeonato precisam de mais: kit ainda mais forte
     e cooldowns proprios menores (o anti-spam global e x2 pra todos). */
  ['stack', 'gemini', 'meta', 'mis', 'grika', 'engenheira-prompt', 'odette'].forEach((id) => {
    tone(id, (p) => {
      if (p.dmg) p.dmg = Math.round(p.dmg * 1.25 * 10) / 10;
      if (p.finisher) p.finisher = Math.round(p.finisher * 1.25);
      if (p.cd) p.cd = Math.max(18, Math.round(p.cd * 0.75));
    });
  });

  /* ---------- Du e Felipinho: kits melhores ---------- */
  tone('du', (p) => {
    if (p.id === 'axe') { p.dmg = 15; p.burn = 200; p.cd = 40; }
    if (p.id === 'geyser') { p.dmg = 19; p.burn = 280; }
    if (p.id === 'rage') { p.dmgMult = 1.7; p.heal = 18; }
    if (p.id === 'quake') { p.dmg = 24; }
    if (p.id === 'apoc') { p.dmg = 60; p.hits = 7; }
  });
  tone('felipinho', (p) => {
    if (p.dmg) p.dmg = Math.round(p.dmg * 1.15 * 10) / 10;
    if (p.id === 'vdom' && p.heal) p.heal = 18;
  });
})();
