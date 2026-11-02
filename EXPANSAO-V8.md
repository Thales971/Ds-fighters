# Expansão V8 — Winx, Nina Vector e Pós-Codigocalipse

## Winx.EXE — correção do sprite e dos ataques

A V7 deixou a Winx em uma sheet compacta de 8 linhas reaproveitadas entre 15 ações e apontava a arte das habilidades para um atlas genérico. A regressão visual capturou o defeito antes da correção. Na V8, a Winx usa uma sheet transparente própria **4×15**, 1280×3900, com uma linha distinta por pose, sem alias de ataques. Seu atlas autoral **4×5** (512×640) alimenta os cinco ícones da HUD e os respectivos impactos/projéteis do Canvas e do online.

Os cinco golpes foram separados visual e mecanicamente:

- **Kernel Ping** — pulso de pixel ciano e TRAVAMENTO curto.
- **Pixel Shift** — avanço com rastro ciano/magenta e breve invulnerabilidade.
- **Window Stack** — painéis digitais despencam sobre o ponto marcado.
- **Cursor Sweep** — arco que cruza o piso, reduz mobilidade e interfere nos comandos.
- **Task Manager** — cinco projéteis convergem num finalizador curto.

Winx continua secreta pelos códigos `WINX` e `WINX.EXE`, com força-base **1,38**, igual a DU. O grupo antigo do código Batata não foi alterado.

## Nina Vector e Kestrel-09

Nina Vector entra como **lutadora normal e livre**: piloto adulta de cabelo curto e óculos, acompanhada pelo guardião biomecânico original Kestrel-09. Os dois têm sheet transparente **4×15** e atlas próprio **4×5**. O mecha é composto como parte da pose de combate, não como sprite de outra personagem ou um efeito genérico.

- **Servo Jab** — punho articulado em linha curta.
- **Railstep** — investida impulsionada.
- **Kestrel Spear** — estocada mecânica na posição marcada.
- **Lock-on Grid** — grade breve para limitar movimento.
- **Full Synchrony** — ataques de piloto e guardião sincronizados.

A referência é anime de piloto/mecha em caráter geral; o Kestrel tem silhueta e cores originais, sem copiar unidades, insígnias ou personagens existentes.

## Arena

**Pós-Codigocalipse** é uma cidade de infraestrutura digital em ruínas, no pôr do sol, com terminais apagados, antenas, vegetação retomando construções e piso largo para combate. A arte-base está em `assets/maps/pos-codigocalipse.jpg`; o loop de ambiente usa 24 quadros (6×4) de 640×360, sem deslocar o chão.

## Implementação e compatibilidade

- Dados: `js/data/powers-v8.js`; sprite sheets e retratos: `assets/sprites/` e `assets/ui/`; atlas exclusivos: `assets/abilities/`.
- O renderizador de `SpriteGen`, a seleção/VS/resgate e o loader `Art` reconhecem os sheets 4×15 e os dois atlases novos sem modificar os demais personagens.
- Nina foi adicionada à allowlist do cliente e do servidor online; Winx continua código-secreta.
- Total medido no app: **31 lutadores e 46 arenas**. Foram preservados os mapas V7 e clássicos, inclusive Dojo à Noite, Circo Abandonado e Pizzaria à Noite.

## Verificações executadas

- `python3 tools/winx_art_check.py` — 15 linhas de pose distintas, sheet 4×15, atlas HUD/FX exclusivo, cinco impactos diferenciados e força 1,38.
- `python3 tools/selection_ui_check.py` — código Winx, Nina normal, retratos completos no desktop/mobile, volta das skins e locução de nomes.
- `python3 tools/v8_browser_check.py` — partida no Canvas com Winx e Nina; ambos os atlases carregados, TRAVAMENTO aplicado e mapa 24 quadros renderizado.
- `npm test --prefix online-server` — sala WebSocket real com escolhas Winx/Nina e arena Pós-Codigocalipse, além das regressões do protocolo.
- `node tools/v7_regressions.cjs`, `node tools/combat_regressions.mjs`, `node tools/audio_mix_test.js`, `python3 tools/mobile_check.py`, `python3 tools/map_events_check.py`, `python3 tools/v5_check.py` e `python3 tools/v7_browser_check.py` — aprovados; a regressão anterior mantém os seis mapas V7/clássicos.
- Todos os módulos JavaScript passam `node --check`; `git diff --check` não encontrou whitespace inválido.

A prévia local de combate usada na revisão fica em `test-results/visual/v8-match-pos-codigocalipse.png`; capturas de teste não são assets do jogo.
