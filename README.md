# 🥊 DS FIGHTERS — Torneio dos Desenvolvedores

Jogo de luta estilo **Street Fighter clássico** direto no navegador — 100% HTML5 Canvas + JavaScript puro, **sem dependências e sem imagens externas** (sprites e sons são gerados por código).

## ▶️ Como jogar

Abra o `index.html` no navegador **ou** publique com GitHub Pages (Settings → Pages → branch `main` → pasta raiz) e acesse a URL gerada.

## 🕹️ Modos

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
| **IALES** | All For One do desenvolvimento — rouba poderes | Poder Roubado (cicla firewall, raio, DDoS, void) | ALL FOR ONE ( saraivada de poderes) |
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

Cada lutador tem **falas próprias** de vitória, intro, special e super (balões de fala durante a luta).

## 🏟️ Cenários (6, todos animados + obstáculos funcionais)

1. **Sala de Servidores** — racks com LEDs piscando; obstáculos: rack frio (deixa lento) e rack quente (queima HP)
2. **Arena GitHub** — círculo de merge pulsante; obstáculo: *merge conflict* (stun)
3. **Chuva de Código** — matrix rain; obstáculos: glitch (inverte controles) e bug (dano dobrado)
4. **Mesa do Dev** — monitor com código, pôster 404; obstáculos: café (velocidade +) e energético (+super)
5. **Nuvem (Cloud)** — nuvens em movimento, pacotes subindo; obstáculo: bucket S3 (te joga pra cima)
6. **Cidade Neon** — prédios com janelas neon e letreiro piscando; obstáculos: placa neon (choque/stun) e outdoor (modo fúria, dano x2)

## 🛠️ Técnicas

- **Sprites procedurais em pixel-art** (`js/engine/sprites.js`): cada lutador é desenhado a partir da paleta + traços (careca+barba+óculos do Du, tubos e "vários olhos" do Iales, corriente e boné do Felipinho etc.) com cache de frames
- **Engine de luta** (`js/engine/fighter.js`): estados com janelas de startup/active/recovery, hitboxes, knockback ponderado, block com redução de dano, barra de super que enche ao atacar/receber dano
- **Projéteis com formas próprias** (machado, carro, engrenagem, livro...) e supers de área/rush/multi-projétil
- **Áudio 100% procedural** via WebAudio (`js/engine/audio.js`): socos, specials, K.O., música chiptune em loop — nenhum arquivo de som
- **IA** (`js/engine/ai.js`) com agressividade ajustada pela dificuldade e pela vida
- Loop com passo fixo de 60 fps, shake de tela, flash de super, partículas e balões de fala

## 📁 Estrutura

```
index.html
css/style.css
js/main.js            loop principal
js/data/fighters.js   os 13 lutadores (dados, falas, golpes)
js/data/stages.js     os 6 cenários (animação + obstáculos)
js/engine/            audio, sprites, input, fighter, projectile, stage, ai, game
```
