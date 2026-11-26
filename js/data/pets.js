/* ============================================================
   DS FIGHTERS — Mascotes equipáveis (menu Personalizar).
   `row` = linha em assets/pets/pets.png (4 quadros de 96px).
   Os buffs são aplicados em Fighter.applyPet().
   ============================================================ */
const PETS = [
  { id: 'none', name: 'Nenhum', row: -1, buff: 'Sem bônus.', fx: {} },
  { id: 'tux', name: 'Pinguim do Linux', row: 0, buff: '+12% de defesa e regenera 0,5 HP/s.', fx: { def: 0.12, regen: 0.5 / 60 } },
  { id: 'whale', name: 'Baleia Container', row: 1, buff: 'Começa cada round com escudo de 12 HP.', fx: { shield: 12 } },
  { id: 'crab', name: 'Caranguejo Seguro', row: 2, buff: 'Imune a veneno e queimadura. +5% de defesa.', fx: { def: 0.05, immune: true } },
  { id: 'snake', name: 'Cobra Script', row: 3, buff: 'Medidores de carga enchem 15% mais rápido.', fx: { meter: 0.15 } },
  { id: 'elephant', name: 'Elefante Legado', row: 4, buff: '+8% de dano em todos os golpes.', fx: { dmg: 0.08 } },
  { id: 'gopher', name: 'Gopher Concorrente', row: 5, buff: '+10% de velocidade de movimento.', fx: { speed: 0.10 } },
  { id: 'leaf', name: 'Espírito da Primavera', row: 6, buff: 'Power-ups duram 50% mais.', fx: { pickup: 0.5 } },
  { id: 'octo', name: 'Polvo do Commit', row: 7, buff: 'Abaixo de 25% de HP, restaura 18 HP (1x por round).', fx: { revive: 18 } },
  { id: 'mistral', name: 'Gato Mistral (Le Chat)', row: 8, buff: '+10% de dano e +10% de velocidade; a cada 3º acerto de habilidade aplica CHOQUE no rival.', fx: { dmg: 0.10, speed: 0.10, shockOnHit: 90 } },
  { id: 'slime', name: 'Slime Verde', row: 9, buff: 'Regenera 0,8 HP/s e +8% de defesa.', fx: { regen: 0.8 / 60, def: 0.08 } },
  { id: 'dragao', name: 'Dragãozinho', row: 10, buff: 'A cada 4º acerto de habilidade aplica QUEIMADURA (60f) no rival.', fx: { burnOnHit: 60 } },
  { id: 'fenix', name: 'Fênix de Fogo', row: 11, buff: 'A cada 5º acerto de habilidade causa EXPLOSÃO extra; +6% de dano.', fx: { explodeOnHit: 2, dmg: 0.06 } },
  { id: 'robot', name: 'Robôzinho CI', row: 12, buff: 'Medidores de carga enchem 25% mais rápido e +6% de velocidade.', fx: { meter: 0.25, speed: 0.06 } },
  /* PETS DEV (nov/2026, arte do dono em novos-pets/): cada um tem uma HABILIDADE
     ativa que age na luta (js/engine/pet-skills.js) e reage ao dono (susto ao
     apanhar, comemora na vitoria). Atlas 4x3: tools/build_pets_v2.py */
  { id: 'postgres', name: 'Elefante Postgres', row: -3, sheet: 'pet-postgres', img: 'assets/pets/pet-postgres.png?v=v90-pets', buff: 'ROLLBACK: 1x por round, um golpe pesado (18+) tem metade do dano desfeito. +10% de defesa.', fx: { def: 0.10, rollback: 0.5 } },
  { id: 'npm', name: 'Unicórnio npm', row: -3, sheet: 'pet-npm', img: 'assets/pets/pet-npm.png?v=v90-pets', buff: 'NPM INSTALL: a cada 9s instala um pacote aleatório por 6s (+30% velocidade, +22% dano, +22% defesa ou +30 de medidor).', fx: { npm: true } },
  { id: 'mysql', name: 'Golfinho MySQL', row: -3, sheet: 'pet-mysql', img: 'assets/pets/pet-mysql.png?v=v90-pets', buff: 'SONAR: a cada 7s acerta o rival (até 520px) com um pulso de 6 de dano que deixa LENTO.', fx: { sonar: 6 } },
  { id: 'stackoverflow', name: 'Coruja StackOverflow', row: -3, sheet: 'pet-stackoverflow', img: 'assets/pets/pet-stackoverflow.png?v=v90-pets', buff: 'RESPOSTA ACEITA: 15% de chance de ler o golpe e tomar só 25% do dano. +10% de medidor.', fx: { owlGuard: 0.15, meter: 0.10 } },
  { id: 'gopher-go', name: 'Gopher Go', row: -3, sheet: 'pet-gopher', img: 'assets/pets/pet-gopher.png?v=v90-pets', buff: 'GOROUTINES: a cada 4º acerto seu, 2 golpes extras concorrentes de 4 de dano cada.', fx: { goroutines: 4 } },
  { id: 'pato', name: 'Pato de Borracha', row: -3, sheet: 'pet-pato', img: 'assets/pets/pet-pato.png?v=v90-pets', buff: 'DEBUG: com debuff (queimando, veneno, lento, tonto...), em 1s o pato limpa tudo e cura 10. Recarga 7s.', fx: { debug: 10 } },
  /* RECOMPENSA DE LOGIN: so equipa com a conta conectada (Profile.LOGIN_PETS). Acima da media de proposito. */
  { id: 'firefox', name: 'Raposa do Firefox', row: -3, sheet: 'firefox', img: 'assets/pets/firefox.png?v=v82-raposa', buff: 'Rápida como o navegador: +12% de velocidade, +10% de dano, +6% de defesa e regenera 0,5 HP/s. Só com login.', fx: { speed: 0.12, dmg: 0.10, def: 0.06, regen: 0.5 / 60 }, login: true },
  /* O SEGREDO: so existe por codigo — digite PITOCO na tela de pet. Apelao DE PROPOSITO. */
  { id: 'pitoco', name: 'Pitoco', row: -2, buff: 'Cara de coitado: 50% dos golpes erram sozinhos e o dono regenera 15 HP/s. Proibido em torneio.', fx: { pitoco: true, regen: 15 / 60, dodge: 0.5 }, secret: true },
];

/* Power-ups do mapa. `row` em assets/pickups/pickups.png (64px). */
const PICKUPS = [
  { id: 'atk', name: 'ATAQUE +35%', row: 0, color: '#ff4b4b', time: 480 },
  { id: 'def', name: 'DEFESA +35%', row: 1, color: '#4ba3ff', time: 480 },
  { id: 'spd', name: 'VELOCIDADE +40%', row: 2, color: '#ffd84b', time: 480 },
  { id: 'nrg', name: 'ENERGIA +50', row: 3, color: '#b06bff', time: 0 },
];
