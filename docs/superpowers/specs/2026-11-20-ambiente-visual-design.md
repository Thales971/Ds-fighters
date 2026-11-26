# Ambiente visual: enfeites, torcida, maré e aurora

Data: 20/11/2026 — design curto, aprovado na conversa com o dono.

## Por quê
Parte do ambiente das arenas parece genérica ou estranha perto da chuva e dos
vagalumes (referência de qualidade do dono). O objetivo é que o cenário pareça
desenhado para cada mapa, não colado por cima.

## Escopo (decidido pelo dono)
1. **Enfeites genéricos — remover todos.** A sheet `assets/fx/stage-props.png`
   (poste com luz, placa, bonequinhos, letreiro, poste, caixote, janela, bandeira)
   deixa de ser desenhada em todas as 94 arenas, inclusive as que listam `props:`
   no `stages-v21.js`. Somem junto o halo de luz dos postes (`buildLights`) e a
   queda de enfeite no golpe forte. Luzes declaradas em `def.lights` continuam.
2. **Torcida — encaixar nos mapas certos.** Mesma sheet `assets/fauna/torcida.png`
   (25 pessoas do dono, 256×200 cada). Cada uma das 7 arenas com `torcida: true`
   (sesi, sesi-patio, circo, estacao-valinhos, quadra-areia, arquibancada,
   terminal-onibus) ganha posição própria (fileiras com y/escala/faixa x) onde o
   desenho do mapa tem arquibancada/calçada. Pessoas menores que os lutadores, usando
   as 25, sem cortar cabeça. Pulo na empolgação continua.
3. **Maré — recortar direito.** As imagens do dono
   (`arte-fonte/pitoco-pet/mare-alta-nova-sprites-recortar/*.jpg`) são quadros de animação
   (onda cresce → quebra → some), não faixas contínuas. Refazer
   `tools/build_mare_atlas.py` para recortar quadro a quadro (sem as divisórias
   que hoje viram riscos verticais) e gerar um atlas novo em `assets/fx/mare.png`.
   Desenho: faixa de água calma baixa e fina no nível do chão (lado a lado, sem
   emenda visível) + onda animada atravessando no sentido do empurrão. Mecânica
   (empurrão, maré permanente com peixe) inalterada.
4. **Aurora — refazer em pixel art (opção A).** Sai a versão vetorial atual
   (`weather.js`, desenhada na frente dos lutadores com `lighter`, estoura em branco).
   Nova: céu escurecido na faixa de cima + cortinas desenhadas num canvas de baixa
   resolução e ampliadas sem suavização (cara de pixel art, como chuva/vagalumes),
   desenhadas **atrás** da torcida e dos lutadores. Estrelas piscando mantidas.
   Bônus de jogo (+8% medidor) inalterado. Respeita `perfScale`/`perfOff` e
   movimento reduzido.

## Fora do escopo
Arco-íris (fica como está), fauna/flora/luz em geral, outros climas.

## Abordagens consideradas
- Aurora A (pixel art em baixa resolução, atrás) — **escolhida**: combina com o jogo
  e é mais leve no celular.
- Aurora B (corrigir a vetorial suave) — descartada: continua destoando da pixel art.
- Enfeites redesenhados — descartado pelo dono: remover é melhor que redesenhar.

## Restrições
JS puro sem build; canvas 960×540, `GROUND_Y = 458`; não piorar o fps (watchdog
de performance); bateria de testes `tools/*_test.cjs` sem regressão — testes que
checam enfeites/aurora/maré antigos são atualizados para o comportamento novo.

## Verificação
Prints reais no navegador (Playwright) das 7 arenas de torcida, Represa/Parque do
Lago com maré e 2–3 arenas com aurora (dia e noite), antes/depois.

## Decisões do construtor (calls meus)
Posições exatas da torcida por arena, paleta/forma das cortinas da aurora, altura
da faixa de água e ritmo da animação da onda — ajustados olhando os prints.
