/* DS Fighters — DEV VETERANO v2 (nov/2026): arte nova do dono (poses 15x4 e 5
   folhas de efeitos em arte-fonte/personagens/dev-veterano-v2) e kit refeito.
   Atlas: assets/abilities/dev-veterano.png (10 linhas, tools/build_devvet_fx.py)
     0 rajada da pistola  1 punho voando  2 corrente  3 granada caindo
     4 punho com rastro + onda (ult)  5 explosao  6 fumaca  7 aneis do soco
     8 impacto do tiro  9 estouro do punho */
(() => {
  const id = 'dev-veterano';
  for (const k of ['abil:' + id, 'fx2:' + id]) if (typeof ART_SHEETS !== 'undefined' && ART_SHEETS[k]) ART_SHEETS[k].rows = 10;
  if (typeof POWERS === 'undefined' || !POWERS[id]) return;
  const vis = (row, color, impactRow) => ({ visualSheet: id, visualRow: row, impactRow, impactSheets: [], impactColor: color });
  POWERS[id].theme = 'pistola anti-bug, punho de 1TB, correntes de aço, granada e turbina de socos';
  /* dano calibrado por simulacao (tools/balance_sim.cjs): o kit antigo recebia
     +28% do powers-balance-v13; este ja vem com os valores finais */
  POWERS[id].powers = [
    Object.assign({
      id: 'antibug-shot', name: 'Tiro Anti-Bug', slot: 'simple', row: 0,
      kind: 'shot', dmg: 19, speed: 14, stun: 16, cd: 36, seek: true,
      fx: { bleed: 150, slow: 35 }, sfx: 'fire',
      desc: 'Rajada da pistola anti-bug: persegue o rival, faz SANGRAR e deixa lento.',
    }, vis(0, '#6fd0ff', 8)),
    Object.assign({
      id: 'one-tb-punch', name: 'Punho de 1TB', slot: 'simple', row: 1,
      kind: 'shot', heavy: true, big: true, seek: true, dmg: 28, speed: 11, stun: 32, launch: -6, cd: 52,
      fx: { paralyze: 60, vuln: 70 }, sfx: 'heavy',
      desc: 'Dispara um punho de 1TB de energia: paralisa por 1 segundo e deixa o rival VULNERÁVEL.',
    }, vis(1, '#ff4040', 9)),
    Object.assign({
      id: 'steel-chains', name: 'Correntes de Aço', slot: 'charge', meter: 0, row: 2,
      kind: 'pull', range: 400, dmg: 22, stun: 36, cd: 48, sfx: 'dash',
      fx: { slow: 40 },
      desc: 'Correntes de aço agarram, PUXAM para perto e deixam o rival lento.',
    }, vis(2, '#6fd0ff')),
    Object.assign({
      id: 'antibug-grenade', name: 'Granada Anti-Bug', slot: 'charge', meter: 1, row: 3,
      kind: 'shot', arc: true, dmg: 30, speed: 10, stun: 26, launch: -6, cd: 62,
      zone: { row: 6, w: 200, time: 240, dmg: 0.2, slow: 40 },
      fx: { burn: 120 }, sfx: 'explosion',
      desc: 'Arremessa uma granada em arco: explode, QUEIMA e deixa uma nuvem de fumaça que deixa lento.',
    }, vis(3, '#ffb03b', 5)),
    Object.assign({
      id: 'punch-turbine', name: 'Turbina de Socos', slot: 'ultimate', row: 4,
      kind: 'rush', dmg: 72, hits: 12, cd: 110,
      fx: { lock: 40, bleed: 100 }, sfx: 'ultimate',
      desc: 'Avança e descarrega uma turbina de socos de energia com onda de choque.',
    }, vis(4, '#ff4040', 7)),
  ];
})();
