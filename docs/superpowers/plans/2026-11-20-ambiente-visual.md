# Ambiente visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover os enfeites genéricos, encaixar a torcida por arena, refazer o recorte/desenho da maré e refazer a aurora em pixel art atrás dos lutadores.

**Architecture:** Tudo em JS puro já existente: `js/engine/stage.js` (StageRenderer: props, torcida, drawBack), `js/engine/mechanics.js` (MECHS.tide.draw), `js/engine/weather.js` (aurora), `tools/build_mare_atlas.py` (atlas). Dados por arena ficam nas fichas `STAGE_LIST` (`js/data/stages*.js`).

**Tech Stack:** Canvas 2D, Node VM + node-canvas nos testes `tools/*_test.cjs`, Python 3 + Pillow/numpy/scipy para o atlas, Playwright para prints.

**Spec:** `docs/superpowers/specs/2026-11-20-ambiente-visual-design.md`

## Global Constraints
- Sem build, sem dependência nova de runtime; canvas 960×540, `GROUND_Y = 458`.
- Arco-íris e demais climas intocados; mecânica da maré (empurrão `g.pushX = dir*1.25`, `permaTide` com peixe) intocada; bônus aurora (+8% medidor em `fighter.js:233`) intocado.
- Respeitar `perfOff`, `perfScale`, `game.reduced`/`reducedFlag`, `qFxOn`.
- Não criar gradiente/canvas por frame (cache como o resto do motor).
- Códigos secretos nunca em comentários/strings novos.
- Commits em português; bateria `for f in tools/*_test.cjs; do node "$f"; done` sem regressão (as 12 que já falhavam por caminho `/workspace/...`/jsdom ficam como estão).

## Review Focus
1. Arena com `props:` explícito (`stages-v21.js`) — também não desenha nada (teste no Task 1).
2. Torcida em arena com `torcida: true` sem posição própria — cai num default seguro (fileira pequena perto do horizonte), nunca gigante (teste no Task 2).
3. Maré antes do atlas carregar (`waveSheet` incompleto) — fallback não quebra (teste já existe em `ambiente_test`, mantido).
4. Aurora com `perfScale` 0.45 e `perfOff` — desenha menos / nada sem erro (Task 4, ajusta `perf_test`).
5. Aurora em arena clara de dia — topo escurece, não estoura em branco (Task 4: checagem de pixels não saturados).

---

### Task 1: Remover enfeites genéricos

**Files:**
- Modify: `js/engine/stage.js` (`defaultStageProps`, construtor ~343-364, `drawProps`, `buildLights`, `react`, update de props ~500)
- Modify: `js/main.js:20` (tirar `stage-props.png` do preload)
- Modify: `tools/preload_net_test.cjs:44`, `tools/visual_hunt_test.cjs:103` (tirar a sheet da lista)
- Create: `tools/ambiente_visual_test.cjs`

**Interfaces:** Produces: `StageRenderer.props` sempre `[]`; `drawProps` removido.

- [ ] Teste (`ambiente_visual_test.cjs`, harness VM igual ao `fauna_torcida_test`): para `estacao-valinhos` (tem `props:`) e `represa` (sem), `stage.props.length === 0`; espiando `drawImage` durante `drawBack`, nenhuma chamada com origem 48×64; `buildLights()` de arena sem `def.lights` retorna `[]`; `main.js` não contém `stage-props.png`.
- [ ] Rodar → falha.
- [ ] Implementar: apagar `defaultStageProps`, `propSheet`, `drawProps` e usos; `buildLights` só com `def.lights`; `react` sem queda de props. Manter `propShake` só se outro código usar (grep).
- [ ] Rodar o teste novo + `preload_net_test`, `visual_hunt_test`, `fauna_torcida_test` → passam.
- [ ] Commit.

### Task 2: Torcida encaixada por arena

**Files:**
- Modify: `js/engine/stage.js` (`initTorcida`, `drawTorcida`)
- Modify: `js/data/stages.js` (sesi, sesi-patio, circo), `js/data/stages-v21.js` (estacao-valinhos, quadra-areia, arquibancada, terminal-onibus)
- Modify: `tools/fauna_torcida_test.cjs` (o check "3 fileiras" vira "fileiras da ficha")
- Test: `tools/ambiente_visual_test.cjs`

**Interfaces:** Produces: campo de ficha `torcida: true | { rows: [{ y, scale, x0?, x1?, gap? }] }` — `y` = linha dos pés em px de tela, `scale` sobre a célula 256×200, `x0/x1` faixa horizontal (default 0..W), `gap` espaçamento em fração da largura (default 0.62, pessoas se sobrepondo levemente). `torcida: true` usa default `[{ y: GROUND_Y - 150, scale: 0.42 }]`.

- [ ] Teste: em toda arena com torcida, toda pessoa desenhada tem altura ≤ 0.6 × altura do lutador (≈ 200·scale ≤ 120) e topo ≥ 0; as colunas de origem cobrem > 5 pessoas distintas (sheet de 25 colunas, `col*256`); `torcida: true` sem objeto usa o default.
- [ ] Rodar → falha.
- [ ] Implementar: `drawTorcida` usa `cols = floor(sheet.width/256)` (25), escolhe pessoa por hash estável (fileira, índice) para não repetir lado a lado, desenha da fileira de trás para a da frente, clip na faixa x0..x1; pulo de empolgação mantido proporcional à escala.
- [ ] Posicionar as 7 arenas olhando prints reais (Playwright, script em scratchpad) — pés na arquibancada/calçada do desenho; ajustar até nada flutuar nem cobrir portas/placares.
- [ ] Rodar teste + `fauna_torcida_test` + `e2e_visual_test` → passam.
- [ ] Commit.

### Task 3: Maré quadro a quadro

**Files:**
- Modify: `tools/build_mare_atlas.py` (reescrever)
- Modify: `assets/fx/mare.png` (gerado), `js/engine/mechanics.js` (`MECHS.tide.draw`)
- Modify: `tools/ambiente_test.cjs` (7b: `naturalWidth` do stub conforme o atlas novo)
- Test: `tools/ambiente_visual_test.cjs`

**Interfaces:** Produces: atlas `assets/fx/mare.png` com layout exposto em `MARE_ATLAS = { fw, fh, waveFrames: [[sx,sy],…], calm: [sx,sy,w,h] }` definido em `mechanics.js` (o script imprime os valores e o teste confere contra o PNG).

- [ ] Script: detectar as divisórias dos painéis (linhas brancas/escuras verticais e horizontais) em cada JPG, recortar cada painel por dentro (margem de 3px), chroma-key magenta (reusar `key_magenta`), alinhar todos pela linha da superfície da água, empacotar quadros de onda (sheet 1: 7 quadros com onda; sheet 2: 7) numa grade + uma faixa de água calma tileável (do último painel, com bordas esquerda/direita casadas por crossfade de 16px).
- [ ] Teste: atlas sem coluna vertical opaca de cor uniforme (riscos) — para cada x, variância de cor da coluna inteira > limiar; faixa calma tileável (coluna 0 ≈ última coluna, diff médio < 12).
- [ ] `tide.draw`: faixa calma com altura ~40px de tela no nível do chão (topo em −34, base em +6), tile sem emenda e rolando no sentido `dir`; onda animada (quadros em ~8 fps) atravessando a tela no sentido `dir`, uma por vez, altura ≤ 110px; reflexo e filetes de luz mantidos; alpha pela `wave` como hoje.
- [ ] Prints Playwright de represa, parque-lago, ponte-rio (antes/depois).
- [ ] Rodar teste + `ambiente_test` + `clima_fauna_test` + `fauna_bioma_test` → passam.
- [ ] Commit.

### Task 4: Aurora em pixel art, atrás

**Files:**
- Modify: `js/engine/weather.js` (remover ramos aurora de `draw` e `drawOverlay`; novo `drawSky(ctx)`)
- Modify: `js/engine/stage.js` (`drawBack`: chamar `this.game.weather.drawSky(ctx)` antes de `drawTorcida`)
- Modify: `tools/perf_test.cjs:29,97-120`, `tools/weather_visual_test.cjs:107,150-163` (checam a aurora nova)
- Test: `tools/ambiente_visual_test.cjs`

**Interfaces:** Produces: `Weather.prototype.drawSky(ctx)` — coordenadas de tela, no-op se `perfOff` ou `kind !== 'aurora'`.

- [ ] Teste: com `kind='aurora'`, `weather.draw` não pinta nada acima dos lutadores (aurora só via `drawSky`); `drawSky` numa arena clara: média de luminância da faixa y<160 cai (céu escurece) e < 5% de pixels saturados (>245 nos 3 canais); pixels esverdeados/teal dominantes no topo; com `perfScale 0.45` desenha sem erro; com `perfOff` não desenha.
- [ ] Rodar → falha.
- [ ] Implementar `drawSky`: (1) gradiente de escurecimento cacheado (azul-noite, alpha ~0.55 em y=0 → 0 em y≈260) em source-over; (2) canvas offscreen 240×80 (criado 1x) onde 2–4 cortinas (`round(4*perfScale)`, mín 2) são desenhadas por colunas de 1px: altura da coluna ondulando com seno, cor verde→teal na borda de baixo e roxo no topo, alpha por coluna cintilando; redesenho a cada 2 ticks (estático com `reduced`); (3) `drawImage` ampliado 4× com `imageSmoothingEnabled=false` em `screen`/`lighter` com alpha ≤ 0.8 na faixa y 0..320; (4) estrelas atuais desenhadas aqui em coordenadas de tela.
- [ ] Prints Playwright: sesi (dia), kernel, 09-orbital-core (noite).
- [ ] Rodar teste + `perf_test` + `weather_visual_test` + `clima_ultra_test` + `clima_fauna_test` → passam.
- [ ] Commit.

### Task 5: Fechamento
- [ ] Bateria completa; comparar com a linha de base (56 ok / 12 falhas de ambiente).
- [ ] Atualizar `?v=` dos scripts/sheets alterados no `index.html`/`main.js`/`stage.js` para um token novo (`v54-ambiente`) para furar cache.
- [ ] Prints antes/depois enviados ao dono; push; atualizar descrição do PR #106.
