/* ============================================================
   DS FIGHTERS — Teclado, toque e controle (API Gamepad, padrão PS4).
   ============================================================ */

const Input = {
  keys: new Set(),
  pressed: new Set(),
  padState: [{}, {}],
  padCount: 0,
  _prevPad: [new Set(), new Set()],

  p1: {
    left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
    punch: 'KeyA', kick: 'KeyS', special: 'KeyD', super: 'KeyF',
  },
  p2: {
    left: 'KeyJ', right: 'KeyL', up: 'KeyI', down: 'KeyK',
    punch: 'Digit1', kick: 'Digit2', special: 'Digit3', super: 'Digit4',
  },

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); });

    document.querySelectorAll('#touch-controls .tbtn').forEach((btn) => {
      const code = btn.dataset.k;
      const on = (e) => {
        e.preventDefault();
        if (!this.keys.has(code)) this.pressed.add(code);
        this.keys.add(code);
      };
      const off = (e) => { e.preventDefault(); this.keys.delete(code); };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });

    const touch = document.getElementById('touch-controls');
    if (touch && 'ontouchstart' in window) touch.classList.remove('hidden');
  },

  down(code) { return this.keys.has(code); },
  hit(code) { return this.pressed.has(code); },

  emptyPad() {
    return {
      left: false, right: false, up: false, down: false,
      punch: false, kick: false, special: false, super: false, start: false,
      punchHit: false, kickHit: false, specialHit: false, superHit: false,
      upHit: false, downHit: false, leftHit: false, rightHit: false, startHit: false,
    };
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
      // Quadrado / L1 = soco, X / R1 = chute, Círculo / L2 = especial, Triângulo / R2 = super
      st.punch = b(2) || b(4);
      st.kick = b(0) || b(5);
      st.special = b(1) || b(6);
      st.super = b(3) || b(7);
      st.start = b(9);
      const prev = this._prevPad[slot];
      const mark = (name, on) => {
        const hitKey = name + 'Hit';
        st[hitKey] = on && !prev.has(name);
        if (on) prev.add(name);
        else prev.delete(name);
      };
      mark('left', st.left);
      mark('right', st.right);
      mark('up', st.up);
      mark('down', st.down);
      mark('punch', st.punch);
      mark('kick', st.kick);
      mark('special', st.special);
      mark('super', st.super);
      mark('start', st.start);
    }
    this.padState = next;
    this.padCount = count;
  },

  pad(index = 0) {
    return this.padState[index] || this.emptyPad();
  },

  read(map, padIndex = 0) {
    const pad = this.pad(padIndex);
    return {
      left: this.down(map.left) || pad.left,
      right: this.down(map.right) || pad.right,
      up: this.down(map.up) || pad.up,
      down: this.down(map.down) || pad.down,
      punch: this.hit(map.punch) || pad.punchHit,
      kick: this.hit(map.kick) || pad.kickHit,
      special: this.hit(map.special) || pad.specialHit,
      super: this.hit(map.super) || pad.superHit,
    };
  },

  endFrame() { this.pressed.clear(); },
};
