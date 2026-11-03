/* ============================================================
   DS FIGHTERS — cliente CDP mínimo (WebSocket na mão, sem npm).

   Serve para pilotar o Chromium headless: abrir página, rodar JS
   dentro do jogo (Runtime.evaluate) e capturar screenshot
   (Page.captureScreenshot). É o "playwright de pobre" do projeto.
   ============================================================ */
import http from 'node:http';
import crypto from 'node:crypto';

export async function newPage(port, url) {
  const open = (method, p) => new Promise((res, rej) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method }, (r) => {
      let b = ''; r.on('data', (d) => { b += d; }); r.on('end', () => res({ status: r.statusCode, body: b }));
    });
    req.on('error', rej); req.end();
  });
  // versões novas exigem PUT em /json/new
  let r = await open('PUT', '/json/new?' + encodeURIComponent(url));
  if (r.status !== 200) r = await open('GET', '/json/new?' + encodeURIComponent(url));
  return JSON.parse(r.body);
}

export function connect(wsUrl, { onEvent } = {}) {
  const u = new URL(wsUrl);
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      host: u.hostname, port: u.port, path: u.pathname + u.search,
      headers: {
        Connection: 'Upgrade', Upgrade: 'websocket',
        'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13',
      },
    });
    req.on('upgrade', (res, socket) => {
      socket.setNoDelay(true);
      const api = { socket, id: 0, pending: new Map(), events: [] };

      const send = (obj) => {
        const data = Buffer.from(JSON.stringify(obj));
        const mask = crypto.randomBytes(4);
        let head;
        if (data.length < 126) head = Buffer.from([0x81, 0x80 | data.length]);
        else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 0xfe; head.writeUInt16BE(data.length, 2); }
        else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 0xff; head.writeBigUInt64BE(BigInt(data.length), 2); }
        const payload = Buffer.from(data.map((b, i) => b ^ mask[i % 4]));
        socket.write(Buffer.concat([head, mask, payload]));
      };

      let buf = Buffer.alloc(0);
      const handle = (frame) => {
        const op = frame[0] & 0x0f;
        let len = frame[1] & 0x7f, off = 2;
        if (len === 126) { len = frame.readUInt16BE(2); off = 4; }
        else if (len === 127) { len = Number(frame.readBigUInt64BE(2)); off = 10; }
        const payload = frame.subarray(off, off + len);
        if (op === 9) { // ping → pong
          socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
          return len + off;
        }
        if (op === 1 || op === 0) {
          try {
            const msg = JSON.parse(payload.toString());
            if (msg.id && api.pending.has(msg.id)) {
              const { res } = api.pending.get(msg.id); api.pending.delete(msg.id); res(msg);
            } else if (msg.method) {
              api.events.push(msg);
              if (onEvent) onEvent(msg);
            }
          } catch (e) { /* frame parcial */ }
        }
        return len + off;
      };

      let scratch = Buffer.alloc(0);
      socket.on('data', (chunk) => {
        scratch = Buffer.concat([scratch, chunk]);
        while (scratch.length >= 2) {
          let len = scratch[1] & 0x7f, need = 2;
          if (len === 126) { if (scratch.length < 4) break; len = scratch.readUInt16BE(2); need = 4; }
          else if (len === 127) { if (scratch.length < 10) break; len = Number(scratch.readBigUInt64BE(2)); need = 10; }
          if (scratch.length < need + len) break;
          const consume = handle(scratch.subarray(0, need + len));
          scratch = scratch.subarray(consume);
        }
      });
      socket.on('error', reject);

      api.send = send;
      api.cmd = (method, params = {}) => new Promise((res) => {
        const id = ++api.id;
        api.pending.set(id, { res });
        send({ id, method, params });
      });
      api.evaluate = async (expr, { awaitPromise = true } = {}) => {
        const r = await api.cmd('Runtime.evaluate', {
          expression: expr, returnByValue: true, awaitPromise, allowUnsafeEvalBlockedByCSP: true,
        });
        if (r.result && r.result.exceptionDetails) {
          const d = r.result.exceptionDetails;
          throw new Error((d.exception && d.exception.description) || d.text);
        }
        return r.result && r.result.result ? r.result.result.value : undefined;
      };
      api.screenshot = async (outPath, { clip } = {}) => {
        const { writeFileSync } = await import('node:fs');
        const r = await api.cmd('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { clip } : {}));
        writeFileSync(outPath, Buffer.from(r.result.data, 'base64'));
        return outPath;
      };
      api.waitFor = async (expr, timeout = 60000, step = 120) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
          try { if (await api.evaluate(`!!(${expr})`, { awaitPromise: false })) return true; } catch (e) {}
          await new Promise((r) => setTimeout(r, step));
        }
        return false;
      };
      api.close = () => socket.destroy();
      resolve(api);
    });
    req.on('error', reject);
    req.end();
  });
}
