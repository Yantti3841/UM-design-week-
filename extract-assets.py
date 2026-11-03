"""Read-only vector extraction from the two supplied Illustrator PDF payloads."""
from pathlib import Path
import json
import re
import pymupdf

out = Path('public/assets')
out.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(r'C:\Users\GuanXer\Downloads\UMDW-PeachBlossom-DataPatterns.ai')
patterns = []
for i, page in enumerate(doc):
    svg = page.get_svg_image()
    # Small center registration marks are not part of the visible pattern.
    drawings = [d for d in page.get_drawings() if d['rect'].get_area() > 2]
    bounds = pymupdf.Rect()
    for d in drawings:
        bounds |= d['rect']
    if i < 7:
        bounds = pymupdf.Rect(0, 0, 700, 700)
    side = max(bounds.width, bounds.height) * 1.025
    cx, cy = (bounds.x0 + bounds.x1)/2, (bounds.y0 + bounds.y1)/2
    box = f'{cx-side/2:g} {cy-side/2:g} {side:g} {side:g}'
    svg = re.sub(r'viewBox="[^"]+"', f'viewBox="{box}"', svg, count=1)
    # Give every source ID a page-specific prefix so composited SVGs stay valid.
    ids = re.findall(r'id="([^"]+)"', svg)
    for old in sorted(ids, key=len, reverse=True):
        svg = svg.replace(f'id="{old}"', f'id="p{i+1}-{old}"')
        svg = svg.replace(f'#{old})', f'#p{i+1}-{old})').replace(f'"#{old}"', f'"#p{i+1}-{old}"')
    (out / f'pattern-{i+1:02}.svg').write_text(svg, encoding='utf-8')
    patterns.append({'id':i+1, 'viewBox':box, 'svg':svg})
(out/'patterns.json').write_text(json.dumps(patterns), encoding='utf-8')
poster = pymupdf.open(r'C:\Users\GuanXer\Downloads\UMDW-Poster-2x3.ai')
for i, page in enumerate(poster):
    (out/f'poster-{i+1}.svg').write_text(page.get_svg_image(), encoding='utf-8')
print('Extracted 21 original vector patterns and both poster pages.')
