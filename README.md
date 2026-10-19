# Doomsday Clock

Every Marvel Cinematic Universe film, series, special, One-Shot and animated title, plotted as a constellation: **story order** runs across, **release date** runs up. A glowing thread joins the Sacred Timeline in story order, so every spike in it is a prequel or a flashback. Alternate universes branch off on dashed pink curves. Counting down to *Avengers: Doomsday* (December 18, 2026).

**Live at [doomsday-clock-mcu.vercel.app](https://doomsday-clock-mcu.vercel.app)**

- Switch between story order and release order; the points glide between the two layouts
- Tick off the 15 titles Disney lists as essential before *Doomsday*: they're ringed on the chart, with a checklist under it (a bar that opens into one on phones)
- Filter by phase and type, search titles, and pull in the other 11 Fox X-Men films (*X-Men* and *X2* always show, as essentials)
- Hover a point for a summary; click it for the synopsis, poster and where to watch
- Track what you've watched (saved in your browser)
- Vertical layout on phones; keyboard navigable (Tab into the chart, arrow keys move along the timeline)

## Run it

Requires Node 22.18 or newer.

```bash
npm install
```

```bash
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build a static site into `dist/` (relative paths, so it can be hosted under any path) |
| `npm test` | Unit tests for the chart layout, countdown, filters and formatting |
| `npm run lint` | Lint with oxlint |
| `npm run tmdb` | Refresh poster data from TMDB (see below) |

## Updating the timeline

Every title lives in [`src/data/entries.ts`](src/data/entries.ts), separate from the UI, so the chart can follow Marvel's revisions to the timeline. Story order (`o`) follows Marvel's official Disney+ timeline; fractional values place titles that aren't on it. Disney's essentials before *Doomsday* carry their list number in `essential`; seasons of one show share a number. The fields are documented in [`src/data/types.ts`](src/data/types.ts).

Posters and TMDB ids are looked up once and committed in [`src/data/tmdb.json`](src/data/tmdb.json), so the site needs no API key at runtime. After adding entries, look up the new ones with a TMDB v3 API key:

```bash
TMDB_API_KEY=your_key npm run tmdb
```

In PowerShell, set the key with `$env:TMDB_API_KEY = 'your_key'` first. Existing matches are kept; add `-- --force` to look everything up again. The script prints each match so you can check it.

## How it's built

Vite, React 19 and TypeScript with plain CSS. The chart is hand-rolled: an SVG for the guides, thread and branches, with the points as absolutely positioned buttons so they stay round at any aspect ratio. The layout math is a set of pure, unit-tested functions in [`src/lib/layout.ts`](src/lib/layout.ts).

Hosted on Vercel, which runs `npm run build` on every push to `main` and serves `dist/`.

## Credits

Unofficial fan project, not affiliated with Marvel Studios or Disney. Marvel titles, logos and artwork belong to their owners.

This product uses the TMDB API but is not endorsed or certified by TMDB.
