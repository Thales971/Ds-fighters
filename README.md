# DS FIGHTERS — Torneio dos Desenvolvedores

Jogo de luta 2D no navegador, em HTML5 Canvas e JavaScript puro. Os lutadores usam **sprite sheets de pixel art originais** (nada copiado de Street Fighter ou de outro jogo).

![Elenco](assets/sprites/elenco.png)

## Como rodar

Abra o `index.html` no navegador. Se o navegador bloquear scripts locais, sirva a pasta:

```bash
python3 -m http.server 8080
```

Aí acesse `http://127.0.0.1:8080`.

Atalhos úteis:

- `index.html#select` abre a seleção de lutadores
- `index.html#demo?stage=5&p1=0&p2=7` começa uma luta de demonstração (os dois são a CPU). `stage` vai de 0 a 5.

## Modos

- **Arcade (vs CPU)** — melhor de 3 rounds. A CPU fica mais esperta a cada round.
- **Versus** — dois jogadores no mesmo teclado, ou dois controles.

`Esc` no meio da luta volta ao menu.

## Controles

| Ação | Teclado P1 | Teclado P2 | Controle (padrão, PS4) |
|---|---|---|---|
| Andar | ← → | J L | Direcional ou analógico esquerdo |
| Pular | ↑ | I | Cima |
| Agachar / guarda baixa | ↓ | K | Baixo |
| Guarda em pé | segure para trás | segure para trás | segure para trás |
| Soco | A | 1 | Quadrado ou L1 |
| Chute | S | 2 | X ou R1 |
| Especial | D | 3 | Círculo ou L2 |
| Super | F | 4 | Triângulo ou R2 |
| Confirmar | Enter | Enter | X ou Options |

No celular aparecem botões de toque.

### Comandos de luta

- **Guarda em pé** (para trás) segura golpe médio e golpe de pulo. A rasteira passa.
- **Guarda baixa** (para baixo) segura golpe médio e rasteira. O pulo passa.
- **Agachado + chute** é golpe baixo. **Pulo + ataque** é golpe alto.
- **↓ ↘ → + soco** (ou o botão) solta o especial e gasta um pedaço da barra roxa.
- **↓ ↙ ← + chute** (ou o botão) solta o super, que precisa da barra cheia.
- **Toque duplo para frente** corre. Toque duplo para trás recua.
- Soco que acerta pode ser cancelado no chute, e golpe acertado pode ser cancelado no especial ou no super.

A barra de vida mostra o dano fantasma em amarelo. A barra roxa enche ao acertar e ao apanhar. Quem ganhar 2 rounds vence a luta. O timer começa em 99.

## Lutadores

| Lutador | Jeito | Especial | Super |
|---|---|---|---|
| **DU** | Careca, barba, óculos e cicatriz. Pesado. | Lâmina do Caos | Fúria do Deus do Código |
| **IALES** | Terno e poderes roubados. Cada especial é um tiro diferente. | Poder Roubado | ALL FOR ONE |
| **FELIPINHO** | Boné, corrente e jeans. Rápido. | Carro Cheat | Modo Deus (GTA) |
| **STACK OVERFLOW** | Laranja, óculos, cura um pouco. | Resposta Aceita | Copy-Paste Massivo |
| **GIT MASTER** | Ninja de capuz. O mais rápido. | Git Dash | Rebase Interativo |
| **BUG HUNTER** | Rabo de cavalo e visor. O tiro atordoa. | Bug Report | Hotfix em Área |
| **FRONT DEV** | Cabelo rosa e óculos. | Caixa de Layout | CSS Ultra Instinct |
| **BACK DEV** | Maior e mais forte. | Erro 500 | DDoS de Socos |
| **DEVOPS** | Capacete e colete. O tiro acerta mais de uma vez. | Pipeline | Deploy Contínuo |
| **QA TESTER** | Prancheta. O tiro segura bastante. | Teste Falhou | Suíte de Testes |
| **SCRUM MASTER** | Terno. Cura e avança. | Daily Standup | Planning Poker |
| **FULLSTACK** | Moletom roxo. | Deploy Simultâneo | Monolito Perfeito |
| **SENPAI DO SENAI** | Cardigã, cabelo grisalho e apostila. | Apostila Pesada | Prova Final |

## Cenários

Os fundos são em camadas, com parallax e animação. Pisar na marca dourada do chão ativa o efeito uma vez por round.

1. **Sala de Servidores** — racks com LED. Um deixa lento, o outro queima.
2. **Arena do Commit** — arquibancada e anel de merge. O conflito atordoa.
3. **Chuva de Código** — chuva de caracteres. Glitch inverte o direcional ou dobra o dano.
4. **Mesa do Dev** — monitor, teclado RGB e café. Café acelera, energético enche o super.
5. **Nuvem** — ilhas, sol e pacotes. O bucket joga o lutador para cima.
6. **Cidade Neon** — chuva, letreiros e rua molhada. Placa dá choque ou fúria.

## Sprites

As folhas ficam em `assets/sprites/` (`du.png`, `iales.png`, e o resto). Cada uma tem 8 colunas e 15 linhas de animação: idle, andar, pulo, agachar, soco, chute, soco agachado, chute agachado, soco no ar, chute no ar, especial, hit, bloqueio, KO e vitória.

A arte é gerada por `tools/generate-sprites.mjs` (só Node, sem dependência). Para refazer:

```bash
node tools/generate-sprites.mjs
```

Isso também regrava `assets/sprites/layout.js`, que o jogo lê. Se um PNG faltar, o jogo desenha um boneco simples com as cores do lutador.
