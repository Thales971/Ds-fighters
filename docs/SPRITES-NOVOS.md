# Como mandar sprites novos

Guia curto para gerar a arte de um lutador e ela entrar no jogo quase sem ajuste.
Pode mandar no formato que já usa (várias folhas com poses, como as de `arte-fonte/`).
O que está aqui só deixa tudo igual entre os lutadores.

## O essencial

- **Fundo liso de uma cor só**, de preferência magenta puro (`#FF00FF`), sem sombra no chão nem cenário.
- **Boneco virado para a direita** em todas as poses.
- **Corpo inteiro** em cada quadro, com os pés aparecendo. Nada cortado na borda.
- **Um boneco por quadro.** Nada de dois personagens colados na mesma célula.
- **Mesmo tamanho do personagem em todas as poses.** O agachado é menor porque está agachado, não porque foi desenhado menor.
- **Mesmo estilo dos lutadores mais novos** (Jester, Domador, Kuno, Stella, Lyra, Urbano, Lobão): pixel art detalhada, contorno escuro, sombreado de 2 ou 3 tons.

## As 15 poses (4 quadros cada, se der)

| Pose | O que mostrar |
|---|---|
| parado | guarda de luta, respirando (4 quadros quase iguais, mexendo pouco) |
| andando | ciclo de passada |
| pulo | encolhido no ar |
| agachado | agachado de guarda |
| soco | preparar, soco esticado, voltar |
| chute | chute em pé |
| soco agachado | soco baixo, ainda agachado |
| chute agachado | rasteira ou chute baixo, ainda agachado |
| soco no ar | soco durante o pulo |
| chute no ar | voadora |
| especial | o golpe especial do personagem (pode ter efeito na mão) |
| levando golpe | recuando de dor, **ainda em pé** |
| bloqueio | braços fechados na frente, **do tamanho normal** |
| KO | **caído deitado no chão**, com o comprimento aproximado da altura dele em pé |
| vitória | comemorando, em pé |

Se só der para fazer menos, as que mais fazem falta são: **parado, andando, soco, chute, levando golpe, KO deitado e vitória**.

## Erros que já apareceram e quebram o jogo

- KO em pé (o jogo precisa tombar o boneco girando).
- "Levando golpe" com o boneco já deitado.
- Bloqueio desenhado minúsculo.
- Agachado que na verdade é um chute em pé.
- Comemoração deitada.
- Folhas com o personagem de outra roupa ou outro traço misturadas com as normais.

## Habilidades (opcional)

Uma folha com os efeitos dos 5 poderes (bola de fogo, raio, explosão…) **sem o personagem**, só o efeito, em fundo liso.
Se tiver 4 quadros de cada efeito, o efeito anima. Se tiver 1, o jogo anima girando e pulsando.

## Depois que mandar

Coloque as folhas em `arte-fonte/personagens/` (ou mande no chat).
O `tools/integrate_fighter.py` recorta, alinha os pés, nivela o tamanho e gera a folha do jogo.
