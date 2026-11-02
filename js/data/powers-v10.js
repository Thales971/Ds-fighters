/* DS Fighters V10 — cinco ataques próprios por lutador e atlas 4x5 exclusivo. */
(() => {
  const withVisual = (id, row, color, power) => Object.assign({}, power, {
    visualSheet: id,
    visualRow: row,
    impactSheets: [],
    impactColor: color,
  });
  const kit = (id, element, theme, powers) => ({ element, theme, powers });

  Object.assign(POWERS, {
    gemini: kit('gemini', 'gemini', 'prismas duplos, órbitas espelhadas e ressonância', [
      withVisual('gemini', 0, '#68ebff', {
        id: 'twin-pulse', name: 'Pulso de Dois Prismas', slot: 'simple', row: 0,
        kind: 'shot', dmg: 10, speed: 10, stun: 16, cd: 42,
        fx: { resonance: 150 }, sfx: 'neon',
        desc: 'Dois prismas se cruzam; o rival recebe Resonância e fica marcado para o próximo acerto.',
      }),
      withVisual('gemini', 1, '#bd82ff', {
        id: 'mirror-step', name: 'Passo Espelhado', slot: 'simple', row: 1,
        kind: 'dash', dmg: 12, speed: 14, stun: 17, cd: 47, sfx: 'dash',
        desc: 'Investida curta alternando os rastros ciano e violeta.',
      }),
      withVisual('gemini', 2, '#78eaff', {
        id: 'split-prism', name: 'Prisma Dividido', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 14, dmg: 17, stun: 25, launch: -8, cd: 70, sfx: 'explosion',
        desc: 'Uma coluna de duas cores atinge o ponto marcado e lança o rival.',
      }),
      withVisual('gemini', 3, '#ad83ff', {
        id: 'orbit-lattice', name: 'Órbita em Dueto', slot: 'charge', meter: 1, row: 3,
        kind: 'zone', at: 'target', time: 90, dmg: 0.08, slow: 20, cd: 82, sfx: 'magic',
        desc: 'Uma malha de órbitas espelhadas ocupa a área por pouco tempo.',
      }),
      withVisual('gemini', 4, '#f6d8ff', {
        id: 'twin-eclipse', name: 'Eclipse Geminado', slot: 'ultimate', row: 4,
        kind: 'blast', at: 'target', dmg: 34, stun: 38, launch: -9, radius: 210, cd: 120, sfx: 'ultimate',
        desc: 'Dois sóis prismáticos convergem numa explosão ampla.',
      }),
    ]),
    meta: kit('meta', 'meta', 'estrelas, laços luminosos e ondas de comunidade', [
      withVisual('meta', 0, '#70ddff', {
        id: 'starlight-reaction', name: 'Reação Estelar', slot: 'simple', row: 0,
        kind: 'shot', dmg: 10, speed: 10, stun: 16, cd: 42, fx: { slow: 35 }, sfx: 'magic',
        desc: 'Uma estrela ciano envolve o rival num brilho breve.',
      }),
      withVisual('meta', 1, '#ff9de2', {
        id: 'ribbon-feed', name: 'Laço de Feed', slot: 'simple', row: 1,
        kind: 'dash', dmg: 12, speed: 14, stun: 17, cd: 46, sfx: 'dash',
        desc: 'Meta desliza num laço pastel e acerta de perto.',
      }),
      withVisual('meta', 2, '#8cecff', {
        id: 'repost-prism', name: 'Repost Prismático', slot: 'charge', meter: 0, row: 2,
        kind: 'pillar', at: 'target', delay: 15, dmg: 17, stun: 24, launch: -8, cd: 70,
        fx: { vuln: 72 }, sfx: 'explosion',
        desc: 'Uma coluna de blocos brilhantes abre espaço para o próximo combo.',
      }),
      withVisual('meta', 3, '#f49bdf', {
        id: 'community-veil', name: 'Véu da Comunidade', slot: 'charge', meter: 1, row: 3,
        kind: 'aura', time: 150, grant: 'veil', meterGain: 2, cd: 94, sfx: 'shield',
        desc: 'Uma bolha de estrelas protege Meta: 10% menos dano recebido por até 150 frames.',
      }),
      withVisual('meta', 4, '#fff0a0', {
        id: 'community-pulse', name: 'Pulso Coletivo', slot: 'ultimate', row: 4,
        kind: 'blast', at: 'target', dmg: 34, stun: 38, launch: -9, radius: 210, cd: 120,
        fx: { vuln: 56 }, sfx: 'ultimate',
        desc: 'Um pulso luminoso de estrelas e corações se espalha pela arena.',
      }),
    ]),
  });

  Object.assign(ELEMENT_FX, {
    gemini: { sheet: 'gemini', color: '#68ebff' },
    meta: { sheet: 'meta', color: '#70ddff' },
  });

  Object.assign(SIGNATURES, {
    gemini: { trait: 'RESSONÂNCIA', desc: 'O próximo acerto consome a marca e causa 15% de dano adicional.', basic: {}, ability: {} },
    meta: { trait: 'VÉU DA COMUNIDADE', desc: 'Uma proteção breve reduz o dano recebido sem bloquear comandos.', basic: {}, ability: {} },
  });
})();
