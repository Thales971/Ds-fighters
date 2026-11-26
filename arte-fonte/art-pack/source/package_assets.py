#!/usr/bin/env python3
"""Exporta arte original em grades fixas e amplia por nearest-neighbor, sem desenhar conteúdo novo."""
from pathlib import Path
from PIL import Image
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
ROWS = {
    'impact': [('punch', 'Impacto leve'), ('heavy', 'Impacto pesado'), ('block', 'Defesa'), ('critical', 'Impacto crítico')],
    'fire': [('fireball', 'Bola de fogo'), ('pillar', 'Pilar de fogo'), ('slash', 'Corte de fogo'), ('explosion', 'Explosão de fogo')],
    'water': [('orb', 'Projétil de água'), ('wave', 'Onda'), ('shield', 'Escudo de água'), ('splash', 'Impacto de água')],
    'lightning': [('projectile', 'Projétil elétrico'), ('strike', 'Raio vertical'), ('ring', 'Anel elétrico'), ('impact', 'Impacto elétrico')],
    'chaos': [('blade', 'Lâmina do caos'), ('vortex', 'Vórtice'), ('claws', 'Garras do caos'), ('eruption', 'Erupção do caos')],
    'arcane': [('ice', 'Gelo'), ('wind', 'Vento'), ('heal', 'Cura'), ('teleport', 'Teleporte')],
    'birds': [('raven', 'Corvo'), ('dove', 'Pomba'), ('eagle', 'Águia'), ('phoenix', 'Fênix')]
}
ICONS = ['chatgpt','claude','gemini','deepseek','copilot','grok','perplexity','meta-ai',
         'mistral','qwen','manus','cursor','midjourney','stability-ai','leonardo-ai','replit']
PLATFORMS = ['grass-earth','cherry-wood','castle-brick','sandstone','lava-basalt','ice-crystal',
             'cloud-stone','chaos-obsidian','cyan-tech','magenta-neon','gold-circuit','rusty-steel',
             'ocean-stone','emerald-forest','lavender-crystal','orbital-metal']
MAP_NAMES = {
 '01-neon-rooftop':'Cobertura Neon', '02-volcanic-forge':'Forja Vulcânica',
 '03-underwater-lab':'Laboratório Abissal', '04-storm-temple':'Templo da Tempestade',
 '05-chaos-citadel':'Cidadela do Caos', '06-sakura-dojo':'Dojo das Cerejeiras',
 '07-sky-islands':'Ilhas do Céu', '08-crystal-cavern':'Caverna de Cristais',
 '09-orbital-core':'Núcleo Orbital', '10-digital-forest':'Floresta Digital'
}


def normalize_sheet(name):
    source = ROOT / 'source' / ('retro-' + name + '.png')
    im = Image.open(source).convert('RGBA')
    if im.getchannel('A').getextrema()[0] == 255:
        raise RuntimeError(f'{name}: fonte sem transparência nativa')
    native = Image.new('RGBA', (256,256), (0,0,0,0))
    out = Image.new('RGBA', (1024,1024), (0,0,0,0))
    cells = []
    for r in range(4):
        row = []
        for c in range(4):
            box = (round(c*im.width/4),round(r*im.height/4),round((c+1)*im.width/4),round((r+1)*im.height/4))
            tile64 = im.crop(box).resize((64,64),Image.Resampling.NEAREST)
            if not tile64.getchannel('A').getbbox():
                raise RuntimeError(f'{name}: célula vazia ({r},{c})')
            tile = tile64.resize((256,256),Image.Resampling.NEAREST)
            native.paste(tile64,(c*64,r*64))
            out.paste(tile,(c*256,r*256))
            row.append(tile)
        cells.append(row)
    out.save(ROOT/'spritesheets'/(name+'.png'),optimize=True)
    native.save(ROOT/'retro-native'/'spritesheets'/(name+'.png'),optimize=True)
    return cells


def save_preview(frames, path, duration):
    images=[]
    for tile in frames:
        bg=Image.new('RGBA',tile.size,(14,18,31,255))
        bg.alpha_composite(tile)
        images.append(bg.convert('RGB').quantize(colors=192))
    images[0].save(path,save_all=True,append_images=images[1:],duration=duration,loop=0,disposal=2)


def main():
    for folder in ['retro-native/spritesheets','retro-native/maps','source/maps']:
        (ROOT/folder).mkdir(parents=True,exist_ok=True)
    manifest={'name':'DS Fighters — Retro Elemental Expansion','version':'1.1.0',
              'frameWidth':256,'frameHeight':256,'columns':4,'rows':4,
              'logicalFrameWidth':64,'logicalFrameHeight':64,'nearestNeighborScale':4,
              'alpha':'native RGBA','coordinateOrder':'row-major; zero-based',
              'sheets':{},'icons':{},'platforms':{},'maps':[]}
    for name, rows in ROWS.items():
        cells=normalize_sheet(name)
        metadata=[]
        for row,(key,label) in enumerate(rows):
            folder=ROOT/'frames'/name/key
            folder.mkdir(parents=True,exist_ok=True)
            frame_paths=[]
            for col,tile in enumerate(cells[row]):
                p=folder/f'{col:02d}.png'; tile.save(p,optimize=True)
                frame_paths.append(str(p.relative_to(ROOT)))
            is_loop = name=='birds' or (row==0 and name in ['fire','water','lightning','chaos'])
            fps=10 if name=='birds' else 14
            save_preview(cells[row],ROOT/'previews'/f'{name}-{key}.gif',round(1000/fps))
            metadata.append({'id':key,'name':label,'row':row,'frames':4,'fps':fps,'loop':is_loop,
                             'pivot':{'x':128,'y':128},'individualFrames':frame_paths,
                             'preview':f'previews/{name}-{key}.gif'})
        manifest['sheets'][name]={'file':f'spritesheets/{name}.png','nativeFile':f'retro-native/spritesheets/{name}.png',
                                  'width':1024,'height':1024,'animations':metadata}
    for name,items,category in [('ai-symbols',ICONS,'icons'),('platforms',PLATFORMS,'platforms')]:
        cells=normalize_sheet(name)
        manifest['sheets'][name]={'file':f'spritesheets/{name}.png','nativeFile':f'retro-native/spritesheets/{name}.png',
                                 'width':1024,'height':1024,'animated':False}
        for n,key in enumerate(items):
            row,col=divmod(n,4); p=ROOT/category/(key+'.png');cells[row][col].save(p,optimize=True)
            manifest[category][key]={'file':str(p.relative_to(ROOT)),'row':row,'column':col,'width':256,'height':256}
    for key,label in MAP_NAMES.items():
        p=ROOT/'maps'/(key+'.png')
        original=ROOT/'source'/'maps'/(key+'.png')
        if not original.exists():
            if not p.exists(): raise RuntimeError(f'Mapa ausente: {key}')
            shutil.copy2(p,original)
        im=Image.open(original).convert('RGB')
        native=im.resize((480,270),Image.Resampling.NEAREST)
        native.save(ROOT/'retro-native'/'maps'/(key+'.png'),optimize=True)
        final=native.resize((1920,1080),Image.Resampling.NEAREST)
        final.save(p,optimize=True)
        manifest['maps'].append({'id':key,'name':label,'file':str(p.relative_to(ROOT)),
                                'nativeFile':f'retro-native/maps/{key}.png','width':1920,'height':1080,
                                'logicalWidth':480,'logicalHeight':270,'floorAlignment':'adjust during integration',
                                'flattened':True})
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'Pronto: {len(manifest["sheets"])} folhas, 28 animações / 112 quadros, 16 ícones, 16 plataformas e {len(manifest["maps"])} mapas.')

if __name__=='__main__':
    main()
