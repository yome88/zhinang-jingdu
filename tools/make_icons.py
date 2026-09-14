"""生成《智囊精读》PWA 图标：朱砂印章风（白字"智囊"竖排于朱红印面）"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent.parent
FONT = r"C:\Users\JS\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\fonts\NotoSansCJKsc-Bold.otf"
PAPER = (247, 242, 231)
SEAL = (166, 58, 43)

def make(size, path, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        # maskable：满铺纸色底，印章缩小居中（safe zone 80%）
        d.rectangle([0, 0, size, size], fill=PAPER + (255,))
        m = int(size * 0.16)
        d.rounded_rectangle([m, m, size - m, size - m], radius=int(size * 0.06),
                            fill=SEAL, outline=(140, 44, 32), width=max(2, size // 128))
        fsize = int((size - 2 * m) * 0.42)
    else:
        d.rectangle([0, 0, size, size], fill=PAPER + (255,))
        m = int(size * 0.05)
        d.rounded_rectangle([m, m, size - m, size - m], radius=int(size * 0.08),
                            fill=SEAL, outline=(140, 44, 32), width=max(2, size // 128))
        fsize = int((size - 2 * m) * 0.40)
    font = ImageFont.truetype(FONT, fsize)
    # 竖排：智 上 囊 下
    cx = size // 2
    for i, ch in enumerate(["智", "囊"]):
        bbox = d.textbbox((0, 0), ch, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        y = size // 2 - (h + int(fsize * 0.08)) + i * (h + int(fsize * 0.16)) - bbox[1] + (0 if i else 0)
        # 计算两字的总块居中
        d.text((cx - w / 2 - bbox[0], y), ch, font=font, fill=(255, 252, 245))
    img.save(path)
    print("saved", path, size)

icons = ROOT / "icons"
icons.mkdir(exist_ok=True)
make(512, icons / "icon-512.png")
make(192, icons / "icon-192.png")
make(180, icons / "apple-touch-icon.png")
make(512, icons / "icon-maskable-512.png", maskable=True)
