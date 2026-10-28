import sys, numpy as np, onnxruntime as ort, cv2
from PIL import Image, ImageFilter
SP = sys.argv[1]
orig = Image.open("subject-orig.jpg").convert("RGB")           # re-encoded below, so EXIF never carries over
W, H = orig.size
rgb = np.asarray(orig)

# ---- depth (Depth Anything V2 Small, Apache-2.0) ----------------------------
sess = ort.InferenceSession(f"{SP}/models/depth-anything-v2-small.onnx", providers=["CPUExecutionProvider"])
inp = np.asarray(orig.resize((518, 924), Image.BICUBIC), dtype=np.float32) / 255.0
inp = (inp - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
out = sess.run(None, {sess.get_inputs()[0].name: inp.transpose(2, 0, 1)[None].astype(np.float32)})[0]
d = np.squeeze(out).astype(np.float32)                           # larger = nearer
d = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)

# ---- alpha: ISNet cutout, tablecloth + stray table edge removed ------------------
cut = np.asarray(Image.open("cut-isnet-general-use.png").convert("RGBA"))
alpha = cut[..., 3].astype(np.float32) / 255.0
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
cloth = ((hsv[..., 0] > 12) & (hsv[..., 0] < 32) & (hsv[..., 1] > 70) & (hsv[..., 2] > 90)).astype(np.uint8)
cloth = cv2.dilate(cv2.morphologyEx(cloth, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8)), np.ones((31, 31), np.uint8))
cloth[:int(H * 0.52)] = 0
cloth[:, :int(W * 0.78)] = 0                                      # cloth lives only at the far right
alpha = alpha * (1 - cv2.GaussianBlur(cloth.astype(np.float32), (0, 0), 3))
alpha[int(H*0.555):int(H*0.68), int(W*0.80):] = 0                  # chair-back fragment right of the arm
# keep the largest connected component + anything big, drop crumbs
bin_ = (alpha > 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(bin_)
keep = np.zeros_like(bin_)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 4000: keep[lab == i] = 1
alpha = alpha * cv2.dilate(keep, np.ones((9, 9), np.uint8))
# pull the edge in 1px so no backdrop halo rides on the cutout
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))
alpha = np.clip(cv2.GaussianBlur(alpha, (0, 0), 0.8), 0, 1)

# decontaminate edge colour: smear interior colour outward a little
solid = (alpha > 0.92).astype(np.uint8)
fill = cv2.inpaint(rgb, 1 - solid, 6, cv2.INPAINT_TELEA)
mixk = np.clip((1 - alpha) * 3, 0, 1)[..., None] * (alpha[..., None] > 0.02)
rgb_dec = (rgb * (1 - mixk) + fill * mixk).astype(np.uint8)
rgba = np.dstack([rgb_dec, (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save("portrait-cutout.png")

# ---- depth normalised inside the cutout ----------------------------------------
m = alpha > 0.5
lo, hi = np.percentile(d[m], [3, 99])
dn = np.clip((d - lo) / (hi - lo), 0, 1)
dn = cv2.GaussianBlur(dn, (0, 0), 4)
# fade to flat outside the silhouette so no sheet stretches off the edge
core = cv2.GaussianBlur(cv2.erode((alpha > 0.5).astype(np.float32), np.ones((15, 15), np.uint8)), (0, 0), 6)
dn = dn * core
Image.fromarray((dn * 255).astype(np.uint8), "L").save("portrait-depth.png")

# ---- backdrop: the photo with the sitter painted out ---------------------------------
mask = cv2.dilate((alpha > 0.15).astype(np.uint8), np.ones((19, 19), np.uint8))
small = cv2.resize(rgb, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
msmall = cv2.resize(mask, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
ip = cv2.inpaint(small, msmall, 9, cv2.INPAINT_TELEA)
ip = cv2.resize(ip, (W, H), interpolation=cv2.INTER_CUBIC)
soft = cv2.GaussianBlur(ip, (0, 0), 7)
mm = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 3)[..., None]
bd = (rgb * (1 - mm) + soft * mm).astype(np.uint8)
Image.fromarray(bd).save("portrait-backdrop.png")
print("alpha coverage", float((alpha > 0.5).mean()), "depth range", float(lo), float(hi))
