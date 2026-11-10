# Roadmap format contract

Other repositories and humans importing this project's roadmap should follow **`name-roadmap/v1`**. Canonical files live at the repository root under `roadmap/`:

| File | `file` field | Purpose |
| --- | --- | --- |
| `roadmap/roadmap.json` | `"roadmap"` | Status + todo items, **highest priority first** |
| `roadmap/completed.json` | `"completed"` | Finished items |
| `roadmap/cancelled.json` | `"cancelled"` | Explicitly abandoned items |

## Schema

```json
{
  "schema": "name-roadmap/v1",
  "file": "roadmap",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": {
    "key": "pf2e-point-buy-calc",
    "title": "Pathfinder 2e Attribute Calculator",
    "status": "active",
    "summary": "Optional, roadmap.json only."
  },
  "items": [
    {
      "id": "stable-kebab-id",
      "title": "Short imperative title",
      "group": "Optional area",
      "notes": "Optional detail"
    }
  ]
}
```

### Field rules

1. `schema` is always `"name-roadmap/v1"`. `file` matches the filename purpose: `"roadmap"`, `"completed"`, or `"cancelled"`.
2. `project.key`, `project.title`, and `project.status` are **identical** in all three files. Never change `project.key`. `status` is `active`, `paused`, or `complete`. `summary` appears **only** in `roadmap.json`.
3. Every item has an `id`: lowercase kebab-case, unique across all three files, **never renamed and never reused**. Titles and notes may change; the id does not.
4. Allowed item fields: `id`, `title`, `group`, `notes`, plus:
   - `completedAt` (required on items in `completed.json`)
   - `cancelledAt` and optional `reason` (on items in `cancelled.json`)
   - Add no other fields
5. Timestamps are ISO 8601 with a UTC offset. Set `updatedAt` on every file you change.
6. Titles ≤ 500 characters; notes and reasons ≤ 20,000; ≤ 2,000 items per file.
7. Valid JSON only: UTF-8, two-space indent, no comments, no trailing commas. A missing file should be created with `"items": []`.

### Move semantics

| Event | Action |
| --- | --- |
| Work finished | Move item from `roadmap.json` → end of `completed.json`; add `completedAt` |
| Work abandoned | Move item → end of `cancelled.json`; add `cancelledAt` and short `reason` |
| Cancelled work revived | Move back to `roadmap.json` with the **same** `id`; remove `cancelledAt` / `reason` |
| Delete | **Never** delete an item outright |

Each item exists in **exactly one** file. Split scope by adding a **new** id rather than redefining an existing one. Update the roadmap in the **same change** as the work it describes.

### Id permanence

Ids are stable forever within this `project.key`. Completed and cancelled ids remain reserved. New work always gets a new kebab-case id.

## Minimal valid examples

### `roadmap/roadmap.json`

```json
{
  "schema": "name-roadmap/v1",
  "file": "roadmap",
  "updatedAt": "2026-11-10T13:32:08+11:00",
  "project": {
    "key": "pf2e-point-buy-calc",
    "title": "Pathfinder 2e Attribute Calculator",
    "status": "active",
    "summary": "Browser calculator for PF2e Remaster attribute modifiers with shareable builds."
  },
  "items": [
    {
      "id": "example-todo",
      "title": "Do the next highest-priority task",
      "group": "docs",
      "notes": "Optional detail for implementers."
    }
  ]
}
```

### `roadmap/completed.json`

```json
{
  "schema": "name-roadmap/v1",
  "file": "completed",
  "updatedAt": "2026-11-10T13:32:08+11:00",
  "project": {
    "key": "pf2e-point-buy-calc",
    "title": "Pathfinder 2e Attribute Calculator",
    "status": "active"
  },
  "items": [
    {
      "id": "example-done",
      "title": "Ship the core calculator",
      "group": "product",
      "notes": "Already available per README.",
      "completedAt": "2026-11-10T13:32:08+11:00"
    }
  ]
}
```

### `roadmap/cancelled.json`

```json
{
  "schema": "name-roadmap/v1",
  "file": "cancelled",
  "updatedAt": "2026-11-10T13:32:08+11:00",
  "project": {
    "key": "pf2e-point-buy-calc",
    "title": "Pathfinder 2e Attribute Calculator",
    "status": "active"
  },
  "items": []
}
```

This repository's live files are the source of truth: [roadmap.json](../roadmap/roadmap.json), [completed.json](../roadmap/completed.json), [cancelled.json](../roadmap/cancelled.json).
