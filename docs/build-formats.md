# Share links and JSON backups

Share links and backups carry the same version 1 build fields. The fields are
top-level JSON properties. Both formats store choices for future levels as well
as the current level.

- **Share link.** The `build` query parameter contains compact JSON encoded as
  a URL query value. Set it with `URL.searchParams.set("build", JSON.stringify(payload))`.
  Read it with `URL.searchParams.get("build")`, which returns the decoded JSON
  text. Pass that text directly to the JSON parser.
- **JSON backup.** Save the payload as a UTF-8 JSON file with the additional
  top-level property `"format": "pf2e-point-buy-calc"`. The app exports it as
  `pathfinder-2e-build.json` with two-space indentation. The file picker accepts
  files up to 64 KiB (65,536 bytes).

## Version 1 fields

Attribute IDs are `str`, `dex`, `con`, `int`, `wis`, and `cha`. For
positional slots, use `""` for an unfilled slot. Preset IDs come from the
[ancestry, background, and class catalogs](../src/options.ts). The three
preset fields also accept `"custom"`.

| Field | Type | Meaning |
| --- | --- | --- |
| `version` | Number | Required. Use the number `1`. |
| `format` | String | Required for backups. Use `"pf2e-point-buy-calc"`. The share reader ignores this field, and generated links omit it. |
| `level` | Integer | Character level for the modifier ledger, from 1 to 20. Defaults to 1. |
| `ancestry` | String | Ancestry ID. Defaults to `"human"`. |
| `background` | String | Background ID. Defaults to `""` for no background. |
| `characterClass` | String | Class ID. Defaults to `""` for no class. |
| `alternate` | Boolean | `true` uses two free ancestry boosts and suppresses the ancestry's fixed boosts and flaw. Defaults to `false`. |
| `customFixed` | Array of strings | Two positional fixed boost slots for a custom ancestry. Defaults to `["", ""]`. |
| `customFlaw` | String | Custom ancestry flaw attribute ID. Defaults to `""`. |
| `ancestryBoosts` | Array of strings | Positional free ancestry boost choices. The ancestry rules and `alternate` determine the number of slots and which attributes are available. |
| `flaws` | Array of attribute IDs | Voluntary flaws. The reader removes duplicates and any attribute already used by the active ancestry flaw. Defaults to an empty array. |
| `backgroundBoosts` | Array of strings | Positional background boost choices. The first slot follows the background's allowed attributes, and any second slot is free. A custom background has two free slots. |
| `key` | String | Class key attribute ID or `""`. The reader fills the key automatically for a class with a single option. |
| `boosts` | Object | Milestone keys `"1"`, `"5"`, `"10"`, `"15"`, and `"20"`, each with up to four distinct attribute IDs. Level 1 holds free boosts. Missing milestones default to empty arrays. Future milestones are saved and take effect in the ledger when reached. |
| `feats` | Object | Optional map from feat slot ID to selection string. Missing or empty maps represent a build with no recorded choices. The writer omits empty maps. |

## Feat choices through level 20

Use exact IDs from the [feat catalog](../src/feat-data.ts) for catalog choices,
such as `"weapon-supremacy"`. To record a feat by name, use a string such as
`"manual:Campaign Lore"`. The reader trims the name, keeps at most 100 UTF-16
code units, and discards empty names.

| Slot keys | When to use them |
| --- | --- |
| `ancestry`, `background`, `class`, `skill` | Level 1 slots. The `background` key is for a custom background. Preset background grants come from the selected background ID. The class and skill slots depend on the class. |
| `ambition`, `training` | Extra choices granted by Natural Ambition and General Training when selected in the level 1 `ancestry` slot. |
| `ancestry-5`, `ancestry-9`, `ancestry-13`, `ancestry-17` | Advancement ancestry feat slots. |
| `general-3`, `general-7`, `general-11`, `general-15`, `general-19` | General feat slots. |
| `class-2` through `class-20` | Class feat slots at even levels when a class is selected. |
| `skill-2` through `skill-20` | Skill feat slots at even levels when a class is selected. Rogues also get odd-level slots, investigators get odd-level slots starting at 3, and swashbucklers get slots at 3, 7, and 15. |
| `grant-<parent-slot>` | Extra choices granted by a feat, such as `grant-general-3` for Ancestral Paragon in `general-3`. Nested grants prefix the full parent key again, as in `grant-grant-ancestry-13`. |

The reader checks choices through level 20 independently of `level`.
It keeps catalog feats that match an available slot, its level limit, and the
feat's repeat limit. Manual entries require an available slot and bypass the
catalog checks. A granted slot requires its parent choice to be present and
valid. The selected feat browsing level is UI state and is absent from both
formats. See the [slot rules](../src/feats.ts) for class-specific details.

## Example backup

This level 4 fighter has planned a level 5 boost and recorded feats through
level 20.

```json
{
  "format": "pf2e-point-buy-calc",
  "version": 1,
  "level": 4,
  "ancestry": "human",
  "background": "warrior",
  "characterClass": "fighter",
  "alternate": false,
  "customFixed": ["", ""],
  "customFlaw": "",
  "ancestryBoosts": ["str", "con"],
  "flaws": [],
  "backgroundBoosts": ["str", "wis"],
  "key": "str",
  "boosts": {
    "1": ["str", "dex", "con", "wis"],
    "5": ["str", "dex", "con", "wis"],
    "10": [],
    "15": [],
    "20": []
  },
  "feats": {
    "ancestry": "natural-ambition",
    "class": "vicious-swing",
    "ambition": "double-slice",
    "general-19": "scare-to-death",
    "class-20": "weapon-supremacy",
    "skill-20": "manual:Campaign Lore"
  }
}
```

To build a share link from this backup, parse the file as JSON and pass the
result as `backup` to this function.

```js
function shareLink(backup) {
  const { format, ...payload } = backup;
  const url = new URL("https://pf.starmist.studio/");
  url.searchParams.set("build", JSON.stringify(payload));
  return url.href;
}
```

## Compatibility and errors

- Invalid JSON or a missing or unsupported `version` causes parsing to fail.
  Opening an invalid link starts a fresh build and shows a message. A link
  without a `build` parameter opens the default build.
- Backups also require the exact `format` string. A rejected, unreadable, or
  oversized file leaves the current build in place and displays a message.
- After checking the header fields, the reader normalizes the payload. It
  ignores unknown properties, fills missing fields with defaults, and clears
  invalid boosts and feat choices. An import can succeed with some choices
  discarded. Older version 1 builds that omit `feats` still load.

The [serializer and parser](../src/build.ts) define the wire format. The
[build tests](../test/build.test.ts) cover round-trips, version and format
rejection, and preservation of planned feats above the character's level.
