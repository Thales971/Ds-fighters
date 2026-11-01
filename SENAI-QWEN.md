# SENAI Valinhos e ranking da Qwen

## Arena SENAI

A **Oficina SENAI Valinhos** é uma arena adicional; **Quadra SESI Valinhos** e **Pátio SESI Valinhos** permanecem no catálogo e suas artes não foram alteradas.

A nova arte usa como referência as três fotografias fornecidas pelo proprietário: salão industrial alto com estrutura metálica e iluminação fluorescente, tornos e equipamentos de usinagem em filas, bancadas azul/creme, motores e painéis elétricos. As pessoas das fotografias não foram incorporadas ao cenário. É uma homenagem artística em pixel art, não uma reconstrução arquitetônica exata.

O fundo possui uma faixa livre de combate e piso estável. A folha animada tem 24 quadros em grade 6 × 4 e usa luz moderada, respeitando redução de movimento. O clima é interno/céu limpo; a mecânica existente de pulso elétrico dialoga com as bancadas de treinamento elétrico e avisa antes do efeito no chão.

## Qwen

A ordem de força solicitada é registrada no ranking **permanente de poder** do elenco, com Qwen em terceiro lugar e sem empate. Suas cinco habilidades, código `Batata` e transformação Astra são preservados. Transformações temporárias, vantagens de matchup, clima, mascotes e habilidade do jogador podem mudar o resultado de uma luta; o ranking não promete uma taxa universal de vitória.

## Supabase

O proprietário autorizou reutilizar e reativar **supabase-aero-ball**. O projeto agora está **ACTIVE_HEALTHY** e possui a tabela exclusiva `ds_fighters_profiles`, protegida por RLS. As tabelas do aplicativo anterior não foram alteradas.

O cliente Supabase está integrado e testado, preservando Firebase/offline como fallback. **Login Google real ainda precisa de configuração OAuth**, pois o provedor está desativado. Veja [SUPABASE.md](SUPABASE.md) para a configuração e o alerta de segurança das tabelas antigas sem RLS. Somente a chave publicável entra no frontend.

## Resultado verificado

A ordem permanente passou a **IALES 1,50 → Felipinho 1,40 → Qwen 1,39 → BHM 1,34 → DU 1,30**. As duas primeiras posições não foram alteradas. A Qwen mantém sua transformação temporária e kit completo.

`python3 tools/senai_check.py` confirmou imagem base 960 × 540, folha 6 × 4 com quadros 640 × 360, as quatro artes SESI byte a byte, SENAI selecionável, ranking da Qwen, kit/Batata/Astra e renderização com pulso elétrico. Não houve erro JavaScript nos cenários verificados.
