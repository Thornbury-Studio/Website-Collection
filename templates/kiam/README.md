# KIAM 咸 — small-batch salted sodas

Showcase site for an invented Singapore soda business: five pages, no build
step, no backend. Open `index.html`, or serve the folder:

    node tools/serve.mjs 4180      # http://127.0.0.1:4180/

Verify in a real browser (headless Chrome over CDP, screenshots + checks):

    node tools/shot.mjs http://127.0.0.1:4180/index.html desktop home
    node tools/shot.mjs http://127.0.0.1:4180/sodas.html mobile sodas
    node tools/interact.mjs        # six-pack builder, map, form, phone nav

Read `CLAUDE.md` first, then `DESIGN.md` (tokens and rules), `PRODUCT.md`
(every number the pages quote) and `IMAGE-CREDITS.md` (provenance).
