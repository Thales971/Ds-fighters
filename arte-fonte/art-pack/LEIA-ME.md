# DS Fighters — Retro Elemental Expansion

Pacote de arte original criado para ampliar o visual de DS Fighters, com direção de pixel art arcade retrô inspirada no visual dos jogos de luta do início dos anos 1990: pixels aparentes, contornos fortes, cores em pequenos degraus e nenhuma suavização na ampliação. A arte não copia sprites de Street Fighter. O repositório original não foi alterado. Este é um pacote de recursos e um carregador opcional, não uma versão do jogo já integrada.

## O que está incluído

São 9 spritesheets PNG RGBA com fundo realmente transparente. Sete folhas são animadas: impactos, fogo, água, raio, caos, magia extra e pássaros. Cada uma tem 4 animações de 4 quadros, totalizando 28 sequências e 112 quadros. As outras duas folhas contêm 16 símbolos estilizados de serviços de IA e 16 módulos de chão/plataforma.

Há também 10 mapas PNG separados em 1920 × 1080, proporção 16:9: Cobertura Neon, Forja Vulcânica, Laboratório Abissal, Templo da Tempestade, Cidadela do Caos, Dojo das Cerejeiras, Ilhas do Céu, Caverna de Cristais, Núcleo Orbital e Floresta Digital.

Os quadros individuais estão em `frames/`. Os ícones separados ficam em `icons/`, as plataformas em `platforms/` e as 28 prévias animadas em `previews/`. As fontes em resolução original ficam em `source/`; a arte comercial consultada como referência não faz parte do pacote.

## Grade e animações

Todas as folhas finais em `spritesheets/` medem **1024 × 1024 pixels**, em grade **4 × 4**. Cada célula mede **256 × 256 pixels**, sem espaçamento adicional entre células. A área transparente dentro de cada célula faz parte do quadro e deve ser preservada.

A versão em resolução nativa retrô fica em `retro-native/spritesheets/`: folhas de **256 × 256**, com células de **64 × 64**. A versão principal é a ampliação exata de 4× por vizinho mais próximo, preservando os blocos de pixels. Os mapas nativos em `retro-native/maps/` medem **480 × 270**; os mapas principais também são ampliados exatamente 4×. No Canvas do jogo de 960 × 540, cada pixel lógico do mapa ocupa 2 × 2 pixels de tela.

A leitura é da esquerda para a direita. Nas sete folhas animadas, cada linha é uma sequência diferente. Os índices no JSON e no carregador começam em zero. Os pivôs são centrais, em `(128, 128)`. Para desenhar um quadro, recorte `(coluna × 256, linha × 256, 256, 256)`.

O `manifest.json` informa nomes, linhas, taxa sugerida de animação, arquivos individuais e prévias. Para os efeitos curtos, use 14 fps e pare no quarto quadro; para pássaros, use 10 fps em loop. Os projéteis da primeira linha de fogo, água, raio e caos também podem repetir em loop. Os GIFs são apenas prévias e repetem mesmo as animações que, durante a luta, devem acontecer uma só vez.

### Linhas de cada folha

**Impactos:** impacto leve; impacto pesado; defesa; crítico. **Fogo:** bola de fogo; pilar; corte circular; explosão. **Água:** projétil; onda; escudo; splash. **Raio:** projétil elétrico; descarga vertical; anel; impacto. **Caos:** lâmina; vórtice; garras; erupção. **Magia extra:** gelo; vento; cura; teleporte. **Pássaros:** corvo; pomba; águia; fênix.

### Símbolos das IAs

A seleção inclui ChatGPT, Claude, Gemini, DeepSeek, Copilot, Grok, Perplexity, Meta AI, Mistral, Qwen, Manus, Cursor, Midjourney, Stability AI, Leonardo AI e Replit. A ordem é linha a linha, da esquerda para a direita.

São interpretações em pixel art para uso visual no personagem IALES, não arquivos oficiais de identidade de marca. Esta seleção não representa todas as IAs existentes. Nomes e marcas pertencem aos respectivos titulares; verifique as regras de marca antes de publicar um produto que as utilize.

### Chãos e plataformas

Os 16 módulos cobrem grama/terra, madeira, tijolos de castelo, arenito, basalto com lava, gelo, pedra de nuvem, obsidiana do caos, metal tecnológico ciano, metal neon magenta, circuito dourado, metal enferrujado, pedra oceânica, pedra florestal, cristal lavanda e metal orbital.

São peças decorativas independentes em vista lateral. Não são um tileset autotiling e a repetição sem emendas não foi garantida. Colisão e posição da superfície precisam ser definidas no código, não inferidas da caixa transparente de 256 × 256.

## Como usar no projeto

Copie esta pasta para `assets/art-pack/` no jogo. O `art-pack.js` fica na raiz do pacote. Carregue o script antes do motor e chame o carregamento uma vez:

```html
<script src="assets/art-pack/art-pack.js"></script>
```

```js
DSArtPack.load('assets/art-pack/').catch(console.warn);
```

Use um servidor local, como o indicado no README do jogo; o carregador lê JSON com `fetch`, que pode ser bloqueado se o HTML for aberto diretamente por `file://`.

Depois que o carregamento terminar, este exemplo desenha uma bola de fogo animada com âncora central:

```js
const frame = Math.floor(tempoEmSegundos * 14) % 4;
DSArtPack.draw(ctx, 'fire', 0, frame, x, y, 128, { flipX: direcao < 0 });
DSArtPack.drawIcon(ctx, 'chatgpt', x, y - 80, 40);
```

O carregador usa `imageSmoothingEnabled = false`. Os PNGs já têm alfa: use composição normal `source-over`, sem remover uma cor de fundo. As folhas de personagem existentes de 96 × 128 permanecem separadas e não devem ser substituídas por estas folhas de efeitos.

As notas em `integration/NOTAS-DO-JOGO.md` indicam os pontos de inserção no motor atual. O módulo retorna `false` quando o recurso ainda não está disponível, permitindo preservar os efeitos procedurais como fallback.

## Uso dos mapas

Os fundos são cenas estáticas já compostas em uma única imagem, não camadas de parallax separadas. As áreas centrais ficam livres para os lutadores. Embora o enquadramento tenha sido solicitado para o piso do jogo, a posição visual do piso varia entre as imagens: ajuste a escala/posição ou desenhe uma plataforma própria na linha `H - 60` antes de usar os mapas numa luta.

`DSArtPack.drawMap(ctx, id, w, h)` desenha a imagem completa; não corrige automaticamente a linha de contato, não cria colisão, não inclui o mapa em `STAGES` e não anima chuva ou outros detalhes pintados no fundo.

## Origem e limites

A arte foi gerada originalmente por IA para este pedido e organizada deterministicamente em folhas, quadros individuais e metadados. As animações são sequências curtas de quatro poses; podem receber refinamento manual adicional para golpes com timing muito específico. Nenhum sprite de outro jogo foi usado. O pacote não contém sons, novas folhas completas de lutadores nem alterações de gameplay.
