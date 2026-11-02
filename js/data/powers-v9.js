/*
 * DS Fighters V9 — efeitos de habilidade exclusivos para Kimi, DeepSeek e Dandara Query.
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
    kimi: {
      element: 'electric',
      theme: 'raios ciano, arcos voltaicos e descargas curtas',
      powers: [
        skill('kimi', 0, {
          id: 'turquoise-arc', name: 'Arco Turquesa', slot: 'simple', row: 0,
          kind: 'shot', dmg: 9, speed: 10, stun: 15, cd: 38,
          fx: { shock: 16 }, sfx: 'neon',
          desc: 'Um raio compacto ciano dispara da palma e eletriza por um pulso breve.',
        }, '#72f3f1'),
        skill('kimi', 1, {
          id: 'voltaic-step', name: 'Passo Voltaico', slot: 'simple', row: 1,
          kind: 'dash', dmg: 13, speed: 15, stun: 20, cd: 46,
          fx: { shock: 12 }, sfx: 'dash',
          desc: 'Kimi avança num rastro de faíscas turquesa; o choque dura poucos instantes.',
        }, '#48d8ed'),
        skill('kimi', 2, {
          id: 'thunder-pillar', name: 'Pilar de Trovão', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 14, dmg: 17, stun: 26, launch: -6, cd: 68,
          fx: { shock: 28, slow: 20 }, sfx: 'explosion',
          desc: 'Uma descarga vertical atinge o ponto marcado e lança o rival para cima.',
        }, '#f2df73'),
        skill('kimi', 3, {
          id: 'tesla-grid', name: 'Grade Tesla', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 96, dmg: 0.09, slow: 32, cd: 84,
          fx: { meterSlow: 20 }, sfx: 'neon',
          desc: 'Um campo baixo de arcos elétricos cerca a área por pouco tempo.',
        }, '#60ebca'),
        skill('kimi', 4, {
          id: 'cyan-storm', name: 'Tempestade Ciano', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 34, stun: 42, launch: -8, radius: 220, cd: 118,
          fx: { shock: 46, vuln: 40 }, sfx: 'ultimate',
          desc: 'Uma explosão radial de raios ciano fecha a luta com um choque controlado.',
        }, '#fff07a'),
      ],
    },
    deepseek: {
      element: 'deepseek',
      theme: 'sonar bioluminescente, correntes abissais e cauda de baleia',
      powers: [
        skill('deepseek', 0, {
          id: 'bubble-probe', name: 'Sonda de Bolhas', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 9, stun: 16, cd: 42, seek: true,
          fx: { slow: 55 }, sfx: 'water',
          desc: 'Uma esfera-sonar abissal de bolhas bioluminescentes persegue levemente o rival.',
        }, '#50d7ff'),
        skill('deepseek', 1, {
          id: 'fluke-sweep', name: 'Varredura de Cauda', slot: 'simple', row: 1,
          kind: 'dash', dmg: 16, speed: 13, stun: 24, cd: 52,
          fx: { chill: 55 }, sfx: 'heavy',
          desc: 'Uma meia-lua de água em forma de cauda de baleia varre a curta distância.',
        }, '#4f9eff'),
        skill('deepseek', 2, {
          id: 'whale-rise', name: 'Ressurgência Abissal', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 15, dmg: 18, stun: 29, launch: -9, cd: 76,
          fx: { chill: 75 }, sfx: 'explosion',
          desc: 'Uma coluna oceânica emerge com o desenho da barbatana da baleia.',
        }, '#66c8ff'),
        skill('deepseek', 3, {
          id: 'undertow', name: 'Corrente de Retorno', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 144, dmg: 0.1, slow: 62, cd: 86,
          fx: { chill: 65, slow: 60 }, sfx: 'water',
          desc: 'Um redemoinho de bolhas puxa o ritmo do oponente para o fundo.',
        }, '#327ccc'),
        skill('deepseek', 4, {
          id: 'whale-song', name: 'Canto das Profundezas', slot: 'ultimate', row: 4,
          kind: 'barrage', dmg: 8, count: 6, homing: 0.35, stun: 24, finisher: 22, cd: 122,
          fx: { chill: 85, vuln: 55 }, sfx: 'ultimate',
          desc: 'Ondas de sonar abissal convergem para um último impacto de cauda.',
        }, '#83e4ff'),
      ],
    },
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
    electric: { sheet: 'kimi', color: '#72f3f1' },
    kimi: { sheet: 'kimi', color: '#72f3f1' },
    deepseek: { sheet: 'deepseek', color: '#50d7ff' },
    database: { sheet: 'dandara-query', color: '#66db9a' },
  });

  Object.assign(SIGNATURES, {
    kimi: {
      trait: 'DESCARGA VOLTAICA',
      desc: 'Descargas explícitas provocam choques curtos; golpes básicos e a Grade Tesla não distorcem comandos.',
      basic: {},
      ability: {},
    },
  });

  const kimi = FIGHTERS.find((fighter) => fighter.id === 'kimi');
  if (kimi) {
    kimi.title = 'A Condutora Voltaica';
    kimi.bio = 'Lutadora anime adulta de cabelo verde-água que concentra eletricidade em descargas ciano e douradas; seus choques são breves.';
    kimi.colors = Object.assign({}, kimi.colors, { accent: '#72f3f1' });
    kimi.traits = Object.assign({}, kimi.traits, { waterRibbon: false, electricArcs: true });
    kimi.quotes = {
      intro: ['A maré está carregada.', 'Pode vir: tenho energia.'],
      win: ['Descarga encerrada.', 'Curto e direto.'],
      special: ['ARCO TURQUESA!', 'PASSO VOLTAICO!', 'PILAR DE TROVÃO!'],
      super: ['TEMPESTADE CIANO!'],
    };
    kimi.special = {
      name: 'Arco Turquesa', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 10, dmg: 9, w: 22, h: 18, color: '#72f3f1', shape: 'bolt', visualSheet: 'kimi', visualRow: 0 },
    };
    kimi.super = { name: 'Tempestade Ciano', type: 'aoe', dmg: 34, radius: 220, visualSheet: 'kimi', visualRow: 4 };
  }

  const deepseek = FIGHTERS.find((fighter) => fighter.id === 'deepseek');
  if (deepseek) {
    deepseek.special = {
      name: 'Sonda de Bolhas', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 9, dmg: 10, w: 28, h: 22, color: '#50d7ff', shape: 'orb', seek: true, visualSheet: 'deepseek', visualRow: 0 },
    };
    deepseek.super = { name: 'Canto das Profundezas', type: 'multi-projectile', dmg: 8, count: 6, visualSheet: 'deepseek', visualRow: 4 };
  }

  const dandara = FIGHTERS.find((fighter) => fighter.id === 'dandara-query');
  if (dandara) {
    dandara.special = {
      name: 'SELECT Rápido', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 10, dmg: 10, w: 24, h: 18, color: '#66db9a', shape: 'bolt', visualSheet: 'dandara-query', visualRow: 0 },
    };
    dandara.super = { name: 'Backup Total', type: 'multi-projectile', dmg: 8, count: 6, visualSheet: 'dandara-query', visualRow: 4 };
  }
})();
