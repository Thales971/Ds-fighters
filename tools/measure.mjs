#!/usr/bin/env node
/* Auditoria "na tela": mede o desenho real de cada lutador/pose/frame.
   Uso: node tools/measure.mjs grika winx-exe nina-vector --out /tmp/med.json */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { newPage, connect } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const outFile = outIdx >= 0 ? argv[outIdx + 1] : '/tmp/measure.json';
const ids = argv.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
const PORT = 8110, DBG = 9340;

const server = spawn(process.execPath, [path.join(ROOT, 'tools/dev_server.mjs'), String(PORT)], { stdio: 'ignore' });
const chrome = spawn(process.env.CHROME || 'chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--hide-scrollbars', '--mute-audio', `--user-data-dir=/tmp/dsf-cdp-${DBG}`,
  `--remote-debugging-port=${DBG}`, '--window-size=1000,600', 'about:blank',
], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch (e) {} try { server.kill('SIGKILL'); } catch (e) {} };
process.on('exit', cleanup);

const until = async (fn, ms = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
  return false;
};
try {
  const ready = await until(() => new Promise((res) => {
    http.get(`http://127.0.0.1:${DBG}/json/version`, (r) => { r.resume(); res(r.statusCode === 200); }).on('error', () => res(false));
  }), 20000);
  if (!ready) throw new Error('chromium não abriu');
  const url = `http://127.0.0.1:${PORT}/tools/measure.html?ids=${encodeURIComponent(ids.join(','))}`;
  const page = await newPage(DBG, url);
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.cmd('Runtime.enable');
  const ok = await cdp.waitFor(`document.title === 'LAB-DONE' || document.title === 'LAB-ERRO'`, 120000);
  const title = await cdp.evaluate('document.title', { awaitPromise: false });
  if (!ok || title !== 'LAB-DONE') throw new Error('medida falhou: ' + title);
  const data = await cdp.evaluate('JSON.stringify(window.__MEASURE)', { awaitPromise: false });
  fs.writeFileSync(outFile, data);
  console.log('salvo', outFile, (data.length / 1024).toFixed(1) + 'KB');
  cdp.close();
} catch (e) {
  console.error('falhou:', e.message);
  process.exitCode = 1;
} finally {
  cleanup();
  setTimeout(() => process.exit(), 50);
}
