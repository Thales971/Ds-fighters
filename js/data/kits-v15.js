/* DS Fighters — kits renovados (nov/2026, pedido do dono: "muito genericos").
   Carregado DEPOIS de todas as camadas de balanceamento (powers-balance-v6..v13,
   balance-v14 e a tabela unica balance-final.js): o kit aqui e o definitivo.
   Usa as mesmas linhas do atlas de habilidades de cada um (sem arte nova). */
(() => {
  const vis = (id, row, color) => ({ visualSheet: id, visualRow: row, impactSheets: [], impactColor: color });

  /* WINX.EXE — a Guardia do Desktop: o sistema operacional virou arma.
     Pop-ups que tampam a tela, Alt+Tab pras costas, tela azul que congela,
     desfragmentar que puxa e embaralha, e a atualizacao forcada. */
  if (POWERS['winx-exe']) {
    POWERS['winx-exe'] = Object.assign({}, POWERS['winx-exe'], {
      theme: 'sistema operacional: pop-ups, Alt+Tab, tela azul, desfragmentar e atualizacao forcada',
      powers: [
        Object.assign({ id: 'popup-erro', name: 'Pop-up de Erro', slot: 'simple', row: 0, kind: 'barrage', count: 3, dmg: 8, seek: true, homing: 0.4, cd: 46, sfx: 'neon',
          fx: { blind: 45, glitch: 40 },
          desc: '3 janelas de ERRO perseguem o rival e tampam a tela dele (CEGO).' }, vis('winx-exe', 0, '#45e6ff')),
        Object.assign({ id: 'alt-tab', name: 'Alt+Tab', slot: 'simple', row: 1, kind: 'shadowport', burstDmg: 18, stun: 22, cd: 54, sfx: 'magic',
          fx: { dizzy: 30 },
          desc: 'Some da janela e reaparece nas COSTAS do rival (aperte soco/chute pra emendar) ou cai por CIMA esmagando: TONTO.' }, vis('winx-exe', 1, '#ff4fd8')),
        Object.assign({ id: 'tela-azul', name: 'Tela Azul', slot: 'charge', meter: 0, row: 2, kind: 'pillar', at: 'target', big: true, delay: 20, dmg: 20, stun: 30, launch: -8, cd: 76, sfx: 'explosion',
          fx: { freeze: 45, glitch: 60 },
          desc: 'O sistema do rival trava: TELA AZUL que CONGELA por um instante.' }, vis('winx-exe', 2, '#2a6bff')),
        Object.assign({ id: 'desfragmentar', name: 'Desfragmentar', slot: 'charge', meter: 1, row: 3, kind: 'pull', range: 360, dmg: 12, stun: 30, cd: 92, sfx: 'neon',
          fx: { shuffle: 150, meterSlow: 40 },
          desc: 'Reorganiza o disco: PUXA o rival pra perto e EMBARALHA os botões dele.' }, vis('winx-exe', 3, '#45e6ff')),
        Object.assign({ id: 'atualizacao-forcada', name: 'Atualização Forçada', slot: 'ultimate', row: 4, kind: 'blast', at: 'target', radius: 260, dmg: 30, stun: 40, launch: -9, cd: 130, sfx: 'ultimate',
          fx: { shuffle: 240, lock: 90, meterBurn: 35 },
          desc: 'ULT: "Instalando atualização 1 de 87...": botões EMBARALHADOS, SEM PODERES e o medidor do rival cai.' }, vis('winx-exe', 4, '#45e6ff')),
      ],
    });
  }

  /* GUARDA DIGITAL — a Sentinela do Perimetro: seguranca de rede.
     Taser que paralisa, algemas que prendem, muralha de firewall, drones de
     vigilancia e a quarentena que isola o invasor. */
  if (POWERS['guarda-digital']) {
    POWERS['guarda-digital'] = Object.assign({}, POWERS['guarda-digital'], {
      theme: 'seguranca de rede: taser, algemas, firewall, drones e quarentena',
      powers: [
        Object.assign({ id: 'taser-rede', name: 'Taser de Rede', slot: 'simple', row: 0, kind: 'beam', range: 300, dmg: 14, stun: 20, cd: 44, sfx: 'thunder_cast',
          fx: { shock: 70, paralyze: 18 },
          desc: 'Descarga do taser em linha: ELETRIZA e PARALISA de leve.' }, vis('guarda-digital', 0, '#2ad4ff')),
        Object.assign({ id: 'algemas', name: 'Algemas Criptografadas', slot: 'simple', row: 1, kind: 'shot', speed: 12, dmg: 12, stun: 16, trap: 55, cd: 60, sfx: 'metal',
          fx: { vuln: 90 },
          desc: 'Algemas de dados que PRENDEM o rival no lugar e deixam VULNERÁVEL.' }, vis('guarda-digital', 1, '#48dfff')),
        Object.assign({ id: 'muralha-firewall', name: 'Muralha de Firewall', slot: 'charge', meter: 0, row: 2, kind: 'wall', time: 330, dmg: 12, slow: 30, cd: 90, sfx: 'shield',
          desc: 'Ergue um firewall: BLOQUEIA projéteis e deixa LENTO quem encostar.' }, vis('guarda-digital', 2, '#2ad4ff')),
        Object.assign({ id: 'drones', name: 'Drones de Vigilância', slot: 'charge', meter: 1, row: 3, kind: 'rain', count: 4, dmg: 20, cd: 100, sfx: 'explosion',
          fx: { vuln: 80, shock: 40 },
          desc: '4 drones bombardeiam a posição do rival, com aviso: VULNERÁVEL + ELETRIZADO.' }, vis('guarda-digital', 3, '#7fe0ff')),
        Object.assign({ id: 'quarentena', name: 'Quarentena', slot: 'ultimate', row: 4, kind: 'zone', at: 'target', time: 260, w: 300, dmg: 0.16, slow: 60, cd: 130, sfx: 'ultimate',
          fx: { lock: 100, meterSlow: 90 },
          desc: 'ULT: isola o rival em QUARENTENA: dano contínuo, LENTO, SEM PODERES e medidor travado.' }, vis('guarda-digital', 4, '#2ad4ff')),
      ],
    });
  }
  if (typeof SIGNATURES !== 'undefined') {
    SIGNATURES['guarda-digital'] = Object.assign({}, SIGNATURES['guarda-digital'] || {}, {
      trait: 'SENTINELA', desc: 'Controle de perímetro: taser, algemas que prendem, firewall, drones e quarentena.',
    });
    SIGNATURES['winx-exe'] = Object.assign({}, SIGNATURES['winx-exe'] || {}, {
      trait: 'SISTEMA OPERACIONAL', desc: 'Pop-ups que cegam, Alt+Tab pras costas, tela azul, desfragmentar que embaralha e atualização forçada.',
    });
  }
})();
