/* DS Fighters — ET 1155: o carro dele na ultimate (nov/2026).
   "Debloat Total" continua montando o PC retro e explodindo o gabinete no
   rival; agora, junto, o sedan velho do ET entra pela tela por tras dele e
   atropela o oponente (dano, empurrao forte e lancamento).
   Arte: assets/fx/et-car.png, desenhada por tools/build_et_car.py.
   O atropelamento e tratado em fighter.js (case 'blast', p.car). */
(() => {
  if (typeof ART_SHEETS !== 'undefined') {
    ART_SHEETS['fx2:et-car'] = { src: 'assets/fx/et-car.png', size: 256, cols: 4, rows: 1, v: 'v99-etcar' };
  }
  if (typeof POWERS === 'undefined' || !POWERS.stack) return;
  for (const p of POWERS.stack.powers) {
    if (p.id === 'debloat') {
      p.car = { sheet: 'et-car', dmg: 16, speed: 21, scale: 1.3 };
      p.desc = 'O sedan velho do ET atravessa a tela e atropela o rival; logo depois ele monta um PC retrô e explode o gabinete em cima.';
    }
    if (p.id === 'chip') p.cd = 30;
  }
})();
