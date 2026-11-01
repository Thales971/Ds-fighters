#!/usr/bin/env python3
"""Import official transparent cat animation into the existing Mistral pet ID/row."""
from pathlib import Path
from PIL import Image
import argparse
p=argparse.ArgumentParser();p.add_argument('gif');a=p.parse_args();root=Path(__file__).resolve().parents[1]
gif=Image.open(a.gif);frames=[]
for k in [0,gif.n_frames//4,gif.n_frames//2,3*gif.n_frames//4]:
 gif.seek(k);frames.append(gif.convert('RGBA').copy())
boxes=[f.getbbox() for f in frames];assert all(boxes)
box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
scale=min(82/(box[2]-box[0]),82/(box[3]-box[1]));size=(round((box[2]-box[0])*scale),round((box[3]-box[1])*scale))
row=Image.new('RGBA',(384,96))
for k,f in enumerate(frames):
 tile=f.crop(box).resize(size,Image.Resampling.NEAREST);row.alpha_composite(tile,(k*96+(96-size[0])//2,90-size[1]))
atlaspath=root/'assets/pets/pets.png';old=Image.open(atlaspath).convert('RGBA');atlas=old.copy();atlas.paste(row,(0,8*96));atlas.save(atlaspath,optimize=True)
assert atlas.crop((0,0,384,8*96)).tobytes()==old.crop((0,0,384,8*96)).tobytes()
assert atlas.crop((0,9*96,384,13*96)).tobytes()==old.crop((0,9*96,384,13*96)).tobytes()
row.save(root/'assets/pets/mistral-cat.png',optimize=True)
print('Gato Mistral: quatro frames oficiais, ID/linha preservados, outros 12 pets idênticos.')
