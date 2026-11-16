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

  // ============================================================
  // 2. Resumo
  // ============================================================
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTADO: ${passed} aprovados, ${failed} falhas`);
  console.log('='.repeat('50'));
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });