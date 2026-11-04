# Diagnóstico dos bugs de sprite (grika, mis, meta, dandara, kimi, deep, nina, gemini, winx, urbano)

**Resultado: o `main` atual está limpo — não conseguimos reproduzir nenhum dos
bugs relatados (sprite gigante, pé dentro do chão, sprite duplo) rodando o jogo
real.** Este documento mostra como isso foi verificado e o que falta para fechar
a questão de vez.

## O que foi testado (tudo no `main` atual, commit 5795e88)

1. **Arquivos de sprite, byte a byte** (`python3 tools/sprite_audit.py` +
   varredura própria de todas as 36 folhas):
   - todas as folhas dos suspeitos têm exatamente 1280×3900 (grade 4×15,
     célula 320×260);
   - nenhuma célula tem o pé abaixo de y=246 (nada "entra na terra");
   - nenhuma célula dos suspeitos tem arte cortada na borda ou altura fora do
     padrão (altura da arte ~198px em todos os 36 lutadores — ninguém é
     desproporcional);
   - `assets/abilities` dos suspeitos: todas 512×640 (4×5 de 128px).
2. **Render matemático do motor** (`node tools/render_poses.cjs`): desenha as
   15 poses × 4 frames de cada suspeito usando o `SpriteGen.blit` real com o
   chão em y=458 (mesma conta do jogo). Todos com o pé no chão, sem duplicação.
3. **O jogo completo rodando** (`node tools/game_harness.cjs`): o `index.html`
   real com todos os scripts foi executado em headless (jsdom + node-canvas),
   com lutas de verdade para cada suspeito — idle, H1–H4, ultimate, dash (que
   desenha o rastro/afterimage), tomando golpe e K.O. Foram geradas ~100
   capturas do canvas de combate (`.vibe/game/`) e nenhuma mostrou sprite
   gigante, duplo ou afundado.
4. **Deploy no ar**: https://ds-fighters.vercel.app e
   https://online-server-one.vercel.app respondem ambos com o selo de build
   **`spritefix-4x15b`** — o mesmo token do `main`. Ou seja, o site está
   servindo o código atual. O `vercel.json` já manda `no-store` em tudo.

## O que isso significa

Se o código servido está certo e renderiza limpo, o bug que você vê está em
uma destas três fontes — e só você consegue confirmar qual:

1. **Tela inicial/PWA no celular**: um atalho "instalado" abre um cache velho
   que F5 não limpa. Teste: desinstale o atalho e abra direto no navegador por
   `https://ds-fighters.vercel.app`.
2. **Checkout local velho**: se você joga com `file://` ou `localhost` numa
   pasta antiga (branches `thales/*`), o código é o velho. No jogo, confira o
   **selo de build no canto da tela**: deve dizer `build spritefix-4x15b`.
   Se dizer outra coisa, é versão antiga.
3. **CDN de borda ainda com entrada velha**: improvável (no-store + token
   novo), mas possível. Espera algumas horas ou abre em outro aparelho/rede.

## Para fechar o caso, precisamos de UMA destas coisas

- um **print da TELA DE JOGO** (com barra de vida, durante a luta) mostrando o
  bug, dizendo o personagem e a ação (parado / soco / habilidade / tomando
  golpe) — as fotos em `bugs/` são artes promocionais e não mostram o bug;
- o **vídeo mp4** dentro do repo;
- a confirmação do **selo de build** que aparece na sua tela (basta o texto).

## Ferramentas deixadas neste commit

- `tools/render_poses.cjs` — renderiza as 15 poses de um lutador com o blit
  real do motor (chão em y=458). Sem argumentos roda os 10 suspeitos.
- `tools/game_harness.cjs` — roda o jogo completo headless e salva capturas
  de luta (idle, H1–H4, ult, dash, hit, ko). Aceita `node tools/game_harness.cjs
  <lutador> [oponente]`.

Ambas precisam de `npm i canvas jsdom` (uma vez). Com elas, qualquer um
"joga" e confere os sprites sem abrir navegador — se um dia um bug desses
voltar, basta rodar os dois comandos e comparar com os PNGs gerados.

---

# V12 — Remoção de lutadores e auditoria intensiva (mis, nina, gemini, meta, deep, kimi)

## Remoção permanente
**Grika, Ash (noir), Rin e Katya (zoya) saíram do jogo** — 32 lutadores agora.
Foram retirados de: `FIGHTERS` (fighters.js / fighters-v11.js), kits e
assinaturas (powers-v11.js / powers-turbo.js), allowlist online
(js/net/room-core.js + online-server/room-core.js), atlas de habilidades
(fx.js), caso especial de projétil (projectile.js), folha de sprites
(layout.js) e HUD (ui.js). Os arquivos de arte continuam no repo para
facilitar um eventual rollback, mas nada no jogo os carrega.

## Auditoria intensiva (mis, nina-vector, gemini, meta, deepseek, kimi)
Medição célula a célula (bbox de alpha, 60 células por folha) contra o padrão
do elenco:

- **Bug 1 — pulo "meio que no chão" (as 6 folhas):** a linha `jump` dessas
  folhas tinha o pé plantado em y=245 (igual a uma pose de chão), enquanto o
  padrão do elenco (ex.: du) deixa o pé em y≈220. No ar, o sprite parecia
  meio enterrado/no chão. **Correção:** `tools/fix_airborne_poses.py` subiu a
  linha jump das 6 folhas para o pé em y=220 (verificado por célula).
- **Bug 2 — Mis gigante ao tomar porrada:** a arte da pose `hit` da Mis tem
  196px de largura (padrão do elenco: ~110px; cabelo/braços abertos). A da
  Kimi tem 230px — a mais larga das 36 folhas. **Correção:** o motor agora
  aceita `poseScale` por lutador (pivô no pé, `sprites.js`) e a Mis desenha o
  hit a 0.80 e a Kimi a 0.75 — compactas ao levar dano, sem mexer nas outras
  poses.
- **Limpo:** gemini, meta e deepseek não têm outlier de pose (pés em 245,
  hit dentro da faixa do elenco). Nina: piloto e mecha Kestrel-09 têm os pés
  no chão em todas as células de chão (verificado por coluna); no ar só nos
  ataques aéreos, como todo o elenco.

## Cache
Token de asset bumpado de `spritefix-4x15b` para **`v12-roster-32`** em todas
as URLs (`?v=`) e no selo de build da tela. Se a tela de alguém mostrar outro
selo, é cache velho.

## Verificação
- `node tools/combat_regressions.mjs` → PASS
- `node tools/v10_regressions.mjs` → 74 assertions
- `node tools/v11_regressions.mjs` → 76 assertions (grika removida do teste)
- `npm test --prefix online-server` → 38 verificações (inclui ausência dos 4 removidos)
- `python3 tools/sprite_audit.py` → AUDITORIA LIMPA
- `node tools/render_poses.cjs` + `tools/game_harness.cjs` → capturas
  conferidas: pulo com pé no ar, hit da Mis compacto, sem duplicação
- `tools/v7_regressions.cjs` falha no main ANTES das mudanças (kimi, linha de
  especial) — pré-existente, fora do escopo.

---

# V12b — Round 2 da auditoria (block/walk-back/"meio no chão")

Com o build `v12-roster-32` no ar, o dono reportou: Mis grande ao tomar porrada
(e em outros momentos), Nina grande ao defender e andar para trás, sprite
"meio que no chão", Kimi e Deep com bugs semelhantes. Medição nova achou a
causa:

- **Poses compactas em altura cheia:** nas 6 folhas refinadas TODAS as poses
  ocupam 198px de altura × 167–304px de largura (cabelo/mecha preenchendo a
  célula), enquanto o elenco clássico bloqueia/agacha a ~115–124px e ~110px
  de largura. Ao defender ou agachar, elas ficavam com o dobro da massa
  visual dos outros lutadores.
- **`backdash` usa a pose de block** (`animPose()` em fighter.js) — por isso
  "grande ao defender E indo para trás" é o mesmo bug.
- **Linhas duplicadas** (mis, kimi, deep, gemini, meta, dandara,
  dev-senior*): `block == crouch`, `punch == cpunch == jpunch`,
  `kick == ckick == jkick`, `idle == win` — só ~7 poses únicas em 15 linhas.
  É a origem de "bugs semelhantes" em vários momentos.

**Correção (engine, sem tocar na arte):** `poseScale` por lutador no blit
(pivô no pé — encolhe a silhueta sem tirar ninguem do chão):
- mis/kimi/deep/gemini/meta: `block 0.70`, `crouch 0.70`, `cpunch/ckick 0.75`,
  `hit 0.75–0.80`
- nina (composição piloto+mecha, mais suave): `block/crouch 0.80`,
  `walk 0.85`, `hit 0.80`

Token bumpado para `v12b-compact-poses`. Verificado em capturas do jogo
rodando: block, walk-back e crouch agora compactos e com os pés no chão;
combat/v10/v11/online-server/sprite_audit todos verdes.

**Pendência de arte (não travada por código):** as linhas duplicadas
(`punch==jpunch`, `kick==jkick`, `block==crouch`, `idle==win`) só resolvem
com arte nova para essas linhas — o poseScale disfarça o tamanho, mas os
frames continuam repetidos.

---

# V12c — Kimi e Deep Seek removidas

Decisão do dono após a auditoria V12b: as folhas da Kimi e da Deep Seek
compartilhavam os mesmos defeitos estruturais das outras refinadas (todas as
poses em altura cheia + linhas duplicadas) e saíram do jogo. **30 lutadores.**

Removidas de: FIGHTERS e kits V7/V9 (powers-v7.js, powers-v9.js), assinaturas,
allowlist online (js/net/room-core.js + online-server/room-core.js), atlas de
habilidades (fx.js), bônus de clima (fighter.js), layout.js (files +
poseScale) e HUD (ui.js). Ferramentas de teste atualizadas; a falha
pré-existente do `tools/v7_regressions.cjs` (linha de especial da kimi) foi
resolvida — a suíte agora passa. Token: **`v12c-roster-30`**.

Verificação: combat_regressions PASS · v7 PASS · v10 74 · v11 76 ·
online-server 38 checks · sprite_audit limpa · jogo boota headless com 30
lutadores.
