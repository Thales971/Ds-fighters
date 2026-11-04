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
