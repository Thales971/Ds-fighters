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
