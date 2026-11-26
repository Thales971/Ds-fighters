# Integração opcional no DS Fighters

A inspeção foi feita sobre o repositório público informado no pedido. Nenhum arquivo do jogo foi alterado e a integração ainda não foi realizada. O pacote final usa folhas **1024 × 1024**, grade **4 × 4**, células **256 × 256**. Os personagens atuais continuam nas folhas próprias de 96 × 128.

## Carregamento

Copie o pacote para `assets/art-pack/` e inclua `<script src="assets/art-pack/art-pack.js"></script>` em `index.html`, antes dos scripts do motor. Chame `DSArtPack.load().catch(console.warn)` uma vez na inicialização; não carregue imagens a cada frame.

O Canvas lógico atual é 960 × 540. Em `js/engine/game.js`, `GROUND_Y = H - 60`, portanto a linha física de contato é 480. Em `drawScene()`, o jogo desenha o fundo e o `StageFX`, depois traduz o contexto por `(-Math.round(cam), GROUND_Y)` para projéteis, lutadores e partículas. Nesse contexto, `y=0` é o piso e `y=-70` corresponde à tela em 410. Não desconte a câmera duas vezes.

O carregador usa **âncora central**: `x,y` são o centro do quadro, não o canto superior esquerdo. `row` e `frame` são números inteiros começando em zero. Os nomes e as linhas estão em `manifest.json`.

## Projéteis

O ponto direto é `Projectile.draw()` em `js/engine/projectile.js`. Logo depois de `ctx.translate(this.x, this.y)`, você pode desenhar o recurso animado antes do `switch (s.shape)` e retornar apenas se o recurso estiver disponível. Preserve o desenho antigo como fallback:

```js
if (s.art && window.DSArtPack) {
  const raw = Math.floor(this.age * 14 / 60);
  const frame = s.art.loop === false ? Math.min(3, raw) : raw % 4;
  const ok = DSArtPack.draw(ctx, s.art.sheet, s.art.row, frame,
    0, 0, s.art.size || 128, { flipX: this.dir < 0 });
  if (ok) { ctx.restore(); return; }
}
```

Este exemplo pressupõe o passo de simulação atual a 60 Hz. Adicione metadados opcionais às especificações de ataque em `js/data/fighters.js`, por exemplo `art: { sheet: 'fire', row: 0, size: 128, loop: true }`. O carregador não aceita o nome textual da animação no argumento `row`; converta pelo manifesto ou use o índice.

Os projéteis atuais começam em `owner.x + owner.dir * 40`, com altura próxima de `y=-70-spec.h/2`. O tamanho visual não deve substituir automaticamente `spec.w`, `spec.h`, dano ou hitbox.

## Impactos e especiais

Os hooks úteis em `js/engine/game.js` são `spawnHitStar()`, `spawnSlash()`, `spawnSparks()`, `aoeBlast()` e `resolveProjectileClashes()`. Guarde um identificador de folha, linha e idade junto da partícula. Em `drawScene()`, no bloco que desenha partículas, tente `DSArtPack.draw()` antes do desenho procedural.

Para um efeito que acontece uma única vez, use `Math.min(3, Math.floor(idadeEmSegundos * fps))` e remova-o ao fim dos quatro quadros. Use `impact`, no singular, como nome da folha. Linhas: 0 leve, 1 pesado, 2 defesa, 3 crítico. Fogo, água, raios, caos e magia extra seguem a ordem indicada no LEIA-ME e no manifesto.

## IALES

IALES está em `js/data/fighters.js`, com `id: 'iales'`. O ciclo atual inclui FIREWALL, RAIO DE DEPLOY, DDoS e VOID NULL. Você pode escolher, como sugestão temática, os ícones Gemini, DeepSeek, ChatGPT e Claude para esse ciclo. Isso é uma escolha visual nova, não uma associação oficial entre as IAs e esses poderes.

Desenhe o símbolo no contexto de mundo após o lutador ou projétil, por exemplo:

```js
DSArtPack.drawIcon(ctx, 'chatgpt', fighter.x, -146, 40);
```

Os 16 nomes válidos estão no objeto `icons` do manifesto. Não existem os nomes `ai-firewall`, `ai-deploy`, `ai-ddos` ou `ai-void` neste pacote.

## Pássaros e mapas

Desenhe pássaros no fundo, antes dos lutadores, em coordenadas de tela:

```js
DSArtPack.draw(ctx, 'birds', 0, Math.floor(t * 10) % 4, 760, 92, 64);
```

Adicione objetos a `STAGES`, em `js/data/stages.js`, para expor os fundos na seleção. A lista já usa `STAGES.length`. Cada objeto precisa de `id`, `name`, `draw(ctx,w,h,t,cam)` e `obstacles: []` se não houver obstáculos. Não use `drawFg` para o piso: essa camada é desenhada sobre os lutadores.

```js
{
  id: 'art-neon-rooftop',
  name: 'Cobertura Neon',
  obstacles: [],
  draw(ctx, w, h, t, cam) {
    if (!DSArtPack.drawMap(ctx, '01-neon-rooftop', w, h)) {
      ctx.fillStyle = '#10182b';
      ctx.fillRect(0, 0, w, h);
    }
    // Piso físico opcional: garante contato em H-60.
    // Ajuste a arte e o material do piso para combinar com este cenário.
    ctx.fillStyle = '#171e30';
    ctx.fillRect(0, h - 60, w, 60);
  }
}
```

Os PNGs de mapas são achatados, estáticos e em 16:9; não oferecem parallax em camadas. A linha visual da plataforma varia entre as imagens e precisa de ajuste na integração. `drawMap` apenas desenha a imagem completa. Plataformas de `platforms/` são peças decorativas: definir colisão e contato continua sendo responsabilidade do motor.
