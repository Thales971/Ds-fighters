/* DS FIGHTERS — CONQUISTAS: medalhas locais persistidas no perfil.
   Eventos chegam pelo Profile.grantAchievement(id); a tela do menu
   mostra o progresso. Nada aqui depende de rede. */
const ACHIEVEMENTS = [
  { id: 'primeiro-ko',   name: 'Primeiro Nocaute',      desc: 'Vença sua primeira luta' },
  { id: 'perfeito',      name: 'Vitória Perfeita',      desc: 'Vença um round sem tomar dano' },
  { id: 'combo-10',      name: 'Combo Insano',          desc: 'Acerte um combo de 10 golpes' },
  { id: 'combo-20',      name: 'Combo Lendário',       desc: 'Acerte um combo de 20 golpes' },
  { id: 'arcade-campeao',name: 'Campeão do Arcade',    desc: 'Zere o modo arcade (7 lutas)' },
  { id: 'survival-10',   name: 'Sobrevivente',         desc: '10 vitórias seguidas no survival' },
  { id: 'lutadores-10',  name: 'Elenco Variado',       desc: 'Vença com 10 lutadores diferentes' },
  { id: 'lutadores-25',  name: 'Mestre do Elenco',     desc: 'Vença com 25 lutadores diferentes' },
  { id: 'elementos-6',   name: 'Domínio Elemental',    desc: 'Vença com 6 elementos diferentes' },
  { id: 'codigos-3',     name: 'Caçador de Segredos',   desc: 'Desbloqueie todos os secretos' },
  { id: 'online-1',      name: 'Salvo na Rede',         desc: 'Vença uma partida online' },
  { id: 'ultimate-5',    name: 'Finalizador',          desc: 'Solte 5 ultimate em uma luta' },
  { id: 'wake-up',       name: 'Levantou Lutando',      desc: 'Acerte um wake-up attack' },
  { id: 'double-jump-50',name: 'Pernas de Aço',        desc: 'Use 50 double jumps' },
  { id: 'dojo',          name: 'Discípulo do Dojo',     desc: 'Complete o treino guiado' },
];
