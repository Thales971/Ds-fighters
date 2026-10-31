/* ============================================================
   DS FIGHTERS — 5 poderes por lutador.
   2 simples (sempre prontos), 2 de carga (medidor enche
   ao bater e ao apanhar) e 1 ultimate.
   Cada golpe aponta para um sheet em assets/fx/layout.js.
   Trocar o PNG não exige mudar este arquivo.
   ============================================================ */

const POWERS = {
  du: kit('fogo', [
    simples('Lâmina de Brasa', '236P', 'projectile', { dmg: 12, speed: 8.5, button: 'special' }),
    simples('Chute de Forja', '214K', 'dash', { dmg: 13, range: 118 }),
    carga('Meteoro', '236K', 0, 'projectile', { dmg: 18, speed: 7, heavy: true, stun: 18 }),
    carga('Aura de Fúria', '214P', 1, 'aura', { dmg: 8, buff: 1.4, time: 180 }),
    ult('Inferno do Código', 'blast', { dmg: 28, radius: 210 }),
  ]),
  iales: kit('gelo', [
    simples('Estilhaço', '236P', 'projectile', { dmg: 11, speed: 9, button: 'special' }),
    simples('Toque Frio', '214K', 'dash', { dmg: 11, range: 110, heal: 6 }),
    carga('Orbe Glacial', '236K', 0, 'projectile', { dmg: 17, speed: 6.2, heavy: true, slow: 120, stun: 18 }),
    carga('Armadura de Gelo', '214P', 1, 'aura', { dmg: 6, invuln: 70, time: 90 }),
    ult('Zero Absoluto', 'rush', { dmg: 30, hits: 5 }),
  ]),
  felipinho: kit('raio', [
    simples('Faísca', '236P', 'projectile', { dmg: 10, speed: 13, button: 'special' }),
    simples('Drift', '214K', 'dash', { dmg: 12, range: 130 }),
    carga('Trovoada', '236K', 0, 'projectile', { dmg: 8, speed: 11, count: 3, stun: 12 }),
    carga('Nitro', '214P', 1, 'aura', { dmg: 6, speedBoost: 200, time: 160 }),
    ult('Modo Deus', 'rush', { dmg: 32, hits: 5 }),
  ]),
  stack: kit('vento', [
    simples('Resposta Certa', '236P', 'projectile', { dmg: 11, speed: 9, button: 'special' }),
    simples('Copy Rápido', '214K', 'dash', { dmg: 11, range: 120, heal: 4 }),
    carga('Tempestade de Abas', '236K', 0, 'projectile', { dmg: 7, speed: 8, count: 4 }),
    carga('Aceito', '214P', 1, 'aura', { dmg: 4, heal: 14, time: 40 }),
    ult('Copy-Paste', 'blast', { dmg: 26, radius: 200, heal: 8 }),
  ]),
  gitmaster: kit('sombra', [
    simples('Shuriken de Commit', '236P', 'projectile', { dmg: 10, speed: 12, button: 'special' }),
    simples('Git Dash', '214K', 'dash', { dmg: 12, range: 140 }),
    carga('Branch Sombria', '236K', 0, 'dash', { dmg: 16, range: 150 }),
    carga('Stash', '214P', 1, 'aura', { dmg: 4, invuln: 80, time: 80 }),
    ult('Rebase Interativo', 'rush', { dmg: 28, hits: 6 }),
  ]),
  bughunter: kit('veneno', [
    simples('Relatório', '236P', 'projectile', { dmg: 11, speed: 8, stun: 18, button: 'special' }),
    simples('Caça', '214K', 'dash', { dmg: 12, range: 124 }),
    carga('Infestação', '236K', 0, 'projectile', { dmg: 14, speed: 7, poison: 180 }),
    carga('Antídoto', '214P', 1, 'aura', { dmg: 4, heal: 16, time: 30 }),
    ult('Hotfix', 'blast', { dmg: 24, radius: 190, heal: 10 }),
  ]),
  frontend: kit('neon', [
    simples('Caixa de Layout', '236P', 'projectile', { dmg: 11, speed: 9, button: 'special' }),
    simples('Flex Dash', '214K', 'dash', { dmg: 12, range: 126 }),
    carga('Gradiente', '236K', 0, 'aura', { dmg: 8, buff: 1.35, time: 170 }),
    carga('Keyframe', '214P', 1, 'projectile', { dmg: 16, speed: 7.5, stun: 16 }),
    ult('CSS Ultra', 'blast', { dmg: 27, radius: 220 }),
  ]),
  backend: kit('terra', [
    simples('Erro 500', '236P', 'projectile', { dmg: 14, speed: 6.5, heavy: true, button: 'special' }),
    simples('Query Pesada', '214K', 'dash', { dmg: 14, range: 108 }),
    carga('Muralha', '236K', 0, 'projectile', { dmg: 20, speed: 5.5, heavy: true, stun: 18 }),
    carga('Transação', '214P', 1, 'aura', { dmg: 4, heal: 12, time: 40 }),
    ult('DDoS de Socos', 'rush', { dmg: 34, hits: 4 }),
  ]),
  devops: kit('metal', [
    simples('Pipeline', '236P', 'projectile', { dmg: 8, speed: 9, count: 2, button: 'special' }),
    simples('Rollback', '214K', 'dash', { dmg: 12, range: 116 }),
    carga('Cluster', '236K', 0, 'projectile', { dmg: 7, speed: 8, count: 4 }),
    carga('Container', '214P', 1, 'aura', { dmg: 6, buff: 1.25, time: 160 }),
    ult('Deploy Contínuo', 'rush', { dmg: 30, hits: 6 }),
  ]),
  qa: kit('acido', [
    simples('Caso de Teste', '236P', 'projectile', { dmg: 11, speed: 8, stun: 16, button: 'special' }),
    simples('Assert', '214K', 'dash', { dmg: 12, range: 112 }),
    carga('Regressão', '236K', 0, 'projectile', { dmg: 15, speed: 6.5, slow: 140 }),
    carga('Cobertura', '214P', 1, 'aura', { dmg: 6, buff: 1.2, time: 150 }),
    ult('Suíte Completa', 'blast', { dmg: 26, radius: 200 }),
  ]),
  scrum: kit('tempo', [
    simples('Post-it', '236P', 'projectile', { dmg: 10, speed: 8.5, button: 'special' }),
    simples('Daily', '214K', 'dash', { dmg: 10, range: 110, heal: 8 }),
    carga('Sprint', '236K', 0, 'aura', { dmg: 6, speedBoost: 220, time: 170 }),
    carga('Bloqueio', '214P', 1, 'projectile', { dmg: 14, speed: 7, stun: 22 }),
    ult('Planning Poker', 'blast', { dmg: 24, radius: 200, heal: 12 }),
  ]),
  fullstack: kit('arcano', [
    simples('Commit Duplo', '236P', 'projectile', { dmg: 7, speed: 9, count: 2, button: 'special' }),
    simples('Merge', '214K', 'dash', { dmg: 13, range: 122 }),
    carga('Stack Trace', '236K', 0, 'aura', { dmg: 8, buff: 1.35, time: 160 }),
    carga('Monorepo', '214P', 1, 'projectile', { dmg: 18, speed: 7, heavy: true }),
    ult('Monolito Perfeito', 'blast', { dmg: 30, radius: 230 }),
  ]),
  senpai: kit('espirito', [
    simples('Apostila', '236P', 'projectile', { dmg: 12, speed: 7.5, button: 'special' }),
    simples('Correção', '214K', 'dash', { dmg: 12, range: 108, heal: 5 }),
    carga('Lição', '236K', 0, 'aura', { dmg: 8, buff: 1.3, heal: 6, time: 170 }),
    carga('Chamada', '214P', 1, 'projectile', { dmg: 16, speed: 8, stun: 16 }),
    ult('Prova Final', 'rush', { dmg: 32, hits: 5 }),
  ]),
};

function kit(element, powers) {
  return { element, powers };
}

function simples(name, input, kind, extra) {
  return move(name, 'simple', input, null, kind, extra);
}

function carga(name, input, meter, kind, extra) {
  return move(name, 'charge', input, meter, kind, extra);
}

function ult(name, kind, extra) {
  return move(name, 'ultimate', '236236P', null, kind, Object.assign({ button: 'super' }, extra));
}

function move(name, slot, input, meter, kind, extra) {
  return Object.assign({
    name, slot, input, meter, kind,
    dmg: 10, speed: 8, range: 100, stun: 14, hits: 4, radius: 180,
    count: 1, heal: 0, buff: 0, time: 0, invuln: 0, poison: 0, slow: 0, speedBoost: 0,
    heavy: false, button: null,
  }, extra);
}
