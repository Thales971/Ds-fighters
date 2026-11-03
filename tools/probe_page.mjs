#!/usr/bin/env node
/* Abre uma URL no Chromium headless e reporta erros de JS + estado do jogo.
   Uso: node tools/probe_page.mjs "http://127.0.0.1:8099/tools/render_lab.html?..."
        node tools/probe_page.mjs <url> --override assets/sprites/layout.js=arquivo */
import { spawn } from 'node:child_process';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { newPage, connect } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const url = argv[0];
const oi = argv.indexOf('--override');
const override = oi >= 0 ? argv[oi + 1] : null;
const PORT = Number(new URL(url).port) || 8120, DBG = 9350;
const server = spawn(process.execPath, [path.join(ROOT, 'tools/dev_server.mjs'), String(PORT),
  ...(override ? ['--override', override] : [])], { stdio: 'ignore' });
const chrome = spawn(process.env.CHROME || 'chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--mute-audio',
  '--remote-allow-origins=*', `--user-data-dir=/tmp/dsf-probe-${DBG}`,
  `--remote-debugging-port=${DBG}`, '--window-size=1000,600', 'about:blank',
], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch (e) {} try { server.kill('SIGKILL'); } catch (e) {} };
process.on('exit', cleanup);

const until = async (fn, ms = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
  return false;
};
try {
  await until(() => new Promise((res) => {
    http.get(`http://127.0.0.1:${DBG}/json/version`, (r) => { r.resume(); res(r.statusCode === 200); }).on('error', () => res(false));
  }));
  const page = await newPage(DBG, url.replace('127.0.0.1', '127.0.0.1'));
  const cdp = await connect(page.webSocketDebuggerUrl, {
    onEvent: (m) => {
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        console.log('EXCECAO:', (d.exception && d.exception.description || d.text || '').split('\n').slice(0, 3).join(' | '));
      }
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        console.log('CONSOLE:', m.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 200));
      }
    },
  });
  await cdp.cmd('Runtime.enable');
  await cdp.cmd('Page.enable');
  await new Promise((r) => setTimeout(r, 8000));
  const ev = async (e) => { try { return await cdp.evaluate(e, { awaitPromise: false }); } catch (err) { return 'ERRO ' + err.message; } };
  console.log('title:', await ev('document.title'));
  console.log('iframe DSGame:', await ev("typeof document.getElementById('frame').contentWindow.DSGame"));
  console.log('layout no iframe:', await ev("(()=>{try{return JSON.stringify({w:document.getElementById('frame').contentWindow.eval('SPRITE_LAYOUT').frameW,h:document.getElementById('frame').contentWindow.eval('SPRITE_LAYOUT').frameH,sc:document.getElementById('frame').contentWindow.eval('SPRITE_LAYOUT').drawScale,base:document.getElementById('frame').contentWindow.eval('SPRITE_LAYOUT').baseline})}catch(e){return 'ERRO '+e.message}})()"));
  console.log('fixes:', await ev("(()=>{try{return JSON.stringify(document.getElementById('frame').contentWindow.eval('SpriteGen').fixes)}catch(e){return 'n/a'}})()"));
  const si = argv.indexOf('--shot');
  if (si >= 0) { await cdp.screenshot(argv[si + 1]); console.log('shot:', argv[si + 1]); }
  cdp.close();
} catch (e) {
  console.error('falhou:', e.message);
  process.exitCode = 1;
} finally {
  cleanup();
  setTimeout(() => process.exit(), 50);
}
