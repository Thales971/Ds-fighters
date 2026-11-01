# DS Fighters — refinamento da V4

**Objetivo:** aprimorar a base atual do repositório, sem trocar o motor Canvas ou remover conteúdo existente.

**Arquitetura:** conservar HTML/CSS, JavaScript global modular, spritesheets 4 × 15 com células 320 × 260, Firebase opcional, servidor WebSocket e fallback PeerJS. Separar correções de combate, conta/nuvem, salas e integração visual. O plano herdado `UPGRADE-PLAN.md` continua sendo a especificação de base.

## Restrições e direção visual

Manter arcade pixel art, silhuetas legíveis, cores e cenários da base. Urbano corresponde à foto de jaqueta preta e cabelo curto castanho; 1155 corresponde ao homem de boné preto, óculos, barba e camisa estampada, não a um alien verde. Qwen usa cabelo curto lilás/azul e roupa branca, inspirada na referência. Xeon mantém gelo e fogo visivelmente distintos. Animações com poses claras, pivô constante nos pés, sem figuras duplicadas e sem faixas de fundo na arena. Não gerar vídeo, música, 3D ou variantes dispensáveis. Limitar gerações ao que será integrado. Não é possível garantir o contador exato da plataforma; não prometer gasto medido.

## Estrutura e implementação

- `assets/sprites/`, `assets/ui/`: folhas e retratos; `tools/`: normalização e checagem dos frames, sem modificar fotos originais.
- `js/engine/` e `js/data/powers-v4.js`: corrigir status, tremor, gelo/fogo, ultimates e balanceamento; aumentar vida sem multiplicar em duplicidade; reforçar 1155 e IALES.
- `js/net/`, `online-server/`, `js/ui/ui.js`: salas públicas reais, código, disponibilidade, configuração de vida infinita e rounds, resiliência e testes de protocolo.
- `js/core/`, `js/ui/account.js`, `firestore.rules`: preservar offline, sincronizar progresso com isolamento de contas; Firebase real depende de configuração do proprietário.
- `js/engine/stage.js`, `js/data/stages.js`, `assets/maps/`: corrigir carregamento/renderização dos mapas novos; arena adicional inspirada no pátio interior do SESI Valinhos, com referência oficial, sem alegar reconstrução fiel.

## Entregas

Aplicar correções verificadas, executar testes existentes e regressões, testar as poses novas na arena, documentar resultados e bloqueios, enviar commit ao repositório autorizado sem force-push. Servidor local/teste não equivale a online publicado. Não alterar hospedagem externa sem acesso e configuração existentes.
