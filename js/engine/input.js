/* ============================================================
   DS FIGHTERS — Input: teclado (P1/P2) + botões de toque.
   ============================================================ */

const Input = {
  keys: new Set(),
  pressed: new Set(),   // pressionado neste frame
  p1: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyA', kick: 'KeyS', special: 'KeyD', super: 'KeyF' },
  p2: { left: 'KeyJ', right: 'KeyL', up: 'KeyI', down: 'KeyK', punch: 'Digit1', kick: 'Digit2', special: 'Digit3', super: 'Digit4' },

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    document.querySelectorAll('#touch-controls .tbtn').forEach((btn) => {
      const code = btn.dataset.k;
      const on = (e) => { e.preventDefault(); if (!this.keys.has(code)) this.pressed.add(code); this.keys.add(code); };
      const off = (e) => { e.preventDefault(); this.keys.delete(code); };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });

    if ('ontouchstart' in window) {
      document.getElementById('touch-controls').classList.remove('hidden');
    }
  },

  down(code) { return this.keys.has(code); },
  hit(code) { return this.pressed.has(code); },

  read(map) {
    return {
      left: this.down(map.left),
      right: this.down(map.right),
      up: this.down(map.up),
      down: this.down(map.down),
      punch: this.hit(map.punch),
      kick: this.hit(map.kick),
      special: this.hit(map.special),
      super: this.hit(map.super),
    };
  },

  endFrame() { this.pressed.clear(); },
};
