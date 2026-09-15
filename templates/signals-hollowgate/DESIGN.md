# HOLLOWGATE — design notes

**Slug** `signals-hollowgate` · **Brand** Hollowgate Junction Signal Box Trust ·
**Niche** heritage railway signalling — a single preserved signal box, its open
days, its paid sessions, and its frame-overhaul work for other boxes.

## The persona

A small registered charity in the West Riding: twenty-two volunteers and one
paid fitter, keeping one Grade II listed junction box of 1897 standing and
working. It is not a railway. It does not run trains. It keeps a frame, and it
sells four things — open days, two-hour supervised sessions at the frame, a
one-day class in mechanical interlocking, and survey-and-overhaul work for
other preserved boxes. A site for this client has to do something no brochure
does: convince someone who has never heard of tappet locking that it is worth
climbing twenty-three steps to see.

## References

Three real ones, and they are load-bearing rather than decorative.

1. **Railway Clearing House lever colour code** (in force on British frames from
   the 1890s). Red stop signal, yellow distant, black points, blue facing point
   lock, brown gate lever, white spare. This is the entire palette of the site.
   Because every colour already has a job, none of them is available for
   decoration — red appears where something would stop a train, and on the
   plate that says the frame has refused you, and nowhere else.
2. **British Rail Corporate Identity Manual, 1965** (Design Research Unit —
   Milner, Kinneir). One grotesque, ruthlessly applied, set tight, ruled with
   hairlines, no ornament. Rail Alphabet itself is not open-licensed, so the
   site uses Public Sans (Libre Franklin-derived, institutional, sober) and
   takes the *discipline* rather than the letterforms. Spline Sans Mono does
   every number, because in a signal box every number is a lever.
3. **Signalling Record Society locking tables and RCH junction diagrams** — the
   dense numeric grid and the thin-ruled topological track diagram. Both appear
   here as themselves: the diagram at the top of the frame, the locking table
   printed on paper below it.

Deliberately not referenced: Victoriana, sepia, brass-and-steam nostalgia. The
Trust's own visual language is its paperwork, not a heritage gift shop.

## The mechanism — the reason this template exists

Sixteen working levers governed by a real interlocking. The whole behaviour
comes out of one list per lever in `js/frame.js`:

- **`needs`** — what must be standing before this lever will move. Read
  backwards, the same array says what this lever *holds* while it is reverse.
  That two-way reading is not a trick; in a real frame those are the same bars
  of steel.
- **`locks`** — the one relationship that refuses to be mutual. A facing point
  lock is a bolt: while 5 is reverse, 4 cannot move either way, but 4 never
  holds 5 back, or you could not bolt points that were already lying reverse.

Everything else falls out of those two fields: the refusal messages, the
release order, the routes, the diagram states, and the locking table on
`frame.html`, which is **printed from the same array** rather than typed beside
it — the only way to be certain the document and the mechanism agree.

The payoff is that the visitor is not told the rules, they are refused by them.
Setting the Down Main and then trying to swing the points for the branch walks
you backwards through the real release sequence: 4 is held by 7, 7 is held by
2, so 2 comes back first. Nobody who has done that once forgets what
interlocking means.

`Put the frame back` replays the legal restore order one lever at a time, at
230 ms a step, because the order is the lesson.

## Composition

Desktop and mobile are different objects, not one scaled.

- **Desktop** — a wide RCH-style track diagram over a horizontal frame of
  sixteen levers with quadrant plates, read left to right the way you stand at
  a frame.
- **Mobile** — the frame becomes the **roll of levers**: one line each, colour
  bar, number, the job spelled out, and N or R. That is what a lever plate
  actually says and what a phone has room for. The diagram keeps its own
  horizontal scroll, which is how you read a strip diagram anyway.

The one paper-inverted region is the locking table, on both pages. Documents
are printed; frames are oiled and dark.

## Motion

One idea, three uses: **things throw.** Levers throw about a pivot, semaphore
arms drop 42°, section hairlines draw left to right. Nothing fades in, nothing
floats, nothing bounces. A refused lever shakes once, 360 ms, and stays where
it was.

## Pages

| Page | What it carries |
|---|---|
| `index.html` | The box, the frame (the mechanism), the arm plate, four services, the Absolute Block bell codes |
| `frame.html` | The roll of levers, the tappet drawing, the generated locking table, the overhaul service |
| `visit.html` | Open days, the three paid things, getting here, the enquiry form, support |

## Constraints honoured

- No payment fields anywhere. Sessions are held by enquiry and settled in the
  box; membership is by standing order. Nothing on this site touches card data.
- CSP meta on every page: `default-src 'self'`, scripts self-only, fonts from
  Google only, `object-src 'none'`.
- No framework, no build step, no CDN script. Two stylesheets' worth of CSS in
  one file, three small scripts, and `tools/grade.py` for the imagery.
- Every form control labelled, every lever a real `<button>` with
  `aria-pressed`, the answer plate an `aria-live` region, reduced motion
  respected from `boot.js` before first paint.
