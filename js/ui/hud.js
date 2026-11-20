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
  _prevHp: [0, 0],
  _hitT: [0, 0],
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
    [0, 1].forEach((ti) => {
      const bubble = this.$('speech-' + ti);
      if (bubble) { bubble.textContent = ''; bubble.classList.remove('on'); }
      this.sayT[ti] = 0;
    });
    const cut = document.getElementById('cutin');
    if (cut) cut.classList.remove('on');
    document.querySelectorAll('#hud .side').forEach((side) => {
      const ti = +side.dataset.team;
      const t = game.teams[ti];
      const f = t.members[t.active];
      const partner = t.members.find((m, k) => k !== t.active);
      side._r = null; /* o HTML e recriado: refs antigas apontariam pra barras fora da tela */
      side.innerHTML = `
        <div class="face" style="background-image:url(${SpriteGen.faceUrl(f.def.id)})"></div>
        <div class="info">
          <div class="nameline"><span class="name">${f.def.name}</span><span class="pips">${game.mode === 'training' ? 'TREINO' : '<i></i>'.repeat(Math.min(9, game.cfg.roundsToWin))}</span></div>
          <div class="life"><div class="red"></div><div class="fill"></div><div class="shield"></div><div class="dmgflash"></div><div class="lifenum"></div></div>
          <div class="meters">
            <div class="m ult"><b>ULT</b><span><i></i></span></div>
            <div class="m ca"><b>A</b><span><i></i></span></div>
            <div class="m cb"><b>B</b><span><i></i></span></div>
            <div class="stun"><i></i></div>
          </div>
          <div class="statuses"></div>
        </div>
        ${partner ? `<div class="partner"><div class="pface" style="background-image:url(${SpriteGen.faceUrl(partner.def.id)})"></div><div class="plife"><i></i></div><div class="ptag"></div></div>` : ''}`;
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
  combo(ti, n, dmg) {
    const el = this.$('combo-' + ti);
    el.innerHTML = `<b>${n}</b> HITS${dmg ? ` <i>· ${Math.round(dmg)} dano</i>` : ''}${n >= 8 ? '<em>INSANO!</em>' : n >= 5 ? '<em>BRUTAL!</em>' : ''}`;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop', 'on');
    this.comboT[ti] = performance.now() + 1300;
  },
  say(ti, text) {
    const el = this.$('speech-' + ti);
    el.textContent = text;
    el.classList.add('on');
    this.sayT[ti] = performance.now() + 4200;
  },
  hide() { this.$('hud').classList.add('hidden'); },
  show() { this.$('hud').classList.remove('hidden'); },
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
      if (!side._r) {
        /* refs cacheadas: querySelector por frame x 60fps e caro demais */
        side._r = {
          fill: side.querySelector('.fill'), red: side.querySelector('.red'), shield: side.querySelector('.shield'),
          num: side.querySelector('.lifenum'), life: side.querySelector('.life'),
          ult: side.querySelector('.ult i'), ultP: side.querySelector('.ult'),
          ca: side.querySelector('.ca i'), caP: side.querySelector('.ca'),
          cb: side.querySelector('.cb i'), cbP: side.querySelector('.cb'),
          stun: side.querySelector('.stun i'), pips: side.querySelectorAll('.pips i'),
          statuses: side.querySelector('.statuses'), partner: side.querySelector('.partner'),
          plife: side.querySelector('.plife i'), ptag: side.querySelector('.ptag'),
        };
      }
      const R = side._r;
      const setW = (el, v) => { if (el && el._w !== v) { el._w = v; el.style.width = v; } };
      const setT = (el, v) => { if (el && el._t !== v) { el._t = v; el.textContent = v; } };
      const hpPct = Math.max(0, f.hp / f.maxHp) * 100;
      setW(R.fill, hpPct + '%');
      setW(R.red, Math.max(0, f.redHp / f.maxHp) * 100 + '%');
      setW(R.shield, Math.min(100, ((f.shield || 0) / f.maxHp) * 100 * 3) + '%');
      setT(R.num, game.cfg.infiniteLife ? '\u221e' : String(Math.ceil(Math.max(0, f.hp))));
      /* flash branco na barra quando leva dano (ghost vermelho drena depois) */
      if (this._prevHp[ti] === undefined) this._prevHp[ti] = f.hp;
      if (f.hp < this._prevHp[ti] - 0.01) this._hitT[ti] = now + 140;
      this._prevHp[ti] = f.hp;
      R.life.classList.toggle('hit', now < (this._hitT[ti] || 0));
      R.life.classList.toggle('low', hpPct < 25);
      setW(R.ult, f.ultimate + '%');
      R.ultP.classList.toggle('full', f.ultimate >= 100);
      setW(R.ca, f.charge[0] + '%');
      R.caP.classList.toggle('full', f.charge[0] >= 100);
      setW(R.cb, f.charge[1] + '%');
      R.cbP.classList.toggle('full', f.charge[1] >= 100);
      setW(R.stun, Math.min(100, f.stunGauge || 0) + '%');
      R.pips.forEach((p, k) => p.classList.toggle('won', k < game.teamWins[ti]));
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
      const st = R.statuses;
      if (st.dataset.h !== html) { st.innerHTML = html; st.dataset.h = html; }
      // parceiro
      const partner = t.members.find((m, k) => k !== t.active);
      if (partner && R.partner) {
        setW(R.plife, Math.max(0, partner.hp / partner.maxHp) * 100 + '%');
        R.partner.classList.toggle('dead', !partner.alive);
        const keys = this.keyLabels(game, ti);
        setT(R.ptag, !partner.alive ? 'K.O.' : t.tagCd > 0 ? Math.ceil(t.tagCd / 60) + 's' : 'TROCA ' + (keys ? keys.tag : ''));
        R.partner.classList.toggle('ready', partner.alive && t.tagCd <= 0);
      }
      // habilidades
      const sk = this.$('skills-' + ti);
      const kitKey = (f.stolen ? 'S:' + f.stolen.from : 'O:' + f.def.id) + (f.has('trans') ? ':trans' : '');
      if (sk.dataset.kit !== kitKey) {
        sk.dataset.kit = kitKey;
        const kit = f.currentKit();
        sk.classList.toggle('stolen', !!f.stolen);
        sk.querySelectorAll('.skill').forEach((el, i) => {
          const p = kit[i];
          if (!p) return;
          const fid = f.powerSheetId ? f.powerSheetId(p) : f.kitOwnerId(p);
          el.querySelector('.ico').style.cssText = Art.css('abil:' + fid, p.row, 1, 54);
          const label = f.powerLabel ? f.powerLabel(p) : p.name;
          el.title = label + ': ' + (p.desc || '');
          el.dataset.name = label;
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
    const suddenOn = !!(game.inferno && game.round === 3 && game.roundState === 'fight');
    if (suddenOn) {
      const secs = String(Math.max(0, Math.ceil((game.suddenLeft || 0) / 60)));
      if (tm.textContent !== secs) tm.textContent = secs;
      tm.classList.add('sudden');
      tm.classList.toggle('low', (game.suddenLeft || 0) < 600);
    } else {
      tm.classList.remove('sudden');
      const secs = game.roundTimer === Infinity ? '∞' : String(Math.max(0, Math.ceil(game.roundTimer / 60)));
      if (tm.textContent !== secs) tm.textContent = secs;
      tm.classList.toggle('low', game.roundTimer !== Infinity && game.roundTimer < 600);
    }
    const rl = this.$('hud-round');
    const rt = game.mode === 'training' ? 'TREINO' : suddenOn ? 'MORTE SÚBITA' : 'ROUND ' + game.round;
    if (rl.textContent !== rt) rl.textContent = rt;
  },
};
