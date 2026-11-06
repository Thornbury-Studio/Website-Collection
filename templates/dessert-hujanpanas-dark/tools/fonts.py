# Hujan Panas: cuts the self-hosted Bricolage Grotesque down to what the page sets.
#   usage: python tools/fonts.py <Google Fonts latin woff2 of Bricolage Grotesque> <out.woff2>
# Pins width at 100, keeps weight (300-800), pins optical size at 36, keeps Latin-1 plus the
# typographic marks the copy uses. The family has no Reserved Font Name (see fonts/BricolageGrotesque-OFL.txt).
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
f = instantiateVariableFont(f, {"wdth": 100, "wght": (300, 800), "opsz": 36})
opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case"]
s = subset.Subsetter(options=opts)
s.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2032, 0x2212, 0x2192, 0x2190, 0x00D7, 0x2009, 0x202F])
s.subset(f); f.flavor = "woff2"; f.save(out)
