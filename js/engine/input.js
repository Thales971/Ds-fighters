/* ============================================================
   DS FIGHTERS — Teclado, mouse e controle (API Gamepad, padrão PS4).
   Jogador 1: WASD + mouse (soco = esquerdo, chute = direito) e poderes 1–0.
   Jogador 2: setas + numpad, sem cruzar com as teclas do jogador 1.
   ============================================================ */
const POWER_SLOTS = 10;
const ACTIONS = ['punch', 'kick', 'tag'].concat(Array.from({ length: POWER_SLOTS }, (_, i) => 'a' + i));

const Input = {
  keys: new Set(),
  pressed: new Set(),
  _physical: new Set(),
  _touchPointers: new Map(),
  _touchCodes: new Map(),
  padState: [{}, {}],
  padCount: 0,
  _prevPad: [new Set(), new Set()],
  p1: {
    left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
    punch: ['MouseLeft'], kick: ['MouseRight'], tag: ['KeyR'],
    a0: ['Digit1'], a1: ['Digit2'], a2: ['Digit3'], a3: ['Digit4'], a4: ['Digit5'],
    a5: ['Digit6'], a6: ['Digit7'], a7: ['Digit8'], a8: ['Digit9'], a9: ['Digit0'],
  },
  p2: {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
    punch: ['KeyJ'], kick: ['KeyK'], tag: ['KeyL'],
    a0: ['Numpad1'], a1: ['Numpad2'], a2: ['Numpad3'], a3: ['Numpad4'], a4: ['Numpad5'],
    a5: ['Numpad6'], a6: ['Numpad7'], a7: ['Numpad8'], a8: ['Numpad9'], a9: ['Numpad0'],
  },
  label(slot, action) {
    const m = slot === 1 ? this.p2 : this.p1;
    const code = (m[action] || [])[0] || '';
    if (code === 'MouseLeft') return 'M1';
    if (code === 'MouseRight') return 'M2';
    return code.replace('Key', '').replace('Digit', '').replace('Numpad', 'N').replace('Arrow', '');
  },
  padLabel(action) {
    return {
      punch: '□', kick: '✕', tag: 'L2',
      a0: '○', a1: '△', a2: 'L1', a3: 'R1', a4: 'R2',
      a5: 'L3', a6: 'R3', a7: 'Tpad', a8: '', a9: '',
    }[action] || '';
  },
  init() {
    const mark = (code) => {
      if (!code) return;
      if (!this.keys.has(code)) this.pressed.add(code);
      this.keys.add(code);
    };
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      this._physical.add(e.code);
      mark(e.code);
      /* PITOCO: o codigo do sangue escuta em qualquer tela de pet */
      if (typeof UI !== 'undefined' && UI.pitocoKey && UI.screen === 'custom') UI.pitocoKey(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this._physical.delete(e.code); if (!this._touchCodes.has(e.code)) this.keys.delete(e.code); });
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
    document.addEventListener('focusin', (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) this.releaseAll(); });
    const app = document.getElementById('app');
    const area = document.getElementById('stage-wrap');
    const mouseCode = (btn) => (btn === 0 ? 'MouseLeft' : btn === 2 ? 'MouseRight' : '');
    const onMouseDown = (e) => {
      const code = mouseCode(e.button);
      if (!code) return;
      e.preventDefault();
      if (typeof UI !== 'undefined' && UI.screen === 'fight') { this._physical.add(code); mark(code); }
    };
    if (area) area.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', (e) => {
      const code = mouseCode(e.button);
      if (code) { this._physical.delete(code); if (!this._touchCodes.has(code)) this.keys.delete(code); }
    });
    if (app) app.addEventListener('contextmenu', (e) => { if (!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); });
    document.querySelectorAll('#touch-controls [data-k]').forEach((btn) => {
      const code = btn.dataset.k;
      const on = (e) => {
        e.preventDefault();
        if (this._touchPointers.has(e.pointerId)) return;
        const held = { code, btn, timer: 0 };
        this._touchPointers.set(e.pointerId, held);
        this._touchCodes.set(code, (this._touchCodes.get(code) || 0) + 1);
        try { btn.setPointerCapture(e.pointerId); } catch (ignored) { /* navegador antigo */ }
        mark(code);
        btn.classList.add('on');
        /* COMBO FACIL: segurar SOCO/CHUTE repete o golpe (um toque novo a cada
           ~8 quadros) — no vidro tocar rapido varias vezes e o que mais falha */
        if ((code === 'MouseLeft' || code === 'MouseRight') && !(typeof Profile !== 'undefined' && Profile.setting('touchAuto') === false)) {
          held.timer = setInterval(() => { if (this._touchCodes.has(code)) this.pressed.add(code); }, 135);
        }
      };
      const off = (e) => {
        if (e.cancelable) e.preventDefault();
        const held = this._touchPointers.get(e.pointerId);
        if (!held) return;
        this._touchPointers.delete(e.pointerId);
        if (held.timer) clearInterval(held.timer);
        const count = (this._touchCodes.get(held.code) || 1) - 1;
        if (count > 0) this._touchCodes.set(held.code, count);
        else { this._touchCodes.delete(held.code); if (!this._physical.has(held.code)) this.keys.delete(held.code); }
        held.btn.classList.toggle('on', count > 0);
      };
      btn.addEventListener('pointerdown', (e) => {
        this.touchUsed = true; /* a luta foi jogada no toque (nota do torneio usa a regua do toque) */
        on(e);
        if (typeof Profile !== 'undefined' && Profile.setting('haptic') !== false && navigator.vibrate) navigator.vibrate(12);
      });
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('lostpointercapture', off);
    });
    const stick = document.getElementById('stick');
    if (stick) {
      const knob = stick.querySelector('i');
      const dirs = { KeyA: false, KeyD: false, KeyW: false, KeyS: false };
      const apply = (code, down) => {
        if (dirs[code] === down) return;
        dirs[code] = down;
        if (down) { this._touchCodes.set(code, (this._touchCodes.get(code) || 0) + 1); mark(code); }
        else {
          const count = (this._touchCodes.get(code) || 1) - 1;
          if (count > 0) this._touchCodes.set(code, count);
          else { this._touchCodes.delete(code); if (!this._physical.has(code)) this.keys.delete(code); }
        }
      };
      /* JOYSTICK v3 (resposta rapida pra luta):
         - o centro e onde o dedo pousou e ACOMPANHA o dedo: se o dedo passa do
           curso, o joystick e arrastado junto. Inverter a direcao (andar ->
           defender) custa ~40px em qualquer ponto, em vez de voltar ate o meio.
         - curso curto (direcao cheia rapido) e zona morta pequena
         - histerese nas bordas dos setores: nao pisca entre andar e pular
         - le pointerrawupdate quando existe (menos atraso que pointermove) */
      let center = null;
      let owner = null;
      let ownerId = null; /* so o dedo que comecou mexe no joystick */
      const host = () => (stick.offsetParent ? stick.offsetParent.getBoundingClientRect() : { left: 0, top: 0 });
      const placeStick = (x, y) => {
        const box = stick.getBoundingClientRect();
        const h = host();
        stick.classList.add('floating');
        stick.style.left = (x - h.left - box.width / 2) + 'px';
        stick.style.top = (y - h.top - box.height / 2) + 'px';
        stick.style.bottom = 'auto';
      };
      const move = (e) => {
        if (!center) return;
        const box = stick.getBoundingClientRect();
        const max = Math.max(26, box.width * 0.26);
        let dx = e.clientX - center.x;
        let dy = e.clientY - center.y;
        let len = Math.hypot(dx, dy);
        if (len > max) {
          /* arrasta o centro: o dedo fica sempre no maximo a "max" dele */
          const k = (len - max) / len;
          center.x += dx * k; center.y += dy * k;
          dx -= dx * k; dy -= dy * k; len = max;
          placeStick(center.x, center.y);
        }
        if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
        const dead = Math.max(6, max * 0.22);
        if (len < dead) { apply('KeyA', false); apply('KeyD', false); apply('KeyW', false); apply('KeyS', false); return; }
        const ux = dx / len, uy = dy / len;
        /* liga num limite, desliga num limite menor (histerese) */
        const keep = (code, val, onAt, offAt) => apply(code, dirs[code] ? val > offAt : val > onAt);
        keep('KeyA', -ux, 0.38, 0.25);
        keep('KeyD', ux, 0.38, 0.25);
        keep('KeyW', -uy, 0.5, 0.36);
        keep('KeyS', uy, 0.62, 0.48);
      };
      const reset = () => {
        if (knob) knob.style.transform = '';
        center = null; owner = null; ownerId = null;
        stick.classList.remove('floating');
        stick.style.left = ''; stick.style.top = ''; stick.style.bottom = '';
        apply('KeyA', false); apply('KeyD', false); apply('KeyW', false); apply('KeyS', false);
      };
      this._resetStick = reset;
      const begin = (e, el, floating) => {
        e.preventDefault();
        if (owner) return;
        this.touchUsed = true;
        owner = el; ownerId = e.pointerId;
        try { el.setPointerCapture(e.pointerId); } catch (ignored) { /* navegador antigo */ }
        if (floating) {
          /* o desenho do joystick pula pra baixo do dedo */
          center = { x: e.clientX, y: e.clientY };
          placeStick(center.x, center.y);
        } else {
          const box = stick.getBoundingClientRect();
          center = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        }
        if (typeof Profile !== 'undefined' && Profile.setting('haptic') !== false && navigator.vibrate) navigator.vibrate(10);
        move(e);
      };
      const moveEv = ('onpointerrawupdate' in window) ? 'pointerrawupdate' : 'pointermove';
      stick.addEventListener('pointerdown', (e) => begin(e, stick, false));
      const mine = (e, el) => owner === el && e.pointerId === ownerId;
      stick.addEventListener(moveEv, (e) => { if (mine(e, stick)) move(e); });
      if (moveEv !== 'pointermove') stick.addEventListener('pointermove', (e) => { if (mine(e, stick)) move(e); });
      stick.addEventListener('pointerup', (e) => { if (mine(e, stick)) reset(); });
      stick.addEventListener('pointercancel', (e) => { if (mine(e, stick)) reset(); });
      const zone = document.getElementById('stick-zone');
      if (zone) {
        zone.addEventListener('pointerdown', (e) => {
          if (typeof Profile !== 'undefined' && Profile.setting('touchFloat') === false) return;
          begin(e, zone, true);
        });
        zone.addEventListener(moveEv, (e) => { if (mine(e, zone)) move(e); });
        if (moveEv !== 'pointermove') zone.addEventListener('pointermove', (e) => { if (mine(e, zone)) move(e); });
        zone.addEventListener('pointerup', (e) => { if (mine(e, zone)) reset(); });
        zone.addEventListener('pointercancel', (e) => { if (mine(e, zone)) reset(); });
      }
    }
  },
  releaseAll() {
    if (this._resetStick) this._resetStick();
    this._touchPointers.forEach(({ btn, timer }) => { btn.classList.remove('on'); if (timer) clearInterval(timer); });
    this._touchPointers.clear(); this._touchCodes.clear(); this._physical.clear();
    this.keys.clear(); this.pressed.clear();
  },
  down(codes) { return codes.some((c) => this.keys.has(c)); },
  hit(codes) { return codes.some((c) => this.pressed.has(c)); },
  emptyPad() {
    const o = { left: false, right: false, up: false, down: false, start: false, back: false, confirm: false };
    ACTIONS.forEach((a) => { o[a] = false; o[a + 'Hit'] = false; });
    ['up', 'down', 'left', 'right', 'start', 'back', 'confirm'].forEach((a) => { o[a + 'Hit'] = false; });
    return o;
  },
  pollPads() {
    let pads = [];
    if (!this.gamepadUnavailable && navigator.getGamepads) {
      try { pads = navigator.getGamepads() || []; }
      catch (_error) { this.gamepadUnavailable = true; } // Iframes podem negar a API.
    }
    let count = 0;
    const next = [this.emptyPad(), this.emptyPad()];
    for (let i = 0; i < pads.length && count < 2; i++) {
      const gp = pads[i];
      if (!gp) continue;
      const slot = count++;
      const b = (n) => !!(gp.buttons[n] && (gp.buttons[n].pressed || gp.buttons[n].value > 0.5));
      const ax = gp.axes || [];
      const dead = 0.38;
      const st = next[slot];
      st.left = b(14) || (ax[0] || 0) < -dead;
      st.right = b(15) || (ax[0] || 0) > dead;
      st.up = b(12) || (ax[1] || 0) < -dead;
      st.down = b(13) || (ax[1] || 0) > dead;
      /* PS4 no mapeamento padrão: □ soco, ✕ chute, ○ △ L1 R1 R2 poderes 1–5, L3 R3 e touchpad 6–8, L2 troca. */
      st.punch = b(2);
      st.kick = b(0);
      st.a0 = b(1);
      st.a1 = b(3);
      st.a2 = b(4);
      st.a3 = b(5);
      st.a4 = b(7);
      st.a5 = b(10);
      st.a6 = b(11);
      st.a7 = b(17);
      st.tag = b(6);
      st.start = b(9);
      st.back = b(8);
      st.confirm = b(0) || b(9);
      const prev = this._prevPad[slot];
      [...ACTIONS, 'up', 'down', 'left', 'right', 'start', 'back', 'confirm'].forEach((name) => {
        const on = !!st[name];
        st[name + 'Hit'] = on && !prev.has(name);
        if (on) prev.add(name); else prev.delete(name);
      });
    }
    for (let s = count; s < 2; s++) this._prevPad[s].clear();
    this.padState = next;
    this.padCount = count;
  },
  pad(index = 0) { return this.padState[index] || this.emptyPad(); },
  read(slot) {
    const map = slot === 1 ? this.p2 : this.p1;
    const pad = this.pad(slot);
    const out = {
      left: this.down(map.left) || pad.left,
      right: this.down(map.right) || pad.right,
      up: this.down(map.up) || pad.up,
      down: this.down(map.down) || pad.down,
    };
    ACTIONS.forEach((a) => { out[a] = this.hit(map[a]) || !!pad[a + 'Hit']; });
    return out;
  },
  menu() {
    const p0 = this.pad(0);
    const p1p = this.pad(1);
    const any = (k) => p0[k] || p1p[k];
    return {
      up: this.hit(['ArrowUp', 'KeyW']) || any('upHit'),
      down: this.hit(['ArrowDown', 'KeyS']) || any('downHit'),
      left: this.hit(['ArrowLeft', 'KeyA']) || any('leftHit'),
      right: this.hit(['ArrowRight', 'KeyD']) || any('rightHit'),
      confirm: any('confirmHit'),
      back: any('backHit') || any('a0Hit'),
      start: this.hit(['Escape', 'KeyP']) || any('startHit'),
    };
  },
  endFrame() { this.pressed.clear(); },
};

function blankInput() {
  const o = { left: false, right: false, up: false, down: false, punch: false, kick: false, tag: false };
  for (let i = 0; i < POWER_SLOTS; i++) o['a' + i] = false;
  return o;
}
const EMPTY_INPUT = Object.freeze(blankInput());
