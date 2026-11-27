// HABILIDADES ANIMADAS: nenhuma linha de atlas de habilidade (assets/abilities)
// pode ter os 4 quadros iguais — efeito parado em luta (era o caso da Kira,
// Milena e Dev Virado; agora animados por tools/animate_static_abilities.py).
const fs = require('fs');
const path = require('path');
let PNG;
try { PNG = require('pngjs').PNG; } catch (e) { console.log('SKIP pngjs ausente'); process.exit(0); }
const DIR = path.resolve(__dirname, '..', 'assets', 'abilities');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const parados = [];
let linhas = 0;
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.png'))) {
  const png = PNG.sync.read(fs.readFileSync(path.join(DIR, f)));
  if (png.width % 4) continue;
  const S = png.width / 4, rows = Math.floor(png.height / S);
  for (let r = 0; r < rows; r++) {
    let opaco = 0, diff = 0;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i0 = ((r * S + y) * png.width + x) * 4;
        if (png.data[i0 + 3] > 40) opaco++;
        for (let c = 1; c < 4; c++) {
          const i1 = i0 + c * S * 4;
          for (let k = 0; k < 4; k++) diff += Math.abs(png.data[i0 + k] - png.data[i1 + k]);
        }
      }
    }
    if (opaco < 50) continue; /* linha vazia */
    linhas++;
    if (diff / (S * S * 12) < 0.5) parados.push(f.replace('.png', '') + ':' + r);
  }
}
check('atlas de habilidade lidos (' + linhas + ' linhas com efeito)', linhas > 200, String(linhas));
check('nenhuma linha de habilidade com os 4 quadros iguais (efeito parado)', parados.length === 0, parados.slice(0, 8).join(', ') || 'ok');
for (const id of ['kira', 'milena', 'dev-virado']) {
  check(id + ': fonte do icone original guardada em arte-fonte/habilidades-base', fs.existsSync(path.resolve(__dirname, '..', 'arte-fonte', 'habilidades-base', id + '.png')));
}
console.log(fails ? `HABILIDADES ANIMADAS: ${fails} FALHAS (${n} checks)` : `HABILIDADES ANIMADAS: TUDO OK (${n} checks)`);
process.exit(fails ? 1 : 0);
