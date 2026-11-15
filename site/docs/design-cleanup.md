# Design cleanup: signs of generated design, found and removed

Goal: look like engineering documentation and mission material. Strict grid, type does the work, little colour,
data and captions over decoration. Facts, quotes, evidence ids, `data/*.json` and `assets/js/passport-rules.js`
are unchanged.

## Fonts

The demo video (youtu.be/5JOlN18c3TY) sets headings in a geometric grotesk and labels in a small-caps mono with wide
tracking (title frames "Flame in Freefall", "Cargo Passport / Know what flies."). The team's own submission files name the two
fonts: Space Grotesk and JetBrains Mono (SIL OFL). The site now uses them, self-hosted in `assets/fonts/`. Before: Segoe UI and Consolas, which are not on every device.

## Found and removed

| Sign | Where | Now |
|---|---|---|
| Glow, bokeh dust, blurred "near" objects, gradient planet | `tools/site/cosmos.html`, `assets/css/cosmos.css`, `.orb` in `library.css` | sparse stars and a thin-line orbit diagram, no motion |
| Parallax, approach-from-depth reveal (blur, scale), pointer light | `assets/js/depth.js`, `reveal.js` (no longer loaded), `depth.css`, `data-reveal` and `data-depth` attributes | removed; content is visible at once |
| Giant outlined section numerals, 100svh scenes with empty space | `.numeral`, `.scene` | numbers stay in the mono eyebrow; scenes are ruled sections |
| Glass panels: gradient fill, big radius, drop shadow | `.slab`, `figure-host`, `.fleet-plan`, `.pp-*` | flat panel, 1px rule, 2px radius |
| Pill buttons and chips | `.btn`, `.chip`, `.pp-choice`, `.fleet-pill` | rectangular, mono caps, 2px radius |
| Centred hero scale type (6rem h1) | `tokens.css`, `library.css`, `story.css` | h1 up to 4rem, left aligned, one column |
| Zig-zag alternating text and heading columns | `beat--flip` | heading always left |
| Colour used as decoration: peach secondary text, violet "concept" tint, tinted callouts with a coloured left bar | `tokens.css`, `home.css`, `passport.css` | neutral secondary text; amber only for the one action, facts and status |
| Identical rounded cards with a coloured top edge | shelf cards, method steps | ruled list entries |
| Badge soup: "Illustrative scenario", "Concept", "Illustrative item", "Waiting for a like", legend of marks | `home-page.mjs`, `shelf.mjs`, `passport.mjs`, `fleet-view.js` | one quiet mono line per scene; sentences keep `data-illustrative` and `data-concept` |
| Round numbered citation buttons with popover | `evidence.js`, `components.css` | the cited sentence itself is underlined in the accent colour; hover, focus or tap shows the verbatim quote and a link to the source page and document |
| Ping animation on a selected tag | `fleet.css` | removed |
| UI stamps: "Explore more stories", "Try the passport" | `home-page.mjs`, `shelf.mjs` | "Other stories", "Open the passport" |
| Likes, comments, "Propose a story", GitHub issue links | `parts.mjs`, `shelf.mjs`, `story-page.mjs`, `library-votes.js`, `library-sync.mjs` | removed |

Not changed on purpose: status glyphs (they carry meaning), the `data-illustrative` / `data-concept` attributes that the gates read.
