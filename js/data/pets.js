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
];

/* Power-ups do mapa. `row` em assets/pickups/pickups.png (64px). */
const PICKUPS = [
  { id: 'atk', name: 'ATAQUE +35%', row: 0, color: '#ff4b4b', time: 480 },
  { id: 'def', name: 'DEFESA +35%', row: 1, color: '#4ba3ff', time: 480 },
  { id: 'spd', name: 'VELOCIDADE +40%', row: 2, color: '#ffd84b', time: 480 },
  { id: 'nrg', name: 'ENERGIA +50', row: 3, color: '#b06bff', time: 0 },
];
