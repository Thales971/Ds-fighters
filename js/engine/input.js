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
        this._touchPointers.set(e.pointerId, { code, btn });
        this._touchCodes.set(code, (this._touchCodes.get(code) || 0) + 1);
        try { btn.setPointerCapture(e.pointerId); } catch (ignored) { /* navegador antigo */ }
        mark(code);
        btn.classList.add('on');
      };
      const off = (e) => {
        if (e.cancelable) e.preventDefault();
        const held = this._touchPointers.get(e.pointerId);
        if (!held) return;
        this._touchPointers.delete(e.pointerId);
        const count = (this._touchCodes.get(held.code) || 1) - 1;
        if (count > 0) this._touchCodes.set(held.code, count);
        else { this._touchCodes.delete(held.code); if (!this._physical.has(held.code)) this.keys.delete(held.code); }
        held.btn.classList.toggle('on', count > 0);
      };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('lostpointercapture', off);
    });
  },
  releaseAll() {
    this._touchPointers.forEach(({ btn }) => btn.classList.remove('on'));
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
