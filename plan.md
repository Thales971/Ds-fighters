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

## Correção focada — Lobão / revisão Mistral

Orçamento informado ~500 créditos: substituir somente sprite e retratos do Lobão por lutador humano de cabelo curto escuro, roupa verde/branca, gola de pele e cadeira; fotos para identidade e Beowulf para wrestling/silhueta, sem face de lobisomem. Reutilizar montagem, poses e motor; um lote de dois blocos. Corrigir apenas regressões recentes de combate e alcance/contrajogo da aura e cadeiras; preservar BHM original quando não houver regressão comprovada. Não recriar mapas, música, contas ou mobile.

## Hotfix de regressões — limite informado 450 créditos

Priorizar travamentos reais do combate e compatibilidade de skins/pets, corrigir o segundo roubo IALES e reconectar os visuais de Lobão. Reutilizar arte válida existente e o sprite humano já gerado; sem novo lote de imagens/mapas, torneio amplo ou alterações de conta. Testar caminhos afetados num único smoke de navegador, preservar mudanças não relacionadas e tratar cache/publicação separadamente do GitHub.

## Decisão do proprietário — skins adiadas

Desativar o recurso de skins na navegação, aplicação em combate e salvamento, mostrar “SKINS — EM BREVE” e preservar os dados antigos para uma implementação futura. Concentrar o hotfix em pets (enquadramento/transparência e efeitos), controles presos a replay, segundo roubo IALES, retratos/arte Lobão e atualização da versão publicada. Reaproveitar arte existente antes de considerar gerações pagas.

A inspeção confirmou que os oito pets clássicos são idênticos à versão anterior: o menu os espremia na altura errada. As cinco linhas novas e os ícones Lobão apresentam blocos/desenhos defeituosos. Substituir somente esses dois conjuntos por um lote econômico de duas folhas transparentes, preservando os oito clássicos e as mecânicas. Não refazer mapas nem todos os sprites humanos.

## Continuação — excluir replay e estabilizar o loop real

Remover toda a funcionalidade de replay conforme o pedido, inclusive gravação e gravação em localStorage, mas preservar perfil e dados não relacionados. Investigar o caminho real menu → seleção → VS → luta com CPU e em iframe, não apenas a simulação chamada manualmente. Verificar permissões de gamepad e sobrecarga de carregamento. Disponibilizar claramente o pet Mistral existente sem duplicar IDs; aumentar pouco o ganho da música com ducking mantido. Refinar os dez clássicos com tratamento comum da arte existente/renderer, sem criar dez conjuntos novos nem pesquisa por cenário.


## Expansão V7 — quatro lutadores e três arenas

**Objetivo:** acrescentar as quatro personagens pedidas e três mapas selecionáveis, mantendo o motor Canvas, as salas online e os arquivos existentes.

**Arquitetura:** adicionar kits em `js/data/powers-v7.js`, os quatro dados a `FIGHTERS`, os novos IDs ao protocolo autoritativo online e o código de Winx ao perfil. Implementar o status temporário `glitch` no mesmo fluxo de `addStatus`/`applyEffects`, com interrupções curtas determinísticas, deslocamento de velocidade modesto e feedback de scanlines; não congelar a simulação nem permitir controle permanentemente bloqueado. Estender `SPRITE_LAYOUT.perFighter` com mapeamento de linhas para sheets 4×8, preservando o 4×15 dos lutadores antigos; produzir faces/retratos do idle. Criar fundos estáticos e deixar `tools/animate-maps.py` produzir os loops de 24 quadros.

**Direção visual:** reutilizar o arcade pixel art existente: silhueta íntegra, paletas contrastantes, piso estável na linha inferior, quatro quadros por estado, pivô no pé, sem texto ilegível ou logotipos copiados. Winx.EXE é uma personagem original com linguagem visual de desktop/sistema operacional, não uma personagem licenciada; Kimi tem cabelo verde-água; DeepSeek será uma combatente anime aquática com cauda/fluke de baleia; Dandara Query é uma adulta do interior do RJ, de dreads e roupa de trabalho contemporânea, sem caricaturar a origem rural.

**Conteúdo:** Winx.EXE secreta por código `WINX` (ou `WINX.EXE`), poder permanente equivalente a Du (1,38) e ataques de interferência; Kimi, DeepSeek e Dandara Query são normais sem código, com kits próprios e força moderada. Como apenas um tema de mapa foi especificado, os dois adicionais serão **Abismo das Baleias** (mar profundo) e **Vale do Cache** (interior serrano do RJ com sítio/estação de dados); o terceiro é **Área de Trabalho** com desktop Windows-inspired, sem copiar logotipo.

**Arquivos:** sprites em `assets/sprites/`, retratos em `assets/ui/`, folhas animadas em `assets/maps/anim/`; manifest em `assets/sprites/layout.js` e `assets/maps/anim.js`; dados em `js/data/fighters.js`, `js/data/powers-v7.js`, `js/data/stages.js`, `js/core/profile.js`; mecânica em `js/engine/fighter.js` e `js/engine/sprites.js`; seleção em `js/ui/ui.js`; sincronização em `js/net/room-core.js` e `online-server/room-core.js`; testes determinísticos e smoke de navegador em `tools/`.

**Restrições:** manter intacto o conteúdo existente; V7 acrescenta exatamente quatro personagens e três arenas, totalizando 30 lutadores e 45 arenas no aplicativo verificado. IDs únicos; Winx permanece acessível por código próprio, enquanto Kimi, DeepSeek e Dandara continuam livres; allowlist igual no cliente e servidor online. Usar uma rodada limitada de arte (quatro folhas transparentes e três fundos) e não gerar variações se a integração passar. Executar regressões focadas de ranking, resgate, status, recortes/animações, seleção, arena e protocolo.


## Correção da Winx e expansão V8 — 01/11/2026

**Objetivo:** corrigir as animações e os ataques da Winx.EXE, acrescentar uma lutadora original com mecha e uma arena pós-apocalipse digital, preservando as versões e lutadores anteriores.

**Arquitetura:** o defeito do V7 é confirmado pelo contrato atual: a Winx e mais três lutadores dividem 8 linhas entre 15 poses, e seu atlas de cinco habilidades aponta para ícones genéricos. Trocar apenas a Winx por uma folha própria 4×15 de células 320×260 com quadro de idle/ataque distinto por estado, e acrescentar um atlas 4×5 exclusivo, ligado tanto à HUD quanto a impactos/projéteis reais. Criar `Nina Vector` como lutadora normal, com folhas próprias 4×15 para piloto/mecha e cinco ataques, e inserir `pós-codigocalipse` como arena animada de 24 quadros. As outras três folhas V7 continuam no formato 4×8 já suportado.

**Direção visual:** manter arcade pixel-art coerente com o DS Fighters. Winx preserva cabelo azul, traje marinho e motivos abstratos de janelas/pixels, com efeitos autorais ciano e magenta, sem ícones de IA nem logotipo Windows. Nina é uma piloto adulta original de cabelo curto e óculos redondos; o companheiro mecha é um guardião biomecânico angular com silhueta, cores e detalhes próprios. A referência é o gênero de anime mecha/piloto, sem copiar designs, nomes, emblemas ou paleta-identidade específicos de franquias. A arena pós-codigocalipse mistura ruínas de infraestrutura digital, terminais quebrados e natureza retomando a cidade; piso de luta livre e sem texto legível.

**Integração:** `js/data/powers-v8.js` acrescenta Nina sem código e atualiza apenas os efeitos visuais da Winx; `assets/sprites/layout.js`, `js/engine/sprites.js`, `js/ui/ui.js` e `css/style.css` dão à Winx/Nina 15 poses completas; `js/engine/fx.js`, `game.js` e `projectile.js` carregam/renderizam o atlas exclusivo da Winx; `js/data/stages.js` e `tools/animate-maps.py` registram o mapa; allowlists de `js/net/room-core.js` e `online-server/room-core.js` aceitam Nina. Manter Winx secreta pelo seu código, demais códigos e unlocks intactos, e Nina disponível sem código. Totais esperados: 31 lutadores e 46 arenas.


## Correção de ataques compartilhados — Kimi, DeepSeek e Dandara Query

As três personagens V7 apontavam os ícones/impactos para sheets genéricas de água, gelo e plataformas. Reaproveitar o contrato V8 `visualSheet` e adicionar um atlas próprio 4×5 para cada personagem; cada uma das cinco habilidades ocupa sua linha/loop próprio no HUD, no impacto e nos projéteis/zonas, inclusive nos snapshots online. Atualizar o efeito básico para a folha própria de cada uma. Kimi passa a ser explicitamente elétrica (nomes, projétil em raio, cor, som e status de choque breve). Preservar identidade, desbloqueios, stats e categorias de DeepSeek/Dandara; usar efeitos abissais de baleia e consulta/banco de dados, respectivamente. Limitar a alteração a esses kits, registros dos atlas e testes.


## Expansão V10 — Gemini, Meta, status e climas

**Objetivo:** adicionar Gemini e Meta como lutadoras normais de força média equivalente ao ET 1155, cada uma com cinco habilidades e efeitos visuais próprios, além de novos status e climas.

**Arquitetura:** manter os dados modulares: `js/data/fighters-v10.js` acrescenta lutadoras e registra as spritesheets 4×8 em `SPRITE_LAYOUT`; `js/data/powers-v10.js`, carregado após V9, define os kits 4×5 e os especiais/ultimates; `js/engine/fx.js` registra cada atlas em `abil:` e `fx2:`. O empacotador V10 converte grades transparentes 4×8 e 4×5 para o tamanho esperado pelo Canvas, gerando spritesheets, faces/retratos e atlas de efeitos. Atualizar seleção, cache, allowlists client/server e extensões de teste sem reescrever os dados legados.

**Direção visual:** manter o arcade pixel-art do DS Fighters. Gemini é uma combatente adulta original de tema dual/espelhado, em roxo e ciano; Meta é uma mulher adulta de aparência anime kawaii, cabelo azul-claro longo, óculos redondos cianos, presilhas de estrela e roupa preta/branca com acentos azuis, usando a imagem anexada apenas como referência visual. Os efeitos de Gemini usam órbitas/prismas e os de Meta usam brilhos, laços e formas de comunidade; sem texto, logotipos ou reprodução literal de marcas.

**Mecânicas:** igualar ambos aos atributos de `stack` (power 1.35, speed 1.20, weight 0.96, hp 122 e meterRate 1.15), sem códigos ou alteração de unlocks existentes. Adicionar `resonance`, uma marca consumida no primeiro acerto não bloqueado e expirada em até 150 frames, que aumenta esse único dano em 15%; e `veil`, buff de até 150 frames que reduz dano recebido em 10%. Nenhum novo status interfere nos controles. Acrescentar `aurora` (medidor +8% para todos) e `heatwave` (fogo/magma +8%, água/gelo −5%), com identidade visual, descrição, opção no seletor e inclusão em pools de arenas tematicamente adequadas.

**Arquivos:** dados em `js/data/fighters-v10.js`, `js/data/powers-v10.js`, `js/data/stages.js`; arte em `assets/sprites/`, `assets/ui/` e `assets/abilities/`; desenho de sprites/atlas em `js/engine/sprites.js`, `js/engine/fx.js`, `js/engine/fighter.js`, `js/engine/weather.js` e `js/ui/ui.js`; integração em `index.html`, `js/net/room-core.js` e `online-server/room-core.js`; regressões unitárias e de navegador em `tools/`.

**Restrições:** duas novas personagens e quatro imagens geradas em uma única rodada; cinco linhas exclusivas por kit; manter o restante do elenco, golpes, arenas e protocolo; os dois climas devem continuar justos para ambos os lados e respeitar movimento reduzido.

**Hardening da revisão:** reaplicações de Resonância/Véu não podem estender a janela ativa além de 150 frames; Onda de Calor deve modificar também ticks de zonas persistentes; rostos V10 usam o mesmo cache-bust na seleção, HUD e lobby.
