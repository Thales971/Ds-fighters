/* ============================================================
   DS FIGHTERS — Servidor dedicado de salas (Node.js + ws).
   Uso: npm install && npm start   (PORT=8787 por padrão)
   A lógica de salas (protocolo, validação, 1v1 / 2x2 / 2x2 com 4
   jogadores, reconexão, placar, limites) fica em room-core.js — o mesmo
   arquivo usado pelo modo P2P do navegador (js/net/room-core.js).
   Este arquivo só cuida do transporte WebSocket, origem e conexões.
   ============================================================ */
'use strict';
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
let RoomCore;
try { RoomCore = require('./room-core.js'); } catch (e) { RoomCore = require('../js/net/room-core.js'); }

const PORT = parseInt(process.env.PORT || '8787', 10);
const MAX_CONN = parseInt(process.env.MAX_CONN || '2000', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const { PROTOCOL, MAX_MSG } = RoomCore;

function createServer(port = PORT) {
  const core = RoomCore.createRooms({
    maxRooms: parseInt(process.env.MAX_ROOMS || '500', 10),
    graceMs: parseInt(process.env.GRACE_MS || '30000', 10),
  });
  let connCount = 0;
  let seq = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ ok: true, game: 'ds-fighters', protocol: PROTOCOL, rooms: core.rooms.size, connections: connCount }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const wss = new WebSocketServer({ server, maxPayload: MAX_MSG });
  wss.on('connection', (ws, req) => {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) { ws.close(1008, 'origem não permitida'); return; }
    if (connCount >= MAX_CONN) { ws.close(1013, 'lotado'); return; }
    connCount++;
    const conn = {
      id: 'p' + (++seq) + crypto.randomBytes(3).toString('hex'),
      send: (msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); },
      kill: () => { try { ws.terminate(); } catch (e) { /* */ } },
    };
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (data) => {
      const raw = data.toString();
      if (raw.length > MAX_MSG) return;
      core.onMessage(conn, raw);
      if (conn.lastProtocolError) ws.close();
    });
    ws.on('close', () => { connCount--; core.onClose(conn); });
    ws.on('error', () => {});
  });
  const hb = setInterval(() => {
    wss.clients.forEach((ws) => { if (!ws.alive) { ws.terminate(); return; } ws.alive = false; ws.ping(); });
  }, 15000);
  wss.on('close', () => clearInterval(hb));
  server.listen(port, () => console.log(`[ds-fighters] servidor de salas v${PROTOCOL} na porta ${port}`));
  return { server, wss, rooms: core.rooms };
}

if (require.main === module) createServer();
module.exports = { createServer, PROTOCOL };
