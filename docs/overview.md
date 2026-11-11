# Overview

**Pathfinder 2e Attribute Calculator** (`pf2e-point-buy-calc`) is a browser tool for planning **Pathfinder Second Edition Remaster** attribute modifiers. It shows where each modifier comes from and lets you share the current build with a link.

It is an unofficial fan tool. Pathfinder is a trademark of Paizo Inc.

## Who it is for

- Players building or advancing a Remaster character through levels 1–20
- GMs and players who need a clear ledger of ancestry, background, class, free, and advancement boosts
- Anyone comparing alternate ancestry boosts or voluntary flaws before committing on a sheet

## Core capabilities

- Apply ancestry, background, class, and level 1 free boosts, with each contribution explained in a live ledger
- Choose presets from *Player Core* and *Player Core 2* and select ancestries from *Howl of the Wild*. Use custom entries for other options
- Use alternate ancestry boosts and voluntary flaws
- Plan advancement through level 20 with partial boosts tracked automatically
- Use Tab to move through starting and advancement boost controls. Use Space or Enter to select or clear a boost or voluntary flaw
- Plan ancestry, class, skill, and general feats through level 20
- Browse a feat level independently of the character level used for the modifier ledger
- See starting feats granted by a background and record feats from other sources by name
- Share a build by link or export and import a JSON backup
- Print a one-page attribute ledger with the character summary, boost contributions, totals, and boost notes
- Undo a reset or import once, before making another edit

## Non-goals

- Full character creation, including skill training, equipment, spells, and automated archetype or variant progression
- Exhaustive coverage of Paizo's published character options
- Multi-user accounts, cloud sync, or a backend API — the app is a static Vite site
- Non-Remaster / legacy PF2e attribute progression as a first-class mode

The feat picker filters by slot, class or ancestry, feat level, and repeat limits. Check skill ranks, subclass requirements, and other prerequisites on your character sheet. For a feat outside the catalog, record its name in the appropriate slot.

## Learn more

- [Getting started](getting-started.md) — install, run, verify
- [FAQ](faq.md) — custom entries and background exceptions
- [Architecture](architecture.md) — modules and data flow
- [Share links and JSON backups](build-formats.md) — version 1 fields, feat slots, and import behavior
- [Development](development.md) — local workflow for contributors and agents
- [Decisions](decisions.md) — key design choices
- [Roadmap](../roadmap/roadmap.json) — planned work
- [AGENTS.md](../AGENTS.md) — guidance for coding agents
