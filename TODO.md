# DS Fighters — refinamento V4

- [x] Sprites e animações: Urbano de jaqueta preta e 1155 de boné/óculos/camisa estampada conforme fotos; Qwen lilás/azul e roupa branca; efeitos de Xeon distintos. Figuras inteiras, folhas integradas, retratos e quatro fases por pose nos três refinados. Transparência e 60 células verificadas por folha.
- [x] Combate: +12% vida global uma única vez; reforço do 1155 e preservação da força/segunda ultimate do IALES; soco Urbano trava e arremessa sem punir bloqueio com segundo golpe inevitável; Xeon gelo/fogo e bônus térmico preparado; Qwen por Batata. Dez grupos de regressão passaram.
- [x] Personalizados e online (implementação): tela local personalizada, vida infinita sem KO, pontuação incluindo bloqueio e DOT, medidores infinitos e até nove vitórias/17 rounds. Diretório de salas reais no servidor dedicado, entrada por código/lista, regras autoritativas, snapshots/inputs ordenados e reconexão sem reiniciar o anfitrião. Testes Chromium 2p/4p passaram; reload do host não restaura a simulação.
- [x] Conta (implementação): Firebase opcional e Supabase preferencial, perfis isolados por provedor/projeto/UID, anônimo preservado, configurações de dispositivo locais, autosave e respostas stale protegidas. Testes VM e SDK real no navegador com Auth/REST simulados passaram.
- [x] Mapas: Kotlin, Kali, JVM, Cidade Cromada e quadra SESI refinados; pátio SESI com fontes públicas e oficina SENAI com fotos do proprietário. Redução de movimento e fallback testados.
- [x] Verificação/entrega: protocolo, combate, conta, renderização, personalizado e partidas locais em dois/quatro navegadores. Arte empacotada; commits autorizados enviados sem substituir o histórico.

## Continuação — SENAI / Qwen / Supabase

- [x] SENAI separado, selecionável, animado; quatro artes SESI preservadas byte a byte.
- [x] Qwen terceira no poder permanente, mantendo Batata, cinco habilidades e Astra. Poder 1,39 entre Felipinho 1,40 e BHM 1,34; contratos de ranking/Astra passaram.
- [x] Reativar Supabase autorizado: `supabase-aero-ball`, `ownxbuailthavxgfxtem`, `ACTIVE_HEALTHY`.
- [x] Criar somente `ds_fighters_profiles` e objetos próprios, com RLS por proprietário, sem acesso anônimo e sem alterar tabelas antigas. Trigger sem SECURITY DEFINER; timestamps do servidor; desbloqueios/estatísticas não regridem.
- [x] Integrar chave publicável e SDK local 2.118.0. Validar fallback, namespace, merge, autosave, escrita em curso, offline/retorno, logout local e Google desativado. API real recusou leitura anônima (HTTP 401).

## Pendências externas

- [ ] Ativar o provedor Google no Supabase com Client ID/Secret OAuth e autorizar `https://online-server-one.vercel.app/` como retorno; executar login Google real. Firebase é alternativa opcional, não obrigatório.
- [ ] Publicar/configurar servidor dedicado permanente WSS para lista global de salas. P2P por convite continua alternativa; testes dedicados foram locais.
- [ ] Revisar as 20 tabelas antigas do projeto compartilhado que estão sem RLS. Não foram modificadas para não bloquear o aplicativo anterior; planejar políticas antes de ativá-las.

Veja `SUPABASE.md`, `SENAI-QWEN.md`, `REFINAMENTO-V4.md`, `FIREBASE.md` e `HOSPEDAGEM.md`. Torneios históricos não foram repetidos nesta etapa.

**Decisão do proprietário (01/11/2026):** adiar o Google. A pendência OAuth acima é futura, não uma tarefa bloqueante a insistir nesta entrega. Supabase ativo; progresso local permanece disponível sem login.

## Expansão V5 — executar sem perguntas

- [x] Balanceamento: vida global 2,00 aplicada uma vez (78,6% acima da V4), padrão 180s e local/online até 300s. Reforços de Caça-Bugs e Kairo guiados pela amostra; Qwen terceira, THL quarto no poder permanente.
- [x] Dolynho, seu amiguinho: normal sem código, garrafa verde/tampa branca/luvas/tênis, cinco habilidades com bastante stun e resistência a controles repetidos; folha de 60 quadros e retratos.
- [x] THL vigilante/justiceiro: rosto inspirado na foto, normal mais poderoso no atributo permanente, cinco habilidades com múltiplos debuffs; folha de 60 quadros e retratos.
- [x] Japão oriental e Distrito Neon 2077: duas arenas originais com 24 quadros cada, preservando SENAI/SESI e o restante do catálogo. Total 25 lutadores/39 arenas.
- [x] 38 músicas recebidas em MP4: áudio normalizado e compacto, sorteio sem repetição imediata, troca ao fim da faixa e ducking do narrador com sobreposição/mute corretos. Vídeos/fotos originais não entram na distribuição.
- [x] Seleção, arte, kits, stun/vida/timer, cronômetro de três dígitos, mixer, mapas anteriores, perfil/Firebase/Supabase e online local 2p/4p verificados. Commit autorizado preparado com documentação e pacote de arte; publicação WSS permanente e Google continuam nas pendências externas acima.

## Mobile e serviços — 01/11/2026

- [x] Mobile jogável: menus e campos em pixels reais, scroll, retrato/paisagem, arena proporcional e controles de 44px. Seis tamanhos passaram sem overflow; viewport visual e campos com teclado testados.
- [x] Movimentação real, seleção/início só por toque, pular/agachar/ataques e até dez habilidades/segunda ultimate/troca/pausa disponíveis. Multitouch/captura, teclado simultâneo, blur e pausa sem comandos presos passaram.
- [x] Online: WS local 2p/4p, P2P com broker público 2p/4p, código, chat, regras, movimento, HP e troca. Reconexão P2P real passou após corrigir heartbeat. WSS permanente/diretório global permanece pendência externa.
- [x] Conta: email habilitado, cadastro/login e recuperação implementados; SDK real com Auth/REST simulados no mobile e testes Node passaram. Google adiado; sem senhas em localStorage, sem usuários fictícios no Supabase e sem alterar Aero Ball. Confirmação de email real ainda não foi testada.

## Lobão e regressões recentes — orçamento ~500 créditos

- [x] Lobão humano inspirado nas fotos e wrestling: uma geração em lote de dois blocos, folha final de 60 quadros, retratos e poses integrados; sem face/orelhas de lobo, sem substituir outros personagens.
- [x] Regressores recentes corrigidos: aura local sem perseguição, sem armadura empilhada, dano x1,5/esquiva 10%, chuva 8 por cadeira. BHM original preservado e catálogo dedicado sincronizado. Testes focados, 16 grupos de combate e 38 verificações de protocolo passaram; vida/Qwen terceira mantidas, mapas/mobile intactos. Não foi feito torneio completo nem prometido balanceamento universal.

## Hotfix Mistral — 450 créditos

- [x] Skins desativadas com EM BREVE, sem aplicação/salvamento; dados preservados. Pets: escala corrigida, cinco conjuntos novos e oito clássicos idênticos em pixels; IDs mantidos.
- [x] Falhas reproduzidas de replay, relógio e investida corrigidas. Roubo remoto e agarrão testados contra defesa, alcance e erro; cópia de cinco poderes e ícones separados de AFO2. 133 poderes renderizados sem exceções.
- [x] Lobão: cinco linhas de ícones refeitas, retratos humanos reenquadrados e URLs de sprite atualizadas; escudo e esquiva preservados. BHM não alterado nesta etapa.
- [x] Publicação real verificada: HTTP 200 no index com EM BREVE/versão do hotfix e no perfil com skins desativadas; hash da arte Lobão publicada idêntico ao arquivo local. Commit 7ef28aa enviado sem sobrescrever alterações remotas.

**Decisão de 18:47:** skins devem ficar desativadas com aviso **EM BREVE**, sem seletor/salvamento/aplicação de paletas. Preservar dados antigos e focar nos outros problemas; esta decisão substitui a entrega de skins ativas no hotfix anterior.

## Remoção de replay e estabilidade real — 01/11/2026

- [x] Replay excluído do menu, tela, handlers, leitura/gravação por quadro e escrita ao fim; perfil intacto. Ausência confirmada também na publicação real.
- [x] Travamento reproduzido com gamepad negado em iframe e loop encerrado por exceção; API protegida e próximo frame agendado antes do processamento. Quatro cenários locais com CPU/RAF/pausa passaram, incluindo mobile e iframe, sem exceções inesperadas.
- [x] Gato Mistral oficial em quatro quadros, com coleira laranja; ID e bônus mantidos, sem duplicata. Outros doze pets idênticos. Atlas publicado confirmado por hash.
- [x] Fundo musical de 0,6 para 0,7 de ganho, configurações/mute respeitados e ducking a 25% durante narração. Regressões do mixer passaram.
- [x] Dez fundos originais reempacotados dos masters: 24 quadros 768×432, piso estável, contraste/overlay mais leves, fallback/miniaturas dos JPGs. Dimensões verificadas e mapas 11+ não reconstruídos; total das dez folhas reduzido para aproximadamente 31 MiB.

- [x] Causa tardia adicional: contexto RNG ausente em Pickup e incorreto nos callbacks de MECHS. Reprodução forçada: 43 falhas antes → 43 casos aprovados depois, incluindo coleta e eventos de todos os mapas; combate/mixer continuaram aprovados.

- [x] Validação pública final v2: hash/conteúdo do deploy confirmados; 43/43 eventos/power-ups passaram; partidas reais no mobile e iframe observadas por 35s cada chegaram ao fim normalmente, sem exceções JavaScript. Não apenas ticks manuais nem apenas push.


## Seleção, retratos e narração — 01/11/2026
- [x] Na seleção, os personagens adicionados recentemente (Urbano, 1155, Qwen/Qwen Astra, Xeon, THL, Dolynho e Lobão) usam os quadros idle completos, escalados proporcionalmente para desktop e mobile, sem usar bustos cortados como miniatura.
- [x] O botão VOLTAR de SKINS — EM BREVE retorna ao menu.
- [x] Ao confirmar um lutador, falar o nome oficial com a síntese de voz pt-BR disponível no navegador/dispositivo; respeitar o volume de voz salvo e reduzir a música durante a fala.
- [x] Regressão: `python3 tools/selection_ui_check.py` (desktop/mobile/voltar/nomes); `python3 tools/mobile_check.py` (0 falhas); `node tools/audio_mix_test.js`; `node tools/combat_regressions.mjs`; `npm test --prefix online-server` (38 verificações); sintaxe JavaScript e `git diff --check`.
