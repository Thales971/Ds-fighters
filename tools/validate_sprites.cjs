// ============================================================
// VALIDAÇÃO COMPLETA DE SPRITES — Pitoco, Fauna, Torcida, Jess
// ============================================================
const fs = require('fs');
const { PNG } = require('pngjs');

const MAGENTA = (r, g, b, a) => a > 40 && g < 90 && r > 150 && b > 90;

let passed = 0;
let failed = 0;

function check(name, condition, extra = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra ? '| ' + extra : ''}`);
  }
}

// Conta, por celula 320x260 da sheet 4x15, fragmentos soltos: componentes de
// alpha (n>=8) a mais de 6px do blob principal (dilatado 6x). Fragmento de
// outro sprite cortado na borda cai aqui.
function detachedFragments(img) {
  const CW = 320, CH = 260, cols = img.width / CW, rows = img.height / CH;
  const d = img.data;
  let bad = 0, detail = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * CW, y0 = r * CH;
      const op = new Uint8Array(CW * CH);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        if (d[((y0 + y) * img.width + x0 + x) * 4 + 3] > 40) op[y * CW + x] = 1;
      }
      const seen = new Uint8Array(CW * CH);
      const comps = [];
      for (let i = 0; i < CW * CH; i++) {
        if (!op[i] || seen[i]) continue;
        let size = 0;
        const stack = [i]; seen[i] = 1;
        while (stack.length) {
          const p = stack.pop(); size++;
          const px = p % CW, py = (p / CW) | 0;
          if (px > 0 && op[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
          if (px < CW - 1 && op[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
          if (py > 0 && op[p - CW] && !seen[p - CW]) { seen[p - CW] = 1; stack.push(p - CW); }
          if (py < CH - 1 && op[p + CW] && !seen[p + CW]) { seen[p + CW] = 1; stack.push(p + CW); }
        }
        comps.push({ size, seed: i });
      }
      if (!comps.length) continue;
      comps.sort((a, b) => b.size - a.size);
      const main = comps[0].seed;
      // mascara do blob principal (BFS a partir do seed) dilatada 6px
      let m;
      {
        const stack = [main]; const inMain = new Uint8Array(CW * CH); inMain[main] = 1;
        while (stack.length) {
          const p = stack.pop();
          const px = p % CW, py = (p / CW) | 0;
          if (px > 0 && op[p - 1] && !inMain[p - 1]) { inMain[p - 1] = 1; stack.push(p - 1); }
          if (px < CW - 1 && op[p + 1] && !inMain[p + 1]) { inMain[p + 1] = 1; stack.push(p + 1); }
          if (py > 0 && op[p - CW] && !inMain[p - CW]) { inMain[p - CW] = 1; stack.push(p - CW); }
          if (py < CH - 1 && op[p + CW] && !inMain[p + CW]) { inMain[p + CW] = 1; stack.push(p + CW); }
        }
        m = inMain;
        for (let k = 0; k < 6; k++) {
          const nm = new Uint8Array(m);
          for (let p = 0; p < CW * CH; p++) {
            if (!m[p]) continue;
            const px = p % CW, py = (p / CW) | 0;
            nm[p] = 1;
            if (px > 0) nm[p - 1] = 1;
            if (px < CW - 1) nm[p + 1] = 1;
            if (py > 0) nm[p - CW] = 1;
            if (py < CH - 1) nm[p + CW] = 1;
          }
          m = nm;
        }
      }
      for (const cp of comps.slice(1)) {
        if (cp.size < 8) continue;
        // esta perto do principal?
        let near = false;
        const stack = [cp.seed]; const vis = new Uint8Array(CW * CH); vis[cp.seed] = 1;
        while (stack.length && !near) {
          const p = stack.pop();
          if (m[p]) { near = true; break; }
          const px = p % CW, py = (p / CW) | 0;
          if (px > 0 && op[p - 1] && !vis[p - 1]) { vis[p - 1] = 1; stack.push(p - 1); }
          if (px < CW - 1 && op[p + 1] && !vis[p + 1]) { vis[p + 1] = 1; stack.push(p + 1); }
          if (py > 0 && op[p - CW] && !vis[p - CW]) { vis[p - CW] = 1; stack.push(p - CW); }
          if (py < CH - 1 && op[p + CW] && !vis[p + CW]) { vis[p + CW] = 1; stack.push(p + CW); }
        }
        if (!near) { bad++; if (detail.length < 6) detail.push(`r${r}c${c} n=${cp.size}`); }
      }
    }
  }
  return { bad, detail };
}

// ============================================================
// 1. Análise de Imagens
// ============================================================
(async () => {
  console.log('\n📊 1. ANÁLISE DE IMAGENS...\n');

  // 1.1 Pitoco
  console.log('--- Pitoco ---');
  let img = PNG.sync.read(fs.readFileSync('assets/pets/pitoco.png'));
  check('Pitoco: largura 384px', img.width === 384, `got ${img.width}`);
  check('Pitoco: altura 96px', img.height === 96, `got ${img.height}`);
  check('Pitoco: 4 quadros de 96px', img.width === 4 * 96, `got ${img.width} / ${img.height}`);
  
  let data = img.data;
  let magentaCount = 0, opaqueCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a === 0) continue;
    opaqueCount++;
    if (MAGENTA(data[i], data[i+1], data[i+2], a)) magentaCount++;
  }
  check('Pitoco: 0 pixels magenta', magentaCount === 0, `magenta: ${magentaCount}`);
  check('Pitoco: tem conteúdo', opaqueCount > 0, `opacos: ${opaqueCount}`);

  // 1.2 Bichos (fauna)
  console.log('--- Bichos (bichos.png) ---');
  img = PNG.sync.read(fs.readFileSync('assets/fauna/bichos.png'));
  check('Bichos: largura ' + img.width + 'px', img.width > 0);
  check('Bichos: altura ' + img.height + 'px', img.height > 0);
  data = img.data;
  magentaCount = 0; opaqueCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a === 0) continue;
    opaqueCount++;
    if (MAGENTA(data[i], data[i+1], data[i+2], a)) magentaCount++;
  }
  check('Bichos: 0 pixels magenta', magentaCount === 0, `magenta: ${magentaCount}`);
  check('Bichos: tem conteúdo', opaqueCount > 0, `opacos: ${opaqueCount}`);
  // Cada quadro é 96×96, atlas tem 4 colunas → 4 quadros por linha, 10 linhas (8 especies + esquilo + libelula) = 40 células
  check('Bichos: atlas esperado 10×4 = 40 células', img.width === 384 && img.height === 960, `got ${img.width}×${img.height}`);
  // Todas as 10 linhas (especies) precisam ter pelo menos 1 célula com figura
  let linhasComFigura = 0;
  for (let row = 0; row < 10; row++) {
    let tem = 0;
    for (let y = row * 96; y < (row + 1) * 96 && !tem; y++) {
      for (let x = 0; x < img.width; x++) {
        if (data[(y * img.width + x) * 4 + 3] > 0) { tem = 1; break; }
      }
    }
    if (tem) linhasComFigura++;
  }
  check('Bichos: todas as 10 especies (linhas) têm sprite', linhasComFigura === 10, `linhas com sprite: ${linhasComFigura}/10`);

  // 1.3 Torcida
  console.log('--- Torcida (torcida.png) ---');
  img = PNG.sync.read(fs.readFileSync('assets/fauna/torcida.png'));
  check('Torcida: largura ' + img.width + 'px', img.width > 0);
  check('Torcida: altura ' + img.height + 'px', img.height > 0);
  data = img.data;
  magentaCount = 0; opaqueCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a === 0) continue;
    opaqueCount++;
    if (MAGENTA(data[i], data[i+1], data[i+2], a)) magentaCount++;
  }
  check('Torcida: 0 pixels magenta', magentaCount === 0, `magenta: ${magentaCount}`);
  check('Torcida: 5 colunas × 256x200 esperadas', img.width === 1280 && img.height === 200, `got ${img.width}×${img.height} (esperado 1280×200 para 5×256)`);
  // A folha é 1 fileira × 5 pessoas (256×200 cada) — verificar que cada pessoa tem conteúdo
  let pessoasComFigura = 0;
  for (let col = 0; col < 5; col++) {
    let tem = 0;
    for (let y = 0; y < img.height && !tem; y++) {
      for (let x = col * 256; x < (col + 1) * 256; x++) {
        if (data[(y * img.width + x) * 4 + 3] > 0) { tem = 1; break; }
      }
    }
    if (tem) pessoasComFigura++;
  }
  check('Torcida: todas as 5 pessoas têm sprite', pessoasComFigura === 5, `pessoas com sprite: ${pessoasComFigura}/5`);

  // 1.4 Jess (sprite sheet)
  console.log('--- Jess (jess.png) ---');
  img = PNG.sync.read(fs.readFileSync('assets/sprites/jess.png'));
  check('Jess: largura ' + img.width + 'px', img.width > 0);
  check('Jess: altura ' + img.height + 'px', img.height > 0);
  data = img.data;
  magentaCount = 0; opaqueCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a === 0) continue;
    opaqueCount++;
    if (MAGENTA(data[i], data[i+1], data[i+2], a)) magentaCount++;
  }
  check('Jess: 0 pixels magenta', magentaCount === 0, `magenta: ${magentaCount}`);
  check('Jess: tem conteúdo', opaqueCount > 0, `opacos: ${opaqueCount}`);
  // Sprite sheets JESS são 4×15 → 4 colunas × 15 linhas = 60 poses
  // Linhas típicas: 15 × altura_linha. Se cada pose é ~128px → altura ~1920px
  // Vamos apenas confirmar largura múltiplo de 320 (CELL_W)
  check('Jess: largura múltiplo de 320 (CELL_W)', img.width % 320 === 0, `got ${img.width}`);
  const frag = detachedFragments(img);
  check('Jess: 0 fragmentos soltos (>6px do sprite principal, ex.: metade de outro sprite cortado na borda)', frag.bad === 0, frag.detail.join(' '));

  // 1.5 Flora (atlas real de arte-fonte/flora/flores.png + arte-fonte/flora/grama.png)
  console.log('--- Flora (flora.png) ---');
  img = PNG.sync.read(fs.readFileSync('assets/fauna/flora.png'));
  check('Flora: atlas 512x640 (4 cols x 5 linhas de 128px)', img.width === 512 && img.height === 640, `${img.width}x${img.height}`);
  let floraCells = 0, floraMagenta = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      let tem = false;
      for (let y = r * 128; y < (r + 1) * 128 && !tem; y++) {
        for (let x = c * 128; x < (c + 1) * 128 && !tem; x++) {
          const i = (y * img.width + x) * 4;
          if (img.data[i + 3] > 40) { tem = true; if (MAGENTA(img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3])) floraMagenta++; }
        }
      }
      if (tem) floraCells++;
    }
  }
  check('Flora: 20/20 celulas com conteudo', floraCells === 20, `${floraCells}/20`);
  check('Flora: 0 pixels magenta', floraMagenta === 0, `magenta: ${floraMagenta}`);

  // ============================================================
  // 2. Resumo
  // ============================================================
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTADO: ${passed} aprovados, ${failed} falhas`);
  console.log('='.repeat('50'));
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });