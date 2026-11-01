#!/usr/bin/env python3
"""Extrai áudio de arquivos fornecidos pelo usuário, normaliza e atualiza playlist.
Uso: python3 tools/import-battle-music.py /pasta/dos/arquivos --workers 3
Não baixa música e não modifica originais. FFmpeg/ffprobe precisam estar no PATH.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/music/rock'
PLAYLIST = ROOT / 'assets/music/playlist.json'
REPORT = ROOT / 'assets/music/import-report.json'
TITLES = {
 'LYU-8IFcDPw':'Linkin Park — Faint',
 'mUfTybEv1HU':'Metal Gear Rising — The Hot Wind Blowing (Platinum Mix)',
 '2l0RMGid6vo':'Metal Gear Rising — It Has to Be This Way',
 'uGcsIdGOuZY':'Skillet — Hero',
 '1mjlM_RnsVE':'Skillet — Monster',
 'ixZDTiXiHsc':'Three Days Grace — Riot',
 '4qlCC1GOwFw':'Linkin Park — One Step Closer',
 'vjVkXlxsO8Q':'Linkin Park — Papercut',
 'j0lSpNtjPM8':'Papa Roach — Last Resort (Squeaky Clean Version)',
 'H2jCbXiEQI4':'Papa Roach — Between Angels and Insects',
 'd8ekz_CSBVg':'Three Days Grace — I Hate Everything About You',
 '7QU1nvuxaMA':'Audioslave — Like a Stone',
 'hTWKbfoikeg':'Nirvana — Smells Like Teen Spirit',
 'bWXazVhlyxQ':'Rage Against the Machine — Killing in the Name',
 'RYnFIRc0k6E':"Limp Bizkit — Rollin' (Air Raid Vehicle)",
 'ZpUYjpKg9KY':'Limp Bizkit — Break Stuff',
 '09LTT0xwdfw':'Disturbed — Down with the Sickness',
 'CSvFpBOe8eY':'System of a Down — Chop Suey!',
 'Dn8vzTsnPps':'Limp Bizkit — My Way',
 '2s3iGpDqQpQ':'Korn — Falling Away from Me',
 'mhJh5_6MuCk':'Slipknot — Killpop',
 'JGNqvH9ykfA':'Slipknot — Nero Forte',
 'VpATBBRajP8':'Slipknot — Unsainted',
 'PAAvNmoqDq0':'Slipknot — Sulfur',
 'AkFqg5wAuFk':'Pantera — Walk',
 'XEEasR7hVhA':'Slipknot — The Devil in I',
 '04F4xlWSFh0':'Drowning Pool — Bodies',
 '9gsAz6S_zSw':'Slipknot — Dead Memories',
 'iywaBOMvYLI':'System of a Down — Toxicity',
 'L-iepu3EtyE':'System of a Down — Aerials',
 'OYjZK_6i37M':'Godsmack — I Stand Alone',
 'jRGrNDV2mKc':'Korn — Freak on a Leash',
 'ZPUZwriSX4M':'Slipknot — Spit It Out',
 'D1jQKpse7Yw':'Slipknot — Left Behind',
 '5abamRO41fE':'Slipknot — Psychosocial',
 'qw2LU1yS7aw':'Slipknot — Before I Forget',
 '6fVE8kSM43I':'Slipknot — Duality',
 'B1zCN0YhW1s':'Slipknot — Wait and Bleed',
}


def probe(path):
    command = ['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels,duration:format=duration','-of','json',str(path)]
    return json.loads(subprocess.check_output(command, text=True))


def convert(source):
    match = re.search(r'\[([A-Za-z0-9_-]{11})\]$', source.stem)
    ident = match.group(1) if match else hashlib.sha256(source.name.encode()).hexdigest()[:11]
    title = TITLES.get(ident, re.sub(r'\[[^]]+\]', '', source.stem))
    slug = unicodedata.normalize('NFKD', title).encode('ascii','ignore').decode()
    slug = re.sub(r'[^a-z0-9]+','-',slug.lower()).strip('-')[:72]
    target = OUT / f'{slug}-{ident}.mp3'
    original = probe(source)
    if not original.get('streams'):
        raise ValueError(f'{source.name}: não tem áudio')
    original_duration = float(original['format']['duration'])
    metrics = {}
    if not target.exists():
        temporary = target.with_suffix('.tmp.mp3')
        command = ['ffmpeg','-hide_banner','-nostdin','-y','-loglevel','info','-threads','1','-filter_threads','1','-i',str(source),'-map','0:a:0','-vn','-sn','-dn','-af','loudnorm=I=-18:TP=-2:LRA=11:print_format=json,aresample=44100','-ac','2','-c:a','libmp3lame','-b:a','112k','-id3v2_version','3','-metadata','title='+title,str(temporary)]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode:
            temporary.unlink(missing_ok=True)
            raise RuntimeError(source.name+': '+result.stderr[-900:])
        blocks = re.findall(r'\{\s*"input_i"[^}]+\}', result.stderr)
        if blocks:
            metrics = json.loads(blocks[-1])
        temporary.replace(target)
    exported = probe(target)
    stream = exported['streams'][0]
    duration = float(exported['format']['duration'])
    assert stream['codec_name'] == 'mp3' and int(stream['sample_rate']) == 44100
    assert abs(duration-original_duration) < 1, (source.name, duration, original_duration)
    assert 0 < target.stat().st_size < 90*1024*1024
    relative = target.relative_to(ROOT).as_posix()
    record = {'title': title, 'file': relative, 'source_filename':source.name, 'source_duration_seconds':round(original_duration,3), 'duration_seconds':round(duration,3), 'bytes':target.stat().st_size, 'codec':'mp3', 'sample_rate':44100, 'normalization':metrics, 'source_provided_by_user':True}
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    sources = sorted(p for p in args.input.iterdir() if p.suffix.lower() in {'.mp4','.webm','.m4a','.mp3','.wav','.ogg','.flac'})
    if not sources:
        raise SystemExit('Nenhuma música recebida; playlist não foi alterada.')
    OUT.mkdir(parents=True,exist_ok=True)
    records = []
    print(f'Importando {len(sources)} arquivos; até {min(4,max(1,args.workers))} conversões simultâneas',flush=True)
    with ThreadPoolExecutor(max_workers=min(4,max(1,args.workers))) as pool:
        futures = [pool.submit(convert, source) for source in sources]
        for future in as_completed(futures):
            item = future.result(); records.append(item)
            print(f"[{len(records)}/{len(sources)}] {item['title']} — {item['duration_seconds']:.0f}s",flush=True)
    records.sort(key=lambda r:r['title'].casefold())
    playlist = json.loads(PLAYLIST.read_text())
    indexed = {t['file']:t for t in playlist.get('tracks',[]) if t.get('file')}
    indexed.update({r['file']:{'title':r['title'],'file':r['file']} for r in records})
    playlist['tracks'] = sorted(indexed.values(),key=lambda r:r['title'].casefold())
    playlist['_como_usar'] = 'Faixas fornecidas pelo proprietário, importadas com FFmpeg. Sorteio por luta, sem repetição consecutiva; volume moderado e ducking durante narrador. Não inclui vídeos originais.'
    PLAYLIST.write_text(json.dumps(playlist,ensure_ascii=False,indent=2)+'\n')
    REPORT.write_text(json.dumps({'normalization_target':{'integrated_lufs':-18,'true_peak_db':-2,'lra':11},'encoding':{'codec':'mp3','bitrate_kbps':112,'sample_rate':44100},'tracks':records,'total_bytes':sum(r['bytes'] for r in records)},ensure_ascii=False,indent=2)+'\n')
    print(f"Concluído: {len(records)} faixas, {sum(r['bytes'] for r in records)/1024**2:.1f} MiB de áudio, originais preservados.",flush=True)

if __name__ == '__main__':
    main()
