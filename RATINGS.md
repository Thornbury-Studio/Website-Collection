# Manager ratings

Every hub card shows ten dots in its chrome bar. The dots are a human judgement of the finished site, 1 to 10.

| Rating | Dots lit | Colour |
|---|---|---|
| 1 to 4 | that many | red |
| 5 to 6 | that many | yellow |
| 7 to 10 | that many | green |

The unlit dots stay visible. A site nobody has rated shows ten unlit dots. A site whose `data-facet` is `experimental` has no dots: the bar says EXPERIMENTAL and it cannot be rated.

## Who may rate

Only manager machines: BENCH and HELM. Not DECK, not an AI helper on its own judgement, not a subagent. A rating is a human's call, passed through a manager machine.

## How

```
node scripts/ratings.mjs set <slug> <1-10>
node scripts/ratings.mjs unset <slug>
node scripts/ratings.mjs check
```

`set` refuses on any machine that is not a manager (it reads `HUB_MACHINE`, else the Admin-Hub clone's `.machine`), re-renders the dots, and prints the trailer the commit message must end with:

```
Rated-by: BENCH
```

Never hand-edit the dots or `data-rating`. `.github/workflows/ratings.yml` fails a push that changes a rating without a `Rated-by:` trailer naming BENCH or HELM, or whose dots do not match the `data-rating` on the card.

## Current ratings

wellness-hollin (HOLLIN): 3/10.
