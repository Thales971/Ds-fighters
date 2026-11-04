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
