# Hospedagem do DS Fighters (jogo + online)

O jogo é **100 % estático** (`index.html`, `js/`, `css/`, `assets/`). Publique a pasta em qualquer hospedagem estática e o online já funciona para todo mundo, sem servidor próprio.

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

**Erro `500 FUNCTION_INVOCATION_FAILED`?** O Vercel tentou rodar o servidor Node em vez de servir os arquivos. No projeto do Vercel, vá em **Settings → Build and Deployment** e confira:

- **Root Directory**: vazio (raiz do repositório), **não** `online-server`.
- **Framework Preset**: **Other**.
- **Build Command**, **Output Directory** e **Install Command**: desligados/vazios (sem override).

Salve e faça **Deployments → ⋯ → Redeploy** (desmarque "Use existing Build Cache").

### Netlify / Cloudflare Pages

Mesmo esquema: importe o repositório, sem comando de build, diretório de publicação = raiz.

### GitHub Pages

Repositório → **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Endereço: `https://thales971.github.io/Ds-fighters/`.

### Testar localmente

```bash
python3 -m http.server 8080   # abra http://localhost:8080
```

## Servidor dedicado (opcional)

```bash
cd online-server
npm install
npm start          # ws://localhost:8787
npm test           # 30 verificações automáticas com conexões reais
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

Onde publicar (Node 18+ com WebSocket; o Vercel **não** serve para isto, porque não mantém WebSocket aberto):

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
