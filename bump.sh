#!/bin/sh
# ===========================================================
# Stamp a fresh version onto every local asset URL.
#
# GitHub Pages tells browsers to cache files for 10 minutes, so
# a returning visitor can run yesterday's JavaScript against
# today's HTML. Changing the URL on each deploy makes that
# impossible: a new version is a new file to the browser.
#
# Run this before committing any CSS or JS change.
# ===========================================================
set -e
cd "$(dirname "$0")"
exec python3 - "$@" <<'PY'
import re, datetime, sys

V = datetime.datetime.utcnow().strftime('%Y%m%d%H%M')
# only src="assets/..." and href="assets/..." — never a CDN or a font
pat = re.compile(r'((?:src|href)="assets/[^"?]+)(?:\?v=\d+)?(")')
total = 0
for page in ('index.html', 'admin.html'):
    s = open(page).read()
    s, n = pat.subn(lambda m: f'{m.group(1)}?v={V}{m.group(2)}', s)
    open(page, 'w').write(s)
    print(f'  {page}: {n} asset URLs stamped')
    total += n
print(f'stamped v={V}  ({total} URLs)')
PY
