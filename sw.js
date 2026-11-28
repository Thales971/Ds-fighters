/* DS Fighters — service worker (app instalavel + abre sem internet).
   Regras pensadas pra NUNCA prender o jogador numa versao velha (problema que
   fez o index antigo desinstalar todo service worker a cada visita):
   - pagina, JS, CSS e JSON: REDE PRIMEIRO e sempre revalidando com o servidor
     (mesmo com o cache HTTP do GitHub Pages); o cache so e usado sem internet
   - imagens/fontes: cache primeiro e atualiza em segundo plano
   - musica (audio com Range) e API: passam direto, nunca entram no cache */
const CACHE = 'dsf-983173d3'; /* trocar o nome apaga os caches antigos no activate */

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isCode = (url, req) => req.mode === 'navigate' || /\.(html|js|mjs|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
const isMedia = (url) => /\.(mp3|ogg|wav|m4a|mp4|webm)$/i.test(url.pathname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           /* CDN/Supabase/PeerJS: navegador cuida */
  if (url.pathname.startsWith('/api/')) return;               /* API sempre ao vivo */
  if (isMedia(url) || req.headers.has('range')) return;       /* musica: streaming do navegador */

  if (isCode(url, req)) {
    e.respondWith((async () => {
      try {
        /* cache: 'no-cache' = SEMPRE confere com o servidor (ETag/304), ignorando
           o cache HTTP de 10 min do GitHub Pages: commit novo aparece na hora */
        const res = await fetch(req, { cache: 'no-cache' });
        if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
        return res;
      } catch (err) {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
        throw err;
      }
    })());
    return;
  }

  /* imagens, fontes e demais: cache primeiro, atualiza em segundo plano */
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || new Response('', { status: 504 });
  })());
});
