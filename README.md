# Pathfinder 2e Attribute Calculator

A browser calculator for planning **Pathfinder Second Edition Remaster** attribute modifiers. Like the companion [D&D calculator](https://github.com/starbornone/dnd-point-buy-calc), it shows where each modifier comes from and lets you share the current build with a link.

- Apply ancestry, background, class, and level 1 free boosts, with an explanation of each contribution in the live ledger.
- Choose from the ancestries, backgrounds, and classes in *Player Core* and *Player Core 2*, or enter boosts manually for options from other books.
- Use alternate ancestry boosts and voluntary flaws, and plan advancement through level 20 with partial boosts tracked automatically.
- Share a build by link, export or import a JSON backup, or print the ledger. You can undo a reset or import before making another edit.

## Run locally

Use Node.js 22 or newer. The calculator has no package dependencies.

```sh
npm run dev
```

Open [the local calculator](http://127.0.0.1:3001). Run `npm test` to check the boost rules and build links. For static hosting, serve the contents of `public/`.

## Rules sources

- [Player Core character creation](https://2e.aonprd.com/Rules.aspx?ID=2027)
- [Player Core options](https://2e.aonprd.com/Sources.aspx?ID=216)
- [Player Core 2 options](https://2e.aonprd.com/Sources.aspx?ID=227)

The calculator tracks standard Remaster attribute progression. For custom entries and backgrounds such as Raised by Belief, select the attributes your source grants.

Pathfinder is a trademark of Paizo Inc. This is an unofficial fan tool.
