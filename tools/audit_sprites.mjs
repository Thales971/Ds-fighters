#!/usr/bin/env node
/* ============================================================
   DS FIGHTERS — auditoria de sprites e do motor de desenho.

   Roda sem dependência externa (Node + os PNGs do repo) e falha
   (exit 1) se qualquer um destes bugs voltar:

   1. folha com tamanho errado (precisa ser 1280x3900 = 4x15 de 320x260)
   2. célula com o pé abaixo da baseline (boneco afundando no chão)
   3. célula estourando a borda (membro/perna cortado)
   4. pose com frames de tamanhos muito diferentes (boneco "pulsando")
   5. pose vazia / folha faltando no layout
   6. token de cache divergente entre index.html, sprites.js e fx.js
      (foi assim que o bug dos gigantes chegou nos aparelhos)
   7. layout.js velho em cache: o motor precisa se corrigir sozinho

   Uso: node tools/audit_sprites.mjs [--quiet]
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { decodePNG, cellBox, layoutIds, CW, CH, BASE, POSES } from './png_probe.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPR = path.join(ROOT, 'assets/sprites');
const QUIET = process.argv.includes('--quiet');
const problems = [];
const bad = (m) => problems.push(m);

/* ---------- 1..5: as folhas ---------- */
const ids = layoutIds();
for (const id of ids) {
  const file = path.join(SPR, `${id}.png`);
  if (!fs.existsSync(file)) { bad(`${id}: folha ausente`); continue; }
  const img = decodePNG(fs.readFileSync(file));
  if (img.width !== CW * 4 || img.height !== CH * POSES.length) {
    bad(`${id}: folha ${img.width}x${img.height} (esperado ${CW * 4}x${CH * POSES.length})`);
    continue;
  }
  for (let r = 0; r < POSES.length; r++) {
    const boxes = [0, 1, 2, 3].map((c) => cellBox(img, c, r));
    const used = boxes.filter((b) => !b.empty);
    if (!used.length) { bad(`${id}.${POSES[r]}: pose sem nenhum frame`); continue; }
    used.forEach((b, k) => {
      if (b.y1 > BASE) bad(`${id}.${POSES[r]}#${k}: pé em y=${b.y1} > baseline ${BASE} (afunda no chão)`);
      if (b.x0 <= 0) bad(`${id}.${POSES[r]}#${k}: conteúdo cortado na borda esquerda`);
      if (b.x1 >= CW - 1) bad(`${id}.${POSES[r]}#${k}: conteúdo cortado na borda direita`);
      // topo só é problema se o pé também não está na linha do chão:
      // aí o desenho flutuou e a cabeça foi cortada de verdade
      if (b.y0 <= 0 && b.y1 < BASE - 4) bad(`${id}.${POSES[r]}#${k}: conteúdo cortado no topo (pé em y=${b.y1})`);
    });
    if (used.length > 1) {
      const hs = used.map((b) => b.h);
      const mn = Math.min(...hs), mx = Math.max(...hs);
      if (mx / mn > 1.18) bad(`${id}.${POSES[r]}: frames de ${mn} a ${mx}px (${(mx / mn).toFixed(2)}x) — boneco pulando de tamanho`);
    }
  }
}
if (!QUIET) console.log(`${ids.length} folhas lidas`);

/* ---------- 6: token de cache único ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const tokens = [...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].map((m) => m[1]);
const uniq = [...new Set(tokens)];
if (uniq.length !== 1) bad(`index.html usa ${uniq.length} tokens de cache diferentes: ${uniq.join(', ')}`);
const sprjs = fs.readFileSync(path.join(ROOT, 'js/engine/sprites.js'), 'utf8');
const fxjs = fs.readFileSync(path.join(ROOT, 'js/engine/fx.js'), 'utf8');
const sprToken = (sprjs.match(/\?v=([A-Za-z0-9._-]+)/) || [])[1];
const fxToken = (fxjs.match(/\?v=([A-Za-z0-9._-]+)/) || [])[1];
if (uniq.length && sprToken !== uniq[0]) bad(`sprites.js usa ?v=${sprToken}, index.html usa ?v=${uniq[0]}`);
if (uniq.length && fxToken !== uniq[0]) bad(`fx.js usa ?v=${fxToken}, index.html usa ?v=${uniq[0]}`);
if (uniq[0] === 'expansion-v8b') bad('layout.js voltou para o token antigo expansion-v8b (é o cache que causa o bug dos gigantes)');
if (!QUIET) console.log(`token de cache: ${uniq.join(', ') || 'nenhum'}`);

/* ---------- 7: o motor se corrige com layout velho? ---------- */
function loadEngine(layoutPath) {
  const ctx = vm.createContext({
    console,
    Image: class { set src(v) { this._src = v; } },
    document: {
      createElement: () => ({
        getContext: () => ({
          clearRect() {}, drawImage() {}, fillRect() {},
          set globalCompositeOperation(v) {}, set fillStyle(v) {},
        }),
      }),
    },
  });
  vm.runInContext(fs.readFileSync(layoutPath, 'utf8') + '\n;globalThis.__L = SPRITE_LAYOUT;', ctx, { filename: 'layout.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/engine/sprites.js'), 'utf8') + '\n;globalThis.__SG = SpriteGen;', ctx, { filename: 'sprites.js' });
  return { L: ctx.__L, SG: ctx.__SG };
}

const SHEET = { naturalWidth: CW * 4, naturalHeight: CH * POSES.length };

// (a) layout bom: não deve mexer em nada
{
  const { L, SG } = loadEngine(path.join(SPR, 'layout.js'));
  if (SG.reconcile(SHEET, 'grika')) bad('o motor "corrigiu" um layout que já estava certo (falso positivo)');
  if (L.frameW !== 320 || L.frameH !== 260 || L.baseline !== 246 || L.drawScale !== 1) {
    bad(`geometria canônica errada: ${L.frameW}x${L.frameH} base ${L.baseline} scale ${L.drawScale}`);
  }
}

// (b) layout legado 96x128/drawScale 2 (o que deixava todo mundo gigante)
{
  const { L, SG } = loadEngine(path.join(ROOT, 'tools/fixtures/layout-legado-96x128.js'));
  if (!SG.reconcile(SHEET, 'grika')) bad('layout legado 96x128/drawScale 2 NÃO foi corrigido (bug dos gigantes de volta)');
  if (L.frameW !== 320 || L.frameH !== 260) bad(`layout legado virou ${L.frameW}x${L.frameH} (esperado 320x260)`);
  if (L.drawScale !== 1) bad(`layout legado manteve drawScale ${L.drawScale} (boneco gigante)`);
  if (L.baseline !== 246) bad(`layout legado manteve baseline ${L.baseline} (pé fora do chão)`);
  if (L.poses.length !== POSES.length) bad(`layout legado ficou com ${L.poses.length} poses (esperado ${POSES.length})`);
  if (L.baseline !== L.frameH - 14) bad('baseline não é frameH - 14: o pé não encosta no chão');
}

// (c) layout dizendo 8 frames numa folha de 4 colunas não pode pedir coluna inexistente
{
  const { L, SG } = loadEngine(path.join(SPR, 'layout.js'));
  L.frames.idle = 8;
  const n = SG.count('idle', 'grika');
  if (n > L.cols) bad(`count() devolveu ${n} frames para uma folha de ${L.cols} colunas`);
}

/* ---------- resultado ---------- */
if (problems.length) {
  console.log(`\n=== ${problems.length} PROBLEMA(S) ===`);
  problems.forEach((p) => console.log(' -', p));
  process.exit(1);
}
console.log('\nAUDITORIA LIMPA: folhas, arte, cache e auto-correção do layout ok');
