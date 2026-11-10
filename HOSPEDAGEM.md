# Hospedagem do DS Fighters (jogo + online)

O cliente do jogo é estático (`index.html`, `js/`, `css/`, `assets/`). A tela de torneio usa ainda uma Vercel Function HTTP (`api/tournaments.js`) e, quando ativada, Redis persistente conectado pela Vercel Marketplace.

> Aviso: Vercel, Netlify, GitHub Pages e Cloudflare Pages têm planos gratuitos com limites de uso. O servidor dedicado opcional (mais abaixo) pode ter custo dependendo do serviço. Confira os preços antes de contratar qualquer coisa.

## Duas formas de conexão online

| Conexão | Precisa de servidor? | Como funciona |
|---|---|---|
| **P2P (padrão, grátis)** | Não | O navegador de quem cria a sala vira o anfitrião. Os outros se conectam direto a ele por WebRTC. Um "broker" público e gratuito do PeerJS (`0.peerjs.com`) só faz a apresentação inicial entre os navegadores; a luta trafega direto entre os jogadores. |
| **Servidor dedicado (opcional)** | Sim (`online-server/`) | Um processo Node.js com WebSocket repassa as mensagens. Útil se alguma rede bloquear WebRTC (redes corporativas, alguns 4G com NAT restrito) ou se você quiser controle total. |

Os dois usam **o mesmo núcleo de salas** (`js/net/room-core.js`): códigos de 6 caracteres, link de convite, até 4 jogadores, validação de protocolo, lutador, mascote e arena, exigência de todos PRONTOS, chat, placar e reconexão.

### Autoridade

| Peça | Responsabilidade |
|---|---|
| **Anfitrião** (quem cria a sala) | Simula a luta inteira: combate, dano, power-ups, clima, mecânicas da arena, rounds e vencedor. Envia snapshot 30 vezes por segundo. |
| **Convidados** | Enviam só as teclas e desenham o snapshot recebido. |
| **Núcleo da sala** | Valida mensagens, define os slots (Equipe A/B, titular/reserva), só aceita entrada do slot dono e resultado do anfitrião. |

Modos online: **1 × 1**, **2 × 2 com 2 jogadores** (cada um controla uma dupla) e **2 × 2 com 4 jogadores** (cada um controla um lutador; o reserva entra com TROCA ou chama ASSIST com SOCO).

Quedas: quem cair tem **30 s** para voltar (o navegador reconecta sozinho). A luta pausa enquanto isso. No P2P, se o anfitrião fechar a aba a sala acaba (o navegador dele *é* o servidor).

## Publicar o jogo

### Vercel (grátis)

1. Entre em <https://vercel.com> com sua conta do GitHub.
2. **Add New → Project → Import** o repositório `Thales971/Ds-fighters`.
3. Framework Preset: **Other**. Build Command: vazio. Output Directory: `.` (raiz).
4. **Deploy**. O endereço fica algo como `https://ds-fighters.vercel.app`. Cada `git push` publica de novo automaticamente.

O `vercel.json` do repositório já define o cache dos assets, e o `.vercelignore` deixa de fora ferramentas e o servidor.

### Torneios online V12 (até 32 participantes)

O front-end e a API HTTP do torneio ficam no projeto Vercel. A API grava inscrições, chave e resultados em Redis persistente; não usa memória de uma Function. Sem o Redis, o jogo esconde o formulário de criar/entrar e mostra um aviso em português. As salas P2P normais continuam.

Para ligar o torneio:

1. No projeto da Vercel, abra **Integrations** (ou [Marketplace → Upstash](https://vercel.com/integrations/upstash)) e conecte **Upstash Redis** a este projeto. O guia da Upstash está em <https://upstash.com/docs/redis/howto/vercelintegration>.
2. Confirme que o ambiente de **Production** recebeu as variáveis (a integração preenche sozinha; não cole o token no repositório nem no JavaScript):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - A API também aceita os nomes antigos da Vercel KV: `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. Faça **Redeploy**. `GET /api/tournaments?health=1` deve responder `{ "ok": true }`. Aí o painel do jogo libera criar e entrar.

Sem essas variáveis, `GET /api/tournaments?health=1` responde **503** com `storage_not_configured`. Num servidor estático local (`python3 -m http.server`) o mesmo endereço responde **404**, porque não existe a Function. Nos dois casos a interface esconde criar/entrar em vez de fingir que o torneio foi salvo. O torneio usa chave de eliminação simples para 2–32 jogadores, códigos de inscrição, confrontos P2P 1 × 1 e dupla confirmação do resultado; disputas ficam para o organizador. O painel atualiza a chave em intervalo moderado, e também tem atualização manual, porque a REST do Redis cobra por comando/request conforme o [guia da API](https://upstash.com/docs/redis/features/restapi).

O gameplay continua usando o transporte P2P/WebRTC atual, com o broker público PeerJS para apresentação inicial dos navegadores. A hospedagem da Function não transforma o navegador do anfitrião em servidor dedicado; se ele fechar a aba, a sala pode cair e o organizador precisa reabrir o confronto. As partidas não são retransmitidas pela API do torneio.

**Erro `500 FUNCTION_INVOCATION_FAILED`?** O Vercel tentou rodar o servidor Node em vez de servir os arquivos. No projeto do Vercel, vá em **Settings → Build and Deployment** e confira:

- **Root Directory**: vazio (raiz do repositório), **não** `online-server`.
- **Framework Preset**: **Other**.
- **Build Command**, **Output Directory** e **Install Command**: desligados/vazios (sem override).

Salve e faça **Deployments → ⋯ → Redeploy** (desmarque "Use existing Build Cache").

### Netlify / Cloudflare Pages

Mesmo esquema: importe o repositório, sem comando de build, diretório de publicação = raiz.
Isso hospeda o jogo e as salas P2P normais; o painel de torneio V12 continuará indisponível, pois `api/tournaments.js` é uma Vercel Function. Para usar torneio, mantenha a implantação da aplicação na Vercel e conecte o Redis conforme a seção acima.

### GitHub Pages

Repositório → **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Endereço: `https://thales971.github.io/Ds-fighters/`.
O jogo e o online P2P normal funcionam como arquivos estáticos; o torneio V12 não, pois o endpoint `/api/tournaments` e seu Redis persistente precisam ser implantados pela Vercel.

### Testar localmente

```bash
python3 -m http.server 8080   # abra http://localhost:8080
```

## Servidor dedicado (opcional)

```bash
cd online-server
npm install
npm start          # ws://localhost:8787
npm test           # 38 verificações automáticas com conexões reais
```

O servidor usa `room-core.js` (cópia de `js/net/room-core.js`; rode `npm run sync` depois de alterar o núcleo).

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `8787` | Porta HTTP/WebSocket |
| `ALLOWED_ORIGINS` | vazio (aceita todas) | Lista separada por vírgula, ex. `https://ds-fighters.vercel.app` |
| `MAX_ROOMS` | `500` | Limite de salas simultâneas |
| `MAX_CONN` | `2000` | Limite de conexões |
| `GRACE_MS` | `30000` | Tempo para voltar depois de cair |

`GET /health` responde `{ ok, protocol, rooms, connections }`.

Onde publicar o servidor dedicado (Node 18+ com WebSocket):

> Atualização 2026: a [Vercel documenta suporte a WebSockets em Functions em beta](https://vercel.com/docs/functions/websockets), mas cada conexão continua sujeita a um limite de duração e instâncias independentes não compartilham memória. O modo torneio não depende dessa conexão longa: usa Functions HTTP + Redis integrado, enquanto os frames das lutas seguem P2P. Para o servidor dedicado contínuo descrito aqui, mantenha um serviço Node com suporte a WebSocket.

- **Render / Railway / Fly.io / Koyeb**: serviço web a partir do repositório, diretório `online-server`, build `npm install`, início `npm start`. No jogo use `wss://seu-app...`.
- **VPS** com Nginx + HTTPS:

```nginx
location / {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

- **Docker**:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY online-server/package*.json ./
RUN npm ci --omit=dev
COPY online-server/server.js online-server/room-core.js ./
EXPOSE 8787
CMD ["node", "server.js"]
```

Com o jogo em HTTPS o servidor **precisa** ser `wss://`. Para usá-lo: na tela Online escolha **Conexão → Servidor dedicado** e cole o endereço (fica salvo), ou fixe para todos em `js/net/online.js` (`defaultUrl()`).

## Checklist antes de anunciar

- [ ] O jogo abre no endereço publicado e a tela Online mostra "P2P pronto".
- [ ] Duas pessoas em redes diferentes criam e entram na mesma sala pelo código ou pelo link de convite.
- [ ] A luta começa quando todos marcam PRONTO e os golpes do convidado aparecem para o anfitrião.
- [ ] Sala 2 × 2 com 4 jogadores: a reserva entra com TROCA.
- [ ] Uma pessoa a mais com o mesmo código recebe "Sala cheia".
