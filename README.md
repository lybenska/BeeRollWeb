# BeeRollWeb

Landing page for [BeeRoll](https://setapp.com/apps/bee-roll), MacPaw's transcript video editor for Mac.

## Stack

- **Astro** (static output). `src/pages/index.astro` is the whole page; `public/styles.css` and `public/main.js` hold the styling and behaviour.
- **Structure is BeeRoll's own, and short**: one heading, one line, one real picture per section — hero, *How it works*
  (one video along a pinned, scroll-driven ruler: import → cut → generate → layer → animate → export), Edit by text (two shots
  generated in BeeRoll, joined into one silent 8 s video in `public/assets/app/tx/`, with captions written for them;
  the video, the lit word, the caption and the playhead stay in step, and a cut line is skipped), B-roll (the real Generate
  panel), AI credits (cost estimate on a gauge), Privacy (one 0 B readout), Setapp (an app listing card), FAQ as a
  transcript, and a closing hex card with a dot-matrix bee.
- **Real captures** in `public/assets/app/`. The editor and the Import, Cut, Layer and Animate frames of *How it works* are
  from the Debug build on 2026-10-07, project *Cosmos*: the voiced 24 s *Look Up* video on the main track (transcribed on the Mac, English), a
  generated Sun shot as picture-in-picture on Overlay 2 with keyframes on X, Scale and Rotation, and the titles *Look Up*
  and *Saturn*. One misheard word was corrected by hand in the transcript ("Satin's" → "Saturn's"). The Generate and Export
  frames, and the caption presets and Generate panel used by `/light`, are still from the 2026-10-06 *Cosmic Calendar* project (taken with ⌘Z
  after each preset). Retake with the bee-roll `run-beeroll` skill (`launch.sh`, `shot.sh`) and crop.
- AI credits and Setapp copy follow the other MacPaw landings and Setapp's own sign-up wording ("AI credits come with Setapp
  Membership, or you can buy them separately"). No bonus-credit number is stated: none is documented for BeeRoll. They are sized in container units, so they scale with their box. Labels match the app (`docs/ui-inventory.md` in the bee-roll repo); file sizes and timecodes in them are illustrative.
- **The page speaks the app's design language** (bee-roll `Modules/DesignKit`): the dark editor chassis and hairlines,
  every word in mono (`SFFontStyle` is all `.monospaced`), honey `#F5A11D` only as a signal, the ivory primary chip with
  a honey hex lamp (`PrimaryButtonStyle`), honey tab pills, and the pointy-top hexagon (`Hexagon`, `HexLamp`); the
  closing block is the welcome guide's hexagon card. Tokens are named after the colorsets at the top of `styles.css`.
- Font: `ui-monospace` (SF Mono in Safari on a Mac, as in the app), with JetBrains Mono from Google Fonts as the
  cross-browser stand-in. Page frame and section order follow the KeyComposer landing.
- `public/assets/shots/setapp-signup.png` is Setapp's sign-up page for BeeRoll, captured in a clean headless browser. `setapp-home.webp` is Setapp's official app screenshot, taken from the KeyComposer landing.

## Light version

`/light` (`src/pages/light.astro`, `public/light.css`, `public/light.js`) is a second design of the same page, after
instrument-panel references: a flat light grey, hairlines, small mono labels (Geist Mono), big light numerals (Geist),
rounded tiles, honey only as a signal. The hero redraws a real Saturn frame as a dot matrix on a canvas; How it works is a
dial whose numbers turn on an arc as you scroll (after Polyera's Wove); the credit estimate is a gauge. Both pages read
their copy and claims from `src/data.ts`. `/light` is `noindex` with a canonical to `/`, so the two never compete in search.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in ./dist
npm run preview   # serves ./dist
```

## Review builds

Every push to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`. The workflow runs
`scripts/review-build.mjs` on the build output: it rewrites root-relative URLs to relative ones (the Pages site sits
under a sub-path) and marks the site `noindex` with a `robots.txt` that disallows crawling, so the review build never
appears in search engines. The source keeps root-relative paths and stays indexable for the production domain.

## Ad landing helpers

- `?v=captions`, `?v=private`, `?v=broll` swap the hero copy for message-matched ad groups (see `heroVariants` in `index.astro`).
- `utm_*` parameters on the landing URL are appended to every Setapp link.
- Before launch, set the public origin in `src/consts.ts` (`SITE_URL`, also `site` in `astro.config.mjs`) and confirm the CTA target (`TRY_URL`).

## Keeping claims true

Every product claim on the page is checked against the app. Recheck these before changing them:

- The app is free; **AI video generation is the only metered action** (welcome guide copy, `Copy+FirstRun.swift`).
- Credit rates in the calculator are the measured table in `SetappAIVideoProvider+Pricing.swift`; model lengths come from `SetappAIVideoProvider+Mapping.swift`.
- Stats: six aspect ratios (`AspectRatio.swift`), three export formats, eight transitions (`ClipTransition.swift`).
- No testimonials until there are real, attributable ones.
