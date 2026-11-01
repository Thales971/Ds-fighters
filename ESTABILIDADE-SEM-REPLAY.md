# Estabilidade — replay removido, gato Mistral e clássicos

## Travamento reproduzido e corrigido

O teste do loop real reproduziu um caso que os testes anteriores de Game.tick manual não capturavam: em iframe com permissão de gamepad bloqueada, navigator.getGamepads lançava SecurityError. Como o próximo requestAnimationFrame era agendado só depois do processamento, a exceção encerrava toda a animação. A luta ficava em intro, tempo 0 e HP imóvel.

A leitura de gamepad agora tolera API indisponível e conserva teclado/toque. O próximo frame é agendado antes do processamento, para uma falha isolada não matar o loop inteiro. O preload usa os mesmos URLs dos renderizadores para não duplicar versões dos arquivos.

## Replay excluído

Removidos menu, tela, handlers, leitura de comandos gravados, gravação por quadro, geração de semente e escrita em localStorage. Não foi apenas ocultado o botão. Dados do perfil e progressos não foram apagados; registros antigos não são mais lidos. Reprodução de efeitos dos snapshots online continua funcionando por applyNetworkFx, sem recurso de replay de partida.

## Gato e música

O pet mistral foi atualizado com quatro quadros do gato pixelado oficial de Le Chat, incluindo coleira laranja. ID, bônus e os outros doze pets foram preservados. Fonte em assets/pets/MISTRAL-FONTE.md. Sem geração paga nova.

Ganho do fundo musical passou de 0,6 para 0,7; volume escolhido nas opções e mute são respeitados. Durante a fala, a música continua reduzida a um quarto do ganho normal.

## Dez clássicos

Os dez fundos originais, Centro de Dados até Arena Git, foram reempacotados a partir dos masters existentes: 24 frames de 768×432, enquadramento integral sem cortar a cena e piso estável. As folhas ficaram menores que as anteriores. Miniaturas usam os JPGs, sem carregar a folha inteira na seleção; overlay de cor, sombra do piso e vinheta ficaram mais leves. Mecânicas e mapas 11+ preservados.

Isso é refinamento da arte existente, não dez cenários inventados. O preenchimento das laterais usa pixels das próprias bordas do master para preservar a proporção/conteúdo; pode ser percebido nas bordas.

## Verificação

python3 tools/live_loop_check.py exercita VS → início real da luta, CPU, RAF, iframe sem gamepad, viewport mobile, pausa/retorno e falha isolada de frame. Não chama Game.tick manualmente.

python3 tools/hotfix_smoke.py mantém os contratos de combate, pets, IALES, skins EM BREVE e ausência de replay. Os testes Node de mixer, combate e perfil verificam os caminhos associados. A publicação deve ser confirmada por conteúdo/execução, e não só pelo push.

Resultados locais confirmados: quatro cenários de loop real passaram, cada um observado por dez segundos (janela, iframe sem gamepad, mobile e recuperação de uma exceção deliberada de um único frame). A CPU atacou e alterou HP; pausa/retorno passou nos quatro. Nenhuma exceção inesperada. Passaram também 12 casos de hotfix com todos os 133 poderes, 16 grupos de combate, mixer e perfil. As dez folhas tiveram dimensões/metadata verificados. Testes finitos não garantem ausência de todo erro possível em qualquer aparelho.
