import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
src, dst = sys.argv[1], sys.argv[2]
f = TTFont(src)
f = instancer.instantiateVariableFont(f, {'wght': (300, 800), 'wdth': (62, 100)})
opts = subset.Options(); opts.flavor = 'woff2'
opts.layout_features = ['kern', 'liga', 'calt', 'tnum', 'lnum', 'case']
opts.name_IDs = ['*']; opts.notdef_outline = True
s = subset.Subsetter(opts)
chars = ''.join(chr(c) for c in range(0x20, 0x7f)) + '\u00a0\u00b7\u00d7\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u2192\u2190\u00a9\u00e9\u2022'
s.populate(unicodes=[ord(c) for c in chars]); s.subset(f)
f.flavor = 'woff2'; f.save(dst)
print(dst, os.path.getsize(dst))
