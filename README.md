# DS FIGHTERS

Jogo de luta 2D arcade no navegador — pixel art, JS/HTML/CSS puro, sem engine. Publicado em <https://ds-fighters.vercel.app>.

**Edição V20 · 43 lutadores no código (42 selecionáveis + boneco de treino oculto) · 47 arenas**

O selo da tela de título e o `<title>` leem esses números dos dados (`FIGHTERS` e `STAGE_LIST`) e a edição do maior `fighters-vN.js` carregado. O cantinho `build …` repete o cache-buster das folhas (`v36-balance13` em `SpriteGen.url`). Assim a contagem não fica presa num texto antigo.

O `stats.power` abaixo é o valor **depois** dos arquivos de balanceamento, não o número original do catálogo.

## Lutadores

Código `S` = só entra com `adm` ou `batata`. Os outros 39 selecionáveis entram sem código. O boneco de treino existe no código e não aparece na grade.

| # | Nome | id | Power | Poderes | |
|---|---|---|---:|---:|---|
| 1 | DU MAGMA | `du` | 1.58 | 5 | S |
| 2 | IALES OMEGA | `iales` | 2.60 | 10 | S |
| 3 | FELIPINHO HYDRO | `felipinho` | 1.62 | 5 | S |
| 4 | ET 1155 | `stack` | 1.54 | 5 | |
| 5 | KAGE COMMIT | `gitmaster` | 1.42 | 5 | |
| 6 | LYRA TRACE | `bughunter` | 1.40 | 5 | |
| 7 | MIRA PIXEL | `frontend` | 1.44 | 5 | |
| 8 | TITAN 500 | `backend` | 1.16 | 5 | |
| 9 | CID PIPE | `devops` | 1.42 | 5 | |
| 10 | ADA ASSERT | `qa` | 1.26 | 5 | |
| 11 | KAIRO SPRINT | `scrum` | 1.50 | 5 | |
| 12 | OMNI STACK | `fullstack` | 1.14 | 5 | |
| 13 | YUMI LAMBDA | `kotlin` | 1.52 | 5 | |
| 14 | ROOT PHANTOM | `hacker` | 1.42 | 5 | |
| 15 | KAEL JVM | `java` | 1.02 | 5 | |
| 16 | CROMO VX | `merc` | 1.52 | 5 | |
| 17 | BHM NOIR | `bhm` | 1.50 | 5 | |
| 18 | GEMINI TWINBYTE | `gemini` | 1.54 | 5 | |
| 19 | META | `meta` | 1.54 | 5 | |
| 20 | MIS, A BRASA MISTRAL | `mis` | 1.52 | 5 | |
| 21 | DEV SENIOR, ENGENHEIRO DE NANOS | `dev-senior` | 1.50 | 5 | |
| 22 | URBANO TREMOR | `urbano` | 1.56 | 5 | |
| 23 | XEON | `xeon` | 1.45 | 5 | |
| 24 | QWEN ASTRA | `qwen` | 1.46 | 5 | |
| 25 | DOLYNHO | `dolynho` | 1.40 | 5 | |
| 26 | VIGILANTE | `thl` | 1.54 | 5 | |
| 27 | LOBÃO | `lobao` | 1.34 | 5 | |
| 28 | WINX.EXE | `winx-exe` | 1.52 | 5 | |
| 29 | DANDARA QUERY | `dandara-query` | 1.50 | 5 | |
| 30 | NINA VECTOR | `nina-vector` | 1.48 | 5 | |
| 31 | DEV VETERANO | `dev-veterano` | 1.52 | 5 | |
| 32 | HANA | `hana` | 1.24 | 5 | |
| 33 | CYBER-PSICOPATA | `cyber-psicopata` | 1.50 | 5 | |
| 34 | GRIKA, A SONHADORA SOMBRIA | `grika` | 1.52 | 5 | |
| 35 | GUARDA DIGITAL | `guarda-digital` | 1.50 | 5 | |
| 36 | ENGENHEIRA DE PROMPT | `engenheira-prompt` | 1.52 | 5 | |
| 37 | ODETTE | `odette` | 1.52 | 5 | |
| 38 | JOHN THE VIBE CODER | `john-vibe` | 1.36 | 5 | |
| 39 | NIMBO | `nimbo` | 1.44 | 5 | |
| 40 | EMILIO | `emilio` | 1.62 | 5 | |
| 41 | NUNES | `nunes` | 1.66 | 5 | |
| 42 | PONTEIRO | `ponteiro` | 1.34 | 5 | |
| — | BONECO DE TREINO | `boneco-treino` | 0.80 | 5 | oculto |

DU MAGMA, IALES OMEGA e FELIPINHO HYDRO são os secretos de propósito mais fortes (o IALES chega a 10 habilidades). QWEN e WINX.EXE são lutadores normais. O restante do elenco foi pensado para ficar equilibrado; os passes `powers-balance-v*.js` já alteraram vários números — a tabela mostra o que o jogo aplica hoje.

Cada lutador normal tem 5 poderes: 2 simples (teclas 1–2), 2 de carga (3–4) e 1 ultimate (5). O IALES usa ainda 6–9 e 0.

## Arenas (47)

| Grupo | Arenas |
|---|---|
| Clássicos animados (14) | Centro de Dados, Chuva de Código, Laboratório 95, Neon City.exe, Fight.exe, Fábrica de Bugs, Placa-Mãe, Startup 3am, Deploy nas Nuvens, Arena Git, Oficina das Latas, Terminal Fósforo, Metrô de Pacotes, Catedral SQL |
| Pacote retrô (10) | Telhado Neon, Forja Vulcânica, Laboratório Submarino, Templo da Tempestade, Cidadela do Caos, Dojo Sakura, Ilhas do Céu, Caverna de Cristal, Núcleo Orbital, Floresta Digital |
| Tecnologia (6) | Floresta Spring Boot, Colmeia JavaScript, Porto dos Containers, Ártico do Kernel, Fundição Rust, Pântano Python |
| Expansão Turbo (4) | Ilha Kotlin, Covil do Kali, Torrefação JVM, Cidade Cromada |
| Expansão V4 (3) | Quadra SESI Valinhos, Pátio SESI Valinhos, Oficina SENAI Valinhos |
| Expansão V5 (2) | Jardim do Sol Nascente, Distrito Neon 2077 |
| Novos V6 (4) | Dojo à Noite, Dojo de Treino, Circo Abandonado, Pizzaria à Noite |
| Expansão V7 (3) | Área de Trabalho, Abismo das Baleias, Vale do Cache |
| Expansão V8 (1) | Pós-Codigocalipse |

Cada arena tem clima possível, fauna e uma mecânica em `js/engine/mechanics.js`. O jogador pode forçar o clima na tela de arena.

## Modos

| Modo | Descrição |
|---|---|
| Arcade | Escada de 7 lutas contra a CPU |
| Versus | 1×1 local ou CPU |
| 2×2 Equipes | Duplas com troca (R / L) |
| Survival | Lute até cair |
| Morte súbita | Paredes de fogo fecham a arena |
| Treino | Dojo, boneco configurável, medidores e cura |
| Treino guiado | Passo a passo para quem ainda não jogou |
| Personalizado | Rounds, tempo, vida infinita, medidores cheios |
| Online | Salas com código, até 4 jogadores (P2P ou servidor) |
| Torneio | 2–32 pessoas, só com Redis ligado na Vercel |
| Mascotes | Companheiro com bônus, salvo no perfil |
| Skins | Desligado — a tela diz EM BREVE |
| Resgatar código | Libera os três secretos neste navegador |

## Controles

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Mover / pular / agachar | WASD | Setas |
| Soco | Botão esquerdo do mouse | J |
| Chute | Botão direito do mouse | K |
| Poderes 1 a 5 | Teclas `1` `2` `3` `4` `5` | Numpad `1`–`5` |
| Poderes 6 a 10 (IALES) | `6` `7` `8` `9` `0` | Numpad `6`–`9` e `0` |
| Troca no 2×2 | R | L |
| Defender | Segurar para trás | Segurar para trás |
| Pausa | Esc ou P | Esc ou P |

Na seleção: WASD ou setas movem, Enter confirma, Backspace volta. No versus local, o jogador 2 entra apertando J.

## Códigos

- `adm` — desbloqueia IALES OMEGA, DU MAGMA e FELIPINHO HYDRO.
- `batata` — o mesmo trio. O código nasceu para liberar o QWEN; o QWEN passou a ser lutador normal, então `batata` ficou como apelido de `adm` e libera quem ainda pede código. A mensagem avisa que o QWEN já entra sem código.
- WINX.EXE e QWEN não usam código. O selo SECRETO na grade só aparece em quem tem `secret: true` e já está liberado (os três acima).

## Online e torneio

Salas normais são P2P (PeerJS) ou um servidor WebSocket opcional em `online-server/`. Até 4 jogadores. Ver [HOSPEDAGEM.md](HOSPEDAGEM.md).

O torneio (2–32) grava a chave em Redis. Sem o Redis a Vercel responde 503 `storage_not_configured` e um servidor estático local responde 404 em `/api/tournaments`. O jogo esconde criar/entrar e explica o que falta, em vez de quebrar o menu.

Para ligar, no projeto da Vercel:

1. **Integrations → Marketplace → [Upstash Redis](https://vercel.com/integrations/upstash)** e conecte a integração a este projeto (guia: <https://upstash.com/docs/redis/howto/vercelintegration>).
2. Confira as variáveis no ambiente de Production (a integração escreve; não commite os valores):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - Nomes antigos também aceitos: `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. Redeploy. `GET /api/tournaments?health=1` deve voltar `{ "ok": true }`.

## Login com Google

O cartão de conta usa o Supabase do projeto `ownxbuailthavxgfxtem`. O jogo funciona sem login; o progresso fica no navegador.

- Se o provedor Google está desligado, o botão fica **GOOGLE AGUARDANDO CONFIGURAÇÃO**.
- Se o host não responde (projeto pausado, DNS, conexão fechada), o botão fica **NUVEM INDISPONÍVEL**, com **TENTAR DE NOVO**. Nada disso impede de jogar.

Para o login valer de verdade: projeto Supabase ativo, provedor Google ligado com Client ID/Secret só no painel, e a URL `https://ds-fighters.vercel.app/` na lista de Redirect URLs. Passo a passo em [SUPABASE.md](SUPABASE.md).

## Rodar local

```bash
python3 -m http.server 8080
```

Abra <http://localhost:8080>. O torneio fica oculto (não há Function `/api` nesse servidor).

## Testes

```bash
node tools/combat_regressions.mjs
node tools/modes_test.js
node tools/hitbox_test.js
node tools/championship.js
python3 tools/sprite_audit.py
npm test --prefix online-server
```

## Deploy

Vercel, site estático. `vercel.json` deixa `framework` nulo, sem comando de build. Cada push em `main` publica de novo. Detalhes em [HOSPEDAGEM.md](HOSPEDAGEM.md).

Como adicionar lutador, arena ou clima: [docs/CONTENT-PIPELINE.md](docs/CONTENT-PIPELINE.md).

Arte, código e efeitos originais. Músicas do proprietário. Jogo gratuito.
