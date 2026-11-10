# Como entra conteúdo no DS Fighters

Este texto descreve o caminho real do código em `main`, não um fluxo ideal. O jogo é estático: não há build. O `index.html` carrega os scripts em ordem, e cada arquivo novo **emenda** o anterior. A edição que o jogador vê (hoje **V20**) é o maior `fighters-vN.js` dessa lista. As contagens da tela de título saem de `FIGHTERS` e `STAGE_LIST`.

## Ordem de carga

O `<head>` e o fim do `index.html` fazem, nesta ordem:

1. `assets/sprites/layout.js` — geometria das folhas e o mapa `id → png`.
2. `assets/stages/sheets.js` e `assets/maps/anim.js` — arenas clássicas animadas.
3. `js/core/profile.js` — save local e códigos.
4. Nuvem: Firebase (opcional), Supabase, SDK vendorizado.
5. Elenco, do mais antigo para o mais novo:
   - `js/data/fighters.js` (elenco base, inclusive os três secretos)
   - `fighters-v10.js` … `fighters-v20.js`
6. Kits, do mais antigo para o mais novo:
   - `js/data/powers.js`, `powers-turbo.js`, `powers-v4.js` … `powers-v11.js`
   - alguns lutadores novos (QWEN, Dolynho, THL, Lobão, Winx, Dandara) nasceram dentro de um `powers-v*.js`, não num `fighters-v*.js`
7. Balanceamento, que **sobrescreve** números já definidos: `powers-balance-v6.js` … `powers-balance-v13.js`.
8. `js/data/pets.js`, `js/data/stages.js`.
9. Motor (`js/engine/*`), HUD, `js/ui/ui.js`, online, `js/net/tournament.js`.
10. `js/data/roster-portraits.js` — atlas dos bustos da grade de seleção, gerado.

Quem carrega por último ganha. Um `stats.power` escrito em `fighters.js` não é o número da luta se um `powers-balance-v*.js` fizer `Object.assign` depois. O README lista o valor **final**.

O cache-buster atual da maior parte dos scripts e das folhas de lutador/habilidade é `?v=v36-balance13` (`SpriteGen.url` e `Art.url`). Não é a edição pública. Clima usa `?v=v33-weather`. As folhas de arena clássica usam `?v=stable-loop-mistral-v1` dentro de `assets/stages/sheets.js`. Quando um PNG muda, o `?v=` daquele arquivo precisa mudar; o `vercel.json` manda `Cache-Control: no-store`, mas o query string continua sendo o que o próprio jogo compara no selo `build`.

## Lutador

### O que define um lutador

| Peça | Onde |
|---|---|
| Nome, bio, cores, golpes básicos, `secret` | Objeto em `FIGHTERS` |
| Cinco (ou dez) habilidades | `POWERS[id].powers` |
| Frase de traço / assinatura | `SIGNATURES[id]`, quando existe |
| Folha do corpo | `assets/sprites/<id>.png` + entrada em `SPRITE_LAYOUT.files` |
| Ícones e impacto | `assets/abilities/<id>.png` |
| Rosto da HUD e do versus | `assets/ui/face-<id>.png` (168×168) |
| Retrato legado do integrador | `assets/ui/portrait-<id>.png` (320×360) |
| Busto da grade de seleção | célula do atlas `assets/ui/roster-portraits.png` |
| Id aceito na sala online | `FIGHTER_IDS` em `js/net/room-core.js` **e** a cópia `online-server/room-core.js` |

`secret: true` só pinta o selo SECRETO e, junto com `Profile.SECRET_IDS`, tranca o lutador até o código. Hoje a lista é `du`, `iales`, `felipinho`. WINX.EXE tem `secret: false` e não está nessa lista: é lutadora normal. O QWEN também. `batata` e `adm` liberam o mesmo trio (`Profile.BATATA_IDS`).

Os três secretos são de propósito mais fortes. O IALES tem 10 habilidades (`a0`…`a9`, teclas 1–0). Lutador normal: 2 simples, 2 de carga, 1 ultimate.

### Formato da folha

Contrato que o motor e `tools/integrate_fighter.py` esperam:

- PNG **RGBA**, **1280×3900**.
- **4 colunas × 15 linhas**. Célula **320×260**.
- Pé na linha **y = 246** (`baseline`). `drawScale` global é 1.
- Ordem das linhas: `idle`, `walk`, `jump`, `crouch`, `punch`, `kick`, `cpunch`, `ckick`, `jpunch`, `jkick`, `special`, `hit`, `block`, `ko`, `win`.
- 4 quadros nas poses cheias. O layout padrão em `frames` ainda descreve poses curtas (pulo 2, agachar 2…); lutadores novos preenchem `perFighter[id].frames` com 4 em todas.
- Folhas que desenharam o corpo grande demais ganharam `perFighter[id].poseScale` (encolhe com pivô no pé). Está em `layout.js`, nos blocos V12 / V12o / V12m / V14a. Não é o caminho para um lutador novo: o certo é a silhueta já caber na célula, na faixa do elenco clássico (corpo ~145–170 px nas poses de ação, não 198 px de altura cheia).

Habilidades: folha **4×5**, célula **128 px** (`assets/abilities/<id>.png`). O IALES é **4×10** porque tem 10 ícones. `row` do poder é a linha dessa folha. Efeitos genéricos continuam em `assets/fx/` (fogo, gelo, raio…). Efeito exclusivo de um lutador pode ir para `assets/fx/` ou reusar a própria folha de habilidade via `fx2:<id>` em `js/engine/fx.js`.

`SpriteGen.reconcile` mede a imagem carregada e corrige `layout.js` se a geometria não bater. Isso evita o boneco gigante quando o navegador guarda um layout velho. Não substitui uma folha no tamanho certo.

### Grade de seleção

A grade não desenha rosto no canvas. `tools/build_roster_portraits.py` recorta o **idle 0** de cada folha real, numa janela quadrada do mesmo tamanho de origem (mesma escala), ancorada no topo da cabeça, e monta `assets/ui/roster-portraits.png` + `js/data/roster-portraits.js`. A célula de 48 px mostra esse busto com `image-rendering: pixelated`.

Ajuste fino (Nina, Dolynho, Ponteiro, Kotlin) fica no dicionário `OVERRIDES` do script. Rode de novo em vez de editar o PNG ou o JS à mão. Lutador travado continua sem imagem: só o `?`.

Formas que não são ficha (`qwen-astra`, `dev-senior-nano`, `emilio-trans`) têm folha própria e **não** entram na grade. O jogo troca a folha no meio da luta (`Fighter` olha o status `astra` / transformação).

## Arena

`STAGE_LIST` em `js/data/stages.js` junta três origens:

1. `STAGE_SHEETS` (`assets/stages/sheets.js`): 14 clássicos animados. Folha PNG + um JPG de fonte em `assets/stages/source/`. Campos `cols`, `rows`, `frames`, `fps`, `frameW`, `frameH`.
2. JPG parado em `assets/maps/<arquivo>.jpg`, um objeto por arena, com `group` (Pacote retrô, Tecnologia, Turbo, V4…).
3. `STAGE_LIST.push(...)` no fim do mesmo arquivo, para as arenas que chegaram depois (V7, V8).

`STAGE_EXTRA` completa clima, fauna e mecânica dos clássicos. Arena de JPG traz isso no próprio objeto.

Campos que importam:

| Campo | Efeito |
|---|---|
| `image` ou `sheet` | O que a tela desenha |
| `weather` | Lista sorteada por `js/engine/weather.js` |
| `fauna` | `bird`, `bat`, `bee`, `butterfly`, `fish` — folha `assets/fauna/fauna.png` |
| `mech` | Chave de `MECHS` em `js/engine/mechanics.js` |
| `tint` | Cor do pós-processamento |
| `gravity`, `friction` | Física da arena |
| `embers`, `sparks`, `petals`, `fireflies`, `bubbles`, `motes`, `neon`, `glitch`, `code` | Camada ambiente em `js/engine/stage.js` |
| `layers` | `[{ src, speed, y }]`. Fundo, meio e frente em PNG, cada um com parallax próprio. Sem isso, o motor fatia a imagem única em três faixas |
| `props` | `[{ cell, x, y, fall, flash }]`. Célula de `assets/fx/stage-props.png` (48×64). `flash` acende no golpe forte; `fall` despenca. Sem a lista, o palco ganha luzes, público e um caixote nas bordas |
| `ambient` | Nome do MP3 em `assets/audio/sfx/` (também listado em `SFX_FILES`). Sem o campo, `stageAmbient()` escolhe um laço pelo id |
| `pixel` | Desliga o smoothing quando as camadas são pixel art |

Golpe com tremor ≥ 8 chama `stage.react`: luzes piscam, o público treme e o objeto marcado `fall` cai. No round final, ou com alguém a 30% da vida ou menos, o palco escurece, a chuva de `assets/fx/rain-streaks.png` entra e a música vai a 1,12×. Isso vale para todo palco, inclusive os que não declaram `layers`.

O id também precisa estar na lista de arenas que a sala online aceita (o núcleo valida arena). Hoje isso segue o catálogo carregado no cliente; o servidor dedicado tem cópia manual do núcleo.

## Ambiência

Três camadas, fáceis de misturar:

1. **Clima** (`Weather` em `js/engine/weather.js`). Tipos: `clear`, `rain`, `wind`, `storm`, `snow`, `aurora`, `heatwave`, `fog`. Muda vento, atrito, bônus elemental e, na tempestade, raio com dano. Sprites: `assets/weather/snowflakes.png`, `leaf.png`, `spark.png`. Áudio em loop: `rain_loop`, `wind_loop` (`assets/audio/sfx/`).
2. **Partículas da arena** (`Stage`, flags do mapa). Pétalas e neon usam `assets/weather/petals.png` e `neon.png`. Brasa, fagulha, vaga-lume, bolha, poeira, glitch e chuva de código saem dessas flags. Não é um sistema novo: é um `if (d.petals)` na montagem das partículas.
3. **Mecânica nomeada** (`mech`). Perigo de verdade (lava, gongo, abelha, container, query, drone…) mora em `MECHS`. Vazio (`lowgrav`, `highjump`, `bounce`) só altera física lida em outro ponto. Mascote é outra coisa: `js/data/pets.js` + linha em `assets/pets/pets.png`.

Música de luta: `assets/music/playlist.json` aponta os MP3 em `assets/music/rock/`. O menu tem faixa própria (`menu`). Fotos de referência de personagem futuro **não** são música e não devem ser apagadas só porque nenhum script cita o arquivo (ver o fim deste texto).

## Quem pôs o quê, e a dívida

Não há um dono por arquivo além dos comentários de versão. A leitura do próprio código:

| Versão no arquivo | O que entrou |
|---|---|
| `fighters.js` + `powers.js` | Elenco base e os três secretos |
| `powers-turbo.js` + mapas Tecnologia / Turbo | Kits e arenas da expansão Turbo |
| `powers-v4.js` | Urbano, Xeon, QWEN (hoje normal) e a 2ª ultimate do IALES |
| `powers-v5.js` / `v6.js` | Dolynho, THL, Lobão |
| `powers-v7.js` … `v11.js` | Winx, Dandara, e os kits que esses arquivos emendam |
| `fighters-v10.js` / `v11.js` | Gemini, Meta, Mis, Dev Senior (e a forma nano) |
| `fighters-v12.js` … `v20.js` | Dev Veterano até o Ponteiro, um pacote por arquivo |
| `powers-balance-v6.js` … `v13.js` | Números reescritos por cima. O v13 é o último passe |
| `stages.js` grupos V4–V8 | SESI/SENAI, Japão, dojo, circo, pizzaria, área de trabalho, abismo, vale, pós-codigocalipse |
| Clima v2 / névoa / ambiência v2 | Flocos, aurora, folhas, brasa, névoa, néon e glitch nos mapas que estavam mudos |

Dívida que isso deixa:

- **Dois jeitos de nascer lutador.** Uns estão em `fighters-vN.js` (ficha + poderes no mesmo arquivo). Outros nasceram em `powers-vN.js` e só existem porque esse arquivo dá `FIGHTERS.push`. A ordem no `index.html` é a documentação.
- **Balanceamento em cascata.** O power “de catálogo” mente. Vários lutadores pensados como normais estão hoje na faixa 1.50 depois do v13, perto dos secretos. O IALES foi a 2.60. Quem for equilibrar de verdade precisa de um único arquivo, não de um oitavo `Object.assign`.
- **Escala de arte misturada.** O elenco clássico cabe na célula. Várias folhas refinadas ocupam ~198 px e dependem de `poseScale` para não virar gigante ao agachar ou vencer. Gemini, Meta e Dolynho pareciam outro tamanho na grade antiga porque a grade misturava `face-*.png` (rosto) com a folha inteira (corpo). O atlas de bustos acaba com isso na seleção; a luta ainda usa a folha crua + `poseScale`.
- **Três cache-busters** (`v36-balance13`, `v33-weather`, `stable-loop-mistral-v1`) e um selo público que durante muito tempo dizia “Edição V12”.
- **Allowlist duplicada.** `online-server/room-core.js` é cópia de `js/net/room-core.js` (`npm run sync` na pasta do servidor). A cópia do servidor **não** lista `emilio`, `nunes` nem `ponteiro`. O P2P usa o arquivo do cliente e aceita os três. O servidor dedicado, se alguém subir essa cópia velha, recusa.
- **`secret` e `SECRET_IDS` já divergiram** (foi o caso da Winx: selo SECRETO com o personagem jogável). Os dois têm que ser mexidos juntos.
- **Ferramentas históricas** (`tools/v7_browser_check.py`, `selection_ui_check.py`, `gen_fighters.py`) ainda citam Kimi, DeepSeek, Zoya, Rin e Noir, que saíram do elenco. Não são o caminho para um lutador novo.
- Fotos de referência e o `assets/art-pack/` (pacote documentado, não carregado pelo `index.html`) convivem com o jogo. Não são lixo só porque a luta não pede o arquivo.

## Checklist — lutador novo, no nível do elenco original

1. Arte do dono recortada para a folha **1280×3900**, RGBA, pé em y=246, 15 poses × 4 quadros. `python3 tools/integrate_fighter.py <id>` faz isso quando a fonte está no formato que o script espera (`bugs/Novos-personagens/` no texto do próprio script). Não invente pixel no canvas do jogo.
2. Confira com `python3 tools/sprite_audit.py <id>`: tamanho, pé, centro, quadros diferentes entre si, `face-<id>.png` 168×168, `portrait-<id>.png`, `abilities/<id>.png`.
3. Crie `js/data/fighters-v21.js` (o próximo número) no estilo do `fighters-v20.js`: registra a folha em `SPRITE_LAYOUT`, dá `FIGHTERS.push` com nome em português, 5 poderes (2 `simple`, 2 `charge`, 1 `ultimate`) e `secret: false`. Poder normal não passa de um soco “que ganha sozinho”; deixe o topo para Du, Iales e Felipinho.
4. Inclua o `<script>` **depois** de `fighters-v20.js` e **antes** dos `powers-balance-*`, com `?v=` novo.
5. Se o passe de balance precisar mexer nele, faça no **último** `powers-balance-v*.js` ou num arquivo novo carregado por último — e apague o número velho em vez de empilhar o sexto override.
6. Acrescente o id em `FIGHTER_IDS` nos dois `room-core.js` e rode `npm run sync --prefix online-server` se o script de sync existir; senão copie a lista na mão e não deixe as duas divergirem.
7. Rode `python3 tools/build_roster_portraits.py` para o busto entrar na grade. Se a cabeça ficar fora, ajuste `OVERRIDES` e rode de novo.
8. Suba o `?v=` de `SpriteGen.url` / `Art.url` se a folha mudou, para o selo `build` não mentir.

## Checklist — arena nova

1. JPG (ou folha animada no formato de `sheets.js`: vários quadros, `frameW`/`frameH` explícitos) em `assets/maps/` ou `assets/stages/`.
2. Um objeto no **fim** de `STAGE_LIST`, com `id`, `name`, `group`, `image` ou `sheet`, `weather`, `fauna`, `mech`, `tint`.
3. Se a mecânica for nova, uma chave em `MECHS` (`js/engine/mechanics.js`) com `every` + `fire(g)`, no mesmo tom das que já existem (aviso no chão, dano contido, sem travar o jogo). Reusar `gong`, `spotlight`, `coffee` é melhor do que um sistema paralelo.
4. Flags de ambiente só se o desenho pedir: `petals`, `embers`, `neon`, `glitch`, `fireflies`, `bubbles`, `motes`, `code`.
5. O id tem que passar na validação de arena da sala. Teste a prévia na tela “Escolha a arena” e uma luta curta com o clima forçado e com o clima aleatório.

## Checklist — ambiência nova

1. Decida a camada. Clima afeta todo mundo e pode ser escolhido no `<select>` da arena (`index.html`, `#opt-weather`) e em `WEATHER_INFO` (`stages.js`). Partícula é flag do mapa. Perigo com dano é `mech`.
2. Sprite em `assets/weather/` ou `assets/fx/`, pixel art, fundo transparente. O `Stage` / `Weather` blita essa imagem. Não desenhe o efeito com `fillRect` se já existe folha.
3. Ligue a flag ou o `kind` nos mapas que combinam com ele. Não ligue em todos: a névoa e o glitch foram parciais de propósito.
4. Se houver som, um MP3 curto em `assets/audio/sfx/` e o nome em `SFX_FILES` (`js/engine/audio.js`).
5. `?v=` novo na URL da imagem (`weather.js` ainda está em `v33-weather`).

## Como simplificar daqui pra frente

- **Um arquivo de elenco e um de poderes**, gerados ou editados no fim da cadeia. Os `v10`…`v20` e os `balance-v6`…`v13` ficam como histórico, mas lutador novo não deveria precisar de mais um arquivo só para existir. Enquanto a cadeia continuar, o número do script e a posição no `index.html` são obrigatórios.
- **Um número de versão só.** Edição pública, cache-buster e selo `build` contam histórias diferentes. O próximo passe pode fazer os três lerem a mesma constante.
- **`room-core` único.** A cópia do `online-server` já perdeu três lutadores. Um teste que compare as duas listas pega a próxima.
- **`poseScale` não é pipeline.** Folha nova já nasce na escala do Du/Kage/Mira. O audit (`sprite_audit.py`) é o portão.
- **Retrato da grade só pelo script.** Não voltar a misturar `face-*.png` com a folha inteira na célula de 48 px. O `face-*.png` continua valendo para a HUD.
- **Balance num lugar.** Antes de subir o power de mais um “normal” para 1.50, olhar a tabela do README: o miolo do elenco já está comprimido lá em cima, e o sentido original era secretos fortes e o resto parelho.

## O que não apagar

Fotos que o dono guardou para personagem que ainda não é ficha, mesmo sem nenhum `src` apontando para elas:

- `assets/music/maximilian personagem/` — Maximilian (futuro).
- `assets/maps/anim/emilio-personagem/` e os JPG soltos `assets/maps/emilio normal.jpg`, `assets/maps/emilio transformaçao.jpg` — referência do Emilio, que já entrou.
- `assets/maps/Nunes-personagem/` e `assets/maps/Nunes.jpg` — referência do Nunes, que já entrou.
- `assets/pets/mistral-cat.png` e `assets/pets/MISTRAL-FONTE.md` — fonte do mascote.
- `assets/art-pack/` — pacote de arte à parte, com `LEIA-ME.md` e `manifest.json`. O jogo não carrega `art-pack.js`; o pacote se referencia sozinho.
- `assets/stages/source/*.gif` — fontes dos clássicos animados. A luta usa o PNG de `sheets.js`.
- `assets/fonts/OFL.txt`, `assets/music/FAIXAS.md`, `assets/music/import-report.json` — licença, lista e relatório das faixas.

Apagar isso não diminui o histórico do Git. O tamanho do clone só cai com uma reescrita de história, que este repositório não deve fazer.
