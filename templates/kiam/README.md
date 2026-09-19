# KIAM 咸 — small-batch salted sodas

Showcase site for an invented Singapore soda business: five pages, no build
step, no backend. Open `index.html`, or serve the folder:

    node tools/serve.mjs 4180      # http://127.0.0.1:4180/

Verify in a real browser (headless Chrome over CDP, screenshots + checks):

    node tools/shot.mjs http://127.0.0.1:4180/index.html desktop home
    node tools/shot.mjs http://127.0.0.1:4180/sodas.html mobile sodas
    node tools/interact.mjs        # six-pack builder, map, form, phone nav

Regenerate the product imagery from the licensed masters in `assets/raw/`:

    node tools/labels.mjs          # five printed labels from tools/label.html (server running)
    python tools/bottles.py        # five bottles from one photograph
    bash tools/encode-video.sh     # the pour loop and its poster
    python tools/encode.py         # every other web image

Read `CLAUDE.md` first, then `DESIGN.md` (tokens and rules), `PRODUCT.md`
(every number the pages quote) and `IMAGE-CREDITS.md` (provenance).
