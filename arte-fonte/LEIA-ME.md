# arte-fonte/

Artes ORIGINAIS do dono (folhas de personagem, mapas, pets, flora...). O jogo
**nunca** carrega nada daqui: os scripts de `tools/` recortam/convertem estas
imagens e gravam o resultado em `assets/`, que e o que o site publica.
Esta pasta fica fora do site (GitHub Pages) e do deploy da Vercel.

| pasta | o que e | quem le |
|---|---|---|
| `personagens/` | folhas de sprite e de habilidades dos lutadores novos | `tools/integrate_fighter.py`, `tools/build_*_fx.py` |
| `pitoco-pet/` | Pitoco, Rafael, Captcha Guard, Cracker e a mare alta | `tools/build_captcha_fx.py`, `tools/build_cracker_fx.py`, `tools/build_mare_atlas.py` |
| `kernor-chefe-torneio/` | o chefe do torneio | `tools/build_kernor_fx.py`, `tools/integrate_fighter.py` |
| `milena-personagem/`, `dev-virado-personagem/`, `emilio-personagem/` | artes por personagem (copias de trabalho) | referencia |
| `mapas-novos/`, `mapas-torneio/` | mapas enviados | `tools/build_mapas_novos.py` |
| `climas/` | clima de bolhas de sabao | `tools/build_bolhas.py` |
| `pets/` | pets dev (Postgres, npm, MySQL...) | `tools/build_pets_v2.py` |
| `flora/`, `fauna/`, `esquilo-libelula/`, `torcida/` | plantas, bichos e torcida dos mapas | `tools/build_flora_atlas.py` e afins |
| `art-pack/` | pacote de efeitos/plataformas antigo | `tools/build-assets.py`, `tools/pack-v*-art.py` |
| `inspiracoes/` | referencias visuais | — |

Arte nova: coloque na pasta do assunto (ou crie uma) e rode o script que gera o asset.
