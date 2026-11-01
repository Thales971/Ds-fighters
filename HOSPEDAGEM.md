# Hospedagem do DS Fighters (jogo + online)

O jogo tem duas partes:

1. **O jogo** (pasta raiz: `index.html`, `js/`, `css/`, `assets/`) — arquivos estáticos. Qualquer hospedagem estática serve: GitHub Pages, Netlify, Vercel, Cloudflare Pages ou um servidor Nginx.
2. **O servidor de salas** (`online-server/`) — um processo Node.js com WebSocket que precisa ficar ligado. Sem ele o jogo funciona inteiro (Arcade, Versus, 2 × 2, Treino), e a tela Online mostra **"ONLINE INDISPONÍVEL"** com instruções, sem simular sala falsa.

> Aviso: vários serviços de hospedagem são gratuitos com limites, mas alguns cobram por uso ou por tempo ligado. Confira os preços antes de contratar.

## Como o online funciona

| Peça | Responsabilidade |
|---|---|
| **Anfitrião** (quem cria a sala) | Simula a luta inteira: combate, dano, power-ups, clima, mecânicas da arena, rounds e vencedor. Envia um snapshot 30 vezes por segundo. |
| **Convidado** | Envia só as teclas (12 bits por quadro) e desenha o snapshot que recebe. |
| **Servidor** | Valida protocolo e mensagens, cria salas com código de 6 caracteres, aceita no máximo 2 jogadores, valida lutadores/mascote/arena, exige os dois PRONTOS, só repassa entrada do convidado para o anfitrião e snapshot do anfitrião para o convidado, aceita o resultado só do anfitrião e guarda o placar da sala. |

Quedas: quem cair tem **30 s** para voltar (o navegador tenta reconectar sozinho com um token da sessão). Enquanto isso a luta fica pausada. Se o convidado não voltar, a partida é cancelada; se o anfitrião sair, a sala é encerrada.

Por ser autoridade do anfitrião, o ideal é que o anfitrião tenha a melhor conexão. A latência do convidado é a ida e volta até o servidor e ao anfitrião, então escolha uma região de servidor próxima dos jogadores.

## Rodar o servidor localmente

```bash
cd online-server
npm install
npm start          # escuta em ws://localhost:8787
npm test           # 25 verificações automáticas com conexões reais
```

Abra o jogo em `http://localhost:8080`, vá em **Online** (o endereço `ws://localhost:8787` já vem preenchido quando você está no localhost), crie uma sala e entre com o código em outra aba ou outro PC da mesma rede (use `ws://IP-DO-PC:8787`).

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `8787` | Porta HTTP/WebSocket |
| `ALLOWED_ORIGINS` | vazio (aceita todas) | Lista separada por vírgula, ex. `https://thales971.github.io` |
| `MAX_ROOMS` | `500` | Limite de salas simultâneas |
| `MAX_CONN` | `2000` | Limite de conexões |
| `GRACE_MS` | `30000` | Tempo para voltar depois de cair |

`GET /health` responde `{ ok, protocol, rooms, connections }` para monitoramento.

## Publicar o servidor (exemplos)

Qualquer serviço que rode Node 18+ e aceite WebSocket serve. Em todos, o diretório do app é `online-server`, o comando de build é `npm install` e o de início é `npm start`.

- **Render / Railway / Fly.io / Koyeb**: crie um serviço web a partir do repositório, diretório raiz `online-server`. O serviço dá um endereço `https://seu-app...`; no jogo use **`wss://seu-app...`**.
- **VPS própria** (Ubuntu): `node server.js` com `pm2` ou `systemd`, atrás de Nginx com HTTPS (Let's Encrypt). Configure o proxy de WebSocket:

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
COPY online-server/server.js ./
EXPOSE 8787
CMD ["node", "server.js"]
```

Se o jogo estiver em HTTPS (GitHub Pages, por exemplo), o servidor **precisa** ser `wss://` (com TLS); navegadores bloqueiam `ws://` em páginas HTTPS.

## Apontar o jogo para o servidor

Duas opções:

1. Cada jogador cola o endereço `wss://...` no campo **Servidor** da tela Online (fica salvo).
2. Deixar fixo para todo mundo: em `js/net/online.js`, na função `defaultUrl()`, troque o `return '';` final por `return 'wss://seu-servidor';`.

## Checklist antes de anunciar o online

- [ ] `https://seu-servidor/health` responde `ok: true`.
- [ ] Duas máquinas em redes diferentes criam e entram na mesma sala pelo código.
- [ ] A luta começa quando os dois marcam PRONTO, os golpes do convidado aparecem no anfitrião e o placar da sala sobe no fim.
- [ ] Fechar a aba do convidado pausa a luta e reabrir em até 30 s retoma.
- [ ] Uma terceira pessoa com o mesmo código recebe "Sala cheia".
