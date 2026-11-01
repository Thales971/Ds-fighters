# DS FIGHTERS — Expansão Arcade

Jogo de luta 2D lateral no navegador, com visual arcade retrô do começo dos anos 90. Arte, sons e código são originais (inspirado no gênero, sem copiar Street Fighter ou outro jogo). Menus, seleção, HUD, mascotes, resgate e salas são feitos em HTML/CSS; o Canvas fica só para a arena.

![Elenco](assets/sprites/elenco.png)

## Como rodar

Sirva a pasta (os navegadores bloqueiam `fetch` em `file://`):

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Para o online local, rode também o servidor de salas (veja [HOSPEDAGEM.md](HOSPEDAGEM.md)):

```bash
cd online-server && npm install && npm start   # ws://localhost:8787
```

## Modos

| Modo | O que é |
|---|---|
| **Arcade** | Escada de 7 lutas contra a CPU, dificuldade crescente e chefe final (IALES, se liberado). Perdeu? Continue. |
| **Versus** | 1 × 1 contra a CPU ou contra outro jogador no mesmo PC. Na seleção, o Jogador 2 aperta `1` para entrar. |
| **2 × 2 Equipes** | Cada lado escolhe 2 lutadores. Troque com a tecla de troca (tem recarga). O parceiro no banco recupera vida. Perde quem ficar sem os dois. |
| **Treino** | Boneco parado/defendendo/pulando/CPU, medidores infinitos opcionais, sem tempo. |
| **Online** | Salas com código de convite, 1 × 1 ou 2 × 2, lobby, escolha de arena e placar da sala. |

## Controles

| Ação | Jogador 1 | Jogador 2 | Controle |
|---|---|---|---|
| Mover / pular / agachar | Setas | `J` `L` `I` `K` | Analógico / D-pad |
| Soco · Chute | `A` · `S` | `1` · `2` | □ · ✕ |
| H1 · H2 (simples, recarga) | `D` · `F` | `3` · `4` | ○ · △ |
| H3 · H4 (carga A / B) | `Q` · `W` | `5` · `6` | L1 · R1 |
| ULTIMATE | `E` | `7` | R2 |
| Troca (2 × 2) | `R` | `8` | L2 |
| Pausa | `Esc` / `P` | | Start |

A tecla de cada habilidade aparece **embaixo do ícone** na HUD. Defender: segure para trás (agachado defende golpes baixos). Dash: toque duas vezes. Agarrão: perto do rival, frente/trás + soco. Cancelamento: acerte um golpe básico e solte uma habilidade na hora. Há controles de toque em telas sensíveis ao toque e a opção "movimento reduzido" nas Opções.

## Sistemas de luta

Combos com contador e dano reduzido progressivamente, hitstop, knockback por peso, golpes altos/baixos, contra-ataque, barra de tontura (apanhar ou defender demais deixa TONTO), dano vermelho recuperável, câmera com zoom e tremor, cut-in de ultimate, KO em câmera lenta, rounds com tempo e "PERFEITO".

Cada lutador tem **5 habilidades animadas**: 2 simples (recarga), 2 de carga (barras A e B) e 1 ultimate. As sprite sheets ficam em `assets/abilities/<id>.png` (4 quadros × 5 linhas de 128 px). Os dados ficam em `js/data/powers.js`.

## Lutadores

12 lutadores (o Senpai foi removido). **DU, IALES e Felipinho Maprim** são secretos: resgate o código **`Batata`** em *Resgatar código* para liberar os três juntos (fica salvo no navegador).

- **IALES** — o mais apelão. *Todos* os ataques têm auto aim e IAs aparecem atrás dele ao conjurar. Rede de poderes estilo All For One: cada habilidade acumula cargas. **Ctrl+C dos Poderes** acerta sempre e rouba as 5 habilidades do rival por 10 s (a HUD mostra o kit roubado e o tempo; o rival fica sem poderes). **Dragão de Fogo Rust** teleguiado. Ultimate **All For One: Merge Total**.
- **DU** — machado de magma que volta (`$_POST`), erupção de lava, Fúria do Guerreiro (super armadura), Composer Quake e o ultimate **Fatal Error: Apocalipse PHP**. Barba longa preta e branca em todos os quadros.
- **Felipinho Maprim** — água e React (bolhas de estado, ondas de re-render, escudo e maremoto).
- Os demais (Stack Overflow, Git Master, Bug Hunter, Front-end, Back-end, DevOps, QA, Scrum Master, Fullstack) também têm kits próprios de 5 habilidades. Veja todos com animação em *Lista de golpes*.

## Arenas (26)

10 cenários animados originais, 10 do pacote retrô e 6 novos de tecnologia (**Floresta Spring Boot**, Colmeia JavaScript, Porto dos Containers, Ártico do Kernel, Fundição Rust e Pântano Python). Cada arena tem **mecânica exclusiva** (lava, esteira, glitch que troca lugares, git revert, holofote, gelo escorregadio, enxame de abelhas, mel que gruda, containers que caem, serpente, gongo, baixa gravidade…) e **clima aleatório** com efeito real:

| Clima | Efeito |
|---|---|
| Chuva | Água e raio +15 %, fogo −15 %, chão escorrega |
| Ventania | Rajadas empurram lutadores e projéteis |
| Tempestade | Chuva + vento + raios que caem com aviso; raio +25 % |
| Nevasca | Movimento 8 % mais lento; gelo +20 % |

Pássaros, abelhas, borboletas, morcegos e peixes aparecem onde fazem sentido. **Power-ups** caem durante a luta (Ataque, Defesa, Velocidade e Energia), com tempo visível na HUD.

## Mascotes

Em *Mascotes*, cada jogador equipa um companheiro que aparece na arena e dá bônus real (salvo no perfil): Pinguim do Linux (+12 % defesa e regeneração), Baleia Container (escudo), Caranguejo Seguro, Cobra Script, Elefante Legado, Gopher Concorrente, Espírito da Primavera e Polvo do Commit.

## Música: seus rocks pesados

A cada batalha uma faixa é sorteada. Para usar as suas:

1. Envie os arquivos (`.mp3` ou `.ogg`) para `assets/music/rock/`.
2. Liste-os em `assets/music/playlist.json`:

```json
{
  "tracks": [
    { "title": "Minha Faixa 1", "file": "assets/music/rock/faixa1.mp3" },
    { "title": "Minha Faixa 2", "file": "assets/music/rock/faixa2.mp3" }
  ]
}
```

Enquanto `tracks` estiver vazio, tocam as faixas originais de `fallback`. Se uma faixa listada não existir, o jogo pula para outra. Volumes separados (geral, música, efeitos, narrador) e mudo ficam em *Opções*. O áudio só começa após o primeiro clique/tecla (regra dos navegadores).

## Estrutura

```
js/core/profile.js      perfil, desbloqueio por código, mascotes, opções
js/data/                fighters, powers (5 habilidades), stages, pets
js/engine/              game (rounds, 2x2, câmera, rede), fighter (combate),
                        projectile, fx, weather, mechanics, stage, ai, audio, input
js/ui/                  hud.js (HUD em HTML), ui.js (telas e navegação)
js/net/online.js        cliente das salas online
online-server/          servidor de salas (Node + ws) e testes
assets/abilities        sprite sheets das habilidades
assets/art-pack         pacote retrô (impactos, fogo, água, raio, caos, símbolos de IAs, pássaros, chão, 10 fundos)
tools/                  scripts de build de assets e testes automáticos
```

Testes: `python3 tools/smoke.py` (todas as arenas e habilidades no Chromium), `python3 tools/online_e2e.py` (partida online real entre dois navegadores) e `cd online-server && npm test` (25 verificações do servidor).

Fonte: Press Start 2P (SIL Open Font License).

## Cenários animados originais (técnico)

São os 10 fundos animados do dono, em `assets/stages/`. Cada PNG é uma folha de 6 colunas por 4 linhas, 24 frames de 960×540, a 10 fps. O jogo só blita o frame da vez. O chão em perspectiva foi pintado por cima da arte original, e silhuetas escuras de gente que apareciam no piso foram apagadas.

1. Centro de Dados
2. Chuva de Código
3. Laboratório 95
4. Neon City.exe
5. Fight.exe
6. Fábrica de Bugs
7. Placa-Mãe
8. Startup 3am
9. Deploy nas Nuvens
10. Arena Git

Os GIFs de origem estão em `assets/stages/source/`. Para reprocessar:

```bash
node tools/process-stages.mjs
```

## Sprites dos lutadores

As folhas ficam em `assets/sprites/`. Cada frame tem 320×260. A ordem das linhas está em `assets/sprites/layout.js`: idle, andar, pulo, agachar, soco, chute, soco agachado, chute agachado, soco no ar, chute no ar, especial, hit, bloqueio, KO e vitória. O jogo alinha o pé na linha `baseline`.
