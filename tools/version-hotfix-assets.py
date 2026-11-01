#!/usr/bin/env python3
"""Version fixed URLs touched by the hotfix so old browser caches cannot mask the update."""
import re,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
version='hotfix450-skins-off'
page=root/'index.html'
s=page.read_text()
s=re.sub(r'(<script src=")((?:js/(?!vendor/)[^"?]+|assets/sprites/layout\.js))(")',lambda m:m[1]+m[2]+'?v='+version+m[3],s)
s=re.sub(r'(<link[^>]+href=")(css/[^"?]+)(")',lambda m:m[1]+m[2]+'?v='+version+m[3],s)
page.write_text(s)
for filename in ['js/ui/ui.js','js/ui/hud.js']:
    p=root/filename;s=p.read_text()
    s=re.sub(r'(assets/ui/face-[^\s)]+\.png)(?=\))',lambda m:m[0]+'?v='+version,s)
    s=s.replace('assets/sprites/${d.id}.png','${SpriteGen.url(d.id)}').replace('assets/sprites/${id}.png','${SpriteGen.url(id)}').replace('assets/sprites/${fid}.png','${SpriteGen.url(fid)}')
    s=s.replace('assets/pets/pets.png)','assets/pets/pets.png?v='+version+')')
    p.write_text(s)
config=root/'vercel.json';d=json.loads(config.read_text())
for rule in d.get('headers',[]):
    for h in rule.get('headers',[]):
        if h['key']=='Cache-Control':h['value']='public, max-age=0, must-revalidate'
config.write_text(json.dumps(d,indent=2)+'\n')
print('Versioned hotfix scripts, styles, portraits and sprite URLs; fixed URLs now revalidate.')
