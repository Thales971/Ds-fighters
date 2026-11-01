#!/usr/bin/env python3
"""Remove match replay UI/recording. Profile data and network snapshot effects stay intact."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def remove_block(text,marker):
 start=text.find(marker)
 if start<0:return text
 brace=text.index('{',start);depth=1;end=brace+1
 while depth:
  depth+=(text[end]=='{')-(text[end]=='}');end+=1
 if text[end:end+1]=='\n':end+=1
 return text[:start]+text[end:]
p=ROOT/'js/engine/game.js';s=p.read_text()
for marker in ['    if (this.replayFrames) {',"    if (this.rec && this.roundState === 'fight') {",'    if (this.rec) {\n      try {']:s=remove_block(s,marker)
s='\n'.join(line for line in s.splitlines() if not any(t in line for t in ['this.replaySeed','this.replayFrames','this.rec =','if (this.rec) { let sd','this._frameInputs','// RNG com seed pro replay']))+'\n'
s=s.replace('replayFx','applyNetworkFx').replace('dir = 1, replay)', 'dir = 1, crackSeed)').replace('const seed = replay ? replay :', 'const seed = crackSeed ? crackSeed :')
assert 'this.rec' not in s and 'replay' not in s.lower();p.write_text(s)
p=ROOT/'js/ui/ui.js';s=p.read_text()
if '  listReplays() {' in s:
 begin=s.index('  listReplays() {');end=s.index('  arcadeNext() {',begin);s=s[:begin]+s[end:]
s='\n'.join(line for line in s.splitlines() if not any(t in line for t in ['enter_replays()','btn-replays-back']))+'\n';assert 'playReplay' not in s;p.write_text(s)
p=ROOT/'index.html';s=p.read_text();s=re.sub(r'    <section class="screen" id="scr-replays"[\s\S]*?</section>\n','',s)
s=re.sub(r'<button[^>]*data-go="replays"[\s\S]*?</button>','',s);assert 'replay' not in s.lower();p.write_text(s)
print('Replay removido: menu, handlers, reprodução, gravação e escrita. Perfil/rede preservados.')
