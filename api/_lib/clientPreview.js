// Every template folder currently staged for client review, mapped to the
// exact static file it serves. This whitelist is what keeps a signed link's
// destination fixed — the redeem endpoint only ever redirects to one of
// these literal paths, never to whatever a crafted token's slug claims.
//
// Edge Runtime can't import this file the way api/* can (see middleware.js's
// header) — middleware.js keeps its own CLIENT_PREVIEW_SLUGS list. Add a new
// staged project to both, or the two will disagree about what's gated.
const CLIENT_PREVIEW_SLUGS = {
  'professor-brawn': '/templates/professor-brawn/index.html',
  'timestealer-cafe': '/templates/timestealer-cafe/index.html',
  'zz-pipeline-test': '/templates/zz-pipeline-test/index.html',
};

module.exports = { CLIENT_PREVIEW_SLUGS };
