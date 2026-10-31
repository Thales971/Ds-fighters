#!/usr/bin/env python3
from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent
LABELS={'impact':'Impactos','fire':'Fogo','water':'Água','lightning':'Raios','chaos':'Caos',
        'arcane':'Gelo, vento, cura e teleporte','birds':'Pássaros e fênix',
        'platforms':'Chãos e plataformas','ai-symbols':'Símbolos das IAs'}


def zip_selected(filename,paths):
    with ZipFile(OUT/filename,'w',ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(paths):
            z.write(p,'ds-fighters-art-pack/'+str(p.relative_to(ROOT)))
    with ZipFile(OUT/filename) as z:
        bad=z.testzip()
        if bad: raise RuntimeError('ZIP inválido: '+bad)
    print(OUT/filename,(OUT/filename).stat().st_size)


def main():
    data=json.loads((ROOT/'manifest.json').read_text())
    text=['# DS Fighters — Catálogo do pacote retrô','',
          '9 spritesheets, 28 sequências de 4 quadros, 16 símbolos de IAs, 16 módulos de chão e 10 fundos de mapas. As folhas abaixo são as versões finais de 1024 × 1024, com alfa real e blocos de pixels de 4 × 4. Os fundos medem 1920 × 1080.','',
          '[Baixar pacote completo](/home/ubuntu/DS-Fighters-Retro-Pack.zip) · [Ler instruções]('+str(ROOT/'LEIA-ME.md')+')','',
          'As imagens são recursos para integrar ao jogo. O repositório não foi alterado. Os mapas são estáticos; ajuste o piso na integração. Os símbolos de IA são estilizados, não oficiais, e representam uma seleção de 16 serviços.','',
          '## Spritesheets','']
    for key,label in LABELS.items():
        sheet=data['sheets'][key]
        path=ROOT/sheet['file']
        text.extend(['### '+label,'','[Baixar PNG final]('+str(path)+') · [Versão nativa 256 × 256]('+str(ROOT/sheet['nativeFile'])+')','',
                     '!['+label+']('+str(path)+')',''])
        if 'animations' in sheet:
            text.extend(['Linhas de cima para baixo: '+ '; '.join(a['name'] for a in sheet['animations'])+'.',''])
            a=sheet['animations'][0]
            text.extend(['**Prévia: '+a['name']+'**','', '!['+a['name']+' animado]('+str(ROOT/a['preview'])+')',''])
    text.extend(['## Os 10 mapas',''])
    for item in data['maps']:
        path=ROOT/item['file']
        text.extend(['### '+item['name'],'','[Baixar PNG final]('+str(path)+') · [Versão nativa 480 × 270]('+str(ROOT/item['nativeFile'])+')','',
                     '!['+item['name']+']('+str(path)+')',''])
    text.extend(['## Documentação','',
                 '[LEIA-ME]('+str(ROOT/'LEIA-ME.md')+') · [Notas de integração]('+str(ROOT/'integration/NOTAS-DO-JOGO.md')+') · [Manifesto JSON]('+str(ROOT/'manifest.json')+')',''])
    (ROOT/'CATALOGO.md').write_text('\n'.join(text),encoding='utf8')
    paths=[p for p in ROOT.rglob('*') if p.is_file() and 'source' not in p.relative_to(ROOT).parts]
    zip_selected('DS-Fighters-Retro-Pack.zip',paths)
    docs=[ROOT/'LEIA-ME.md',ROOT/'manifest.json',ROOT/'art-pack.js',ROOT/'integration/NOTAS-DO-JOGO.md']
    sprites=[p for p in paths if p.relative_to(ROOT).parts[0] in ['spritesheets','frames','icons','platforms','previews']]
    sprites += [p for p in paths if str(p.relative_to(ROOT)).startswith('retro-native/spritesheets/')]
    zip_selected('DS-Fighters-Sprites-Retro.zip',sprites+docs)
    maps=[p for p in paths if p.relative_to(ROOT).parts[0]=='maps' or str(p.relative_to(ROOT)).startswith('retro-native/maps/')]
    zip_selected('DS-Fighters-10-Mapas-Retro.zip',maps+[ROOT/'LEIA-ME.md'])
    print('Catálogo:',ROOT/'CATALOGO.md')

if __name__=='__main__':
    main()
