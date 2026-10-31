#!/usr/bin/env node
/** Abre o jogo no Chrome e tira prints, conferindo erros de console. */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const PORT = 8765;
const shots = '/tmp/ds-shots';
mkdirSync(shots, { recursive: true });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
});

const chrome = spawn('google-chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--user-data-dir=/tmp/chrome-ds-smoke',
  '--remote-debugging-port=9222',
  '--window-size=960,540',
  '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

async function cdp() {
  let wsUrl = '';
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      const info = await res.json();
      wsUrl = info.webSocketDebuggerUrl;
      break;
    } catch { await sleep(150); }
  }
  if (!wsUrl) throw new Error('chrome sem debug');
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      logs.push('EXC ' + JSON.stringify(msg.params.exceptionDetails || msg.params).slice(0, 500));
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
      if (msg.params.type === 'error' || msg.params.type === 'warning') logs.push(msg.params.type + ' ' + args);
    }
  };
  function send(method, params = {}, sessionId) {
    const msgId = ++id;
    const payload = { id: msgId, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
    return new Promise((res) => pending.set(msgId, res));
  }
  const created = await send('Target.createTarget', { url: 'about:blank' });
  if (!created.result || !created.result.targetId) {
    throw new Error('createTarget ' + JSON.stringify(created).slice(0, 300));
  }
  const attached = await send('Target.attachToTarget', { targetId: created.result.targetId, flatten: true });
  const sessionId = attached.result.sessionId;
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  return { ws, send, logs, sessionId };
}

async function shot(send, sessionId, name) {
  const msg = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  if (!msg.result || !msg.result.data) throw new Error('shot ' + name + ' ' + JSON.stringify(msg).slice(0, 400));
  writeFileSync(`${shots}/${name}.png`, Buffer.from(msg.result.data, 'base64'));
}

async function state(send, sessionId) {
  const { result } = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      href: location.href,
      errors: window.__dsErrors || [],
      screen: window.__ds && window.__ds.screen,
      hp: window.__ds && window.__ds.p1 && [Math.round(window.__ds.p1.hp), Math.round(window.__ds.p2.hp)],
      states: window.__ds && window.__ds.p1 && [window.__ds.p1.state, window.__ds.p2.state],
      imgs: window.__ds && Object.keys(SpriteGen.images).filter(k => SpriteGen.images[k]).length,
      wins: window.__ds && window.__ds.p1 && [window.__ds.p1.wins, window.__ds.p2.wins]
    })`,
    returnByValue: true,
  }, sessionId);
  return result && result.result ? result.result.value : JSON.stringify(result);
}

try {
  await sleep(400);
  const { send, logs, sessionId } = await cdp();
  const pages = [
    ['title', 'http://127.0.0.1:8765/index.html?shot=title', 700],
    ['select', 'http://127.0.0.1:8765/index.html?shot=select#select', 900],
    ['neon', 'http://127.0.0.1:8765/index.html?shot=neon#demo?stage=3&p1=0&p2=6', 2200],
    ['lab', 'http://127.0.0.1:8765/index.html?shot=lab#demo?stage=2&p1=4&p2=12', 1600],
    ['nuvem', 'http://127.0.0.1:8765/index.html?shot=nuvem#demo?stage=8&p1=2&p2=7', 1600],
    ['arena', 'http://127.0.0.1:8765/index.html?shot=arena#demo?stage=9&p1=8&p2=9', 1600],
    ['dados', 'http://127.0.0.1:8765/index.html?shot=dados#demo?stage=0&p1=3&p2=10', 1600],
    ['poder', 'http://127.0.0.1:8765/index.html?shot=poder#demo?stage=3&p1=0&p2=6', 1600],
  ];
  for (const [name, url, wait] of pages) {
    const nav = await send('Runtime.evaluate', {
      expression: `location.href = ${JSON.stringify(url)}; 'ok'`,
      returnByValue: true,
    }, sessionId);
    if (nav.result && nav.result.exceptionDetails) console.log('nav fail', name, JSON.stringify(nav.result.exceptionDetails).slice(0, 200));
    await sleep(wait);
    if (name === 'poder') {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const g = window.__ds;
          g.roundState = 'fight';
          g.p1.charge = [100, 100];
          g.p1.ultimate = 100;
          g.p2.x = Math.min(900, g.p1.x + 200);
          g.p1.castPower(g.p1.kit.powers.find((p) => p.kind === 'projectile'));
          return g.p1.state + ' ' + g.projectiles.length;
        })()`,
        returnByValue: true,
      }, sessionId);
      await sleep(500);
    }
    await shot(send, sessionId, name);
    const st = await state(send, sessionId);
    console.log(name, st);
  }
  if (logs.length) console.log('LOGS', logs.slice(0, 20).join('\n'));
  else console.log('sem logs de erro');
} finally {
  chrome.kill('SIGKILL');
  server.kill('SIGKILL');
}
