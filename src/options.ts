export const attributes = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export type Attribute = keyof typeof attributes;
export const attributeIds = Object.keys(attributes) as Attribute[];
export const milestones = [1, 5, 10, 15, 20] as const;
export type Milestone = typeof milestones[number];

export function isAttribute(id: unknown): id is Attribute {
  return typeof id === "string" && Object.hasOwn(attributes, id);
}

type CatalogRow<T> = [name: string, rule: T];

export const optionSources = ["Player Core", "Player Core 2", "Howl of the Wild"] as const;
export type OptionSource = typeof optionSources[number];

interface AncestryRule {
  fixed: Attribute[];
  flaw?: Attribute;
  source?: OptionSource;
}

interface BackgroundRule {
  restricted: Attribute[];
  count: number;
  source: OptionSource;
}

interface ClassRule {
  keys: Attribute[];
  source?: OptionSource;
}

function catalog<T>(rows: CatalogRow<T>[]): Record<string, T & { name: string }> {
  return Object.fromEntries(rows.map(([name, rule]) => [
    name.toLowerCase().replaceAll(" ", "-"),
    { name, ...rule },
  ]));
}

// Source links are in the README.
export const ancestries = catalog<AncestryRule>([
  ["Dwarf", { fixed: ["con", "wis"], flaw: "cha" }],
  ["Elf", { fixed: ["dex", "int"], flaw: "con" }],
  ["Gnome", { fixed: ["con", "cha"], flaw: "str" }],
  ["Goblin", { fixed: ["dex", "cha"], flaw: "wis" }],
  ["Halfling", { fixed: ["dex", "wis"], flaw: "str" }],
  ["Human", { fixed: [] }],
  ["Leshy", { fixed: ["con", "wis"], flaw: "int" }],
  ["Orc", { fixed: [] }],
  ["Catfolk", { fixed: ["dex", "cha"], flaw: "wis", source: "Player Core 2" }],
  ["Hobgoblin", { fixed: ["con", "int"], flaw: "wis", source: "Player Core 2" }],
  ["Kholo", { fixed: ["str", "int"], flaw: "wis", source: "Player Core 2" }],
  ["Kobold", { fixed: ["dex", "cha"], flaw: "con", source: "Player Core 2" }],
  ["Lizardfolk", { fixed: ["str", "wis"], flaw: "int", source: "Player Core 2" }],
  ["Ratfolk", { fixed: ["dex", "int"], flaw: "str", source: "Player Core 2" }],
  ["Tengu", { fixed: ["dex"], source: "Player Core 2" }],
  ["Tripkee", { fixed: ["dex", "wis"], flaw: "str", source: "Player Core 2" }],
  ["Centaur", { fixed: ["str", "wis"], flaw: "cha", source: "Howl of the Wild" }],
  ["Minotaur", { fixed: ["str", "con"], flaw: "cha", source: "Howl of the Wild" }],
  ["Surki", { fixed: ["con"], source: "Howl of the Wild" }],
]);

type BackgroundRow = [name: string, restricted: Attribute[], count?: number];

const backgroundRows: BackgroundRow[] = [
  ["Acolyte", ["int", "wis"]],
  ["Acrobat", ["str", "dex"]],
  ["Animal Whisperer", ["wis", "cha"]],
  ["Artisan", ["str", "int"]],
  ["Artist", ["dex", "cha"]],
  ["Bandit", ["dex", "cha"]],
  ["Barkeep", ["con", "cha"]],
  ["Barrister", ["int", "cha"]],
  ["Bounty Hunter", ["str", "wis"]],
  ["Charlatan", ["int", "cha"]],
  ["Cook", ["con", "int"]],
  ["Criminal", ["dex", "int"]],
  ["Cultist", ["int", "cha"]],
  ["Detective", ["int", "wis"]],
  ["Emissary", ["int", "cha"]],
  ["Entertainer", ["dex", "cha"]],
  ["Farmhand", ["con", "wis"]],
  ["Field Medic", ["con", "wis"]],
  ["Fortune Teller", ["int", "cha"]],
  ["Gambler", ["dex", "cha"]],
  ["Gladiator", ["str", "cha"]],
  ["Guard", ["str", "cha"]],
  ["Herbalist", ["con", "wis"]],
  ["Hermit", ["con", "int"]],
  ["Hunter", ["dex", "wis"]],
  ["Laborer", ["str", "con"]],
  ["Martial Disciple", ["str", "dex"]],
  ["Merchant", ["int", "cha"]],
  ["Miner", ["str", "wis"]],
  ["Noble", ["int", "cha"]],
  ["Nomad", ["con", "wis"]],
  ["Prisoner", ["str", "con"]],
  ["Raised by Belief", []],
  ["Sailor", ["str", "dex"]],
  ["Scholar", ["int", "wis"]],
  ["Scout", ["dex", "wis"]],
  ["Street Urchin", ["dex", "con"]],
  ["Teacher", ["int", "wis"]],
  ["Tinker", ["dex", "int"]],
  ["Warrior", ["str", "con"]],
];

const backgroundRows2: BackgroundRow[] = [
  ["Amnesiac", [], 3],
  ["Astrologer", ["int", "wis"]],
  ["Barber", ["dex", "wis"]],
  ["Blessed", ["wis", "cha"]],
  ["Bookkeeper", ["int", "wis"]],
  ["Courier", ["dex", "int"]],
  ["Cursed", ["int", "cha"]],
  ["Driver", ["str", "dex"]],
  ["Feral Child", ["str", "dex", "con"], 1],
  ["Feybound", ["dex", "cha"]],
  ["Haunted", ["wis", "cha"]],
  ["Insurgent", ["str", "wis"]],
  ["Outrider", ["con", "wis"]],
  ["Pilgrim", ["wis", "cha"]],
  ["Refugee", ["con", "wis"]],
  ["Returned", ["con", "wis"]],
  ["Root Worker", ["int", "wis"]],
  ["Royalty", ["int", "cha"]],
  ["Saboteur", ["str", "dex"]],
  ["Scavenger", ["int", "wis"]],
  ["Servant", ["dex", "cha"]],
  ["Squire", ["str", "con"]],
  ["Tax Collector", ["str", "cha"]],
  ["Ward", ["con", "cha"]],
];

function backgroundOptions(rows: BackgroundRow[], source: OptionSource): CatalogRow<BackgroundRule>[] {
  return rows.map(([name, restricted, count = 2]) => [
    name,
    { restricted: restricted.length ? restricted : attributeIds, count, source },
  ]);
}

export const backgrounds = catalog([
  ...backgroundOptions(backgroundRows, "Player Core"),
  ...backgroundOptions(backgroundRows2, "Player Core 2"),
]);

export const classes = catalog<ClassRule>([
  ["Bard", { keys: ["cha"] }],
  ["Cleric", { keys: ["wis"] }],
  ["Druid", { keys: ["wis"] }],
  ["Fighter", { keys: ["str", "dex"] }],
  ["Ranger", { keys: ["str", "dex"] }],
  ["Rogue", { keys: ["str", "dex", "int", "cha"] }],
  ["Witch", { keys: ["int"] }],
  ["Wizard", { keys: ["int"] }],
  ["Alchemist", { keys: ["int"], source: "Player Core 2" }],
  ["Barbarian", { keys: ["str"], source: "Player Core 2" }],
  ["Champion", { keys: ["str", "dex"], source: "Player Core 2" }],
  ["Investigator", { keys: ["int"], source: "Player Core 2" }],
  ["Monk", { keys: ["str", "dex"], source: "Player Core 2" }],
  ["Oracle", { keys: ["cha"], source: "Player Core 2" }],
  ["Sorcerer", { keys: ["cha"], source: "Player Core 2" }],
  ["Swashbuckler", { keys: ["dex"], source: "Player Core 2" }],
]);
