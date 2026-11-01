#!/usr/bin/env python3
"""Pack existing generated assets into the game's native atlas contracts; no new drawing."""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]

def pack(path,cell,limit):
    source=Image.open(path).convert('RGBA')
    assert source.width % 4 == 0 and source.height % 5 == 0
    fw,fh=source.width//4,source.height//5
    rows=[]
    for row in range(5):
        cells=[source.crop((col*fw,row*fh,(col+1)*fw,(row+1)*fh)) for col in range(4)]
        boxes=[im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox() for im in cells]
        assert all(boxes),f'empty frame in {path.name}, row {row}'
        scale=min(limit/max(b[2]-b[0] for b in boxes),limit/max(b[3]-b[1] for b in boxes))
        strip=Image.new('RGBA',(cell*4,cell*1))
        for col,(im,box) in enumerate(zip(cells,boxes)):
            im=im.crop(box)
            im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
            pixels=np.asarray(im).copy()
            pixels[pixels[:,:,3]==0]=0 # Canonical transparent RGB, not background removal.
            im=Image.fromarray(pixels)
            x=col*cell+(cell-im.width)//2
            y=cell-im.height-6 if cell==96 else (cell-im.height)//2
            strip.alpha_composite(im,(x,y))
        rows.append(strip)
    out=Image.new('RGBA',(cell*4,cell*5))
    for row,strip in enumerate(rows):out.alpha_composite(strip,(0,row*cell))
    return out

# Preserve all eight classic pets byte-for-byte at the pixel level.
pet_path=root/'assets/pets/pets.png'
classic=Image.open(pet_path).convert('RGBA').crop((0,0,384,768))
new_pets=pack(args.source/'pets-five.png',96,78)
all_pets=Image.new('RGBA',(384,1248));all_pets.alpha_composite(classic,(0,0));all_pets.alpha_composite(new_pets,(0,768))
all_pets.save(pet_path,optimize=True)
pack(args.source/'lobao-abilities.png',128,112).save(root/'assets/abilities/lobao.png',optimize=True)

# Reframe the existing HUMAN head for the HUD; full sprite remains available.
sprite_path=root/'assets/sprites/lobao.png'
sprite=Image.open(sprite_path).convert('RGBA')
head=sprite.crop((110,32,195,120))
for name,size in [('face-lobao.png',(168,168)),('portrait-lobao.png',(320,360))]:
    ImageOps.pad(head,size,method=Image.Resampling.NEAREST,color=(0,0,0,0)).save(root/'assets/ui'/name,optimize=True)
# Remove hidden RGB only under fully transparent pixels, preserving the visible sprite.
pixels=np.asarray(sprite).copy();pixels[pixels[:,:,3]==0]=0
Image.fromarray(pixels).save(sprite_path,optimize=True)
print('Packed pets 384x1248, abilities 512x640, and existing human portraits; eight classic pet rows preserved.')
