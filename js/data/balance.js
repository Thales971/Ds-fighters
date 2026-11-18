/* DS Fighters — Classificacao de forca + buff dos fracos no TORNEIO (arcade).
   - Balance.score(d): forca do lutador (stats + estilo de luta).
   - Balance.buffFor(def): no torneio, os lutadores MAIS FRACOS ganham buff
     automatico: quarto mais fraco +25% HP / +15% forca; metade inferior
     +12% HP / +8% forca; metade forte nao ganha nada. */
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

  if (typeof window !== 'undefined') { window.Balance = Balance; }
  if (typeof globalThis !== 'undefined') { globalThis.Balance = Balance; }
})();
