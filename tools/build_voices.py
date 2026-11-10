#!/usr/bin/env python3
"""Gera as falas em pt-BR (edge-tts) e o manifesto.

Para trocar uma fala, substitua o mp3 pelo mesmo nome.
Não precisa rodar este script de novo, a menos que o texto mude.
"""
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
QUOTES = json.loads(Path('/tmp/quotes.json').read_text(encoding='utf-8'))
VOICE_DIR = ROOT / 'assets/audio/voice'
FIGHTER_DIR = VOICE_DIR / 'fighters'
RIVAL_DIR = VOICE_DIR / 'rivalries'

ANNOUNCER = 'pt-BR-AntonioNeural'
CAST = {
    'emilio': 'pt-BR-AntonioNeural',
    'odette': 'pt-BR-FranciscaNeural',
    'ponteiro': 'pt-BR-AntonioNeural',
    'nunes': 'pt-BR-ThalitaNeural',
    'du': 'pt-BR-AntonioNeural',
    'iales': 'pt-BR-ThalitaNeural',
    'felipinho': 'pt-BR-AntonioNeural',
    'hana': 'pt-BR-FranciscaNeural',
    'dandara-query': 'pt-BR-ThalitaNeural',
    'nina-vector': 'pt-BR-FranciscaNeural',
    'engenheira-prompt': 'pt-BR-ThalitaNeural',
    'grika': 'pt-BR-FranciscaNeural',
    'winx-exe': 'pt-BR-ThalitaNeural',
}
POOL = ['pt-BR-AntonioNeural', 'pt-BR-FranciscaNeural', 'pt-BR-ThalitaNeural']

ANNOUNCE = [
    ('round1', 'Round um.'),
    ('round2', 'Round dois.'),
    ('round3', 'Round três.'),
    ('final', 'Round final.'),
    ('fight', 'Lutem!'),
    ('ko', 'Ká ô!'),
    ('combo', 'Combo perfeito!'),
    ('perfect', 'Vitória perfeita!'),
    ('timeup', 'Tempo esgotado.'),
    ('youwin', 'Você venceu!'),
    ('youlose', 'Você perdeu.'),
    ('draw', 'Empate.'),
    ('title', 'Dê esse Fighters.'),
    ('ultimate', 'Ultimate!'),
    ('choose', 'Escolha seu lutador.'),
    ('stolen', 'Poder roubado.'),
    ('storm', 'Tempestade!'),
    ('powerup', 'Poder!'),
    ('unlocked', 'Desbloqueado.'),
]

RIVALS = [
    ('emilio', 'odette', 'Odette, a prancheta não ganha de quem overclocka o SESI.'),
    ('emilio', 'ponteiro', 'Ponteiro, o relógio não salva quem chega atrasado.'),
    ('nunes', 'ponteiro', 'Ponteiro, a fênix não espera a hora certa.'),
    ('iales', 'du', 'Du, o seu PHP é só mais um poder na minha coleção.'),
    ('qwen', 'gemini', 'Gemini, dois modelos na arena. Só um responde.'),
    ('urbano', 'xeon', 'Xeon, o cais não esquece quem largou o convés.'),
    ('stack', 'gitmaster', 'Git, esse merge não entra sem revisão.'),
    ('frontend', 'backend', 'Backend, a tela chegou antes da sua API.'),
    ('hacker', 'guarda-digital', 'Guarda, o firewall nem me viu entrar.'),
    ('winx-exe', 'nina-vector', 'Nina, fecha as janelas. O processo vai acabar.'),
]


def voice_for(fid):
    if fid in CAST:
        return CAST[fid]
    return POOL[sum(ord(c) for c in fid) % len(POOL)]


async def synth(text, voice, dest, rate='+0%'):
    dest.parent.mkdir(parents=True, exist_ok=True)
    last = None
    for attempt in range(3):
        try:
            await edge_tts.Communicate(text, voice, rate=rate).save(str(dest))
            return
        except Exception as exc:
            last = exc
            await asyncio.sleep(0.4 * (attempt + 1))
    raise RuntimeError(f'{dest.name}: {last}')


async def bounded(sem, coro):
    async with sem:
        await coro


async def main():
    sem = asyncio.Semaphore(2)
    jobs = []
    announcer = {}
    for key, text in ANNOUNCE:
        dest = VOICE_DIR / f'{key}.mp3'
        announcer[key] = {'file': f'assets/audio/voice/{key}.mp3', 'text': text}
        jobs.append(bounded(sem, synth(text, ANNOUNCER, dest, rate='-6%')))
    fighters = {}
    for row in QUOTES:
        fid = row['id']
        voice = voice_for(fid)
        entry = {}
        for kind, field in (('intro', 'intro'), ('ultimate', 'ult'), ('win', 'win')):
            text = (row.get(field) or 'Vamos nessa.').replace('...', ', ').strip()
            rel = f'assets/audio/voice/fighters/{fid}-{kind}.mp3'
            entry[kind] = {'file': rel, 'text': text}
            jobs.append(bounded(sem, synth(text, voice, ROOT / rel)))
        fighters[fid] = entry
    rivalries = []
    for a, b, text in RIVALS:
        rel = f'assets/audio/voice/rivalries/{a}__{b}.mp3'
        rivalries.append({'a': a, 'b': b, 'file': rel, 'text': text})
        jobs.append(bounded(sem, synth(text, voice_for(a), ROOT / rel, rate='-4%')))
    results = await asyncio.gather(*jobs, return_exceptions=True)
    failed = [r for r in results if isinstance(r, Exception)]
    if failed:
        print('falhas', len(failed))
        for err in failed[:12]:
            print(err)
    book = {
        '_como_trocar': 'Substitua o mp3 pelo mesmo caminho e o mesmo nome. A legenda usa o texto daqui. Se só o áudio mudar, não precisa editar este arquivo.',
        'announcer': announcer,
        'fighters': fighters,
        'rivalries': rivalries,
    }
    (VOICE_DIR / 'manifest.json').write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    js = '/* Gerado por tools/build_voices.py. Trocar um mp3 não exige novo build. */\nconst VOICE_BOOK = ' + json.dumps(book, ensure_ascii=False) + ';\n'
    (ROOT / 'js/data/voice-book.js').write_text(js, encoding='utf-8')
    print('falas', len(jobs))


if __name__ == '__main__':
    asyncio.run(main())
