# Expansão V7 — DS Fighters

## Conteúdo

A expansão acrescenta quatro lutadores e três arenas à base existente. No jogo carregado no navegador, o elenco passou a **30 lutadores** e o catálogo, a **45 arenas**.

- **Winx.EXE** é a personagem secreta de código, com força-base **1,38**, igual à de DU. `WINX` e `WINX.EXE` desbloqueiam somente a Winx. O código **Batata** continua liberando seu grupo antigo (DU, IALES, Felipinho e Qwen).
- **Kimi** é uma personagem normal de anime com cabelo verde-água e kit de água/gelo.
- **DeepSeek** é uma personagem normal com tema aquático e cauda/fluke de baleia.
- **Dandara Query** é uma mulher adulta do interior do RJ, de dreads, especialista em banco de dados, disponível sem código.

Os quatro kits têm pelo menos cinco golpes e artes próprias de combate; seus efeitos de habilidade reutilizam os atlases de partículas compatíveis do jogo para evitar ícones quebrados ou novos lotes de imagens.

## Status TRAVAMENTO

Os ataques tecnológicos da Winx podem aplicar o estado `glitch`: scanlines curtas ciano/magenta, movimento 12% mais lento e uma pausa de três quadros nos comandos em pulsos a cada 36 quadros. O efeito tem teto contra renovação repetida. A pausa afeta somente a entrada do lutador, não o relógio ou o loop global, e os comandos voltam automaticamente. A renderização respeita a opção de movimento reduzido.

## Arenas

- **Área de Trabalho** — desktop original inspirado em interfaces de computador, sem logotipos copiados; mecânica de pulso elétrico.
- **Abismo das Baleias** — caverna oceânica luminosa com peixes e bolhas; mecânica de maré.
- **Vale do Cache** — paisagem serrana rural com casa e elementos de dados; mecânica de feixe de consulta.

Cada cenário recebeu imagem própria e sheet ambiental de **24 quadros (6 × 4, 640 × 360 por quadro)**. As arenas clássicas e as do SENAI/SESI não foram substituídas.

## Arte e integração

Cada lutador possui um sheet transparente **4 × 8** com oito ações, normalizado para quatro quadros por ação em células de **320 × 260**. O mapa de linhas específico reutiliza poses para movimentos equivalentes e mantém intactos os sheets legados **4 × 15**. A face de combate (cut-in) foi derivada do próprio frame idle; a seleção usa o sheet completo. Winx entra na seleção bloqueada até o resgate do código; Kimi, DeepSeek e Dandara ficam livres.

## Verificações executadas

- `node tools/v7_regressions.cjs` — kits/IDs, força da Winx, código separado do Batata, status com limite, linhas de animação, arenas e allowlist online.
- `python3 tools/selection_ui_check.py` — 8 verificações no Chromium: botão Voltar de skins, código, miniaturas desktop/mobile, nomes narrados em português e console sem erros.
- `python3 tools/v7_browser_check.py` — partida Canvas local com Winx e Kimi nas três arenas novas e nas três clássicas preservadas; as seis sheets carregaram e o status apareceu.
- `python3 tools/map_events_check.py` — mecânicas e pickups dos mapas, inclusive os três novos.
- `python3 tools/mobile_check.py` — zero falhas.
- `python3 tools/v5_check.py` — retrocompatibilidade, mapas Japão/cyberpunk, 38 faixas e ducking do narrador.
- `node tools/combat_regressions.mjs` e `node tools/audio_mix_test.js` — aprovados.
- `npm test --prefix online-server` — 38 verificações aprovadas; os novos IDs são aceitos pelo protocolo.

As capturas locais de revisão ficam em `test-results/visual/` e não fazem parte dos assets do jogo.

### Compatibilidade dos cenários
As folhas clássicas **Dojo à Noite**, **Circo Abandonado** e **Pizzaria à Noite** permanecem no manifest e passaram no mesmo teste real do Canvas. O gerador `tools/animate-maps.py` agora mantém essas três entradas quando novas folhas são construídas.
