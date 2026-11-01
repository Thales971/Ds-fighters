#!/usr/bin/env python3
"""Verifica a conta Cloud sem credenciais reais.

O primeiro cenário confirma que o jogo segue offline sem configuração. O segundo
intercepta os imports do SDK Firebase e injeta um documento remoto falso para
exercitar a mesclagem e o cartão de conta.
"""
import glob
import json
import os
import shutil
import socket
import subprocess
import sys
import time

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def launch_browser(playwright):
    args = ['--autoplay-policy=no-user-gesture-required']
    try:
        return playwright.chromium.launch(args=args)
    except PlaywrightError:
        candidates = sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome')))
        executable = shutil.which('chromium') or shutil.which('google-chrome')
        if executable:
            return playwright.chromium.launch(executable_path=executable, args=args)
        if not candidates:
            raise
        return playwright.chromium.launch(executable_path=candidates[-1], args=args)


def collect_errors(page, errors):
    page.on('console', lambda message: errors.append('console.' + message.type + ': ' + message.text) if message.type == 'error' else None)
    page.on('pageerror', lambda error: errors.append('pageerror: ' + str(error)))


def mock_modules(route):
    url = route.request.url
    if url.endswith('/firebase-app.js'):
        source = "export function initializeApp(config) { return { config }; }"
    elif url.endswith('/firebase-auth.js'):
        source = """
const mockUser = { uid: 'mock-user-1', displayName: 'Conta Mock', photoURL: '' };
export function getAuth(app) { return { app }; }
export class GoogleAuthProvider {}
export function onAuthStateChanged(auth, callback) { setTimeout(() => callback(mockUser), 0); return () => {}; }
export function getRedirectResult(auth) { return Promise.resolve(null); }
export function signInWithPopup(auth, provider) { return Promise.resolve({ user: mockUser }); }
export function signInWithRedirect(auth, provider) { return Promise.resolve(); }
export function signOut(auth) { return Promise.resolve(); }
"""
    elif url.endswith('/firebase-firestore.js'):
        source = """
const remote = {
  profile: {
    unlocked: ['du'],
    pets: ['remote-pet', 'none'],
    name: 'Remoto',
    settings: { music: 0.1 },
    stats: { fights: 4, wins: 2, bestArcade: 3, maxCombo: 8 }
  },
  updatedAt: { toMillis: () => 2000 },
  name: 'Remoto',
  photo: ''
};
export function getFirestore(app) { return { app }; }
export function doc(db, collection, id) { return { collection, id }; }
export function getDoc(ref) { return Promise.resolve({ exists: () => true, data: () => remote }); }
export function serverTimestamp() { return { mocked: true }; }
export function setDoc(ref, data) { globalThis.__mockCloudWrite = data; return Promise.resolve(); }
"""
    else:
        return route.continue_()
    route.fulfill(status=200, content_type='application/javascript', headers={'Access-Control-Allow-Origin': '*'}, body=source)


def main():
    port = free_port()
    server = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(port)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    errors = []
    try:
        time.sleep(0.5)
        with sync_playwright() as playwright:
            browser = launch_browser(playwright)

            offline_context = browser.new_context(viewport={'width': 960, 'height': 540})
            offline_page = offline_context.new_page()
            offline_page.route('**/js/config/supabase-config.js', lambda route: route.fulfill(
                content_type='application/javascript', body='window.DS_SUPABASE_CONFIG = null;'))
            collect_errors(offline_page, errors)
            offline_page.goto(f'http://127.0.0.1:{port}/index.html', wait_until='load')
            offline_page.wait_for_selector('#account-box .account-action', state='attached', timeout=15000)
            offline_page.wait_for_timeout(500)
            button = offline_page.locator('#account-box .account-action')
            assert button.is_disabled(), 'o botão sem configuração deveria estar desabilitado'
            assert 'NÃO CONFIGURADO' in button.inner_text(), 'o estado sem configuração não foi exibido'
            offline_context.close()

            local_profile = {
                'unlocked': ['iales'],
                'pets': ['local-pet', 'none'],
                'name': 'Local',
                'settings': {'music': 0.8, 'serverUrl': 'wss://local', 'touch': 'on'},
                'stats': {'fights': 2, 'wins': 3, 'bestArcade': 5, 'maxCombo': 6},
            }
            remote_context = browser.new_context(viewport={'width': 960, 'height': 540})
            remote_page = remote_context.new_page()
            remote_page.route('**/js/config/supabase-config.js', lambda route: route.fulfill(
                content_type='application/javascript', body='window.DS_SUPABASE_CONFIG = null;'))
            remote_page.add_init_script(
                "localStorage.setItem('dsfighters.profile.v2', %s);"
                "localStorage.setItem('dsfighters.cloud.meta.v1', %s);"
                % (json.dumps(json.dumps(local_profile)), json.dumps(json.dumps({'updatedAt': 1000})))
            )
            remote_page.route('http://127.0.0.1:**/js/config/firebase-config.js', lambda route: route.fulfill(
                status=200,
                content_type='application/javascript',
                body="window.DS_FIREBASE_CONFIG = {apiKey:'fake', authDomain:'fake.firebaseapp.com', projectId:'fake', appId:'fake-app'};",
            ))
            remote_page.route('https://www.gstatic.com/firebasejs/**', mock_modules)
            collect_errors(remote_page, errors)
            remote_page.goto(f'http://127.0.0.1:{port}/index.html', wait_until='load')
            remote_page.wait_for_function("typeof Cloud !== 'undefined' && Cloud.status === 'saved'", timeout=20000)
            merged = remote_page.evaluate("({profile: Profile.data, user: Cloud.user && Cloud.user.uid, box: document.getElementById('account-box').innerText})")
            profile = merged['profile']
            assert merged['user'] == 'mock-user-1', 'o usuário simulado não entrou'
            assert 'Conta Mock' in merged['box'], 'o cartão não mostrou o nome da conta'
            assert 'Salvo na nuvem' in merged['box'], 'o estado salvo não apareceu no cartão'
            assert set(profile['unlocked']) == {'iales', 'du'}, 'desbloqueios não foram unidos'
            assert profile['stats'] == {'fights': 4, 'wins': 3, 'bestArcade': 5, 'maxCombo': 8}, 'estatísticas não usaram máximos'
            assert profile['pets'] == ['remote-pet', 'none'] and profile['name'] == 'Remoto', 'dados mais recentes não foram aplicados'
            assert profile['settings']['music'] == 0.8 and profile['settings']['serverUrl'] == 'wss://local' and profile['settings']['touch'] == 'on', 'configurações locais não foram preservadas'
            remote_context.close()
            browser.close()

        if errors:
            raise AssertionError('erros de página: ' + ' | '.join(dict.fromkeys(errors)))
        print('cloud_check: PASS (offline sem configuração + mock Firebase com mesclagem/UI)')
        return 0
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == '__main__':
    raise SystemExit(main())
