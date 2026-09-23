"""UNFURL. — find where the film is in focus, frame by frame.

    python tools/focus.py        -> tools/focus.json (read by tools/film.py)

The master is a shallow-focus macro: leaves drift through a thin focal plane, so a
fixed 16:9 band of the portrait frame is often all blur. For each of the 160
frames this measures sharpness (local Laplacian energy) down the height of the
frame, picks the band centre that holds the most of it, and smooths that path over
time (a camera operator following focus, not a jump cut).
"""
import json, os, subprocess, tempfile, shutil
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'raw', 'AdobeStock_737291599.mov')
N = 160
CROP_L, CROP_R = 72, 24


def main():
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                         '-of', 'csv=p=0', SRC]).decode().strip())
    tmp = tempfile.mkdtemp(prefix='focus-')
    # decode small: 540 wide is plenty to find focus
    subprocess.check_call(['ffmpeg', '-loglevel', 'error', '-y', '-i', SRC, '-vf',
                           'fps=%f,scale=540:-2' % ((N - 1) / (dur - 0.12)), os.path.join(tmp, '%04d.png')])
    files = sorted(os.listdir(tmp))[:N]
    raw, sharp_total = [], []
    for f in files:
        g = cv2.imread(os.path.join(tmp, f), cv2.IMREAD_GRAYSCALE).astype(np.float32)
        H, W = g.shape
        lap = np.abs(cv2.Laplacian(cv2.GaussianBlur(g, (3, 3), 0), cv2.CV_32F))
        rows = lap.mean(axis=1)                       # sharpness per row
        band = int(round(W * 9 / 16))                 # a 16:9 band of this width
        csum = np.concatenate([[0], np.cumsum(rows)])
        best, best_c = -1, 0.5
        for top in range(0, H - band, 4):
            e = csum[top + band] - csum[top]
            if e > best:
                best, best_c = e, (top + band / 2) / H
        raw.append(best_c)
        sharp_total.append(float(rows.mean()))
    shutil.rmtree(tmp, ignore_errors=True)
    while len(raw) < N:
        raw.append(raw[-1])
    raw = np.array(raw[:N])
    # smooth over ~4 s of film either side, so the band moves like a camera, not a jump
    k = 22
    pad = np.pad(raw, k, mode='edge')
    ker = np.hanning(2 * k + 1); ker /= ker.sum()
    smooth = np.convolve(pad, ker, mode='valid')
    lo, hi = 0.30, 0.68
    smooth = np.clip(smooth, lo, hi)
    out = {'centre': [round(float(x), 4) for x in smooth], 'raw': [round(float(x), 4) for x in raw],
           'sharp': [round(x, 3) for x in sharp_total]}
    with open(os.path.join(ROOT, 'tools', 'focus.json'), 'w') as fh:
        json.dump(out, fh)
    print('centre range', smooth.min(), smooth.max(), 'frames', len(smooth))


if __name__ == '__main__':
    main()
