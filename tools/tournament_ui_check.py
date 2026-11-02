#!/usr/bin/env python3
"""Smoke do painel V12 usando uma API fake; nunca acessa nem grava no Redis real."""
import copy
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results' / 'visual'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/')
errors = []
api_calls = []
tourney = None


def response(route, status, body):
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body, ensure_ascii=False))


def public_copy():
    return copy.deepcopy(tourney)


def api_handler(route):
    global tourney
    req = route.request
    api_calls.append({'method': req.method, 'url': req.url})
    parsed = urlparse(req.url)
    query = parse_qs(parsed.query)
    if req.method == 'GET' and query.get('health') == ['1']:
        response(route, 200, {'ok': True, 'storage': 'persistent', 'provider': 'test-double', 'maxPlayers': 32})
        return
    if req.method == 'GET' and query.get('code'):
        tourney['updatedAt'] = int(tourney.get('updatedAt', 0)) + 1
        response(route, 200, {'tournament': public_copy()})
        return
    body = req.post_data_json or {}
    action = body.get('action')
    api_calls[-1]['action'] = action
    if action in ('create', 'join') and not (22 <= len(str(body.get('requestId', ''))) <= 64):
        response(route, 400, {'error': 'invalid_request_id', 'message': 'requestId obrigatório.'})
        return
    if action not in ('create', 'join'):
        expected = {'player-1': 'host-token', 'player-2': 'guest-token'}.get(body.get('playerId'))
        if not expected or body.get('token') != expected:
            response(route, 401, {'error': 'invalid_player_token', 'message': 'Token inválido.'})
            return
    if action == 'create':
        tourney = {
            'code': 'ABCD23', 'name': body.get('name', 'Torneio DS Fighters'), 'status': 'open',
            'capacity': int(body.get('capacity', 32)), 'ownerId': 'player-1', 'winnerId': None,
            'players': [{'id': 'player-1', 'name': 'Host', 'seed': 1}], 'rounds': [],
        }
        response(route, 201, {'code': 'ABCD23', 'playerId': 'player-1', 'token': 'host-token', 'tournament': public_copy()})
        return
    if action == 'join':
        tourney['players'].append({'id': 'player-2', 'name': 'Guest', 'seed': 2})
        response(route, 200, {'code': 'ABCD23', 'playerId': 'player-2', 'token': 'guest-token', 'tournament': public_copy()})
        return
    if action == 'start':
        tourney['status'] = 'active'
        tourney['rounds'] = [[{
            'id': 'r1m1', 'round': 1, 'index': 1,
            'playerIds': ['player-1', 'player-2'], 'players': ['Host', 'Guest'],
            'status': 'ready', 'winnerId': None, 'winnerName': None,
            'hostPlayerId': 'player-1', 'roomCode': None, 'sourceMatchIds': None,
            'startedBy': [], 'claim': None, 'dispute': None,
        }]]
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'rehost':
        match = tourney['rounds'][0][0]
        match['status'] = 'ready'
        match['roomCode'] = None
        match['connectedPlayerId'] = None
        match['startedBy'] = []
        match['hostPlayerId'] = body['hostPlayerId']
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'room':
        match = tourney['rounds'][0][0]
        if body['playerId'] != match['hostPlayerId'] or match['status'] != 'ready':
            response(route, 403, {'error': 'match_host_only', 'message': 'Somente o anfitrião da sala.'})
            return
        match['roomCode'] = body['roomCode']
        match['startedBy'] = []
        match['status'] = 'joining'
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'connected':
        match = tourney['rounds'][0][0]
        if body['playerId'] == match['hostPlayerId'] or body['playerId'] not in match['playerIds']:
            response(route, 403, {'error': 'opponent_confirmation_only', 'message': 'Confirme pelo adversário.'})
            return
        if match['status'] != 'joining' or body.get('roomCode') != match['roomCode']:
            response(route, 409, {'error': 'room_not_joined', 'message': 'Sala não confirmada.'})
            return
        match['connectedPlayerId'] = body['playerId']
        match['status'] = 'connected'
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'started':
        match = tourney['rounds'][0][0]
        if match['status'] not in ('connected', 'playing') or body.get('roomCode') != match['roomCode'] or body['playerId'] not in match['playerIds']:
            response(route, 409, {'error': 'match_not_started', 'message': 'Início ainda não confirmado.'})
            return
        if body['playerId'] not in match['startedBy']:
            match['startedBy'].append(body['playerId'])
        match['status'] = 'playing' if len(match['startedBy']) == 2 else 'connected'
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'claim':
        match = tourney['rounds'][0][0]
        match['status'] = 'reported'
        match['claim'] = {'winnerId': body['winnerId'], 'winnerName': 'Host' if body['winnerId'] == 'player-1' else 'Guest', 'byPlayerId': body['playerId'], 'byName': 'Host'}
        response(route, 200, {'tournament': public_copy()})
        return
    if action == 'confirm':
        match = tourney['rounds'][0][0]
        match['status'] = 'complete'
        match['winnerId'] = body['winnerId']
        match['winnerName'] = 'Host' if body['winnerId'] == 'player-1' else 'Guest'
        match['claim'] = None
        tourney['status'] = 'complete'
        tourney['winnerId'] = body['winnerId']
        tourney['winnerName'] = match['winnerName']
        response(route, 200, {'tournament': public_copy()})
        return
    response(route, 400, {'error': 'unexpected_test_action', 'message': str(action)})


def offline_handler(route):
    if route.request.method == 'GET':
        response(route, 503, {'error': 'storage_not_configured', 'message': 'Torneios indisponíveis: conecte Upstash Redis pela Vercel Marketplace e faça redeploy.'})
    else:
        response(route, 503, {'error': 'storage_not_configured', 'message': 'Torneios indisponíveis.'})


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    context.route('**/api/tournaments**', api_handler)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='load')
    page.wait_for_function("window.TournamentUI && TournamentUI.getState().ready", timeout=30000)
    page.evaluate("UI.show('online')")
    page.locator('#net-name').fill('Host')
    page.locator('#tourney-name').focus()
    page.keyboard.press('Tab')
    assert page.evaluate("document.activeElement.id") == 'tourney-capacity', 'keyboard tab follows labeled tournament fields'
    page.keyboard.press('Tab')
    assert page.evaluate("document.activeElement.id") == 'tourney-create', 'keyboard reaches the create button'
    focus_outline = page.locator('#tourney-create').evaluate("el => getComputedStyle(el).outlineStyle")
    assert focus_outline == 'solid', f'create button has visible keyboard focus: {focus_outline}'
    page.keyboard.press('Enter')
    page.wait_for_function("document.getElementById('tourney-code').textContent === 'ABCD23'", timeout=10000)
    assert page.locator('#tourney-players li').count() == 1
    assert page.locator('#btn-res-tournament').get_attribute('hidden') is None

    guest_context = browser.new_context(viewport={'width': 1280, 'height': 900})
    guest_context.route('**/api/tournaments**', api_handler)
    guest = guest_context.new_page()
    guest.on('pageerror', lambda error: errors.append(str(error)))
    guest.goto(BASE, wait_until='load')
    guest.wait_for_function("window.TournamentUI && TournamentUI.getState().ready", timeout=30000)
    guest.evaluate("UI.show('online')")
    guest.locator('#net-name').fill('Guest')
    guest.locator('#tourney-join-code').fill('abcd23')
    guest.locator('#tourney-join').click()
    guest.wait_for_function("document.getElementById('tourney-players').children.length === 2", timeout=10000)

    page.locator('#tourney-refresh').click()
    page.wait_for_function("document.getElementById('tourney-players').children.length === 2", timeout=10000)
    page.locator('#tourney-start').click()
    page.wait_for_selector('.tourney-match.status-ready')
    assert page.locator('[data-tourney-action="host"]').count() == 1
    page.screenshot(path=str(OUT / 'v12-tournament-bracket-mock.png'), full_page=True)

    page.evaluate("""() => { Net.create = async function() { this.room = {code:'ABC123',players:[{id:'host-slot'}]}; }; }""")
    page.locator('[data-tourney-action="host"]').click()
    page.wait_for_selector('.tourney-match.status-joining')
    guest.locator('#tourney-refresh').click()
    guest.wait_for_selector('[data-tourney-action="join-room"]')
    guest.evaluate("""() => { Net.me='guest-slot'; Net.join = async function() { const code=this.$('net-code').value; this.room={code,players:[{id:'host-slot'},{id:'guest-slot'}]}; }; }""")
    guest.locator('[data-tourney-action="join-room"]').click()
    guest.wait_for_selector('.tourney-match.status-connected')
    assert any(call.get('action') == 'connected' for call in api_calls), 'opponent join confirms the P2P connection through the tournament API'
    page.evaluate("""() => {
      UI.showVs = function(_cfg, then) { setTimeout(then, 250); };
      const realStart = UI.game.start.bind(UI.game);
      UI.game.start = function(cfg) {
        const result = realStart(cfg);
        this.__v12ActualStartAt = performance.now();
        return result;
      };
      const realStartedHook = TournamentUI.matchStarted.bind(TournamentUI);
      TournamentUI.matchStarted = function(code) {
        if (!UI.game.__v12ActualStartAt) window.__v12EarlyStartHook = true;
        return realStartedHook(code);
      };
      Net.me = 'host-slot';
      Net.room = {code:'ABC123',hostId:'host-slot',mode:'1v1',cap:2,score:[0,0],config:{},players:[
        {id:'host-slot',team:0,slot:0,picks:['stack'],pet:'none'},
        {id:'guest-slot',team:1,slot:2,picks:['meta'],pet:'none'}
      ]};
      Net.startMatch({room:Net.room,matchId:'p2p-host',stage:'mistral',config:{}});
    }""")
    page.wait_for_timeout(30)
    assert not any(call.get('action') == 'started' for call in api_calls), 'start ACK must wait for the actual delayed Game.start callback'
    assert not page.evaluate('window.__v12EarlyStartHook === true'), 'start hook must not run during the VS animation'
    page.wait_for_function('UI.game.__v12ActualStartAt > 0', timeout=5000)
    page.evaluate("UI.show('online')")
    page.wait_for_selector('.tourney-match.status-connected')
    guest.evaluate("""() => {
      UI.showVs = function(_cfg, then) { setTimeout(then, 250); };
      const realStart = UI.game.start.bind(UI.game);
      UI.game.start = function(cfg) {
        const result = realStart(cfg);
        this.__v12ActualStartAt = performance.now();
        return result;
      };
      const realStartedHook = TournamentUI.matchStarted.bind(TournamentUI);
      TournamentUI.matchStarted = function(code) {
        if (!UI.game.__v12ActualStartAt) window.__v12EarlyStartHook = true;
        return realStartedHook(code);
      };
      Net.me = 'guest-slot';
      Net.room = {code:'ABC123',hostId:'host-slot',mode:'1v1',cap:2,score:[0,0],config:{},players:[
        {id:'host-slot',team:0,slot:0,picks:['stack'],pet:'none'},
        {id:'guest-slot',team:1,slot:2,picks:['meta'],pet:'none'}
      ]};
      Net.startMatch({room:Net.room,matchId:'p2p-guest',stage:'mistral',config:{}});
    }""")
    guest.wait_for_timeout(30)
    assert not guest.evaluate('window.__v12EarlyStartHook === true'), 'guest start ACK also waits for Game.start'
    guest.wait_for_function('UI.game.__v12ActualStartAt > 0', timeout=5000)
    guest.evaluate("UI.show('online')")
    page.wait_for_selector('.tourney-match.status-playing')
    assert sum(call.get('action') == 'started' for call in api_calls) >= 2, 'both real startMatch hooks must reach the API'

    page.locator('[data-tourney-action="rehost"]').click()
    page.wait_for_selector('.tourney-match.status-ready')
    assert page.evaluate("document.body.dataset.screen === 'online' && UI.game.mode === 'demo'"), 'local rehost exits the stale online match and returns to the tournament panel'
    guest.locator('#tourney-refresh').click()
    guest.wait_for_selector('.tourney-match.status-ready')
    assert guest.evaluate("document.body.dataset.screen === 'online' && UI.game.mode === 'demo'"), 'remote rehost exits the stale online match and returns the opponent to the tournament panel'
    assert guest.evaluate('Net.room === null'), 'the old guest room is left after a remote rehost'
    assert tourney['rounds'][0][0]['roomCode'] is None
    assert tourney['rounds'][0][0]['hostPlayerId'] == 'player-2'

    page.locator('[data-tourney-action="rehost"]').click()
    page.wait_for_selector('[data-tourney-action="host"]')
    page.evaluate("""() => { Net.create = async function() { this.room = {code:'QWE456',players:[{id:'host-slot'}]}; }; }""")
    page.locator('[data-tourney-action="host"]').click()
    page.wait_for_selector('.tourney-match.status-joining')
    guest.locator('#tourney-refresh').click()
    guest.wait_for_selector('[data-tourney-action="join-room"]')
    guest.locator('[data-tourney-action="join-room"]').click()
    guest.wait_for_selector('.tourney-match.status-connected')
    page.evaluate("""() => {
      UI.showVs = function(_cfg, then) { setTimeout(then, 100); };
      Net.me = 'host-slot';
      Net.room = {code:'QWE456',hostId:'host-slot',mode:'1v1',cap:2,score:[0,0],config:{},players:[
        {id:'host-slot',team:0,slot:0,picks:['stack'],pet:'none'},
        {id:'guest-slot',team:1,slot:2,picks:['meta'],pet:'none'}
      ]};
      Net.startMatch({room:Net.room,matchId:'p2p-host-2',stage:'mistral',config:{}});
    }""")
    page.wait_for_timeout(150)
    page.evaluate("UI.show('online')")
    guest.evaluate("""() => {
      UI.showVs = function(_cfg, then) { setTimeout(then, 100); };
      Net.me = 'guest-slot';
      Net.room = {code:'QWE456',hostId:'host-slot',mode:'1v1',cap:2,score:[0,0],config:{},players:[
        {id:'host-slot',team:0,slot:0,picks:['stack'],pet:'none'},
        {id:'guest-slot',team:1,slot:2,picks:['meta'],pet:'none'}
      ]};
      Net.startMatch({room:Net.room,matchId:'p2p-guest-2',stage:'mistral',config:{}});
    }""")
    guest.wait_for_timeout(150)
    guest.evaluate("UI.show('online')")
    page.wait_for_selector('.tourney-match.status-playing')
    winner_select = page.locator('[data-tourney-winner="r1m1"]')
    winner_select.select_option('player-2')
    winner_select.focus()
    with page.expect_response('**/api/tournaments?code=*'):
        page.evaluate('TournamentUI.refresh(true)')
    winner_select = page.locator('[data-tourney-winner="r1m1"]')
    assert winner_select.input_value() == 'player-2', 'polling updates must preserve the selected winner'
    assert page.evaluate("document.activeElement.dataset.tourneyWinner === 'r1m1'") is True, 'polling updates must restore focus to the active match selector'
    page.locator('[data-tourney-action="claim"]').click()
    page.wait_for_selector('.tourney-match.status-reported')
    guest.locator('#tourney-refresh').click()
    guest.wait_for_selector('[data-tourney-action="confirm"]')
    guest.locator('[data-tourney-action="confirm"]').click()
    page.locator('#tourney-refresh').click()
    page.wait_for_selector('.tourney-match.status-complete')
    assert 'CAMPEÃO: Guest' in page.locator('#tourney-bracket').inner_text()

    page.evaluate("UI.show('results')")
    assert page.locator('#btn-res-tournament').is_visible()
    page.locator('#btn-res-tournament').click()
    page.wait_for_function("UI.screen === 'online'")

    page.set_viewport_size({'width': 375, 'height': 812})
    page.wait_for_timeout(400)
    box = page.locator('#tourney-panel').bounding_box()
    layout = page.evaluate("""() => ({innerWidth, dpr: devicePixelRatio, zoom: document.documentElement.style.zoom,
      active: [...document.querySelectorAll('.screen.on')].map(e => ({id:e.id, transform:getComputedStyle(e).transform})),
      parents: (() => {let e=document.querySelector('#tourney-panel'),a=[];for(let i=0;e&&i<4;i++,e=e.parentElement){const s=getComputedStyle(e),r=e.getBoundingClientRect();a.push({id:e.id,cls:e.className,width:s.width,transform:s.transform,rect:{x:r.x,w:r.width}})}return a})()})""")
    if not box or box['x'] < 0 or box['x'] + box['width'] > 377:
        page.screenshot(path=str(OUT / 'v12-tournament-mobile-failure.png'), full_page=True)
        print('MOBILE_LAYOUT_FAILURE', json.dumps({'box': box, 'layout': layout}, ensure_ascii=False))
    assert box and box['x'] >= 0 and box['x'] + box['width'] <= 377, f'panel overflows mobile: {box}'

    offline_context = browser.new_context(viewport={'width': 1280, 'height': 900})
    offline_context.route('**/api/tournaments**', offline_handler)
    offline = offline_context.new_page()
    offline.on('pageerror', lambda error: errors.append(str(error)))
    offline.goto(BASE, wait_until='load')
    offline.wait_for_function("window.TournamentUI && document.getElementById('tourney-status').textContent.includes('Upstash Redis')", timeout=30000)
    assert offline.locator('#tourney-create').is_disabled()
    assert offline.locator('#tourney-join').is_disabled()
    assert 'Upstash Redis' in offline.locator('#tourney-status').inner_text()
    assert errors == [], errors
    assert any('/api/tournaments?health=1' in item['url'] for item in api_calls)

    print(json.dumps({
        'status': 'PASS',
        'apiCalls': len(api_calls),
        'bracket': 'create/join/start/rehost/report/double-confirm/champion',
        'keyboard': {'labeledTabOrder': True, 'enterActivatesCreate': True, 'visibleFocus': focus_outline},
        'offlineMessage': offline.locator('#tourney-status').inner_text(),
        'mobilePanel': box,
        'pageErrors': errors,
    }, ensure_ascii=False, indent=2))
    offline_context.close()
    guest_context.close()
    context.close()
    browser.close()
