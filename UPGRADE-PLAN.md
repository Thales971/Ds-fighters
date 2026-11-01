# DS Fighters — Expansão Arcade

O pacote retrô da etapa anterior foi enviado ao GitHub no commit `8f3c6b43972e28e90041eabf4de0922cc8a3e052`. A base atual também inclui a atualização recente do proprietário com cinco poderes por lutador e dez cenários animados. A expansão deve preservar essa base, sem substituir o jogo por um protótipo de outro gênero.

## Direção visual e contratos

A estética permanece arcade retrô, inspirada em jogos de luta do início dos anos 1990, com arte e código originais. A tela de seleção, menus, personalização, resgate, salas e HUD passam a HTML/CSS; apenas a arena precisa de uma superfície gráfica. A HUD mostra vida, dano fantasma, rounds, tempo, estado de clima, buffs, cinco habilidades e a tecla abaixo de cada habilidade. Haverá foco visível, suporte a teclado/controle/toque e opção de reduzir flashes e movimento.

Preservar o elenco e os sprites atuais, exceto as mudanças pedidas: remover Senpai; aprimorar DU, IALES e Felipinho/Maprim. Interpretação a confirmar: Felipinho/Maprim é o terceiro personagem resgatável, com poderes de água e React. O código único `Batata` desbloqueia os três juntos. O resgate persiste no perfil local; esse código público não deve ser apresentado como sistema seguro de licenças ou proteção contra cliente modificado.

## Combate e personagens

Todos os lutadores têm exatamente cinco habilidades distintas, com efeitos animados: duas simples, duas de carga e uma ultimate. Golpes básicos continuam separados das cinco habilidades. A interface oferece atalhos diretos além dos comandos de luta atuais, indicando custo, recarga, disponibilidade e descrição.

IALES é o mais forte. Seus ataques usam auto aim; uma habilidade aplica um acerto garantido e rouba temporariamente o conjunto de cinco poderes do adversário. Durante o roubo, a HUD troca para o conjunto roubado, mostra a duração e restaura o kit original ao terminar. Símbolos de IAs aparecem atrás dele durante a conjuração. As habilidades têm temas de código: por exemplo, dragão de fogo de Rust, modelos de IA, compilação, execução e uma ultimate original no estilo de acumular poderes, sem copiar um personagem protegido.

DU usa machado, fúria de guerreiro, magma e PHP. Sua barba fica mais longa e mescla preto e branco. Seu kit é deliberadamente forte, mas abaixo de IALES. Felipinho/Maprim usa água e React, com escudos, ondas e uma ultimate própria, também forte. Os outros lutadores mantêm identidade de desenvolvimento e ganham cinco efeitos visualmente reconhecíveis, não apenas o mesmo círculo com outra cor.

Melhorar hitstop, impacto, câmera, feedback de guarda, combos, recuperação, knockback, clipes de efeitos e transição de rounds. Manter limites de entidades e evitar que loops de som ou efeitos se acumulem.

## Cenários, clima e itens

Integrar os dez mapas do pacote anterior, preservando e aprimorando os dez cenários animados atuais. Criar a Floresta Spring Boot e cenários adicionais coerentes com os temas de tecnologia. Cada mapa oferece uma mecânica própria, com indicação visual, intervalo, efeito real no combate e limites para evitar dano aleatório inevitável.

Sortear clima adequado ao mapa: seco, chuva, vento e tempestade, com mudanças de intensidade e efeitos ambientais. O sorteio e os eventos compartilhados pertencem ao servidor nas partidas online. Adicionar pássaros e abelhas nos cenários apropriados; usar animações em spritesheets. Introduzir power-ups temporários de ataque, defesa, velocidade e energia, com estados explícitos na HUD e expiração.

## Personalização e áudio

Criar menu de mascotes equipáveis, incluindo pinguim do Linux, com buffs reais aplicados uma vez na criação do lutador. Mostrar claramente o benefício de cada mascote e salvar a escolha. Disponibilizar os mascotes em combate sem esconder a silhueta principal.

Criar efeitos sonoros próprios para menus, golpes, bloqueio, habilidades, resgate, pickups, clima, vitória e KO. Música de batalha é escolhida aleatoriamente a partir de uma playlist configurável no repositório. Preparar `assets/audio/music/` e um manifesto para as faixas de rock pesado que o proprietário enviará depois. Não buscar nem incorporar músicas comerciais sem autorização; fornecer trilha original de fallback se aprovada na execução. Música começa após gesto do usuário, possui controle separado de volume e troca/para corretamente ao mudar de tela.

## Modos

Manter Arcade e Versus local. Adicionar treino e modo 2×2, interpretado como equipes de dois lutadores com troca de personagem, controles e condições de vitória explícitos. O online oferece criação e entrada em salas, código de convite, lobby com seleção de modo/equipe/mapa, confirmação de jogadores, estado sincronizado, desconexão e recuperação.

A simulação online deve ter uma autoridade definida para dano, pickups, clima, placares e vitória; validar mensagens, versão de protocolo, associação à sala, frequência e tamanho. Não prometer rollback competitivo ou anticheat de nível comercial. O servidor e as instruções de hospedagem ficam versionados no GitHub, com teste de duas conexões e isolamento entre salas. Não mostrar partidas falsas se o servidor estiver indisponível.

## Estrutura prevista

Manter os módulos do motor em `js/engine/` e os catálogos em `js/data/`. Acrescentar módulos separados para interface DOM, perfil/resgate, mascotes, clima/eventos, integração dos assets e networking. Colocar o servidor e os testes de protocolo em `server/`; ferramentas de geração/organização em `tools/`; sprites, cenários e áudio em `assets/`. Um manifesto conecta efeitos às cinco habilidades de cada personagem.

## Decisão necessária para o online

Nenhum Cloud Computer foi encontrado na conta; estão disponíveis apenas o Sandbox temporário e o desktop do proprietário, que não será utilizado sem escolha explícita. O GitHub armazena o código e pode servir conteúdo estático, mas não mantém um servidor de salas WebSocket executando.

O proprietário precisa escolher entre preparar o servidor para hospedar depois, disponibilizar um Cloud Computer, ou informar uma hospedagem externa. Sem servidor permanente e endereço HTTPS/WSS verificado, o código online pode ser implementado e testado localmente, mas não deve ser declarado publicado ou disponível na internet.
