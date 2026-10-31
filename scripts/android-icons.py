"""Makes the Android launcher icons and splash screens from app/brand/icon-512.png.
Run after changing the logo:  python3 scripts/android-icons.py   (needs Pillow: pip install pillow)"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
icon = Image.open(ROOT / 'app/brand/icon-512.png').convert('RGBA')
glyph = Image.open(ROOT / 'app/brand/icon-glyph-512.png').convert('RGBA')  # the logo without its background, for adaptive icons
ICON_BG = '#EA580C'
BG = (255, 251, 245, 255)

for d, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    out = RES / f'mipmap-{d}'
    out.mkdir(parents=True, exist_ok=True)
    small = icon.resize((px, px), Image.LANCZOS)
    small.save(out / 'ic_launcher.png')
    small.save(out / 'ic_launcher_round.png')
    # adaptive icon foreground: 108dp canvas, logo inside the 66dp safe zone
    fg_px = round(px * 108 / 48)
    fg = Image.new('RGBA', (fg_px, fg_px), (0, 0, 0, 0))
    inner = round(fg_px * 80 / 108)  # the glyph has its own margins, so it can be bigger than the 66dp safe zone
    fg.alpha_composite(glyph.resize((inner, inner), Image.LANCZOS), ((fg_px - inner) // 2, (fg_px - inner) // 2))
    fg.save(out / 'ic_launcher_foreground.png')

# Adaptive icon background colour
vals = RES / 'values'
(vals / 'ic_launcher_background.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">' + ICON_BG + '</color>\n</resources>\n')

# Splash screens: the logo in the middle of the cream background, same size as each existing file
for f in RES.glob('drawable*/splash.png'):
    w, h = Image.open(f).size
    s = Image.new('RGBA', (w, h), BG)
    k = round(min(w, h) * 0.28)
    s.alpha_composite(icon.resize((k, k), Image.LANCZOS), ((w - k) // 2, (h - k) // 2))
    s.convert('RGB').save(f)
print('Android icons and splash screens updated.')
