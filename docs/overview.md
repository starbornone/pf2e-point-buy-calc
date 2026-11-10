# Overview

**Pathfinder 2e Attribute Calculator** (`pf2e-point-buy-calc`) is a browser tool for planning **Pathfinder Second Edition Remaster** attribute modifiers. It shows where each modifier comes from and lets you share the current build with a link.

It is an unofficial fan tool. Pathfinder is a trademark of Paizo Inc.

## Who it is for

- Players building or advancing a Remaster character through levels 1–20
- GMs and players who need a clear ledger of ancestry, background, class, free, and advancement boosts
- Anyone comparing alternate ancestry boosts or voluntary flaws before committing on a sheet

## Core capabilities

- Apply ancestry, background, class, and level 1 free boosts, with each contribution explained in a live ledger
- Choose ancestries, backgrounds, and classes from *Player Core* and *Player Core 2*, or enter boosts manually for options from other books
- Use alternate ancestry boosts and voluntary flaws
- Plan advancement through level 20 with partial boosts tracked automatically
- Assign boosts with named controls and browse level 1 ancestry, class, skill, and general feats when the build grants those choices
- See starting feats granted by a background and record feats from other sources by name
- Share a build by link, export or import a JSON backup, or print the ledger
- Undo a reset or import once, before making another edit

## Non-goals

- Full character creation, including skill training, equipment, spells, and feat choices after level 1
- Official Paizo content beyond the Player Core / Player Core 2 catalogs shipped in `src/options.ts` (other books use custom entry)
- Multi-user accounts, cloud sync, or a backend API — the app is a static Vite site
- Non-Remaster / legacy PF2e attribute progression as a first-class mode

The planner tracks Remaster attribute progression and starting feat choices. The feat picker shows listed prerequisites for players to check on their character sheet.

## Learn more

- [Getting started](getting-started.md) — install, run, verify
- [Architecture](architecture.md) — modules and data flow
- [Development](development.md) — local workflow for contributors and agents
- [Decisions](decisions.md) — key design choices
- [Roadmap](../roadmap/roadmap.json) — planned work
- [AGENTS.md](../AGENTS.md) — guidance for coding agents
