# Pacote visual — refinamento da V4

As folhas de Urbano, ET 1155 e Qwen foram redesenhadas em pixel art e integradas ao contrato existente de quatro colunas por quinze linhas, com células de 320 × 260 e contato com o chão em y=246. `sprites/refined-frames.json` registra os recortes finais; `tools/refine-sprites.py` reproduz a montagem a partir dos dois blocos RGBA de cada personagem. As fotografias pessoais originais não foram adicionadas ao repositório.

Urbano usa cabelo curto castanho e jaqueta preta, conforme a foto fornecida. O 1155 usa boné, óculos, barba, camiseta estampada e jeans; “alien” permanece somente um apelido. Qwen tem cabelo lilás/azul, camiseta branca e estrela no cabelo, inspirada na referência enviada. A forma Astra existente permanece como transformação alternativa. Xeon recebeu uma folha de efeitos com lança de gelo, punho flamejante, prisão glacial, muralha de fogo e explosão de choque térmico.

## Pátio SESI Valinhos

A arena `sesi-patio` é uma homenagem artística inspirada em fotografias públicas do interior/pátio da escola, não uma reconstrução arquitetônica exata. A quadra anterior continua disponível. Foram usadas como orientação visual as fotos da cerimônia de denominação da escola e de evento escolar, divulgadas pelo SESI-SP. Pessoas reais das fotos não foram incorporadas ao cenário.

Fontes consultadas:

[SESI-SP — Walter Vicioni Gonçalves é o patrono da Escola Sesi de Valinhos](https://campinasamoreiras.sesisp.org.br/noticia/walter-vicioni-goncalves-e-o-patrono-da-escola-sesi-de-valinhos).

[CIESP Campinas — cerimônia na escola SESI Valinhos](https://www.ciespcampinas.org.br/site/noticias/2073/2021/12/professor_walter_vicioni_goncalves_e_o_patrono_da_escola_sesi_de_valinhos._ciesp_campinas_marca_presenca._).

[SESI-SP — aluna do SESI Valinhos no EPTV na Escola](https://campinasamoreiras.sesisp.org.br/noticia/aluna-do-sesi-valinhos-conquista-5-lugar-no-eptv-na-escola-com-redacao-sobre-inteligencia-artificial).

## Mapas existentes

Foram reprocessados apenas os mapas Kotlin, Kali, JVM, Cidade Cromada e quadra SESI, além do novo pátio. As folhas passaram a 640 × 360 por quadro, com paleta estável de 256 cores, brilho menos agressivo e sementes determinísticas. O piso da Cidade Cromada não ondula mais como se fosse água. O renderizador reduz os filtros que escondiam detalhes, congela o fundo quando a redução de movimento está ativa e usa a imagem base se a folha animada falhar.

Os arquivos PNG são folhas reais com transparência nativa nos personagens/efeitos. Os mapas são opacos. Os mestres de geração ficam fora da distribuição do jogo; não é necessário carregá-los em produção.
