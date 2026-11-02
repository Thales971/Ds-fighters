/* DS Fighters — torneio online coordenado por Vercel Functions. */
(() => {
  const API = window.DS_TOURNAMENT_API || '/api/tournaments';
  const STORAGE_KEY = 'dsf.tournament.v1.';
  const LAST_KEY = 'dsf.tournament.last.v1';
  const state = { ready: false, code: '', credentials: null, tournament: null, busy: false, timer: null, renderedSignature: '', activeMatchId: '', activeRoomCode: '', refreshInFlight: false, healthInFlight: false, pendingRequests: Object.create(null) };
  const $ = (id) => document.getElementById(id);

  function setStatus(message, tone = 'info') {
    const el = $('tourney-status');
    if (!el) return;
    el.textContent = message;
    el.className = `tourney-status ${tone}`;
    updateResumeButton();
  }

  function updateResumeButton() {
    const button = $('btn-res-tournament');
    if (button) button.hidden = !state.code;
  }

  function setAvailability(ready) {
    state.ready = !!ready;
    state.renderedSignature = '';
    ['tourney-create', 'tourney-join', 'tourney-start', 'tourney-refresh'].forEach((id) => {
      const button = $(id);
      if (button) button.disabled = !state.ready;
    });
    document.querySelectorAll('[data-tourney-action], [data-tourney-winner]').forEach((control) => { control.disabled = !state.ready; });
    render();
  }

  function markUnavailable(error) {
    if (error && error.status && error.status < 500) return;
    if (!state.ready) return;
    setAvailability(false);
  }

  function readSaved(code) {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + code) || 'null'); } catch (_) { return null; }
  }

  function saveCredentials(code, credentials) {
    state.code = code;
    state.credentials = credentials;
    try {
      localStorage.setItem(STORAGE_KEY + code, JSON.stringify(credentials));
      localStorage.setItem(LAST_KEY, code);
    } catch (_) {
      setStatus('Não foi possível salvar o token neste navegador. Não feche esta página antes do torneio terminar.', 'warn');
    }
    updateResumeButton();
  }

  function operationStorageKey(action, code = '') { return `dsf.tournament.request.v1.${action}.${code || 'new'}`; }

  function requestIdFor(action, code = '') {
    const key = operationStorageKey(action, code);
    let id = state.pendingRequests[key];
    try { id = id || sessionStorage.getItem(key); } catch (_) { /* fallback em memória */ }
    if (id && /^[A-Za-z0-9_-]{22,64}$/.test(id)) { state.pendingRequests[key] = id; return id; }
    id = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    state.pendingRequests[key] = id;
    try { sessionStorage.setItem(key, id); } catch (_) { /* fallback em memória nesta aba */ }
    return id;
  }

  function completeRequest(action, code = '') {
    const key = operationStorageKey(action, code);
    delete state.pendingRequests[key];
    try { sessionStorage.removeItem(key); } catch (_) { /* */ }
  }

  function mutationStorageKey(action, extra = {}) {
    const fields = Object.keys(extra).sort().map((key) => `${key}=${String(extra[key])}`).join('|');
    const playerId = state.credentials && state.credentials.playerId || 'anonymous';
    return `dsf.tournament.op.v1.${state.code}.${playerId}.${action}.${fields}`;
  }

  function requestIdForMutation(action, extra = {}) {
    const key = mutationStorageKey(action, extra);
    let id = state.pendingRequests[key];
    try { id = id || sessionStorage.getItem(key); } catch (_) { /* fallback em memória */ }
    if (id && /^[A-Za-z0-9_-]{22,64}$/.test(id)) { state.pendingRequests[key] = id; return id; }
    id = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    state.pendingRequests[key] = id;
    try { sessionStorage.setItem(key, id); } catch (_) { /* fallback em memória nesta aba */ }
    return id;
  }

  function completeMutationRequest(action, extra = {}) {
    const key = mutationStorageKey(action, extra);
    delete state.pendingRequests[key];
    try { sessionStorage.removeItem(key); } catch (_) { /* */ }
  }

  async function request(method, payload = null, query = '') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(API + query, {
        method,
        cache: 'no-store',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('A API de torneio demorou demais para responder. Tente atualizar novamente.');
      throw error;
    } finally { clearTimeout(timeout); }
    let data;
    try { data = await response.json(); } catch (_) { data = {}; }
    if (!response.ok) {
      const error = new Error(data.message || 'Serviço de torneio indisponível.');
      error.status = response.status;
      error.code = data.error || '';
      throw error;
    }
    return data;
  }

  async function checkHealth() {
    if (state.healthInFlight) return;
    state.healthInFlight = true;
    try {
      const data = await request('GET', null, '?health=1');
      if (!data.ok) throw new Error('O armazenamento persistente ainda não está disponível.');
      setAvailability(true);
      setStatus('Torneio online pronto · dados persistidos no Redis da Vercel · partidas P2P.', 'ok');
    } catch (error) {
      setAvailability(false);
      const detail = error.message.includes('fetch') || error.message.includes('Failed')
        ? 'A API Vercel ainda não está disponível.'
        : error.message;
      const setup = detail.toLowerCase().includes('upstash') ? '' : ' Conecte Upstash Redis pela Vercel Marketplace e faça redeploy para ativar torneios.';
      const saved = state.code ? ` Código salvo: ${state.code}.` : '';
      setStatus(`${detail}${setup}${saved}`, 'warn');
    } finally { state.healthInFlight = false; }
  }

  function cleanCode(value) { return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }
  function playerName() {
    try { return Net.myName(); } catch (_) { return ($('net-name') && $('net-name').value) || 'Jogador'; }
  }

  async function create() {
    if (!state.ready || state.busy) return;
    state.busy = true;
    try {
      const name = $('tourney-name').value.trim() || 'Torneio DS Fighters';
      const capacity = Number($('tourney-capacity').value);
      const data = await request('POST', { action: 'create', requestId: requestIdFor('create'), name, playerName: playerName(), capacity });
      completeRequest('create');
      saveCredentials(data.code, { playerId: data.playerId, token: data.token });
      state.tournament = data.tournament;
      render();
      setStatus(`Torneio ${data.code} criado. Compartilhe o código para chamar participantes.`, 'ok');
    } catch (error) { markUnavailable(error); setStatus(error.message, 'err'); }
    finally { state.busy = false; }
  }

  async function join() {
    if (!state.ready || state.busy) return;
    const code = cleanCode($('tourney-join-code').value);
    if (code.length !== 6) { setStatus('Digite o código de seis caracteres do torneio.', 'warn'); return; }
    state.busy = true;
    try {
      const data = await request('POST', { action: 'join', requestId: requestIdFor('join', code), code, playerName: playerName() });
      completeRequest('join', code);
      saveCredentials(data.code, { playerId: data.playerId, token: data.token });
      state.tournament = data.tournament;
      $('tourney-join-code').value = '';
      render();
      setStatus(`Você entrou em ${data.code}.`, 'ok');
    } catch (error) { markUnavailable(error); setStatus(error.message, 'err'); }
    finally { state.busy = false; }
  }

  async function refresh(silent = false) {
    if (!state.ready || !state.code || state.busy || state.refreshInFlight) return;
    state.refreshInFlight = true;
    try {
      const data = await request('GET', null, `?code=${encodeURIComponent(state.code)}`);
      const previous = state.tournament;
      state.tournament = data.tournament;
      render();
      disconnectInvalidatedRoom(previous, state.tournament);
      if (!silent) setStatus(`Torneio ${state.code} atualizado · ${state.tournament.players.length}/${state.tournament.capacity} participantes.`, 'ok');
    } catch (error) {
      markUnavailable(error);
      if (!silent || !state.ready) setStatus(error.message, 'err');
    } finally { state.refreshInFlight = false; }
  }

  async function mutate(action, extra = {}) {
    if (!state.ready || !state.credentials || !state.code || state.busy) return null;
    state.busy = true;
    const requestId = requestIdForMutation(action, extra);
    try {
      const data = await request('POST', Object.assign({ action, code: state.code }, state.credentials, extra, { requestId }));
      completeMutationRequest(action, extra);
      const previous = state.tournament;
      state.tournament = data.tournament;
      render();
      disconnectInvalidatedRoom(previous, state.tournament);
      return data;
    } catch (error) {
      markUnavailable(error);
      setStatus(error.message, 'err');
      return null;
    } finally { state.busy = false; }
  }

  function makeButton(label, action, matchId, extra = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav btn tiny';
    button.textContent = label;
    button.disabled = !state.ready;
    button.dataset.tourneyAction = action;
    button.dataset.matchId = matchId;
    Object.entries(extra).forEach(([key, value]) => { button.dataset[key] = String(value); });
    return button;
  }

  function winnerSelect(match, initial) {
    const label = document.createElement('label');
    label.className = 'tourney-winner-label';
    label.textContent = 'Vencedor';
    const select = document.createElement('select');
    select.dataset.tourneyWinner = match.id;
    select.disabled = !state.ready;
    match.playerIds.forEach((id) => {
      if (!id) return;
      const option = document.createElement('option');
      option.value = id;
      option.textContent = match.players[match.playerIds.indexOf(id)] || 'Jogador';
      if (id === initial) option.selected = true;
      select.appendChild(option);
    });
    label.appendChild(select);
    return label;
  }

  function matchCard(match, tournament, actorId, owner) {
    const card = document.createElement('article');
    card.className = `tourney-match status-${match.status}`;
    const heading = document.createElement('h4');
    heading.textContent = `Confronto ${match.index}`;
    card.appendChild(heading);

    const versus = document.createElement('p');
    versus.className = 'tourney-versus';
    versus.textContent = `${match.players[0] || 'BYE'}  ×  ${match.players[1] || 'BYE'}`;
    card.appendChild(versus);

    const status = document.createElement('p');
    const statusNames = { ready: 'Pronto', joining: 'Aguardando o adversário conectar', connected: 'P2P conectado · aguardando início da luta', playing: 'Em andamento', reported: 'Aguardando confirmação', disputed: 'Contestado', complete: 'Concluído', bye: 'Avança por bye', void: 'Sem confronto', waiting: 'Aguardando rodada anterior' };
    status.textContent = statusNames[match.status] || match.status;
    status.className = 'tourney-match-status';
    card.appendChild(status);

    if (match.roomCode) {
      const code = document.createElement('p');
      code.className = 'tourney-room-code';
      code.textContent = `Sala P2P: ${match.roomCode}`;
      card.appendChild(code);
    }
    if (match.winnerName) {
      const winner = document.createElement('p');
      winner.className = 'tourney-winner';
      winner.textContent = `Vencedor: ${match.winnerName}`;
      card.appendChild(winner);
    }

    const actions = document.createElement('div');
    actions.className = 'tourney-match-actions';
    const isPlayer = match.playerIds.includes(actorId);
    if (match.status === 'ready' && actorId === match.hostPlayerId) {
      actions.appendChild(makeButton('HOSPEDAR SALA P2P', 'host', match.id));
    }
    if (match.status === 'ready' && isPlayer && actorId !== match.hostPlayerId) {
      const waiting = document.createElement('small');
      waiting.textContent = 'Aguardando o anfitrião abrir a sala.';
      actions.appendChild(waiting);
    }
    if (match.status === 'joining' && isPlayer && actorId !== match.hostPlayerId) {
      actions.appendChild(makeButton('ENTRAR NA SALA P2P', 'join-room', match.id));
    } else if (match.status === 'joining' && actorId === match.hostPlayerId) {
      const waiting = document.createElement('small');
      waiting.textContent = 'Aguardando o adversário conectar à sala P2P.';
      actions.appendChild(waiting);
    }
    if (match.status === 'connected' && isPlayer) {
      const waiting = document.createElement('small');
      waiting.textContent = 'Escolha lutadores e marque PRONTO no lobby P2P. O resultado só libera depois de a luta começar.';
      actions.appendChild(waiting);
    }
    if (['ready', 'joining', 'connected', 'playing'].includes(match.status) && owner && match.playerIds.filter(Boolean).length === 2) {
      const otherHost = match.playerIds.find((id) => id !== match.hostPlayerId);
      actions.appendChild(makeButton(match.status === 'ready' ? 'TROCAR ANFITRIÃO' : 'REABRIR SALA', 'rehost', match.id, { hostPlayerId: otherHost }));
    }
    if (match.status === 'playing' && isPlayer) {
      if (match.roomCode && actorId !== match.hostPlayerId) actions.appendChild(makeButton('ENTRAR NA SALA P2P', 'join-room', match.id));
      actions.appendChild(winnerSelect(match, match.playerIds[0]));
      actions.appendChild(makeButton('REPORTAR RESULTADO', 'claim', match.id));
    }
    if (match.status === 'reported' && match.claim) {
      if (actorId === match.claim.byPlayerId) {
        const waiting = document.createElement('small');
        waiting.textContent = `Aguardando ${match.claim.winnerName} ser confirmado pelo adversário.`;
        actions.appendChild(waiting);
      } else if (isPlayer) {
        actions.appendChild(makeButton(`CONFIRMAR ${match.claim.winnerName}`, 'confirm', match.id, { winnerId: match.claim.winnerId }));
        actions.appendChild(winnerSelect(match, match.playerIds.find((id) => id !== match.claim.winnerId)));
        actions.appendChild(makeButton('CONTESTAR RESULTADO', 'dispute', match.id));
      }
    }
    if (match.status === 'disputed' && owner) {
      actions.appendChild(winnerSelect(match, match.dispute && match.dispute.firstWinnerId));
      actions.appendChild(makeButton('RESOLVER COMO ORGANIZADOR', 'resolve', match.id));
    }
    card.appendChild(actions);
    return card;
  }

  function captureBracketInteraction(root) {
    const selected = new Map(Array.from(root.querySelectorAll('[data-tourney-winner]'), (select) => [select.dataset.tourneyWinner, select.value]));
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const focus = active ? {
      id: active.id || '',
      winnerId: active.dataset.tourneyWinner || '',
      action: active.dataset.tourneyAction || '',
      matchId: active.dataset.matchId || '',
      hostPlayerId: active.dataset.hostPlayerId || '',
    } : null;
    return { selected, focus };
  }

  function restoreBracketInteraction(root, interaction) {
    interaction.selected.forEach((value, matchId) => {
      const select = Array.from(root.querySelectorAll('[data-tourney-winner]')).find((entry) => entry.dataset.tourneyWinner === matchId);
      if (select && Array.from(select.options).some((option) => option.value === value)) select.value = value;
    });
    const focus = interaction.focus;
    if (!focus) return;
    let target = null;
    if (focus.winnerId) target = Array.from(root.querySelectorAll('[data-tourney-winner]')).find((entry) => entry.dataset.tourneyWinner === focus.winnerId);
    else if (focus.action) target = Array.from(root.querySelectorAll('[data-tourney-action]')).find((entry) => entry.dataset.tourneyAction === focus.action && entry.dataset.matchId === focus.matchId && entry.dataset.hostPlayerId === focus.hostPlayerId);
    else if (focus.id) target = document.getElementById(focus.id);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  function render() {
    const home = $('tourney-home');
    const board = $('tourney-board');
    if (!home || !board) return;
    const tournament = state.tournament;
    const signature = `${state.ready ? 'ready' : 'offline'}:${tournament ? JSON.stringify(tournament) : 'none'}`;
    if (signature === state.renderedSignature) { updateResumeButton(); return; }
    state.renderedSignature = signature;
    home.hidden = !!tournament;
    board.hidden = !tournament;
    updateResumeButton();
    if (!tournament) return;

    $('tourney-code').textContent = tournament.code;
    $('tourney-name-view').textContent = tournament.name;
    $('tourney-capacity-view').textContent = `${tournament.players.length} / ${tournament.capacity}`;
    $('tourney-start').hidden = !(tournament.ownerId === state.credentials?.playerId && tournament.status === 'open');
    $('tourney-start').disabled = tournament.players.length < 2 || !state.ready;
    $('tourney-refresh').disabled = !state.ready;

    const people = $('tourney-players');
    people.replaceChildren();
    tournament.players.forEach((player) => {
      const item = document.createElement('li');
      item.textContent = `${player.seed}. ${player.name}${player.id === tournament.ownerId ? ' · ORGANIZADOR' : ''}`;
      people.appendChild(item);
    });

    const root = $('tourney-bracket');
    const interaction = captureBracketInteraction(root);
    root.replaceChildren();
    tournament.rounds.forEach((round, roundIndex) => {
      const section = document.createElement('section');
      section.className = 'tourney-round';
      const title = document.createElement('h3');
      title.textContent = roundIndex === tournament.rounds.length - 1 ? 'FINAL' : `RODADA ${roundIndex + 1}`;
      section.appendChild(title);
      round.forEach((match) => section.appendChild(matchCard(match, tournament, state.credentials?.playerId, tournament.ownerId === state.credentials?.playerId)));
      root.appendChild(section);
    });
    if (tournament.status === 'complete') {
      const champion = document.createElement('p');
      champion.className = 'tourney-champion';
      champion.textContent = `CAMPEÃO: ${tournament.winnerName || '—'}`;
      root.appendChild(champion);
    }
    restoreBracketInteraction(root, interaction);
  }

  function currentMatch(tournament, matchId) {
    return tournament && tournament.rounds.flat().find((match) => match.id === matchId) || null;
  }

  function disconnectInvalidatedRoom(previous, next) {
    if (!state.activeMatchId || !state.activeRoomCode || !Net.room) return;
    const before = currentMatch(previous, state.activeMatchId);
    const after = currentMatch(next, state.activeMatchId);
    if (!before || !after || !before.roomCode) return;
    if (after.roomCode === state.activeRoomCode && !['ready', 'complete', 'disputed'].includes(after.status)) return;
    const staleCode = state.activeRoomCode;
    state.activeMatchId = '';
    state.activeRoomCode = '';
    Net.leave(true);
    if (typeof UI !== 'undefined' && typeof UI.show === 'function') UI.show('online');
    setStatus(`A sala P2P ${staleCode} foi encerrada ou substituída pelo torneio.`, 'warn');
  }

  async function startRoom(matchId) {
    if (!state.ready || !state.tournament || !state.credentials) return;
    const match = state.tournament.rounds.flat().find((entry) => entry.id === matchId);
    if (!match || match.hostPlayerId !== state.credentials.playerId) return;
    try {
      if (Net.room) Net.leave(true);
      Net.$('net-transport').value = 'p2p';
      Net.$('net-mode').value = '1v1';
      await Net.create();
      const until = Date.now() + 12000;
      while (Date.now() < until && !(Net.room && Net.room.code)) await new Promise((resolve) => setTimeout(resolve, 100));
      if (!(Net.room && Net.room.code)) throw new Error('A sala P2P não abriu. Verifique a conexão e tente novamente.');
      const roomCode = Net.room.code;
      state.activeMatchId = matchId;
      state.activeRoomCode = roomCode;
      const result = await mutate('room', { matchId, roomCode });
      if (result) setStatus(`Sala ${roomCode} publicada. A partida só libera o resultado depois que o adversário entrar.`, 'ok');
      else { state.activeMatchId = ''; state.activeRoomCode = ''; if (Net.room) Net.leave(true); }
    } catch (error) { setStatus(error.message, 'err'); }
  }

  async function joinRoom(matchId) {
    if (!state.tournament) return;
    const match = state.tournament.rounds.flat().find((entry) => entry.id === matchId);
    if (!match || !match.roomCode) return;
    try {
      if (Net.room) Net.leave(true);
      Net.$('net-transport').value = 'p2p';
      Net.$('net-mode').value = '1v1';
      Net.$('net-code').value = match.roomCode;
      await Net.join();
      const until = Date.now() + 15000;
      const inRoom = () => Net.room && Net.room.code === match.roomCode && Net.room.players.length >= 2 && Net.myPlayer();
      while (Date.now() < until && !inRoom()) await new Promise((resolve) => setTimeout(resolve, 100));
      if (!inRoom()) throw new Error('A conexão P2P não confirmou a entrada na sala. Confira o código e tente novamente.');
      state.activeMatchId = matchId;
      state.activeRoomCode = match.roomCode;
      const confirmed = await mutate('connected', { matchId, roomCode: match.roomCode });
      if (confirmed) setStatus(`Conectado à sala ${match.roomCode}. Escolha seu lutador e marque PRONTO no lobby.`, 'ok');
    } catch (error) { setStatus(error.message, 'err'); }
  }

  async function matchStarted(roomCode) {
    if (!state.ready || !state.activeMatchId || state.activeRoomCode !== String(roomCode || '').toUpperCase()) return null;
    return mutate('started', { matchId: state.activeMatchId, roomCode: state.activeRoomCode });
  }

  async function onBracketAction(event) {
    const button = event.target.closest('[data-tourney-action]');
    if (!button) return;
    const action = button.dataset.tourneyAction;
    const matchId = button.dataset.matchId;
    if (action === 'host') return startRoom(matchId);
    if (action === 'join-room') return joinRoom(matchId);
    if (action === 'rehost') {
      const result = await mutate('rehost', { matchId, hostPlayerId: button.dataset.hostPlayerId });
      if (result && state.activeMatchId === matchId) { state.activeMatchId = ''; state.activeRoomCode = ''; }
      if (result && Net.room) Net.leave(true);
      return result;
    }
    if (action === 'claim' || action === 'dispute' || action === 'resolve') {
      const select = $('tourney-bracket').querySelector(`[data-tourney-winner="${matchId}"]`);
      if (!select || !select.value) { setStatus('Selecione um vencedor primeiro.', 'warn'); return; }
      if (action === 'dispute') return mutate('confirm', { matchId, winnerId: select.value });
      return mutate(action, { matchId, winnerId: select.value });
    }
    if (action === 'confirm') return mutate('confirm', { matchId, winnerId: button.dataset.winnerId });
  }

  async function copyCode() {
    const code = state.code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setStatus(`Código ${code} copiado.`, 'ok');
    } catch (_) {
      setStatus(`Código do torneio: ${code}`, 'info');
    }
  }

  function restore() {
    let code = '';
    try { code = cleanCode(localStorage.getItem(LAST_KEY)); } catch (_) { /* armazenamento local indisponível */ }
    if (code.length !== 6) return;
    const credentials = readSaved(code);
    if (!credentials || !credentials.playerId || !credentials.token) return;
    state.code = code;
    state.credentials = credentials;
    updateResumeButton();
  }

  async function openFromResults() {
    if (Net.room) Net.leave(true);
    state.activeMatchId = '';
    state.activeRoomCode = '';
    UI.show('online');
    if (state.code && state.ready) await refresh();
    $('tourney-panel')?.scrollIntoView({ block: 'start', behavior: Profile.reducedMotion() ? 'auto' : 'smooth' });
  }

  function bind() {
    $('tourney-create')?.addEventListener('click', create);
    $('tourney-join')?.addEventListener('click', join);
    $('tourney-start')?.addEventListener('click', () => mutate('start'));
    $('tourney-refresh')?.addEventListener('click', () => refresh());
    $('tourney-copy')?.addEventListener('click', copyCode);
    $('tourney-back')?.addEventListener('click', () => {
      state.tournament = null;
      render();
      setStatus('Você saiu da visualização. Sua inscrição e o token continuam salvos neste navegador.', 'info');
    });
    $('tourney-bracket')?.addEventListener('click', onBracketAction);
    $('btn-res-tournament')?.addEventListener('click', openFromResults);
    $('tourney-join-code')?.addEventListener('input', (event) => { event.target.value = cleanCode(event.target.value); });
  }

  async function init() {
    bind();
    restore();
    render();
    await checkHealth();
    if (state.code && state.ready) await refresh(true);
    clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (document.hidden) return;
      if (!state.ready) { checkHealth(); return; }
      if (state.code && !state.busy && !state.refreshInFlight) refresh(true);
    }, 15000);
  }

  window.TournamentUI = { init, refresh, matchStarted, getState: () => ({ code: state.code, tournament: state.tournament, ready: state.ready }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
