# 🥊 DS FIGHTERS — Torneio dos Desenvolvedores

Jogo de luta estilo **Street Fighter clássico** direto no navegador — HTML5 Canvas + JavaScript puro.

Suporta **sprite sheets reais** (com fallback procedural se as imagens não existirem).

## ▶️ Como jogar

Abra o `index.html` no navegador **ou** publique com GitHub Pages (Settings → Pages → branch `main` → pasta raiz) e acesse a URL gerada.

## 🎮 Modos

- **Arcade (vs CPU)** — lute contra a IA, melhor de 3 rounds
- **Versus (2 jogadores)** — mesmo teclado

## ⌨️ Controles

| Ação | P1 | P2 (versus) |
|---|---|---|
| Andar | ← → | J L |
| Pular / abaixar | ↑ / ↓ | I / K |
| Soco | A | 1 |
| Chute | S | 2 |
| **Special** (gasta super) | D | 3 |
| **Super** (precisa 100% da barra) | F | 4 |

No celular aparecem botões de toque na tela.

## 🥷 Os lutadores (13 no roster)

| Lutador | Tema | Special | Super |
|---|---|---|---|
| **DU** | Deus do Código estilo Kratos — careca, barba enorme, óculos e cicatriz | Lâmina do Caos (machado de fogo) | Fúria do Deus do Código (rush de socos) |
| **IALES** | All For One do desenvolvimento — rouba poderes | Poder Roubado (cicla firewall, raio, DDoS, void) | ALL FOR ONE (saraivada de poderes) |
| **FELIPINHO** | Nerd estilo GTA — fala e luta como CJ, cria mods | Carro Cheat (carro atropela) | Modo Deus do GTA (invencível + dano x2) |
| **STACK OVERFLOW** | Oráculo verde das respostas aceitas | Resposta Aceita (cura + projétil ✓) | Copy-Paste Massivo |
| **GIT MASTER** | Ninja dos commits | Git Dash (teleporte com corte) | Rebase Interativo |
| **BUG HUNTER** | Caçadora com lupa/visor dourado | Bug Report (stun longo) | Hotfix em Área (AoE) |
| **FRONT DEV** | Estilista do CSS | Caixa de Layout (box girando) | CSS Ultra Instinct |
| **BACK DEV** | Servidor de aço musculoso | Erro 500 (projétil pesado) | DDoS de Socos |
| **DEVOPS** | Mestre do pipeline com capacete | Pipeline (engrenagem multi-hit) | Deploy Contínuo |
| **QA TESTER** | Fiscal com prancheta | Teste Falhou (stun) | Suíte de Testes (AoE) |
| **SCRUM MASTER** | Facilitador ágil de terno | Daily Standup (cura + golpe) | Planning Poker (AoE + cura) |
| **FULLSTACK** | Faz tudo, moletom roxo | Deploy Simultâneo (3 camadas) | Monolito Perfeito |
| **SENPAI DO SENAI** | Professor lendário com óculos e apostila | Apostila Pesada | Prova Final |

## 🏟️ Cenários (6, todos animados + obstáculos funcionais)

1. **Sala de Servidores** — racks com LEDs piscando
2. **Arena GitHub** — círculo de merge pulsante
3. **Chuva de Código** — matrix rain
4. **Mesa do Dev** — monitor com código
5. **Nuvem (Cloud)** — nuvens e pacotes
6. **Cidade Neon** — prédios neon

## 🖼️ Sprite Sheets

Coloque as imagens PNG na pasta `assets/sprites/` com os nomes:

`du.png`, `iales.png`, `felipinho.png`, `stack.png`, `gitmaster.png`, `bughunter.png`, `frontend.png`, `backend.png`, `devops.png`, `qa.png`, `scrum.png`, `fullstack.png`, `senpai.png`

Se as imagens não existirem, o jogo usa o desenho procedural de fallback.

## 🛠️ Técnicas

- Sistema de sprites com sheets + fallback (`js/engine/sprites.js`)
- Engine de luta com hitboxes, super, rounds
- Áudio procedural via WebAudio
- IA e estágios com obstáculos

## 📁 Estrutura

```
index.html
css/style.css
js/main.js
js/data/fighters.js
js/data/stages.js
js/engine/
assets/sprites/   ← coloque as PNG aqui
```
