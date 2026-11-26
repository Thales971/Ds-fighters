# Expansão V5 — THL, Dolynho e lutas longas

## Personagens e arte

THL é um vigilante tático com identidade facial inspirada na fotografia fornecida pelo proprietário: cabelo preto curto, sobrancelhas marcadas e barba curta. Sua roupa é preta/cinza com um emblema original de caveira/escudo. É normal, sem código; sua posição permanente será abaixo da Qwen, mantendo a decisão anterior de Qwen terceira.

Dolynho é um lutador normal inspirado no mascote verde de guaraná solicitado. A referência visual [Mascotpedia — Dollynho](https://mascots.fandom.com/wiki/Dollynho) descreve a garrafa verde antropomórfica, olhos grandes, luvas e tênis. A imagem pública escolhida foi copiada para a área de produção, não a fotografia pessoal do THL para a distribuição.

Os mestres novos foram gerados com alpha nativo; blocos de animação são normalizados em folhas 4 × 15 (60 quadros) de células 320 × 260, com linha dos pés em 246. A pose de soco agachado ausente nos blocos iniciais recebeu uma correção própria, não uma pose em pé esmagada. Retratos são derivados da folha. Cinco habilidades por lutador têm folhas próprias 4 × 5 de 128 × 128 por célula; o executor e os impactos genéricos do jogo são reaproveitados.

## Arenas

**Jardim do Sol Nascente**: templo/vila japonesa, torii, cerejeiras, lanternas, ponte e lago ao amanhecer. **Distrito Neon 2077**: metrópole cyberpunk noturna com luzes ciano/magenta, cabos, hologramas e asfalto refletivo. São cenários originais inspirados na atmosfera pedida, não cópias de mapas comerciais.

Ambos preservam espaço livre de combate, possuem animação de 24 quadros (6 × 4) e respeitam redução de movimento. As arenas anteriores permanecem. O jardim usa o gongo de energia; o distrito usa letreiros com aviso antes de cair.

## Vida, tempo e controle

Decisão de implementação: vida global 2,00 × a vida-base, contra 1,12 × antes, sem multiplicação cumulativa. Tempo padrão 180 segundos, antes 99, e personalizados/online até 300 segundos. O tempo ainda pode ser reduzido pelo jogador. Dolynho terá controle forte sem permitir travar o alvo para sempre; THL aplica vários debuffs com janelas e custos de habilidade.

## Música

Após a mensagem inicial chegaram **38 vídeos de músicas fornecidos pelo proprietário**, incluindo Linkin Park, Slipknot, System of a Down e Metal Gear Rising. O importador extrai somente áudio, normaliza loudness com alvo −18 LUFS / pico verdadeiro −2 dB e exporta MP3 estéreo compacto. Os vídeos e fotos originais não vão para o repositório do jogo. A playlist usa faixas reais recebidas, sem downloads adicionais.

O volume padrão da música é 0,35, com mixagem 0,60: ganho inicial 0,21. Durante narração o fundo cai a 25% desse ganho e só retorna quando todas as falas terminam. As preferências de volume salvas continuam editáveis. Sorteio não repete a faixa anterior quando houver alternativas. As músicas comerciais não são obras originais do DS Fighters; uso e redistribuição devem respeitar as licenças dos respectivos titulares.

O login Google continua adiado por decisão do proprietário. Esta expansão não muda as tabelas/provedores do Supabase.

## Verificação

Os resultados finais estão abaixo; o ranking de poder permanente não determina todas as vitórias e a amostra CPU não substitui partidas humanas.

### Resultados finais

- 16 grupos de regressão de combate: vida, Qwen terceira/THL quarto, novos normais, entidades e debuffs reais, resistência a stun, reset e snapshots. Explosões agora respeitam `stun` e `launch` do poder em vez de ignorá-los.
- `v5_check.py`: 60 quadros RGBA por personagem, retratos, cinco efeitos próprios, 25 lutadores/39 arenas, vida THL 280 e Dolynho 252, seleção local/online 180–300 s, cronômetro de três dígitos sem sobreposição, duas arenas renderizadas, redução de movimento e reprodução real de uma música enviada com narrador/ducking.
- `online_e2e.py ws 2` e `ws 4`: novos lutadores e cyberpunk em salas reais **locais**, regras de 300 s sincronizadas, movimento, chat, troca de reserva, HP e reconexão do host sem reiniciar o round. Nenhum erro JavaScript.
- Mapas SESI continuam byte a byte iguais; SENAI, sprites V4, personalizado e os testes de perfil/Firebase/Supabase passaram. Google real e servidor WSS público permanente continuam fora desta etapa.
- 38 MP3 reais, 123,1 MiB, duração preservada com tolerância inferior a 1 s; todos têm métricas de normalização e nenhuma sobra de conversão. A faixa seguinte é sorteada também ao terminar a anterior durante uma luta; menu mantém loop próprio.

### Balanceamento observado, não promessa de winrate

Amostras de execução real do motor em Chromium: 132 confrontos na V4, 148 na V5 inicial e 148 na V5 ajustada. Cada normal enfrentou quatro referências (1155, Urbano, Xeon e BHM), alternando lados, CPU normal e limite de 60 s, sem mecânica de arena. São observações de testes controlados, **não dados de partidas humanas**, nem um torneio exaustivo; a comparação usa vida-base diferente e seeds/estado da CPU, por isso taxas não devem ser tomadas como ranking universal.

Os outliers repetidos Caça-Bugs e Kairo Sprint receberam reforços moderados de vida, alcance, recuperação e energia. A Lupa Solar alcança 380 e o Timebox 280, preservando seus tipos e efeitos. Na amostra final, eles passaram de zero vitórias na amostra V5 inicial a 5/8 e 3/8, respectivamente; Dolynho ficou 4/8 e THL 7/8 contra as mesmas quatro referências. A ordem contratada é por `stats.power`: IALES 1,50; Felipinho 1,40; Qwen 1,39; THL 1,36; BHM 1,34.

Os JSON completos são produzidos pelos comandos abaixo em `test-results/`, que permanece fora do Git:

```bash
node tools/combat_regressions.mjs
node tools/audio_mix_test.js
python3 tools/v5_check.py
python3 tools/online_e2e.py ws 2
python3 tools/online_e2e.py ws 4
python3 tools/v5_balance_sample.py --out test-results/balance-final-v5.json
```
