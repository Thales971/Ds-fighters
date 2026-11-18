/* DS Fighters — Balanceamento do TORNEIO LOCAL.
   - Balance.score(d): forca do lutador (mesma ideia do arcade: stats + estilo).
   - Balance.buffFor(def): no torneio, os lutadores MAIS FRACOS ganham buff
     automatico (metade inferior do ranking: +25% HP / +15% forca;
     3o quartil: +12% HP / +8% forca; fortes nao ganham nada).
   - buildTourneyBracket / tourneyRoundPairings / tourneyResolveRound:
     chaveamento eliminatorio simples de 8 (ou 16) lutadores. */
(() => {
  const Balance = {
    _rank: null,
    score(d) {
      const s = d.stats || {};
      let sc = (s.power || 1) * 2 + (s.speed || 1) + (s.meterRate || 1) + (s.hp || 100) / 200;
      const sp = (d.special && d.special.type) || '';
      if (/projectile|cycle|multi|beam|summon|aoe/i.test(sp)) sc += 1.1;
      if (/rush|buff|transform/i.test(sp)) sc += 0.5;
      const kick = (d.moves && d.moves.kick) || {};
      if ((kick.range || 0) >= 70) sc += 0.4;
      return sc;
    },
    ranking() {
      if (!this._rank) {
        const all = (typeof FIGHTERS !== 'undefined' ? FIGHTERS : []).filter((d) => d.id !== 'boneco-treino');
        this._rank = all.map((d) => ({ id: d.id, sc: this.score(d) })).sort((a, b) => b.sc - a.sc);
      }
      return this._rank;
    },
    buffFor(def) {
      if (!def || def.id === 'boneco-treino') return null;
      const r = this.ranking(); /* ordenado do MAIS FORTE (idx 0) pro mais fraco */
      const idx = r.findIndex((e) => e.id === def.id);
      if (idx < 0) return null;
      const n = r.length;
      if (idx >= Math.ceil(n * 0.75)) return { hp: 1.25, power: 1.15, tier: 'fraco' };  /* quarto mais fraco: buff forte */
      if (idx >= Math.floor(n / 2)) return { hp: 1.12, power: 1.08, tier: 'medio' };    /* metade inferior: buff leve */
      return null;                                                                      /* metade forte: sem buff */
    },
    reset() { this._rank = null; },
  };

  /* Chaveamento eliminatorio simples. size deve ser potencia de 2 (8 ou 16). */
  function buildTourneyBracket(playerId, size, rnd) {
    size = size || 8;
    rnd = rnd || Math.random;
    const pool = (typeof FIGHTERS !== 'undefined' ? FIGHTERS : [])
      .filter((d) => d.id !== 'boneco-treino' && d.id !== playerId && !d.secret)
      .map((d) => d.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    const chave = [playerId].concat(pool.slice(0, size - 1));
    for (let i = chave.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = chave[i]; chave[i] = chave[j]; chave[j] = t; }
    /* embaralha de novo mas garante player dentro (ja esta) */
    return { size, chave, round: 0, roundsNames: roundNames(size) };
  }

  function roundNames(size) {
    /* rounds = log2(size): 8 -> 3 rounds (oitavas, quartas, final) */
    const names = { 8: ['OITAVAS', 'QUARTAS', 'FINAL'], 16: ['16-AVAS', 'OITAVAS', 'QUARTAS', 'FINAL'], 4: ['QUARTAS', 'FINAL'], 2: ['FINAL'] };
    return names[size] || names[8];
  }

  /* Emparelha a chave do round atual; retorna meu par e o oponente. */
  function tourneyRoundPairings(chave, playerId) {
    const pairs = [];
    for (let i = 0; i + 1 < chave.length; i += 2) pairs.push([chave[i], chave[i + 1]]);
    if (chave.length % 2) pairs.push([chave[chave.length - 1], null]); /* bye */
    const myPair = pairs.find((p) => p[0] === playerId || p[1] === playerId) || pairs[0];
    const myOpp = myPair[0] === playerId ? myPair[1] : myPair[0];
    return { pairs, myPair, myOpp };
  }

  /* Resolve o round: player venceu ou nao; demais pares resolvem no cara ou coroa.
     Retorna a chave do proximo round. */
  function tourneyResolveRound(pairs, playerId, playerWon, rnd) {
    rnd = rnd || Math.random;
    return pairs.map((p) => {
      if (p[0] === playerId || p[1] === playerId) {
        if (!p[0] || !p[1]) return playerId; /* bye */
        return playerWon ? playerId : (p[0] === playerId ? p[1] : p[0]);
      }
      if (!p[1]) return p[0];
      return rnd() < 0.5 ? p[0] : p[1];
    }).filter(Boolean);
  }

  if (typeof window !== 'undefined') { window.Balance = Balance; window.buildTourneyBracket = buildTourneyBracket; window.tourneyRoundPairings = tourneyRoundPairings; window.tourneyResolveRound = tourneyResolveRound; }
  if (typeof globalThis !== 'undefined') { globalThis.Balance = Balance; globalThis.buildTourneyBracket = buildTourneyBracket; globalThis.tourneyRoundPairings = tourneyRoundPairings; globalThis.tourneyResolveRound = tourneyResolveRound; }
})();
