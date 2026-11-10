# Contributing

## Propose changes

1. Keep diffs small and scoped to one concern (rules, catalog, UI, docs, or roadmap hygiene).
2. Match existing TypeScript style in `src/` — no new framework or build tool without an explicit decision.
3. Add or extend tests in `test/build.test.ts` when changing `calculate`, `normalizeBuild`, `serializeBuild`, or `parseBuild`.
4. Run `npm test` and `npm run build` before considering the change done.

## Documentation

- User-facing behavior belongs in [README.md](../README.md) first; deepen it in `docs/` ([overview](overview.md), [getting-started](getting-started.md), etc.).
- Keep README and docs consistent — same Node versions, ports, scripts, and feature claims.
- Update [architecture.md](architecture.md) or [decisions.md](decisions.md) when module boundaries or format contracts change.

## Roadmap moves with the work

This project uses the `name-roadmap/v1` files under `roadmap/`:

- Finish work → move the item from `roadmap/roadmap.json` to the end of `roadmap/completed.json` with `completedAt`
- Drop work → move to `roadmap/cancelled.json` with `cancelledAt` and a short `reason`
- Never rename or reuse item `id`s
- Set `updatedAt` on every file you touch

Full contract: [roadmap-format.md](roadmap-format.md). Agent summary: [AGENTS.md](../AGENTS.md).

## Scope boundaries

Do not add auth, databases, CI configs, or APIs the project does not already use unless the roadmap item and a decision record explicitly call for them. Prefer documenting gaps over scaffolding unused tooling.
