# Development

## Local workflow

```sh
npm ci              # clean install from lockfile
npm run dev         # Vite on 127.0.0.1:3001 (strict port)
npm test            # node --test (boost rules + share/backup)
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + vite build → dist/
npm run preview     # serve the production build locally
```

There is no separate lint script in this repository. Prefer TypeScript and the existing tests as the quality gate.

## Repo layout

```
index.html          # DOM shell
public/icon.svg
src/
  app.ts            # UI / browser entry behavior
  build.ts          # Build model, calculate, serialize/parse
  options.ts        # Remaster catalogs and attribute ids
  styles.css
test/
  build.test.ts     # Characterization and round-trip tests
docs/               # Product and contributor docs
roadmap/            # name-roadmap/v1 todo / completed / cancelled
AGENTS.md           # Agent working agreements
```

## Safe navigation notes for agents

- **Domain logic lives in `build.ts`.** Prefer fixing modifier math and normalization there, then assert in `test/build.test.ts`.
- **Catalog data lives in `options.ts`.** Use the existing `catalog()` helper for kebab-case IDs and add a rules source to the README for new presets.
- **Do not invent a backend.** Share state is URL + JSON backup only.
- **Keep `version: 1` share/backup contracts stable** unless you deliberately migrate and update tests.
- **UI assumes fixed element ids** in `index.html`. Adding controls means updating both the HTML and `app.ts` (`byId` throws if an id is missing).

## Testing expectations

- Run `npm test` after changes to boost rules, normalization, serialization, or catalogs that affect those paths.
- Mirror README / Player Core sample expectations where practical (see the dwarf druid sample test).
- `npm run build` must pass before treating a change as ready to ship.

## Documentation and roadmap

When behavior users can see changes, update [README.md](../README.md) and the relevant `docs/` page in the same change. Move roadmap items with the work — see [contributing.md](contributing.md) and [roadmap-format.md](roadmap-format.md).
