/* DS Fighters V12-balance — pedido do dono: os mais fracos estão "quase
   jogáveis". Agora é melhoria MECÂNICA, não só número: as habilidades dos
   6 piores ganham teleguiado, mais hits e mais área — coisas que ajudam
   em jogo de verdade, não só na planilha. */
(() => {
  const tone = (id, fn) => { const k = POWERS[id]; if (k && k.powers) k.powers.forEach(fn); };
  const up = (p, mult) => { if (p.dmg) p.dmg = Math.round(p.dmg * mult * 10) / 10; };

  /* KOTLIN: coroutines teleguiadas — os projéteisacades agora buscam o alvo */
  tone('kotlin', (p) => {
    up(p, 1.15);
    if (p.kind === 'shot') { p.seek = true; p.w = Math.max(p.w || 0, 24); }
    if (p.id === 'kstorm') { p.hits = 8; p.radius = Math.max(p.radius || 0, 260); }
  });
  /* GITMASTER: shurikens múltiplas + merge que cobre a arena */
  tone('gitmaster', (p) => {
    up(p, 1.15);
    if (p.id === 'shuriken') { p.count = 3; p.spread = 0.12; p.seek = true; }
    if (p.id === 'rebase') p.radius = Math.max(p.radius || 0, 280);
  });
  /* GUARDA DIGITAL: o firewall vira muralha dupla e detém quem passa */
  tone('guarda-digital', (p) => {
    up(p, 1.2);
    if (p.id === 'firewall-shot') { p.pierce = true; p.seek = true; }
    if (p.id === 'detention-field') { p.time = 420; p.w = 220; }
    if (p.id === 'total-lockdown') p.radius = 320;
  });
  /* GEMINI/META: os espelhos acertam de verdade */
  ['gemini', 'meta'].forEach((id) => tone(id, (p) => {
    up(p, 1.2);
    if (p.kind === 'shot') { p.seek = true; p.w = Math.max(p.w || 0, 26); }
    if (p.kind === 'blast') p.radius = Math.max(p.radius || 0, 270);
  }));
  /* ODETTE: a dança cobre mais área e congela mais tempo */
  tone('odette', (p) => {
    up(p, 1.2);
    if (p.kind === 'blast' || p.kind === 'pillar') p.radius = Math.max(p.radius || 0, 260);
    if (p.kind === 'shot') p.seek = true;
  });
  /* ENGENHEIRA: os prompts executam mais vezes */
  tone('engenheira-prompt', (p) => {
    up(p, 1.2);
    if (p.kind === 'shot') { p.count = p.count || 2; p.seek = true; }
    if (p.kind === 'zone') { p.w = 220; p.time = 480; }
    if (p.id === 'supreme-prompt') p.radius = 320;
  });
  /* CYBER-PSICOPATA: a fúria conecta em cadeia */
  tone('cyber-psicopata', (p) => {
    up(p, 1.2);
    if (p.kind === 'rush') p.hits = 12;
    if (p.kind === 'shot') p.seek = true;
  });
})();
