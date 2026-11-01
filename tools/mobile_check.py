#!/usr/bin/env python3
"""Teste mobile real com Chromium: layout, navegação e controles de toque."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/mobile';OUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--probe',action='store_true');args=parser.parse_args()
errors=[];failures=[]
def check(condition,description):
    if not condition:failures.append(description)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium')
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:8099/',wait_until='load');page.wait_for_function('window.DSGame && !document.getElementById("loader")')
    page.evaluate("Profile.data.settings.touch='auto';UI.pressStart()")
    for width,height in [(390,844),(844,390),(360,740),(740,360),(320,568),(768,1024)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(150)
        page.evaluate("UI.toMenu()")
        menu=page.evaluate("(()=>{let e=document.querySelector('#scr-menu .mm'),r=e.getBoundingClientRect();return {w:r.width,h:r.height,app:document.getElementById('app').getBoundingClientRect().toJSON(),vw:innerWidth,vh:innerHeight};})()")
        check(menu['h']>=40,f'menu alvo pequeno {width}×{height}: {menu["h"]:.1f}px')
        check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'overflow horizontal {width}×{height}')
        if args.probe and width==390:page.screenshot(path=str(OUT/'antes-menu-retrato.png'))
        for screen in ['options','rules','online']:
            page.evaluate('screen=>UI.show(screen)',screen)
            bounds=page.locator(f'#scr-{screen} .panel').bounding_box()
            check(bounds and bounds['x']>=-1 and bounds['x']+bounds['width']<=width+1,f'painel {screen} fora da tela {width}')
            inputs=page.locator(f'#scr-{screen} input[type=text]:visible')
            if inputs.count():
                inp=inputs.first;size=inp.bounding_box()
                check(size and size['height']>=36,f'campo {screen} minúsculo {width}')
        page.evaluate("(()=>{UI.show('fight');DSGame.start({teams:[['thl'],['dolynho']],stage:'cyberpunk',cpu:[false,false],mode:'versus'});DSGame.roundState='fight';DSGame.running=false;DSGame.render(1);UI.updateTouch();})()")
        buttons=page.locator('#touch-controls button:visible');check(buttons.count()>=13,f'faltam controles {width}')
        for button in buttons.all():
            rect=button.bounding_box();name=button.get_attribute('data-k') or button.inner_text()
            check(rect and rect['width']>=40 and rect['height']>=40,f'toque pequeno {name} {width}: {rect}')
            check(rect and rect['x']>=-1 and rect['y']>=-1 and rect['x']+rect['width']<=width+1 and rect['y']+rect['height']<=height+1,f'toque fora da tela {name} {width}')
        arena=page.locator('#game').bounding_box();check(arena and abs(arena['width']/arena['height']-16/9)<0.01,f'arena distorcida {width}')
        if args.probe and width==390:page.screenshot(path=str(OUT/'antes-luta-retrato.png'))
        if not args.probe and width in [390,844]:page.screenshot(path=str(OUT/f'depois-luta-{width}.png'))
    browser.close()
check(not errors,'erros JS: '+str(errors))
(OUT/'layout-result.json').write_text(json.dumps({'failures':failures,'errors':errors},ensure_ascii=False,indent=2)+'\n')
print('mobile_check:',len(failures),'falhas',flush=True)
for failure in failures[:15]:print('FAIL',failure,flush=True)
if failures and not args.probe:raise SystemExit(1)
