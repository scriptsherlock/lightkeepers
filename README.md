# Lightkeepers

AI literacy games that grow up with the child, from 7 to 17. One story ties them together: the old Keeper needs an apprentice who understands how machines think, so you visit each place, help its machine, and light its lantern.

The site is one screen: the 3D Lantern Lands, made for Turing Education. Pick an age group, 6–10 or 11–14, and the sun really moves. For the younger group it rises at dawn over the Isles. For the older group it climbs, crosses the sky and sets into night, when the lanterns and Nova Grid's windows light up. Games for the chosen age glow green; the rest are greyed but still playable. Drag to circle the islands and scroll to zoom. Each lantern opens its chapter and plays the game inside the page, and the Story and For teachers buttons open the background and the teaching notes. Left alone, the screen switches between the groups by itself for the booth. Without WebGL, a flat illustrated map takes its place.

| Region | Time | Chapters |
| --- | --- | --- |
| The Lantern Isles | Dawn | Sidekick Academy, Echo’s Letters (coming next), Order Up! |
| The Living Kingdom | Day | Tree Quest |
| Nova Grid | Night | Relight, Countersign, The Line (in development) |

No accounts, no tracking and no live AI. Every machine in the games is a transparent simulation, and nothing a pupil types leaves the device.

## Run it

Node 22 or newer.

```sh
npm install
npm run dev        # http://127.0.0.1:5200/
npm test           # age bands, sky, chapter data, preview and clip files
npm run build      # static site in dist/
npm run preview    # http://127.0.0.1:4200/
```

URL options: `?band=young|older` picks the age group, `?still` stops the automatic switching, and `?flat=1` uses the flat map instead of 3D.

## Offline, for a booth

```sh
npm run bundle:games -- --build   # rebuild every game and copy it into public/games/
npm run build && npm run preview
```

The site finds the bundled copies by itself and plays them inside the tour, so it runs with the wifi off. The game repositories need to sit next to this folder.

Presenter keys: `1` to `7` open a chapter, `V` plays the one-minute tour, `[` or `]` switches the age group, `0` closes everything, and `R` resets.

## Clips and previews

`public/clips/` holds short muted gameplay recordings, and `public/previews/` holds stills. Both are captured from the games themselves with `tools/qa/record-clips.mjs` and `tools/qa/capture-previews.mjs`.

Made for Turing Education.
