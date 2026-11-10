# Getting started

## Prerequisites

- **Node.js** `22.18+` or `24+` (see `package.json` `engines`)
- npm (ships with Node)
- A modern desktop browser

Unsupported / edge cases:

- Older Node (e.g. 20.x) — install may fail or tooling may misbehave; upgrade first.
- Opening `index.html` as a `file://` URL — not supported; use the Vite dev server or a built preview.
- Binding to a public interface by default — `npm run dev` listens on `127.0.0.1:3001` only.

## Install and run

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001).

## Verify success

1. The page loads without console errors and shows ancestry / background / class controls.
2. Changing ancestry updates the live ledger.
3. Optional checks:

```sh
npm test
npm run build
npm run preview
```

`npm test` exercises boost rules and build-link round-trips. `npm run build` type-checks and writes the static site to `dist/`.

## First useful action

1. Pick an ancestry from Player Core (e.g. Dwarf).
2. Choose a background and class.
3. Assign free and milestone boosts until remaining boosts hit zero.
4. Copy the share link from the page (or note the `?build=` query) and open it in a new tab to confirm restore.

## Failure symptoms

| Symptom | Likely cause | What to try |
| --- | --- | --- |
| `npm ci` fails on engine | Node too old | Install 22.18+ or 24+ |
| Dev server exits mentioning port | Port `3001` already in use (`--strictPort`) | Stop the other process, or free 3001 |
| Blank page / missing `#…` errors | DOM ids out of sync with `app.ts` | Confirm you are on the Vite URL, not a stale build |
| Share link does nothing | Invalid or wrong-version payload | `parseBuild` returns null for bad JSON / non-`version: 1`; start a new build |
| Import rejected | Not a backup, or too large | Backups need `format: "pf2e-point-buy-calc"` and `version: 1`; max size is 64 KiB |

## Deploy (optional)

Import the repo on Vercel with production branch `main`, Vite preset, build command `npm run build`, output `dist`. Add custom domain `pf.starmist.studio` in Domains if that is your target host.

## Rules references

Official Remaster character-creation rules and option lists are linked from the [README](../README.md#rules-sources).

Next: [architecture.md](architecture.md) · [development.md](development.md)
