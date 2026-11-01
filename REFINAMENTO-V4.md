# DS Fighters — refinamento da V4

## O que mudou

Urbano, ET 1155 e Qwen receberam novas folhas transparentes com 60 quadros cada, retratos e ícones coerentes. Os recortes usam componentes inteiros da imagem, não uma grade de altura presumida; isso evita pernas soltas, cabeças cortadas e invasão de poses vizinhas. As folhas refinadas usam quatro fases nas animações, mantendo o timing legado para o restante do elenco. A linha de agachar ausente no mestre do Urbano foi preenchida com a guarda agachada da própria sequência de soco, sem reaproveitar o personagem antigo.

Xeon recebeu uma folha nova com gelo e fogo separados e explosão térmica. O dash aplica queimadura, a muralha de fogo mantém seu efeito na zona e o bônus térmico exige que o alvo já tenha sido preparado. Urbano prende brevemente e arremessa com o soco sísmico; bloquear o primeiro tremor não arma um segundo golpe inevitável. A segunda ultimate do IALES mantém o contrato da tecla 6 e os quatro acúmulos, com dano crescente; o estoque só é consumido se houver acerto válido. O 1155 ganhou dano no chip e uma recarga menor na investida. Todos os lutadores recebem +12% de vida uma única vez na criação.

O pátio SESI Valinhos complementa a quadra já existente. É uma homenagem artística baseada em referências públicas do interior, não uma reconstrução exata. Kotlin, Kali, JVM, Cidade Cromada e quadra SESI ganharam folhas animadas com maior resolução e efeitos menos agressivos. O piso cromado não ondula como água. Referências visuais estão em [assets/REFINAMENTO-V4.md](assets/REFINAMENTO-V4.md).

## Personalizado

O menu **PERSONALIZADO** permite escolher CPU ou jogador 2 local, tempo de round, vida infinita, medidores infinitos e até nove vitórias. Com vida infinita, golpes/status não causam KO; no fim do tempo ganha quem causar mais dano naquele round. Os acúmulos/ataques e animações continuam funcionando. Partidas de nove vitórias podem chegar a 17 rounds; a antiga interrupção fixa no quinto round foi removida. A HUD mostra `∞` na vida.

## Online

O servidor dedicado publica um diretório vivo de salas reais. É possível entrar pela lista ou pelo código; o anfitrião define rounds, tempo, vida infinita e medidores, e as regras chegam ao motor de ambos os lados. Entradas e snapshots atrasados são descartados. Reconexões preservam a vaga pelo período de tolerância, há heartbeat e os callbacks de conexões antigas não assumem uma nova sessão.

**Não foi hospedado um servidor permanente nesta tarefa.** A lista pública exige que um servidor dedicado esteja rodando e que os jogadores usem o mesmo endereço. P2P continua sendo uma alternativa por convite, sem diretório público global. Os testes online abaixo usam um servidor local temporário, não são prova de conectividade entre redes externas. Siga [HOSPEDAGEM.md](HOSPEDAGEM.md) para publicar um serviço HTTPS/WSS.

## Google e progresso

O perfil anônimo e os perfis autenticados têm snapshots locais separados por UID. Respostas e uploads obsoletos são rejeitados após troca de conta; o logout tenta descarregar a fila pendente e as preferências de dispositivo ficam locais. Desbloqueios e estatísticas são normalizados. `Batata` continua liberando DU, IALES, Felipinho e Qwen. As regras Firestore restringem leitura/gravação ao dono e validam o formato dos dados.

**`js/config/firebase-config.js` continua sem configuração real.** A implementação foi testada offline e com Firebase simulado, mas não houve login Google real ou publicação de regras em um projeto Firebase. Para ativar, configure o projeto público, habilite Google Auth, autorize o domínio e publique `firestore.rules` conforme [FIREBASE.md](FIREBASE.md). Não é necessário fornecer chave privada de serviço para o frontend.

## Verificação reproduzível

```bash
node tools/combat_regressions.mjs
node tools/profile_cloud_test.js
python3 tools/cloud_check.py
npm run sync --prefix online-server
npm test --prefix online-server
python3 tools/online_e2e.py ws 2
python3 tools/online_e2e.py ws 4
# Com a raiz servida em http://localhost:8099:
python3 tools/visual_refinement_check.py
```

Foram verificados os dez grupos de combate, isolamento/troca de contas, Firebase simulado e modo sem configuração, o protocolo do servidor, partidas Chromium de dois e quatro jogadores (movimento remoto, troca, chat, snapshots e resultado), os assets, renderização de quatro cenas e as regras personalizadas no motor. O teste visual também verifica fallback de cenário, redução de movimento e ausência de erro JavaScript. Os verificadores procuram Chromium do sistema quando não existe cache do Playwright.

As fotografias pessoais originais e os mestres de geração não foram adicionados ao Git. Não foi executado um torneio completo de balanceamento nesta etapa; o balanceamento antigo permanece como histórico, não como resultado desta versão.

## Correções da revisão final

A retomada do socket na mesma sala preserva a instância da simulação, o round e o placar do anfitrião; não chama `Game.start` novamente. Sequências de entrada são reiniciadas corretamente em uma nova partida/reassociação e mensagens de sockets antigos são ignoradas. O teste online derruba de fato a conexão do anfitrião e verifica a preservação do estado em duas e quatro pessoas.

**Limite importante:** recarregar/fechar a página do anfitrião destrói a simulação autoritativa, incluindo entidades e conjurações em andamento. Esse caso cancela a sala com mensagem explícita em vez de fingir uma restauração ou reiniciar o placar silenciosamente. Não há migração de autoridade entre jogadores nesta atualização.

O dano bloqueado e os efeitos contínuos aplicados por personagens/zonas agora têm autoria e contam na pontuação de vida infinita. Dano ambiental e superaquecimento próprio não são atribuídos ao adversário. A suíte de combate passou a dez grupos de regressão.
