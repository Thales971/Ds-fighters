#!/usr/bin/env python3
"""Audit explicit per-fighter ability atlas wiring in the browser runtime.

By default this reports the current state without failing, so partially migrated
legacy rosters remain inspectable. Use --strict to require every fighter to have
five unique rows in its own `abil:<id>`/`fx2:<id>` sheet.
"""
import argparse
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/')
parser = argparse.ArgumentParser()
parser.add_argument('--strict', action='store_true', help='exit non-zero if any fighter lacks a complete own five-row atlas')
args = parser.parse_args()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.goto(BASE, wait_until='load')
    page.wait_for_function("window.DSGame && Array.isArray(FIGHTERS) && POWERS && typeof Art !== 'undefined'", timeout=30000)
    rows = page.evaluate("""() => FIGHTERS.map(f => {
      const moves = (POWERS[f.id] && POWERS[f.id].powers) || [];
      const own = moves.filter(p => p.visualSheet === f.id && Number.isInteger(p.visualRow));
      const atlas = Object.keys(Art.images || {}).includes('abil:' + f.id) && Object.keys(Art.images || {}).includes('fx2:' + f.id);
      const rows = [...new Set(own.map(p => p.visualRow))].sort((a, b) => a - b);
      const complete = moves.length === 5 && own.length === 5 && rows.join(',') === '0,1,2,3,4';
      return {id: f.id, name: f.name, moves: moves.length, ownRows: rows, complete, registeredAtlas: atlas};
    })""")
    browser.close()

    complete = [row for row in rows if row['complete']]
    missing = [row['id'] for row in rows if not row['complete']]
    print(json.dumps({
        'totalFighters': len(rows),
        'fullyUniqueFiveMoveAtlases': len(complete),
        'missingOrPartial': missing,
        'details': rows,
    }, ensure_ascii=False, indent=2))
    if args.strict and missing:
        sys.exit(1)
