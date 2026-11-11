# Pathfinder 2e Attribute Calculator

A browser calculator for planning **Pathfinder Second Edition Remaster** attribute modifiers. Like the companion [D&D calculator](https://github.com/starbornone/dnd-point-buy-calc), it shows where each modifier comes from and lets you share the current build with a link.

- Apply ancestry, background, class, and level 1 free boosts, with an explanation of each contribution in the live ledger.
- Choose from *Player Core* and *Player Core 2* presets, plus Centaur, Minotaur, and Surki from *Howl of the Wild*. Use custom entries for other options.
- Use alternate ancestry boosts and voluntary flaws, and plan advancement through level 20 with partial boosts tracked automatically.
- Pick boosts with named controls. Use the separate feat level selector to plan ancestry, class, skill, and general feats through level 20. The picker shows prerequisites for feats from the two Player Core books. Enter feats from other books by name.
- See granted background feats and record choices alongside your modifiers. Feat choices for every level are included in share links and JSON backups.
- Share a build by link, export or import a JSON backup, or print the ledger. You can undo a reset or import before making another edit.

## Documentation

- [Overview](docs/overview.md) — product summary, audience, and non-goals
- [FAQ](docs/faq.md) — custom entries and background exceptions
- [Share links and JSON backups](docs/build-formats.md) — payload reference for integrators
- [AGENTS.md](AGENTS.md) — guidance for coding agents
- [Roadmap](roadmap/roadmap.json) — planned work (`name-roadmap/v1`)

## Run locally

Use Node.js 22.18+ or 24+. The calculator uses Vite and TypeScript.

```sh
npm ci
npm run dev
```

Open [the local calculator](http://127.0.0.1:3001). Run `npm test` to check the boost rules and build links. Run `npm run build` to type-check and build the static site into `dist/`, then `npm run preview` to check that build locally.

## Deploy to Vercel

Import this repository with `main` as the production branch. Select the **Vite** preset, use `npm run build` as the build command, and serve `dist` as the output directory. Add `pf.starmist.studio` in the project's **Domains** settings.

## Rules sources

- [Player Core character creation](https://2e.aonprd.com/Rules.aspx?ID=2027)
- [Player Core options](https://2e.aonprd.com/Sources.aspx?ID=216)
- [Player Core 2 options](https://2e.aonprd.com/Sources.aspx?ID=227)
- *Howl of the Wild* ancestry boosts and flaws for [Centaur](https://2e.aonprd.com/Ancestries.aspx?ID=73), [Minotaur](https://2e.aonprd.com/Ancestries.aspx?ID=75), and [Surki](https://2e.aonprd.com/Ancestries.aspx?ID=76)
- Feat names, levels, traits, prerequisites, and background grants come from the [Foundry PF2e compendium](https://github.com/foundryvtt/pf2e/tree/2e65a924c7b9e28606d8bc2dfa3ece18976ac0a6/packs/pf2e).

The calculator tracks standard Remaster attribute progression. For help entering boosts for Raised by Belief, see the [FAQ](docs/faq.md#how-do-i-enter-raised-by-belief).

Pathfinder is a trademark of Paizo Inc. This is an unofficial fan tool.
