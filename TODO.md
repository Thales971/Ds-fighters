# DS Fighters — refinamento V4

- [x] Sprites e animações: Urbano de jaqueta preta e 1155 de boné/óculos/camisa estampada conforme fotos; Qwen lilás/azul e roupa branca; efeitos de Xeon distintos. Figuras inteiras, folhas integradas, retratos e quatro fases por pose nos três refinados. Transparência e 60 células verificadas por folha.
- [x] Combate: +12% vida global uma única vez; reforço do 1155 e preservação da força/segunda ultimate do IALES; soco Urbano trava e arremessa sem punir bloqueio com segundo golpe inevitável; Xeon gelo/fogo e bônus térmico preparado; Qwen por Batata. Dez grupos de regressão passaram.
- [x] Personalizados e online (implementação): tela local personalizada, vida infinita sem KO, pontuação de dano incluindo bloqueio e DOT, medidores infinitos e até nove vitórias/17 rounds. Diretório de salas reais no servidor dedicado, entrada por código/lista, regras autoritativas, snapshots/inputs ordenados e reconexão de socket sem reiniciar o anfitrião. Testes Chromium 2p/4p passaram; reload do host cancela explicitamente, não restaura a simulação.
- [x] Conta Google (implementação): perfis isolados por UID, anônimo preservado, preferências de dispositivo locais, filas e respostas stale protegidas. Testes offline e Firebase simulado passaram.
- [x] Mapas: Kotlin, Kali, JVM, Cidade Cromada e quadra SESI refinados; pátio SESI Valinhos adicionado com referências públicas documentadas. Redução de movimento e fallback testados.
- [x] Verificação/entrega preparada: 37 testes de protocolo, 10 grupos de combate, conta mockada, quatro renderizações, modo personalizado e partidas reais locais de 2/4 navegadores. Arte final empacotada; envio Git autorizado para main sem substituir o histórico.

## Ativação externa ainda necessária

- [ ] Configurar um projeto Firebase real, Google Auth, domínio autorizado e regras Firestore. `js/config/firebase-config.js` permanece `null`; nenhum login real foi realizado.
- [ ] Publicar/configurar um servidor dedicado permanente WSS para a lista global de salas. Os testes usaram servidor temporário local. P2P por convite permanece alternativa.

Veja `REFINAMENTO-V4.md`, `FIREBASE.md` e `HOSPEDAGEM.md`. As tabelas antigas de torneio são históricas; não foi feito um torneio completo nesta etapa.

## Continuação — pedido SENAI / Qwen / Supabase

- [x] Manter os mapas SESI como estão e adicionar o SENAI Valinhos com base nas fotos da oficina e dos painéis elétricos, como arena própria selecionável e animada. `senai_check.py` confirmou o catálogo e quatro hashes SESI preservados.
- [x] Qwen como terceira mais forte no ranking permanente de poder do elenco, mantendo Batata, cinco habilidades e Astra; testar ordem e evitar empate. Poder 1,39 entre Felipinho 1,40 e BHM 1,34; contratos de ranking/Astra passaram.
- [ ] Usar o conector Supabase no projeto autorizado. Descoberta concluída: único projeto `supabase-aero-ball`, inativo; escolha/reutilização aguarda confirmação. Não alterar dados de outro jogo sem autorização.
