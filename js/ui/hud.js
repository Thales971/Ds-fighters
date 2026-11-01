/* ============================================================
   DS FIGHTERS — HUD em HTML (sem Canvas).
   Barras de vida com dano vermelho recuperável, escudo, pips de round,
   retrato, parceiro do 2x2, medidores (carga A/B e ULT), status com
   tempo restante, kit roubado e as 5 habilidades com a tecla embaixo.
   ============================================================ */
const HUD = {
  els: null,
  built: false,
  sayT: [0, 0],
  comboT: [0, 0],
  $(id) { return document.getElementById(id); },
  keyLabels(game, ti) {
    const cfg = game.cfg || {};
    const human = game.mode === 'online' ? ti === cfg.localTeam : game.mode === 'demo' ? false : !(cfg.cpu && cfg.cpu[ti]) && !(game.mode === 'training' && ti === 1);
    if (!human) return null;
    const slot = game.mode === 'online' ? 0 : (cfg.cpu && cfg.cpu[0] ? 0 : ti);
    const pad = Input.padCount > slot;
    return ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'tag', 'punch', 'kick'].reduce((o, a) => {
      o[a] = Input.label(slot, a) + (pad ? ' · ' + Input.padLabel(a) : '');
      return o;
    }, {});
  },
  reset(game) {
    this.game = game;
    document.querySelectorAll('#hud .side').forEach((side) => {
      const ti = +side.dataset.team;
      const t = game.teams[ti];
      const f = t.members[t.active];
      const partner = t.members.find((m, k) => k !== t.active);
      side.innerHTML = `
        <div class="face" style="background-image:url(assets/ui/face-${f.def.id}.png)"></div>
        <div class="info">
          <div class="nameline"><span class="name">${f.def.name}</span><span class="pips">${'<i></i>'.repeat(game.cfg.roundsToWin)}</span></div>
          <div class="life"><div class="red"></div><div class="fill"></div><div class="shield"></div><div class="lifenum"></div></div>
          <div class="meters">
            <div class="m ult"><b>ULT</b><span><i></i></span></div>
            <div class="m ca"><b>A</b><span><i></i></span></div>
            <div class="m cb"><b>B</b><span><i></i></span></div>
            <div class="stun"><i></i></div>
          </div>
          <div class="statuses"></div>
        </div>
        ${partner ? `<div class="partner"><div class="pface" style="background-image:url(assets/ui/face-${partner.def.id}.png)"></div><div class="plife"><i></i></div><div class="ptag"></div></div>` : ''}`;
      const keys = this.keyLabels(game, ti);
      const sk = this.$('skills-' + ti);
      const kit = f.currentKit();
      sk.innerHTML = kit.map((p, i) => `
        <div class="skill s${i} ${p.slot}" data-i="${i}" title="${p.name}: ${p.desc || ''}">
          <div class="ico"></div><div class="cool"></div><div class="lock">🔒</div>
          <div class="pct"></div>
          <div class="key">${keys ? keys['a' + i] : (game.mode === 'online' ? 'REMOTO' : 'CPU')}</div>
        </div>`).join('') + `<div class="skill-name"></div>`;
      sk.dataset.kit = '';
    });
    this.$('hud').classList.toggle('tag', game.mode === 'tag' || !!(game.cfg && game.cfg.tag));
    this.$('hud').classList.toggle('hidden', game.mode === 'demo');
    this.built = true;
  },
  setStageInfo(stage, w) {
    const mech = stage.mech && typeof MECH_INFO !== 'undefined' ? MECH_INFO[stage.mech] || '' : '';
    this.$('hud-stage').innerHTML = `<span class="st">${stage.name}</span><span class="wx">${w.icon} ${w.name}</span>${mech ? `<span class="mc">${mech.split(':')[0]}</span>` : ''}`;
  },
  combo(ti, n) {
    const el = this.$('combo-' + ti);
    el.innerHTML = `<b>${n}</b> HITS${n >= 8 ? '<em>INSANO!</em>' : n >= 5 ? '<em>BRUTAL!</em>' : ''}`;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop', 'on');
    this.comboT[ti] = performance.now() + 1300;
  },
  say(ti, text) {
    const el = this.$('speech-' + ti);
    el.textContent = text;
    el.classList.add('on');
    this.sayT[ti] = performance.now() + 2600;
  },
  hide() { this.$('hud').classList.add('hidden'); },
  update(game) {
    if (!this.built || !game.teams) return;
    const now = performance.now();
    [0, 1].forEach((ti) => {
      if (now > this.comboT[ti]) this.$('combo-' + ti).classList.remove('on');
      if (now > this.sayT[ti]) this.$('speech-' + ti).classList.remove('on');
      const t = game.teams[ti];
      const f = t.members[t.active];
      const side = document.querySelector(`#hud .side[data-team="${ti}"]`);
      if (!side || !f) return;
      const q = (s) => side.querySelector(s);
      const hpPct = Math.max(0, f.hp / f.maxHp) * 100;
      q('.fill').style.width = hpPct + '%';
      q('.red').style.width = Math.max(0, f.redHp / f.maxHp) * 100 + '%';
      q('.shield').style.width = Math.min(100, ((f.shield || 0) / f.maxHp) * 100 * 3) + '%';
      q('.lifenum').textContent = Math.ceil(Math.max(0, f.hp));
      q('.life').classList.toggle('low', hpPct < 25);
      q('.ult i').style.width = f.ultimate + '%';
      q('.ult').classList.toggle('full', f.ultimate >= 100);
      q('.ca i').style.width = f.charge[0] + '%';
      q('.ca').classList.toggle('full', f.charge[0] >= 100);
      q('.cb i').style.width = f.charge[1] + '%';
      q('.cb').classList.toggle('full', f.charge[1] >= 100);
      q('.stun i').style.width = Math.min(100, f.stunGauge || 0) + '%';
      side.querySelectorAll('.pips i').forEach((p, k) => p.classList.toggle('won', k < game.teamWins[ti]));
      // status
      const chips = [];
      for (const k of Object.keys(f.status || {})) {
        const left = f.left(k);
        if (left <= 0 || !STATUS_LABEL[k]) continue;
        chips.push(`<span style="--c:${STATUS_LABEL[k].c}">${STATUS_LABEL[k].t} ${Math.ceil(left / 60)}s</span>`);
      }
      if (f.stolen) chips.unshift(`<span class="big" style="--c:#c77dff">KIT DE ${(f.stolen.fromName || '').toUpperCase()} ${Math.ceil(Math.max(0, f.stolen.until - f.now) / 60)}s</span>`);
      if (f.afo) chips.push(`<span style="--c:#b26bff">ALL FOR ONE ×${f.afo}</span>`);
      if (f.has && f.has('dizzy')) chips.push(`<span class="big" style="--c:#ffe14d">TONTO!</span>`);
      const html = chips.join('');
      const st = q('.statuses');
      if (st.dataset.h !== html) { st.innerHTML = html; st.dataset.h = html; }
      // parceiro
      const partner = t.members.find((m, k) => k !== t.active);
      if (partner && q('.partner')) {
        q('.plife i').style.width = Math.max(0, partner.hp / partner.maxHp) * 100 + '%';
        q('.partner').classList.toggle('dead', !partner.alive);
        const keys = this.keyLabels(game, ti);
        q('.ptag').textContent = !partner.alive ? 'K.O.' : t.tagCd > 0 ? Math.ceil(t.tagCd / 60) + 's' : 'TROCA ' + (keys ? keys.tag : '');
        q('.partner').classList.toggle('ready', partner.alive && t.tagCd <= 0);
      }
      // habilidades
      const sk = this.$('skills-' + ti);
      const kitKey = (f.stolen ? 'S:' + f.stolen.from : 'O:' + f.def.id);
      if (sk.dataset.kit !== kitKey) {
        sk.dataset.kit = kitKey;
        const kit = f.currentKit();
        sk.classList.toggle('stolen', !!f.stolen);
        sk.querySelectorAll('.skill').forEach((el, i) => {
          const p = kit[i];
          if (!p) return;
          const fid = f.kitOwnerId(p);
          el.querySelector('.ico').style.cssText = Art.css('abil:' + fid, p.row, 1, 54);
          el.title = p.name + ': ' + (p.desc || '');
          el.dataset.name = p.name;
        });
      }
      sk.querySelectorAll('.skill').forEach((el, i) => {
        const ps = f.powerState(i);
        el.classList.toggle('ready', !!ps.ready);
        el.classList.toggle('locked', !!ps.locked);
        el.querySelector('.cool').style.height = (ps.ready ? 0 : (1 - Math.max(0, Math.min(1, ps.pct || 0))) * 100) + '%';
        const pc = el.querySelector('.pct');
        const txt = ps.need ? 'AFO ' + ps.need : ps.ready || ps.locked ? '' : ps.p && ps.p.slot === 'simple' ? '' : Math.floor((ps.pct || 0) * 100) + '%';
        if (pc.textContent !== txt) pc.textContent = txt;
      });
    });
    const tm = this.$('hud-timer');
    const secs = game.roundTimer === Infinity ? '∞' : String(Math.max(0, Math.ceil(game.roundTimer / 60)));
    if (tm.textContent !== secs) tm.textContent = secs;
    tm.classList.toggle('low', game.roundTimer !== Infinity && game.roundTimer < 600);
    const rl = this.$('hud-round');
    const rt = game.mode === 'training' ? 'TREINO' : 'ROUND ' + game.round;
    if (rl.textContent !== rt) rl.textContent = rt;
  },
};
