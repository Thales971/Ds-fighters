#!/usr/bin/env node
/* ============================================================
   DS FIGHTERS — screenshot do jogo rodando de verdade.

   Sobe o servidor estático + Chromium headless com CDP, abre
   tools/render_lab.html, espera o canvas do jogo ser pintado
   (document.title === 'LAB-DONE') e salva o PNG.

   Uso:
     node tools/lab.mjs --a grika --b winx-exe --act idle --out /tmp/g.png
     node tools/lab.mjs --a mis --b nina-vector --act punch --ticks 30
   Sem --out, salva em tools/out/<a>-<b>-<act>.png
   ============================================================ */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { newPage, connect } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i += 2) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1];
const PORT = 8099 + (Number(opt.port) || 0);
const DBG = 9333 + (Number(opt.port) || 0);
const A = opt.a || 'grika';
const B = opt.b || 'winx-exe';
const ACT = opt.act || 'idle';
const outFile = path.resolve(opt.out || path.join(ROOT, 'tools/out', `${A}-${B}-${ACT}.png`));
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const qs = new URLSearchParams({ a: A, b: B, act: ACT, ticks: opt.ticks || '40', cd: opt.cd || '0', zoom: opt.zoom || '1' });
if (opt.stage) qs.set('stage', opt.stage);
if (opt.annot === '0') qs.set('annot', '0');
const url = `http://127.0.0.1:${PORT}/tools/render_lab.html?${qs}`;

const server = spawn(process.execPath, [path.join(ROOT, 'tools/dev_server.mjs'), String(PORT),
  ...(opt.override ? [`--override`, opt.override] : [])], { stdio: 'ignore' });

const profile = `/tmp/dsf-cdp-${DBG}`;
const chrome = spawn(process.env.CHROME || 'chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--hide-scrollbars', '--force-device-scale-factor=1',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  '--remote-allow-origins=*', `--user-data-dir=${profile}`,
  `--remote-debugging-port=${DBG}`, `--window-size=${Math.round(960 * Number(opt.zoom || 1))},${Math.round(540 * Number(opt.zoom || 1))}`,
  'about:blank',
], { stdio: 'ignore' });

const until = async (fn, ms = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
  return false;
};
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch (e) {} try { server.kill('SIGKILL'); } catch (e) {} };
process.on('exit', cleanup);

let page, cdp;
const log = (...a) => { console.error('[lab]', ...a); };
try {
  const ready = await until(() => new Promise((res) => {
    http.get(`http://127.0.0.1:${DBG}/json/version`, (r) => { r.resume(); res(r.statusCode === 200); }).on('error', () => res(false));
  }), 20000);
  if (!ready) throw new Error('Chromium não abriu a porta de debug');
  log('chromium ok, abrindo', url);
  page = await newPage(DBG, url);
  cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.cmd('Page.enable');
  await cdp.cmd('Runtime.enable');
  log('cdp conectado, esperando LAB-DONE');
  const ok = await cdp.waitFor(`document.title === 'LAB-DONE'`, Number(opt.timeout || 60000));
  const title = await cdp.evaluate('document.title', { awaitPromise: false });
  log('titulo:', title);
  if (!ok) throw new Error('lab não terminou; título=' + title);
  if (opt.script) {
    const r = await cdp.evaluate(opt.script);
    if (r !== undefined) console.error('[lab] script =>', typeof r === 'string' ? r : JSON.stringify(r));
  }
  await new Promise((r) => setTimeout(r, 250));
  await cdp.screenshot(outFile);
  console.log(outFile, fs.statSync(outFile).size + ' bytes');
} catch (e) {
  console.error('falhou:', e.message);
  process.exitCode = 1;
} finally {
  if (cdp) cdp.close();
  cleanup();
  setTimeout(() => process.exit(), 50);
}
