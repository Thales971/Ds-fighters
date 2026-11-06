# DS FIGHTERS

Jogo de luta 2D arcade no navegador — pixel art retrô, JS/HTML/CSS puro, sem engine.

**40 lutadores · 46 arenas · online até 4 jogadores · modo treino com dojo próprio**

## Lutadores

| # | Nome | Power | Tema |
|---|---|---|---|
| 1 | DU MAGMA | 1.38 | Magma vivo |
| 2 | IALES OMEGA | 1.55 | Todas as IAs, 10 habilidades |
| 3 | FELIPINHO HYDRO | 1.44 | Água e React |
| 4 | ET 1155 (stack) | 1.16 | Soquete 1155 |
| 5 | KAGE COMMIT (gitmaster) | 1.10 | Git |
| 6 | LYRA TRACE (bughunter) | 1.04 | Bug report |
| 7 | MIRA PIXEL (frontend) | 1.08 | CSS |
| 8 | TITAN 500 (backend) | 1.12 | Erro 500 |
| 9 | CID PIPE (devops) | 1.06 | Pipeline |
| 10 | ADA ASSERT (qa) | 1.02 | Testes |
| 11 | KAIRO SPRINT (scrum) | 1.08 | Gelo |
| 12 | OMNI STACK (fullstack) | 1.12 | Combos |
| 13 | YUMI LAMBDA (kotlin) | 1.06 | Rapidez |
| 14 | ROOT PHANTOM (hacker) | 1.10 | Rootkit |
| 15 | KAEL JVM (java) | 1.10 | Tanque |
| 16 | CROMO VX (merc) | 1.30 | 20% esquiva base |
| 17 | BHM NOIR | 1.32 | Raio + sombra |
| 18 | VIGILANTE (thl) | 1.10 | Lockdown tático |
| 19 | URBANO TREMOR | 1.20 | Terremoto |
| 20 | XEON | 1.10 | Performance |
| 21 | QWEN ASTRA | 1.39 | Forma alternativa |
| 22 | DOLYNHO | 1.08 | Simplicidade |
| 23 | LOBÃO | 1.40 | Wrestling selvagem |
| 24 | WINX.EXE | 1.38 | Desktop |
| 25 | GEMINI TWINBYTE | 1.35 | Duas frequências |
| 26 | META | 1.24 | Comunidade |
| 27 | MIS, A BRASA MISTRAL | 1.37 | Fogo |
| 28 | DEV SENIOR | 1.46 | Nanomáquinas |
| 29 | DANDARA QUERY | 1.15 | Banco de dados |
| 30 | NINA VECTOR | 1.15 | Kestrel-09 |
| 31 | DEV VETERANO | 1.36 | Duas pistolas |
| 32 | HANA | 1.24 | Jardim de código |
| 33 | CYBER-PSICOPATA | 1.48 | Tank de pressão |
| 34 | GRIKA | 1.30 | Pesadelos |
| 35 | GUARDA DIGITAL | 1.22 | Perímetro |
| 36 | ENGENHEIRA DE PROMPT | 1.24 | Instruções |
| 37 | ODETTE | 1.26 | Elegância |
| 38 | JOHN THE VIBE CODER | 1.36 | Herdeiro do fuzil |
| 39 | NIMBO | 1.38 | Portador rachado |
| 40 | BONECO DE TREINO | 0.80 | Sparring de madeira |

## Modos

| Modo | Descrição |
|---|---|
| Arcade | Escada de 7 lutas contra a CPU |
| Versus | 1×1 local ou CPU |
| 2×2 Equipes | Duplas com troca |
| Survival | Lute até cair |
| Treino | Dojo próprio, boneco configurável, cura automática |
| Online | P2P ou servidor, até 4 jogadores |
| Personalizado | Regras customizáveis |

## Testes

```bash
node tools/combat_regressions.mjs
node tools/modes_test.js
node tools/hitbox_test.js
node tools/championship.js
python3 tools/sprite_audit.py
npm test --prefix online-server
```

## Deploy

Vercel automático a cada push para `main`. Ver [HOSPEDAGEM.md](HOSPEDAGEM.md).

## Nuvem

Supabase com retry exponencial (2s→32s), health check a cada 15s, auto-sync ao voltar a conexão e backup local. Ver [SUPABASE.md](SUPABASE.md).

## Códigos

- `adm` — desbloqueia Iales, Du e Felipinho
- `batata` — desbloqueia secretos antigos
- Winx.exe e Qwen são **padrão** (sem código)

---
Arte, código e efeitos originais. Músicas do proprietário. Jogo gratuito.
