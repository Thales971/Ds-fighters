# 🥊 DS FIGHTERS

Jogo de luta 2D arcade no navegador — pixel art, JS/HTML/CSS puro, **sem engine**.

▶️ **Jogar agora:** <https://ds-fighters.vercel.app>

**53 lutadores na grade** (+ boneco de treino oculto e 5 personagens secretos por código) · **94 arenas** · **16 climas**.
A tela de título lê esses números direto dos dados (`FIGHTERS` / `STAGE_LIST`), então eles nunca ficam desatualizados.

## ✨ O que tem no jogo

- **Modos:** Versus local (2 jogadores no mesmo teclado) ou contra CPU · 2×2 por equipes com troca · **Arcade "Torneio até o Chefe"** (escada de chefes fortes que termina no boss **Iales**, com música de AMV na luta final) · Survival · Morte Súbita · Treino com boneco configurável · Tutorial guiado · Regras personalizadas (rounds, tempo, vida infinita) · Online P2P até 4 jogadores · Torneio com chave (Redis na Vercel).
- **Arenas vivas:** cada uma tem **clima aleatório** (chuva com anéis no chão, tempestade com raio, nevasca, aurora boreal, eclipse solar, arco-íris, neblina, onda de calor, granizo, ventania, chuva de folhas, vagalumes, confete, fogos...), **fauna reagindo à luta** (pombos que fogem, gato que se assusta, peixes na água, morcegos à noite — sempre no bioma certo) e **mecânica própria** (maré alta, lava, baixa gravidade, raio, esteira, …).
- **Gráficos:** palcos com arte própria, iluminação com halos, vignette de drama, letterbox de cinema no round final, reflexo molhado no chão na chuva/maré, aberração cromática no golpe pesado/KO, qualidade gráfica (Baixo/Médio/Alto) e limite de FPS ajustável.
- **Progressão local:** perfil no navegador, conquistas, mascotes com bônus, skins e códigos secretos para desbloquear lutadores extras.

## 🎮 Controles

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Mover / pular / agachar | `WASD` | Setas |
| Soco / chute | Botão esquerdo / direito do mouse | `J` / `K` |
| Poderes 1–5 | `1` `2` `3` `4` `5` | Numpad `1`–`5` |
| Poderes 6–10 (só alguns lutadores) | `6` `7` `8` `9` `0` | Numpad `6`–`9`, `0` |
| Trocar de lutador (2×2) | `R` | `L` |
| Defender | Segurar para trás | Segurar para trás |
| Pausa | `Esc` ou `P` | — |

Também dá pra jogar no **controle (gamepad, padrão PS4)**. Na seleção: `WASD`/setas movem, `Enter` confirma, `Backspace` volta. No versus local, o jogador 2 entra apertando `J`.

## ▶️ Rodar local

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Sem build, sem dependências: é só servir os arquivos. (Nesse servidor local o torneio fica oculto, porque não existe a Function `/api`.)

## 🗂️ Estrutura

```
index.html          tela única; carrega os scripts na ordem certa
css/style.css       tema retrô (fonte Press Start 2P, painéis, animações)
js/engine/          game.js (loop/sim 60Hz + render), fighter.js, stage.js (palco+clima+fauna),
                    weather.js (16 climas), mechanics.js (mecânicas de arena), vfx.js, ai.js, net/
js/data/            lutadores, poderes, palcos, balanceamento, conquistas, mascotes (arquivos vN = expansões)
js/ui/              telas (menu, seleção, arenas, opções, HUD...), conta/login
js/core/            profile.js (progresso local + resgatar código), input.js, audio.js
assets/             sprites, mapas, climas, fauna, músicas, fx (pixel art gerada em tools/)
tools/              ~60 suítes de teste em Node (vm) + geradores de sprites/atlas
online-server/      servidor WebSocket opcional p/ online
api/                Functions Vercel (torneio com Redis)
docs/               CONTENT-PIPELINE.md: como adicionar lutador/arena/clima
```

## 🧪 Testes

```bash
for f in tools/*_test.cjs; do printf '%-32s ' "$f"; node "$f" 2>&1 | tail -1; done
```

Cada suite imprime `TUDO OK (N checks)`. Algumas suites legadas exigem `jsdom` (não instalado) ou têm falhas pré-existentes — rode no `main` para comparar.

## 🤫 Códigos secretos

 Existem códigos que desbloqueiam lutadores e mascotes secretos. Eles **não estão escritos em nenhum arquivo público** — nem neste README, nem em comentários de código, nem na mensagem de erro quando você digita errado. Descubra jogando ou pergunte ao dono. 😉

## 🌐 Online, torneio e login

- **Online (salas até 4):** P2P via PeerJS, ou servidor WebSocket próprio em `online-server/`.
- **Torneio (2–32):** chave gravada em Redis (Upstash na Vercel). Sem Redis configurado, o menu explica o que falta em vez de quebrar. Detalhes em [HOSPEDAGEM.md](HOSPEDAGEM.md).
- **Login com Google:** Supabase; o jogo funciona 100% offline no navegador mesmo sem login. Guia em [SUPABASE.md](SUPABASE.md).

## 🚀 Deploy

Vercel, site estático: `vercel.json` com `framework: null` e sem build — cada push na `main` publica de novo. Variáveis de ambiente (Upstash/Supabase) só no painel da Vercel, nunca no código. Detalhes em [HOSPEDAGEM.md](HOSPEDAGEM.md).

## ➕ Como adicionar conteúdo

Lutador, arena, clima, poder, mascote, evento sazonal: passo a passo com testes em [docs/CONTENT-PIPELINE.md](docs/CONTENT-PIPELINE.md).

---

Arte, código e efeitos originais. Músicas do proprietário. Jogo gratuito. 🥊
