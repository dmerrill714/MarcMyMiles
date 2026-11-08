from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 1024
BG = "#080b0a"
LIME = "#d8ff54"
WHITE = "#f4f7f3"
MUTED = (244, 247, 243, 38)

image = Image.new("RGBA", (SIZE, SIZE), BG)
draw = ImageDraw.Draw(image)

# A restrained speedometer arc. The 270-degree sweep leaves a gap at the bottom.
box = (172, 172, 852, 852)
draw.arc(box, start=135, end=405, fill=LIME, width=76)

# Tick marks just inside the arc.
import math

center = SIZE / 2
for i in range(9):
    angle = math.radians(135 + i * (270 / 8))
    outer = 294
    inner = 260 if i % 2 == 0 else 272
    x1 = center + math.cos(angle) * inner
    y1 = center + math.sin(angle) * inner
    x2 = center + math.cos(angle) * outer
    y2 = center + math.sin(angle) * outer
    draw.line((x1, y1, x2, y2), fill=MUTED, width=18 if i % 2 == 0 else 10)

# Needle pointing just past the 20-mph-style start of the sweep.
needle_angle = math.radians(318)
tip = (center + math.cos(needle_angle) * 230, center + math.sin(needle_angle) * 230)
tail = (center - math.cos(needle_angle) * 58, center - math.sin(needle_angle) * 58)
draw.line((tail, tip), fill=WHITE, width=32)
draw.ellipse((center - 38, center - 38, center + 38, center + 38), fill=LIME)
draw.ellipse((center - 13, center - 13, center + 13, center + 13), fill=BG)

out = Path("public/icons")
out.mkdir(parents=True, exist_ok=True)

image.resize((512, 512), Image.Resampling.LANCZOS).save(out / "icon-512.png")
image.resize((192, 192), Image.Resampling.LANCZOS).save(out / "icon-192.png")
image.resize((512, 512), Image.Resampling.LANCZOS).save(out / "icon-maskable-512.png")
image.resize((180, 180), Image.Resampling.LANCZOS).save(out / "apple-touch-icon.png")
print("Generated app icons in public/icons")
