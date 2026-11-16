// ============================================================
// ANÁLISE DE IMAGEM — assets/pets/pitoco.png
// Verifica se o sprite está bem recortado (sem magenta, transparência OK)
// ============================================================
const fs = require('fs');
const { PNG } = require('pngjs');

const MAGENTA = (r, g, b, a) => a > 40 && g < 90 && r > 150 && b > 90;

(async () => {
  const imgData = fs.readFileSync('assets/pets/pitoco.png');
  const img = PNG.sync.read(imgData);
  const w = img.width, h = img.height;
  console.log(`📐 Dimensões: ${w} x ${h}`);

  const data = img.data;

  let magentaCount = 0;
  let opaqueCount = 0;
  let transparentCount = 0;
  let semitransparentCount = 0;
  let nonTransparentPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a === 0) { transparentCount++; continue; }
    if (a < 255) { semitransparentCount++; }
    if (a > 0) { opaqueCount++; nonTransparentPixels++; }
    if (MAGENTA(r, g, b, a)) magentaCount++;
  }

  console.log(`\n📊 Análise de pixels:`);
  console.log(`  - Pixels totalmente transparentes: ${transparentCount}`);
  console.log(`  - Pixels opacos/semi-opacos (a > 0): ${opaqueCount}`);
  console.log(`  - Pixels semi-transparentes (0 < a < 255): ${semitransparentCount}`);
  console.log(`  - Pixels MAGENTA (possível artefato de recorte ruim): ${magentaCount}`);

  // Verificar se tem 4 quadras (cols: 4)
  const cols = 4;
  const frameW = w / cols;
  console.log(`\n🎞️  Quadros (cols=${cols}):`);
  console.log(`  - Largura total: ${w}px`);
  console.log(`  - Largura por quadro: ${frameW}px`);
  console.log(`  - Altura: ${h}px`);

  // Verificar cada quadro se tem conteúdo
  for (let col = 0; col < cols; col++) {
    let quadroOpc = 0, quadroMag = 0;
    for (let y = 0; y < h; y++) {
      for (let x = col * frameW; x < (col + 1) * frameW; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        if (a > 0) quadroOpc++;
        if (MAGENTA(r, g, b, a)) quadroMag++;
      }
    }
    console.log(`  - Quadro ${col + 1}: ${quadroOpc} px opacos, ${quadroMag} px magenta`);
  }

  console.log(`\n${magentaCount === 0 ? '✅' : '❌'} MAGENTA: ${magentaCount === 0 ? 'NENHUM — sprite limpo' : 'DETECTADO — possível recorte ruim'}`);
  console.log(`${nonTransparentPixels > 0 ? '✅' : '❌'} CONTEÚDO: ${nonTransparentPixels} px não-transparentes (sprite não está vazio)`);
  console.log(`${frameW === Math.floor(frameW) ? '✅' : '❌'} QUADROS: ${cols} quadros de ${frameW}px cada (divisão exata)`);
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });