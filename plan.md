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

## Continuação — SENAI Valinhos, Qwen e Supabase

Manter as duas arenas SESI existentes sem modificar suas artes. Adicionar uma arena separada `senai-valinhos`, inspirada nas três fotografias enviadas: oficina industrial ampla, teto metálico, fileiras de tornos e bancadas azuis/creme, painéis elétricos e motores. Uma única arte nova, folha animada de 24 quadros com luz moderada e piso firme; integrar ao catálogo/seleção e aproveitar a mecânica elétrica existente.

Qwen deve ocupar a terceira posição no ranking permanente de poder do elenco, sem empates nem alteração arbitrária das duas posições superiores. Manter cinco habilidades, transformação Astra e desbloqueio por Batata. Registrar o critério e testá-lo; ranking projetado não significa vitória garantida em toda partida.

O conector Supabase foi consultado: único projeto visível `supabase-aero-ball`, inativo. Não reativar ou gravar nesse projeto antes de esclarecer sua autorização, pois pode ter dados de outro jogo. Uma integração de progresso deve reutilizar o isolamento por UID, oferecer Google pelo Supabase Auth, manter fallback offline e aplicar RLS em tabelas exclusivas; depende da escolha/ativação do projeto e da configuração OAuth Google. Nenhuma chave de serviço pode entrar no frontend.

## Supabase autorizado — 01/11/2026

O proprietário autorizou explicitamente reativar e compartilhar `supabase-aero-ball` (`ownxbuailthavxgfxtem`). A reativação foi aceita. Criar somente `public.ds_fighters_profiles` com UID proprietário, JSON de progresso, nome/avatar e timestamps; RLS SELECT/INSERT/UPDATE pelo próprio `auth.uid()`, sem acesso anônimo. Não alterar tabelas/dados/políticas do Aero Ball, não mudar Site URL global, não criar usuários reais ou credenciais fictícias para testes.

Integrar um provedor Supabase preferencial por arquivo separado sobre o contrato existente `Cloud`, preservando o fallback Firebase/offline e a mesclagem/isolamento de contas. SDK local em versão fixa, sessão de autenticação com chave exclusiva e IDs locais separados por provedor/projeto. Usar Google OAuth com PKCE, callbacks fora do lock de `onAuthStateChange`, autosave e erros claros. Testar merge, sessões, rede offline e RLS. Se Google não estiver habilitado ou não houver acesso ao painel, completar banco/cliente e solicitar somente a configuração OAuth restante ao proprietário.

## Expansão V5 — lutas longas, THL, Dolynho e arenas

Pedido de 01/11/2026: executar sem perguntas. Manter a base Canvas/online/Supabase e Google adiado. Vida global passa de 1,12 para **2,00 vezes a vida-base**, aplicada apenas uma vez; tempo padrão passa de 99 para **180 segundos**, com personalizados/online até **300 segundos**. A ordem permanente mantém IALES, Felipinho e Qwen como top 3; THL será um dos mais fortes e o normal com maior poder permanente, abaixo da Qwen. Usar testes de kits, dano, controles e uma rodada de simulação para corrigir outliers, sem prometer igualdade absoluta de matchups.

**Dolynho**: normal/liberado, garrafinha verde de guaraná, olhos grandes, tampa branca, luvas brancas e tênis vermelhos; estilo mascote fiel à referência pública. Kit de controle com jatos, bolhas, rasteira borbulhante e ultimate de amizade; stun forte mas com limite/retorno contra repetição para não travar uma luta inteira.

**THL**: normal/liberado, identidade facial da foto enviada (cabelo curto preto, sobrancelhas grossas, barba curta, rosto largo), vigilante tático inspirado no justiceiro, roupa preta/cinza com proteção/colete e emblema original claro. Kit de debuffs usando vulnerabilidade, lentidão, sangramento e bloqueio temporário de poderes; alto poder, mas não ultrapassar Qwen no ranking permanente. Foto apenas como referência, não como avatar fotográfico.

Arte: quatro blocos transparentes (4 × 8 e 4 × 7 por lutador), normalizados em folhas 4 × 15 de 320 × 260, retratos derivados e efeitos reaproveitados do jogo. Dois cenários originais animados: **Jardim do Sol Nascente**, vila/templo japonês com ponte, lanternas e cerejeiras, e **Distrito Neon 2077**, cidade cyberpunk noturna densa com letreiros, cabos, chuva e luzes ciano/magenta. Não copiar mapas existentes de jogos comerciais; manter piso livre e aparência arcade. Preservar todas as arenas existentes.

Áudio: músicas aleatórias sem repetição consecutiva, volume de fundo moderado e redução temporária enquanto o narrador fala. No momento só foi anexada a foto THL, **nenhuma faixa de música**; não inventar que arquivos foram recebidos nem gerar músicas substitutas. Preparar ferramenta de importação para faixas enviadas, conservar fallback original e testar volumes/randomização.

Divisão: código de personagens/balanceamento em `js/data/powers-v5.js` + `fighter.js`; áudio em `audio.js` e defaults de perfil; integração de arte, tempo, UI, protocolo, mapa e testes de ponta a ponta pela tarefa principal. Não delegar alterações de Git nem imagens pagas; somente o agente principal gera a arte.

**Atualização de anexos:** às 10:38–10:39 o proprietário enviou os vídeos das músicas e fotos adicionais do rosto. Usar a foto grande já fornecida para a identidade do THL; as novas imagens pequenas são complementares, sem refazer arte consistente. Extrair somente o áudio de todos os MP4 recebidos, normalizar loudness/true peak e codificar MP3 compacto com títulos de faixa, preservando vídeos originais. Registrar o lote em `assets/music/playlist.json` e relatório de duração/tamanho; a ausência inicial de música foi resolvida. Conversão em script único com concorrência limitada, não pesquisas por música.

## Correção mobile e verificação de serviços — 01/11/2026

Preservar Canvas 960×540 e desktop; separar menus responsivos, palco proporcional e controles de toque em tamanho físico útil. Adaptar retrato/paisagem, viewport visual/teclado e safe areas, sem cortar formulários. Viewport em js/main.js; estilos mobile dedicados; markup/input/UI existentes para navegação por toque e todas as habilidades.

Online: verificar criação/entrada, protocolo, P2P público e WSS local; distinguir diretório que ainda exige WSS permanente. Conta: Google segue adiado; verificar Supabase e permitir email se o provedor já está habilitado, sem mexer em settings compartilhados ou criar usuários fictícios. Preservar RLS e isolamento de progresso. Divisão: pai cuida do mobile, um agente de conta, outro de online; testes e commits pelo pai.
