"""Extract the final Illustrator's PDF vectors without changing their common canvas."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET
import pymupdf

source = Path(r'D:\xwechat_files\wxid_tndj3fvz02ws11_0bcd\msg\file\2026-10\UMDW-DataPattern-Final-1014.ai')
out = Path('public/assets/final1014')
out.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(source)
patterns = []
namespace = '{http://www.w3.org/2000/svg}'
ET.register_namespace('', namespace[1:-1])
for i, page in enumerate(doc):
    svg = page.get_svg_image()
    svg = re.sub(r'\s+inkscape:[\w-]+="[^"]*"', '', svg)
    for old in sorted(re.findall(r'id="([^"]+)"', svg), key=len, reverse=True):
        svg = svg.replace(f'id="{old}"', f'id="final{i+1}-{old}"').replace(f'#{old})', f'#final{i+1}-{old})').replace(f'"#{old}"', f'"#final{i+1}-{old}"')
    pattern = {'id': i+1, 'viewBox': '0 0 700 700', 'svg': svg}
    if 20 <= i <= 26:
        for part in ['disk', 'nodes']:
            root = ET.fromstring(svg)
            defs = {e for d in root.findall(namespace+'defs') for e in d.iter()}
            paths = [e for e in root.iter(namespace+'path') if e not in defs]
            parents = {child: parent for parent in root.iter() for child in parent}
            for n, path in enumerate(paths):
                if (part == 'disk' and n > 0) or (part == 'nodes' and n == 0):
                    parents[path].remove(path)
            pattern[part] = ET.tostring(root, encoding='unicode')
    (out/f'pattern-{i+1:02}.svg').write_text(svg, encoding='utf-8')
    if 1 <= i <= 4 or 13 <= i <= 31:
        bounds = pymupdf.Rect()
        for drawing in page.get_drawings():
            if drawing['rect'].get_area() > 1:
                bounds |= drawing['rect']
        side = max(bounds.width, bounds.height) * 1.10
        cx, cy = (bounds.x0+bounds.x1)/2, (bounds.y0+bounds.y1)/2
        box = f'{cx-side/2:g} {cy-side/2:g} {side:g} {side:g}'
        thumbnail = re.sub(r'viewBox="[^"]+"', f'viewBox="{box}"', svg, count=1)
        (out/f'thumbnail-{i+1:02}.svg').write_text(thumbnail, encoding='utf-8')
    patterns.append(pattern)
root = ET.fromstring(patterns[39]['svg'])
defs = {e for d in root.findall(namespace+'defs') for e in d.iter()}
paths = [e for e in root.iter(namespace+'path') if e not in defs]
parents = {child: parent for parent in root.iter() for child in parent}
for path in paths[2:]:
    parents[path].remove(path)
patterns[1]['upright'] = ET.tostring(root, encoding='unicode')
(out/'patterns.json').write_text(json.dumps(patterns), encoding='utf-8')
print('Extracted 40 common-canvas vectors; split 7 region disks and node layers.')
