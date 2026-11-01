#!/usr/bin/env python3
"""Jogabilidade com toque real via CDP; Auth/REST simulados, sem criar conta real."""
import base64,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/mobile';OUT.mkdir(parents=True,exist_ok=True)
URL='https://ownxbuailthavxgfxtem.supabase.co'
UID='4df575f9-7d75-4e2d-8b7a-e1dab0a2dc28'
def center(page,selector):
    r=page.locator(selector).bounding_box();assert r
    return {'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}
def b64(obj):return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')
errors=[];uploads=[];auth_requests=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium')
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:8099/');page.wait_for_function('window.DSGame && !document.getElementById("loader") && Cloud.emailEnabled===true')
    page.locator('#btn-start').tap();page.locator('[data-go=versus]').tap()
    thl=page.evaluate("FIGHTERS.findIndex(f=>f.id==='thl')");doly=page.evaluate("FIGHTERS.findIndex(f=>f.id==='dolynho')")
    page.locator(f'.cell[data-i="{thl}"]').tap();page.locator(f'.cell[data-i="{doly}"]').tap()
    page.wait_for_function("UI.screen==='stage'")
    page.locator('#btn-fight').tap()
    page.wait_for_function("UI.screen==='fight' && DSGame.roundState==='fight'",timeout=20000)
    before=page.evaluate('DSGame.activeOf(0).x')
    cdp=ctx.new_cdp_session(page);right=center(page,'.t-right')
    def touch(event,points):cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
    a=dict(right,id=1);a2=dict(right,id=2,x=right['x']+3)
    touch('touchStart',[a]);page.wait_for_timeout(300)
    assert page.evaluate('DSGame.activeOf(0).x')>before+20,'toque não moveu o lutador'
    touch('touchStart',[a,a2]);assert page.evaluate("Input._touchCodes.get('KeyD')===2"),'dois dedos no mesmo botão perderam referência'
    touch('touchEnd',[a2]);assert page.evaluate("Input.keys.has('KeyD')"),'soltar um dedo cancelou o outro'
    moved=dict(a2,x=a2['x']+80);touch('touchMove',[moved]);assert page.evaluate("Input.keys.has('KeyD')"),'arrastar fora cancelou o botão capturado'
    touch('touchEnd',[]);assert page.evaluate("!Input.keys.has('KeyD') && Input._touchPointers.size===0"),'direção ficou presa'
    page.keyboard.down('KeyD');touch('touchStart',[a]);touch('touchEnd',[])
    assert page.evaluate("Input.keys.has('KeyD')"),'toque apagou teclado ainda pressionado'
    page.keyboard.up('KeyD');assert page.evaluate("!Input.keys.has('KeyD')")
    touch('touchStart',[a]);page.evaluate("window.dispatchEvent(new Event('blur'))")
    assert page.evaluate('Input.keys.size===0 && Input.pressed.size===0')
    touch('touchEnd',[])
    page.locator('#touch-controls [data-k=Escape]').tap()
    page.wait_for_function("UI.screen==='pause'")
    assert page.evaluate('Input.keys.size===0')
    page.locator('#btn-resume').tap();page.wait_for_function("UI.screen==='fight'")
    # Posicionamento em todos os poderes, incluindo segunda ultimate e kit de 10.
    page.evaluate("(()=>{Profile.data.unlocked.push('iales');DSGame.start({teams:[['iales'],['thl']],stage:'japan',cpu:[false,false],mode:'versus',infiniteMeter:true});DSGame.running=false;DSGame.roundState='fight';UI._touchKitKey=null;UI.updateTouch();})()")
    assert page.locator('#touch-controls [data-k=Digit6]').is_visible(),'segunda ultimate indisponível no toque'
    page.evaluate("(()=>{let f=DSGame.activeOf(0),kit=f.currentKit();f.currentKit=()=>Array.from({length:10},(_,i)=>kit[i%kit.length]);UI._touchKitKey=null;UI.updateTouch();})()")
    for width,height in [(320,568),(740,360)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(180)
        assert page.locator('#touch-controls [data-k=Digit0]').is_visible()
        field=page.locator('#game').bounding_box()
        for button in page.locator('#touch-controls button:visible').all():
            r=button.bounding_box();assert r and r['width']>=40 and r['height']>=40
            assert 0<=r['x'] and 0<=r['y'] and r['x']+r['width']<=width+1 and r['y']+r['height']<=height+1
        assert field and field['x']>=0 and field['x']+field['width']<=width+1
    print('PASS escolha e início só por toque, movimento real, multitouch/captura, teclado, blur, pausa e dez poderes',flush=True)
    ctx.close()
    # Novo contexto: SDK real, somente endpoints desta fixture interceptados.
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    expires=int(time.time())+3600
    user={'id':UID,'aud':'authenticated','role':'authenticated','email':'fixture@example.invalid','user_metadata':{'full_name':'Conta fixture'}}
    token=b64({'alg':'HS256','typ':'JWT'})+'.'+b64({'sub':UID,'aud':'authenticated','role':'authenticated','exp':expires,'iat':expires-3600})+'.fixture'
    session={'access_token':token,'refresh_token':'fixture-only','token_type':'bearer','expires_in':3600,'expires_at':expires,'user':user}
    def route_api(route):
        req=route.request;path=req.url.split('.supabase.co',1)[-1]
        headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}
        if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
        if '/auth/v1/settings' in path:data={'external':{'email':True,'google':False},'disable_signup':False,'mailer_autoconfirm':False}
        elif '/auth/v1/signup' in path:auth_requests.append('signup');data={'user':user,'session':None}
        elif '/auth/v1/token' in path:auth_requests.append('signin');data=session
        elif '/auth/v1/user' in path:data=user
        elif '/auth/v1/logout' in path:data={}
        elif '/rest/v1/ds_fighters_profiles' in path:
            if req.method=='GET':data=None
            elif req.method=='POST':uploads.append(json.loads(req.post_data or '{}'));route.fulfill(status=201,headers=headers,body='');return
            else:raise AssertionError(path)
        else:raise AssertionError('API inesperada '+path)
        route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(data))
    page.route(URL+'/**',route_api)
    page.goto('http://localhost:8099/');page.wait_for_function('Cloud.emailSignupEnabled===true && !document.getElementById("loader")')
    page.locator('#btn-start').tap();page.locator('#btn-mobile-account').tap();page.locator('#account-email-signup').tap()
    page.locator('#account-email').fill('fixture@example.invalid');page.locator('#account-password').fill('fixture-password-ONLY')
    page.set_viewport_size({'width':390,'height':340});page.wait_for_timeout(120)
    page.locator('#account-password').tap()
    assert page.evaluate('document.documentElement.scrollWidth<=390'),'teclado expandiu a página'
    page.locator('#account-auth-submit').tap();page.wait_for_function("Cloud.status==='confirm-email'")
    assert page.evaluate('!Cloud.user'),'cadastro sem confirmação alegou usuário autenticado'
    assert 'confirm' in page.locator('#account-box').inner_text().lower()
    assert 'fixture-password-ONLY' not in page.evaluate('JSON.stringify({...localStorage})'),'senha armazenada'
    page.set_viewport_size({'width':390,'height':844});page.locator('#account-auth-switch').tap()
    page.locator('#account-password').fill('fixture-password-ONLY');page.locator('#account-auth-submit').tap()
    page.wait_for_function("Cloud.user && Cloud.status==='saved'",timeout=15000)
    assert uploads and uploads[-1]['user_id']==UID
    assert page.evaluate("Profile.accountUid==='supabase:ownxbuailthavxgfxtem:'+Cloud.user.uid")
    page.locator('.account-signout').tap();page.wait_for_function('!Cloud.user && Profile.accountUid===null')
    assert auth_requests==['signup','signin']
    assert not page.locator('#account-password').count()
    print('PASS SDK real mobile com Auth/REST simulados: cadastro, confirmação pendente, login, namespace, save, logout e teclado',flush=True)
    ctx.close();b.close()
assert not errors,errors
print('mobile_play_check: PASS; nenhum erro JS e nenhuma conta/email real criado',flush=True)
