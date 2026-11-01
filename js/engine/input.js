/* ============================================================
   DS FIGHTERS — Teclado, toque e controle (API Gamepad, padrão Xbox/PS).
   Cada habilidade tem tecla própria (mostrada embaixo do ícone na HUD).
   ============================================================ */
const ACTIONS = ['punch', 'kick', 'a0', 'a1', 'a2', 'a3', 'a4', 'tag'];

const Input = {
  keys: new Set(),
  pressed: new Set(),
  padState: [{}, {}],
  padCount: 0,
  _prevPad: [new Set(), new Set()],
  p1: {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
    punch: ['KeyA'], kick: ['KeyS'], a0: ['KeyD'], a1: ['KeyF'], a2: ['KeyQ'], a3: ['KeyW'], a4: ['KeyE'], tag: ['KeyR'],
  },
  p2: {
    left: ['KeyJ'], right: ['KeyL'], up: ['KeyI'], down: ['KeyK'],
    punch: ['Digit1', 'Numpad1'], kick: ['Digit2', 'Numpad2'], a0: ['Digit3', 'Numpad3'], a1: ['Digit4', 'Numpad4'],
    a2: ['Digit5', 'Numpad5'], a3: ['Digit6', 'Numpad6'], a4: ['Digit7', 'Numpad7'], tag: ['Digit8', 'Numpad8'],
  },
  /* Rótulos curtos para a HUD. */
  label(slot, action) {
    const m = slot === 1 ? this.p2 : this.p1;
    const code = (m[action] || [])[0] || '';
    return code.replace('Key', '').replace('Digit', '').replace('Numpad', 'N').replace('Arrow', '');
  },
  padLabel(action) {
    return { punch: '□', kick: '✕', a0: '○', a1: '△', a2: 'L1', a3: 'R1', a4: 'R2', tag: 'L2' }[action] || '';
  },
  init() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); });
    document.querySelectorAll('#touch-controls [data-k]').forEach((btn) => {
      const code = btn.dataset.k;
      const on = (e) => {
        e.preventDefault();
        if (!this.keys.has(code)) this.pressed.add(code);
        this.keys.add(code);
        btn.classList.add('on');
      };
      const off = (e) => { e.preventDefault(); this.keys.delete(code); btn.classList.remove('on'); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    });
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
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
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
      st.punch = b(2);
      st.kick = b(0);
      st.a0 = b(1);
      st.a1 = b(3);
      st.a2 = b(4);
      st.a3 = b(5);
      st.a4 = b(7);
      st.tag = b(6);
      st.start = b(9);
      st.back = b(1) || b(8);
      st.confirm = b(0) || b(9);
      const prev = this._prevPad[slot];
      [...ACTIONS, 'up', 'down', 'left', 'right', 'start', 'back', 'confirm'].forEach((name) => {
        const on = st[name];
        st[name + 'Hit'] = on && !prev.has(name);
        if (on) prev.add(name); else prev.delete(name);
      });
    }
    this.padState = next;
    this.padCount = count;
  },
  pad(index = 0) { return this.padState[index] || this.emptyPad(); },
  /* Entrada de luta para um jogador (slot 0 = P1, 1 = P2). */
  read(slot) {
    const map = slot === 1 ? this.p2 : this.p1;
    const pad = this.pad(slot);
    const out = {
      left: this.down(map.left) || pad.left,
      right: this.down(map.right) || pad.right,
      up: this.down(map.up) || pad.up,
      down: this.down(map.down) || pad.down,
    };
    ACTIONS.forEach((a) => { out[a] = this.hit(map[a]) || pad[a + 'Hit']; });
    return out;
  },
  /* Navegação de menus (qualquer teclado/controle). */
  menu() {
    const p0 = this.pad(0);
    const p1 = this.pad(1);
    const any = (k) => p0[k] || p1[k];
    return {
      up: this.hit(['ArrowUp']) || any('upHit'),
      down: this.hit(['ArrowDown']) || any('downHit'),
      left: this.hit(['ArrowLeft']) || any('leftHit'),
      right: this.hit(['ArrowRight']) || any('rightHit'),
      confirm: any('confirmHit'),
      back: any('backHit'),
      start: this.hit(['Escape', 'KeyP']) || any('startHit'),
    };
  },
  endFrame() { this.pressed.clear(); },
};
const EMPTY_INPUT = Object.freeze({ left: false, right: false, up: false, down: false, punch: false, kick: false, a0: false, a1: false, a2: false, a3: false, a4: false, tag: false });
