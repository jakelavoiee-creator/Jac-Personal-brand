"""AURA type pair: Times New Roman Condensed (italic, lowercase) + Akzidenz-Grotesk (bold caps).

Both are commercial fonts, so they aren't in the repo. They're picked up automatically when present:
  - assets/fonts/licensed/   (git-ignored) - drop your licensed .otf/.ttf files here
  - your installed Windows fonts (Times New Roman ships with Windows)
Until then the free stand-ins are used: Tinos Italic (Times-metric) and Archivo ExtraBold (grotesk).
"""
import glob
import os
import shutil
from pathlib import Path

from PIL import ImageFont

HERE = Path(__file__).resolve().parent
FONTS = HERE / "assets" / "fonts"
LIC = FONTS / "licensed"
WIN = [Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts",
       Path(os.environ.get("LOCALAPPDATA", "~")).expanduser() / "Microsoft" / "Windows" / "Fonts"]


def _find(patterns, fallback):
    for d in [LIC] + WIN:
        for pat in patterns:
            hits = sorted(glob.glob(str(d / pat)))
            if hits:
                return Path(hits[0])
    return FONTS / fallback


SERIF = _find(["*Times*Cond*Ital*.[ot]tf", "*TimesNewRoman*Cond*It*.[ot]tf", "timesi.ttf", "*Times*New*Roman*Italic*.[ot]tf"],
              "Tinos-Italic.ttf")
GROTESK = _find(["*Akzidenz*Bold*Cond*.[ot]tf", "*Akzidenz*Bold*.[ot]tf", "*AkzidenzGrotesk*Bd*.[ot]tf", "*Akzidenz*.[ot]tf"],
                "Archivo-ExtraBold.ttf")
# Times New Roman Condensed is narrower than regular Times: squeeze when we only have a regular cut
SERIF_SCALE = 1.0 if "cond" in SERIF.name.lower() else 0.82


def family(path):
    return ImageFont.truetype(str(path), 20).getname()[0]


def ass_fonts_dir(build):
    """Copy the chosen fonts next to the subtitles so libass finds them by family name."""
    d = Path(build) / "fonts"
    d.mkdir(parents=True, exist_ok=True)
    for f in (SERIF, GROTESK):
        if not (d / f.name).exists():
            shutil.copy(f, d / f.name)
    return d


def describe():
    s = "Times New Roman" if SERIF.parent != FONTS else "Tinos (free stand-in for Times New Roman)"
    g = "Akzidenz-Grotesk" if GROTESK.parent != FONTS else "Archivo ExtraBold (free stand-in for Akzidenz-Grotesk)"
    return f"fonts: {s} + {g}"
