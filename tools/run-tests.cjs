#!/usr/bin/env node
/* Roda a bateria inteira (tools/*_test.cjs) em sequência, cada suíte num
   processo próprio, e sai com código != 0 se alguma falhar.
   Uso: npm test            (tudo)
        npm test -- fauna   (só suítes cujo nome contém "fauna") */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const filter = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const suites = fs.readdirSync(__dirname)
  .filter((f) => f.endsWith('_test.cjs'))
  .filter((f) => !filter.length || filter.some((q) => f.includes(q)))
  .sort();

const failed = [];
const t0 = Date.now();
for (const f of suites) {
  const s = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { cwd: ROOT, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n');
  /* varias suites imprimem "FALHA ..." mas saem com 0: a linha conta como falha */
  const printedFail = out.some((l) => /^FALHA\b/.test(l) || /\b[1-9]\d* FALHA/.test(l));
  const ok = r.status === 0 && !printedFail;
  const last = out[out.length - 1] || '';
  console.log((ok ? 'OK    ' : 'FALHA ') + f.padEnd(34) + ((Date.now() - s) / 1000).toFixed(1).padStart(6) + 's  ' + last.slice(0, 90));
  if (!ok) {
    failed.push(f);
    for (const line of out.filter((l) => /FALHA|Error|ERRO/.test(l)).slice(0, 6)) console.log('        ' + line.slice(0, 160));
    if (r.error) console.log('        ' + String(r.error.message || r.error));
  }
}
console.log('---');
console.log(`${suites.length - failed.length}/${suites.length} suítes ok em ${((Date.now() - t0) / 1000).toFixed(0)}s` + (failed.length ? ' — falharam: ' + failed.join(', ') : ''));
process.exit(failed.length ? 1 : 0);
