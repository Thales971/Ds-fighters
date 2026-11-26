# Hotfix — skins adiadas, pets, IALES e Lobão

## Corrigido

- **Skins desativadas:** menu e tela mostram **EM BREVE**, sem seletor ou salvamento. Paletas antigas permanecem no perfil, mas não são aplicadas no combate.
- **Pets:** escala correta do atlas na seleção; cinco conjuntos novos de quatro fases para Mistral, Slime, Dragão, Fênix e Robô. Os oito pets clássicos foram preservados pixel a pixel. Nenhum ID salvo foi removido.
- **Partidas/replays:** partida normal deixa de usar comandos do replay anterior; cada partida inicia o relógio corretamente. Gravação captura os inputs da equipe certa uma única vez por quadro e não grava replays nem pausas.
- **IALES:** o agarrão usa a rotina de investida existente e termina ao acertar ou errar. O roubo remoto tem alcance, aviso de impacto e bloqueio; sair do alcance impede a cópia. Ambos respeitam defesa e esquiva. Cópia limitada às cinco habilidades principais, evitando extras recursivos. Ícones dos roubos e da segunda ultimate separados; efeito gigante retirado do agarrão.
- **Lobão:** cinco linhas de ícones refeitas, com cadeira vermelha e emblema de escudo; retrato humano reenquadrado e caminhos de sprite atualizados. Escudo e esquiva da ultimate preservados. BHM não foi rebalanceado nesta etapa.
- **Cache:** scripts, CSS e imagens alteradas têm versão nos endereços; arquivos estáticos passam a revalidar. Isso impede que os mesmos caminhos continuem exibindo arte antiga por dias.

## Evidência

13 casos Chromium passaram: skins, luta normal, saída de replay, relógio de replay, roubo remoto com acerto/bloqueio/alcance, agarrão com acerto/bloqueio/erro, AFO2, todos os pets e 133 poderes. Sem exceções JavaScript. Passaram também 16 grupos de regressões de combate, teste focado Lobão/BHM, perfil e 38 verificações do protocolo.

Teste: `python3 tools/hotfix_smoke.py`. Prévia opcional: `--preview /tmp/jogo.jpg`. Os testes anteriores de layout mobile e P2P completo não foram repetidos nesta etapa curta.

Replays antigos gravados com inputs incorretos não podem ser reconstruídos retroativamente; a correção vale para novas gravações e para sair de replay sem prender os controles.

## Publicação

A correção deve estar no repositório e na versão realmente servida. Um push sozinho não comprova publicação: conferir `index.html` e `js/core/profile.js?v=hotfix450-skins-off` na URL do jogo. Google permanece adiado e servidor WSS permanente continua uma pendência externa, não alterada neste hotfix.

Verificado em 01/11/2026 após o commit `7ef28aa`: a publicação `https://online-server-one.vercel.app/` retornou HTTP 200 com a tela **SKINS — EM BREVE**, scripts versionados e `SKINS_ENABLED: false`. O SHA-256 de `assets/abilities/lobao.png` publicado é idêntico ao arquivo local. Portanto, essa versão não foi confirmada apenas pelo push.

Os 13 casos de `hotfix_smoke.py` foram repetidos diretamente nessa URL publicada, incluindo defesa/alcance dos roubos, saída de replay, relógio, todos os pets e 133 poderes. Todos passaram, sem exceções JavaScript. Captura gerada a partir da própria publicação.
