# AGENTS

## Project

- **Title:** Pathfinder 2e Attribute Calculator
- **Key:** `pf2e-point-buy-calc`
- **Purpose:** Browser calculator for Pathfinder Second Edition Remaster attribute modifiers. Users apply ancestry, background, class, free, and advancement boosts; see a live ledger of where each modifier comes from; and share or back up the build via link or JSON. Static Vite + TypeScript site; no backend.

## Layout

| Path | Why it matters |
| --- | --- |
| `README.md` | Human product entry point |
| `AGENTS.md` | This file — agent working agreements |
| `docs/` | Overview, architecture, getting started, development, contributing, decisions, roadmap format |
| `roadmap/` | `roadmap.json`, `completed.json`, `cancelled.json` |
| `index.html` | DOM shell |
| `src/app.ts` | UI wiring |
| `src/build.ts` | Build model, calculate, serialize/parse |
| `src/options.ts` | Attribute catalogs (Player Core / Player Core 2) |
| `src/styles.css` | Styles / print |
| `test/build.test.ts` | Boost rules and share/backup tests |
| `public/icon.svg` | Icon |

## Working agreements

- Node.js `22.18+` or `24+`.
- Install: `npm ci`
- Dev server: `npm run dev` → [http://127.0.0.1:3001](http://127.0.0.1:3001) (`--strictPort`)
- Tests: `npm test` (`node --test`)
- Typecheck / production build: `npm run typecheck`, `npm run build` → `dist/`
- Preview build: `npm run preview`
- Do not invent lint, CI, auth, databases, or APIs this repo does not already use.
- Prefer fixing rules in `src/build.ts` with coverage in `test/build.test.ts`; keep catalog data in `src/options.ts`.

## Documentation

- Update `docs/` when behavior, setup, architecture, or contracts change.
- Keep `README.md` and docs aligned (engines, scripts, features, non-goals).
- Link new topics from `docs/overview.md` when you add pages.
- Format contract for roadmaps: [docs/roadmap-format.md](docs/roadmap-format.md).

## Roadmap

This project's key is `pf2e-point-buy-calc` and its title is `Pathfinder 2e Attribute Calculator`. Keep the
roadmap in three files in `roadmap/` at the repository root:

- `roadmap/roadmap.json`: project status and items still to do, highest priority first
- `roadmap/completed.json`: finished items
- `roadmap/cancelled.json`: items that will not be done

All three use this shape:

```json
{
  "schema": "name-roadmap/v1",
  "file": "roadmap",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": { "key": "pf2e-point-buy-calc", "title": "Pathfinder 2e Attribute Calculator", "status": "active", "summary": "Optional, roadmap.json only." },
  "items": [
    { "id": "stable-kebab-id", "title": "Short imperative title", "group": "Optional area", "notes": "Optional detail" }
  ]
}
```

Rules:

1. `schema` is always `"name-roadmap/v1"`. `file` is `"roadmap"`,
   `"completed"` or `"cancelled"` to match the filename.
2. `project.key`, `project.title` and `project.status` are identical in all
   three files. Never change `project.key`. `status` is `active`, `paused` or
   `complete`. `summary` appears only in `roadmap.json`.
3. Every item has an `id`: lowercase kebab-case, unique across all three files,
   never renamed and never reused, even after the item is completed or cancelled.
   Titles and notes may be edited freely; the id stays the same.
4. Allowed item fields are `id`, `title`, `group` and `notes`, plus
   `completedAt` (`completed.json` only, required) and `cancelledAt` with an
   optional `reason` (`cancelled.json` only). Add no other fields.
5. When work is finished, move the item from `roadmap.json` to the end of
   `completed.json` and add `completedAt`. When it is dropped, move it to the
   end of `cancelled.json` and add `cancelledAt` and a short `reason`. Never
   delete an item outright. If a cancelled item is revived, move it back to
   `roadmap.json` with the same id and remove `cancelledAt`/`reason`.
6. Each item is in exactly one file. Split work into new items with new ids
   rather than changing what an existing id means.
7. Set `updatedAt` in every file you change. Timestamps are ISO 8601 with a
   UTC offset, e.g. `2026-10-14T09:30:00+11:00`.
8. Keep `roadmap.json` items in priority order. Titles are at most 500
   characters; notes and reasons at most 20,000; at most 2,000 items per file.
9. Output valid JSON only: UTF-8, two-space indent, no comments, no trailing
   commas. Create a missing file with an empty `items` array.
10. Update the roadmap in the same change as the work it describes: mark an
    item completed only when that work is actually done.

The format contract for other repositories this repo will import is in
[docs/roadmap-format.md](docs/roadmap-format.md).

## Do / don’t

**Do**

- Prefer small, reviewable diffs
- Update roadmap items in the same change as the work
- Extend domain tests when changing boost math or serialization
- Preserve share/backup `version: 1` behavior unless deliberately migrating

**Don’t**

- Rename or reuse roadmap item ids
- Invent APIs, auth, databases, or CI the project does not use
- Open `index.html` via `file://` as a supported workflow
- Expand product scope past Remaster attribute planning without a roadmap item and docs update
