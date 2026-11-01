#!/usr/bin/env python3
"""SDK real no navegador; mock de Auth/REST somente nos cenários simulados.
Não cria usuários nem escreve dados em Supabase real.
Raiz servida em http://localhost:8099/.
"""
import base64
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://ownxbuailthavxgfxtem.supabase.co'
KEY = 'dsfighters.supabase.ownxbuailthavxgfxtem.auth.v1'
UID = '4df575f9-7d75-4e2d-8b7a-e1dab0a2dc28'
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)

def encoded(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')

def run():
    errors = []
    uploads = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium')
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto('http://localhost:8099/', wait_until='load')
        page.wait_for_function("Cloud.provider==='supabase' && Cloud.status==='ready' && Cloud.googleEnabled===false", timeout=30000)
        page.wait_for_function("document.querySelector('.account-signin').disabled")
        assert page.evaluate('!!supabase.createClient && Cloud.isConfigured()')
        assert 'GOOGLE AGUARDANDO CONFIGURAÇÃO' in page.locator('#account-box').inner_text()
        page.screenshot(path=str(OUT / 'supabase-menu.png'))
        print('PASS SDK local real, configuração real e UI Google pendente', flush=True)
        page.close()

        context = browser.new_context()
        mock = context.new_page()
        mock.on('pageerror', lambda e: errors.append(str(e)))
        expires = int(time.time()) + 3600
        user = {'id': UID, 'aud': 'authenticated', 'role': 'authenticated', 'email': 'fixture@example.invalid', 'user_metadata': {'full_name': 'Conta de teste'}}
        token = encoded({'alg': 'HS256', 'typ': 'JWT'}) + '.' + encoded({'sub': UID, 'aud': 'authenticated', 'role': 'authenticated', 'exp': expires, 'iat': expires-3600}) + '.fixture'
        session = {'access_token': token, 'refresh_token': 'fixture-only', 'token_type': 'bearer', 'expires_at': expires, 'expires_in': 3600, 'user': user}
        local = {'unlocked': ['iales'], 'pets': ['tux','none'], 'name': 'Local', 'settings': {'music': 0.77, 'serverUrl': 'wss://local-only'}, 'stats': {'fights': 8,'wins': 3,'bestArcade': 2,'maxCombo': 5}}
        mock.add_init_script('localStorage.setItem(%s,%s);localStorage.setItem("dsfighters.profile.v2",%s);' % (json.dumps(KEY),json.dumps(json.dumps(session)),json.dumps(json.dumps(local))))
        remote = {'profile': {'unlocked': ['qwen'], 'pets': ['tux','none'], 'name': 'Remoto','stats': {'fights': 4,'wins': 6,'bestArcade': 7,'maxCombo': 9}},'name':'Remoto','photo':'','updated_at': '2099-01-01T00:00:00Z'}
        def route_api(route):
            request = route.request
            path = request.url.split('.supabase.co',1)[-1]
            headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}
            if request.method == 'OPTIONS':
                route.fulfill(status=204,headers=headers); return
            if '/auth/v1/settings' in path: data = {'external': {'google': True}}
            elif '/auth/v1/user' in path: data = user
            elif '/rest/v1/ds_fighters_profiles' in path:
                if request.method == 'GET':
                    assert 'select=profile%2Cname%2Cphoto%2Cupdated_at' in request.url
                    assert 'limit=1' in request.url
                    data = remote
                elif request.method == 'POST':
                    body = json.loads(request.post_data or '{}'); uploads.append(body)
                    route.fulfill(status=201,headers=headers,body=''); return
                else: raise AssertionError('unexpected REST '+request.method)
            elif '/auth/v1/logout' in path: data = {}
            else: raise AssertionError('API inesperada '+path)
            route.fulfill(status=200,content_type='application/json',headers=headers,body=json.dumps(data))
        mock.route(URL+'/**', route_api)
        mock.goto('http://localhost:8099/',wait_until='load')
        mock.wait_for_function("Cloud.status==='saved' && Cloud.user", timeout=15000)
        merged = mock.evaluate('({profile:Profile.data,uid:Profile.accountUid,user:Cloud.user.uid})')
        assert merged['uid'] == 'supabase:ownxbuailthavxgfxtem:'+UID
        assert merged['user'] == UID
        assert set(merged['profile']['unlocked']) == {'iales','qwen'}
        assert merged['profile']['stats'] == {'fights':8,'wins':6,'bestArcade':7,'maxCombo':9}
        assert merged['profile']['settings']['music'] == 0.77
        assert merged['profile']['settings']['serverUrl'] == 'wss://local-only'
        assert uploads and uploads[-1]['user_id'] == UID
        assert 'serverUrl' not in uploads[-1]['profile']['settings']
        assert 'Conta de teste' in mock.locator('#account-box').inner_text()
        mock.evaluate("Profile.record('fights',1)")
        mock.wait_for_function("Cloud.status==='saved' && !Cloud._dirty", timeout=7000)
        assert uploads[-1]['profile']['stats']['fights'] == 9
        context.set_offline(True)
        assert mock.evaluate('Cloud.flush()') is False
        assert mock.evaluate("Cloud.status==='offline'")
        context.set_offline(False)
        mock.wait_for_function("Cloud.status==='saved'", timeout=10000)
        assert mock.evaluate('Cloud.signOut()') is True
        mock.wait_for_function('!Cloud.user && Profile.accountUid===null')
        print('PASS SDK real com Auth/REST simulados: merge, namespace, autosave, offline/retorno, logout',flush=True)
        context.close(); browser.close()
    assert not errors, errors
    print('supabase_check: PASS; nenhuma escrita/usuário criado no backend real',flush=True)

if __name__ == '__main__':
    run()
