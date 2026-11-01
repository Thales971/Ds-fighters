# SENAI Valinhos e ranking da Qwen

## Arena SENAI

A **Oficina SENAI Valinhos** é uma arena adicional; **Quadra SESI Valinhos** e **Pátio SESI Valinhos** permanecem no catálogo e suas artes não foram alteradas.

A nova arte usa como referência as três fotografias fornecidas pelo proprietário: salão industrial alto com estrutura metálica e iluminação fluorescente, tornos e equipamentos de usinagem em filas, bancadas azul/creme, motores e painéis elétricos. As pessoas das fotografias não foram incorporadas ao cenário. É uma homenagem artística em pixel art, não uma reconstrução arquitetônica exata.

O fundo possui uma faixa livre de combate e piso estável. A folha animada tem 24 quadros em grade 6 × 4 e usa luz moderada, respeitando redução de movimento. O clima é interno/céu limpo; a mecânica existente de pulso elétrico dialoga com as bancadas de treinamento elétrico e avisa antes do efeito no chão.

## Qwen

A ordem de força solicitada é registrada no ranking **permanente de poder** do elenco, com Qwen em terceiro lugar e sem empate. Suas cinco habilidades, código `Batata` e transformação Astra são preservados. Transformações temporárias, vantagens de matchup, clima, mascotes e habilidade do jogador podem mudar o resultado de uma luta; o ranking não promete uma taxa universal de vitória.

## Supabase

O conector está disponível e foi consultado. O único projeto retornado foi **supabase-aero-ball**, com estado **INACTIVE**. Como o nome indica outro jogo, sua reutilização/reativação foi solicitada ao proprietário antes de qualquer gravação ou mudança no projeto.

Nenhuma tabela ou dado do Aero Ball foi alterado nesta etapa de descoberta. O login atual continua usando a implementação Firebase opcional até a definição do projeto Supabase. Para uma integração Supabase real, será necessário projeto ativo, tabela exclusiva de perfis protegida por RLS e configuração do provedor Google; chave de serviço nunca deve ser colocada no frontend.

## Resultado verificado

A ordem permanente passou a **IALES 1,50 → Felipinho 1,40 → Qwen 1,39 → BHM 1,34 → DU 1,30**. As duas primeiras posições não foram alteradas. A Qwen mantém sua transformação temporária e kit completo.

`python3 tools/senai_check.py` confirmou imagem base 960 × 540, folha 6 × 4 com quadros 640 × 360, as quatro artes SESI byte a byte, SENAI selecionável, ranking da Qwen, kit/Batata/Astra e renderização com pulso elétrico. Não houve erro JavaScript nos cenários verificados.
