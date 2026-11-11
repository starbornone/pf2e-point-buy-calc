# Decisions

Lightweight records inferred from the shipped README and codebase. Newest conceptual choices first.

## ADR-1 — Vite + TypeScript static SPA

**Context:** The calculator must run in the browser with a short local feedback loop and simple static hosting (Vercel + custom domain).

**Decision:** Use Vite and TypeScript as a static site (`npm run dev` / `npm run build` → `dist/`). No application server.

**Consequences:** Deploy is CDN/static only. Share state cannot rely on server sessions; URL and file backup are the persistence story. Node engine constraints follow the Vite/TS toolchain (`22.18+` or `24+`).

## ADR-2 — Remaster-only attribute progression

**Context:** Pathfinder 2e Remaster changed how attributes and boosts work relative to legacy material.

**Decision:** Track standard Remaster attribute progression only. Custom ancestry/background/class entry covers books and exceptions (e.g. Raised by Belief) by letting the user select granted attributes.

**Consequences:** No dual legacy/Remaster mode. Catalog growth is additive in `options.ts`; odd grants stay on the custom path rather than special-casing every background.

## ADR-3 — Domain module separated from UI

**Context:** Boost math, partial advancement, and share encoding must be testable without a browser.

**Decision:** Put `Build`, `normalizeBuild`, `calculate`, `serializeBuild`, and `parseBuild` in `src/build.ts`; catalogs in `src/options.ts`; DOM in `src/app.ts`. Tests import the domain module via `node --test`.

**Consequences:** UI bugs and rules bugs can be fixed independently. Agents should prefer asserting rules in `test/build.test.ts` over browser automation.

## ADR-4 — Versioned share link and JSON backup contracts

**Context:** Builds need to be restorable across sessions and devices without accounts.

**Decision:** Share payloads are JSON with `version: 1` embedded in `?build=`. File backups add `format: "pf2e-point-buy-calc"` and pretty-print. Unknown versions and non-backup JSON fail closed (`parseBuild` → `null`). Import size capped (64 KiB in the UI).

**Consequences:** Bumping `version` is a deliberate migration. External tools can interoperate by matching these fields. See tests in `test/build.test.ts` for accepted/rejected shapes.

## ADR-5 — Source-based presets and custom entries

**Context:** Each additional source adds rules to verify and maintain.

**Decision:** Ship presets from *Player Core* and *Player Core 2* and add selected presets from other official sources. Group presets by book and offer custom entries for options outside the catalog.

**Consequences:** Catalog additions need a rules citation. Players can enter fixed boosts, flaws, key attributes, and background boosts through the custom controls.

## ADR-7 — Canonical site URL and static SEO assets

**Context:** Builds are shared as `?build=` query URLs. Search engines and social crawlers need a single indexable URL plus predictable discovery files on the static host.

**Decision:** Keep `<link rel="canonical">` and `og:url` on `https://pf.starmist.studio/` (no query string). Ship `public/robots.txt`, `public/sitemap.xml`, Open Graph / Twitter image (`og-image.jpg`), and JSON-LD `WebApplication` markup from `index.html`. Vite copies `public/` into `dist/` unchanged.

**Consequences:** Shared builds remain usable but are not separate SEO landing pages. Social previews require the JPEG (SVG favicons are unreliable for crawlers). Sitemap stays one URL unless the product gains more public routes.

## ADR-6 — Single-step undo for destructive restore actions

**Context:** Reset and import can wipe a carefully tuned build; full history would complicate the no-backend model.

**Decision:** Keep one `previousBuild` snapshot so the user can undo a reset or import until they edit again.

**Consequences:** Not a general undo stack. Document UX as “undo once before another edit,” matching the README.
