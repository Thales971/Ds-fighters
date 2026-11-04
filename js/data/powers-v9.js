/*
 * DS Fighters V9 — efeitos de habilidade exclusivos para Dandara Query.
 * Cada uma das cinco linhas é compartilhada apenas entre os quatro quadros da animação
 * daquela habilidade; HUD, projéteis, zonas e impactos usam o atlas do próprio personagem.
 */
(() => {
  const visual = (id, row, color) => ({
    visualSheet: id,
    visualRow: row,
    impactSheets: [],
    impactColor: color,
  });
  const skill = (id, row, data, color) => Object.assign({}, data, visual(id, row, color));

  Object.assign(POWERS, {
    'dandara-query': {
      element: 'database',
      theme: 'consultas rápidas, transações seguras e colunas de dados',
      powers: [
        skill('dandara-query', 0, {
          id: 'select-query', name: 'SELECT Rápido', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 10, stun: 16, cd: 42,
          fx: { meterSlow: 50 }, sfx: 'whoosh',
          desc: 'Um pacote de consulta verde cruza a arena e reduz o ganho de medidor.',
        }, '#66db9a'),
        skill('dandara-query', 1, {
          id: 'join-step', name: 'JOIN de Aço', slot: 'simple', row: 1,
          kind: 'dash', dmg: 14, speed: 14, stun: 21, cd: 50,
          fx: { vuln: 55 }, sfx: 'dash',
          desc: 'Duas faixas de dados se cruzam enquanto Dandara entra no alcance.',
        }, '#9dd86d'),
        skill('dandara-query', 2, {
          id: 'table-master', name: 'Tabela Mestra', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 14, dmg: 18, stun: 27, launch: -6, cd: 74,
          fx: { vuln: 65, meterSlow: 50 }, sfx: 'explosion',
          desc: 'Linhas ordenadas de uma tabela irrompem sob o adversário.',
        }, '#63cf81'),
        skill('dandara-query', 3, {
          id: 'transaction', name: 'Transação Segura', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 156, dmg: 0.08, slow: 58, cd: 88,
          fx: { slow: 65, vuln: 45 }, sfx: 'metal',
          desc: 'Um anel de grade verde protege a área e pune quem fica parado.',
        }, '#a4d56c'),
        skill('dandara-query', 4, {
          id: 'full-backup', name: 'Backup Total', slot: 'ultimate', row: 4,
          kind: 'barrage', dmg: 8, count: 6, homing: 0.4, stun: 22, finisher: 19, cd: 120,
          fx: { vuln: 95, meterSlow: 80 }, sfx: 'ultimate',
          desc: 'Colunas e pacotes de dados se acumulam num backup explosivo.',
        }, '#d6c56d'),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    database: { sheet: 'dandara-query', color: '#66db9a' },
  });

  const dandara = FIGHTERS.find((fighter) => fighter.id === 'dandara-query');
  if (dandara) {
    dandara.special = {
      name: 'SELECT Rápido', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 10, dmg: 10, w: 24, h: 18, color: '#66db9a', shape: 'bolt', visualSheet: 'dandara-query', visualRow: 0 },
    };
    dandara.super = { name: 'Backup Total', type: 'multi-projectile', dmg: 8, count: 6, visualSheet: 'dandara-query', visualRow: 4 };
  }
})();
