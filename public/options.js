export const attributes = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const attributeIds = Object.keys(attributes);
export const milestones = [1, 5, 10, 15, 20];

function catalog(rows) {
  return Object.fromEntries(rows.map(([name, rule]) => [
    name.toLowerCase().replaceAll(" ", "-"),
    { name, ...rule },
  ]));
}

// Pathfinder Player Core and Player Core 2. Source links are in the README.
export const ancestries = catalog([
  ["Dwarf", { fixed: ["con", "wis"], flaw: "cha" }],
  ["Elf", { fixed: ["dex", "int"], flaw: "con" }],
  ["Gnome", { fixed: ["con", "cha"], flaw: "str" }],
  ["Goblin", { fixed: ["dex", "cha"], flaw: "wis" }],
  ["Halfling", { fixed: ["dex", "wis"], flaw: "str" }],
  ["Human", { fixed: [] }],
  ["Leshy", { fixed: ["con", "wis"], flaw: "int" }],
  ["Orc", { fixed: [] }],
  ["Catfolk", { fixed: ["dex", "cha"], flaw: "wis", core2: true }],
  ["Hobgoblin", { fixed: ["con", "int"], flaw: "wis", core2: true }],
  ["Kholo", { fixed: ["str", "int"], flaw: "wis", core2: true }],
  ["Kobold", { fixed: ["dex", "cha"], flaw: "con", core2: true }],
  ["Lizardfolk", { fixed: ["str", "wis"], flaw: "int", core2: true }],
  ["Ratfolk", { fixed: ["dex", "int"], flaw: "str", core2: true }],
  ["Tengu", { fixed: ["dex"], core2: true }],
  ["Tripkee", { fixed: ["dex", "wis"], flaw: "str", core2: true }],
]);

const backgroundRows = [
  ["Acolyte", "int wis"],
  ["Acrobat", "str dex"],
  ["Animal Whisperer", "wis cha"],
  ["Artisan", "str int"],
  ["Artist", "dex cha"],
  ["Bandit", "dex cha"],
  ["Barkeep", "con cha"],
  ["Barrister", "int cha"],
  ["Bounty Hunter", "str wis"],
  ["Charlatan", "int cha"],
  ["Cook", "con int"],
  ["Criminal", "dex int"],
  ["Cultist", "int cha"],
  ["Detective", "int wis"],
  ["Emissary", "int cha"],
  ["Entertainer", "dex cha"],
  ["Farmhand", "con wis"],
  ["Field Medic", "con wis"],
  ["Fortune Teller", "int cha"],
  ["Gambler", "dex cha"],
  ["Gladiator", "str cha"],
  ["Guard", "str cha"],
  ["Herbalist", "con wis"],
  ["Hermit", "con int"],
  ["Hunter", "dex wis"],
  ["Laborer", "str con"],
  ["Martial Disciple", "str dex"],
  ["Merchant", "int cha"],
  ["Miner", "str wis"],
  ["Noble", "int cha"],
  ["Nomad", "con wis"],
  ["Prisoner", "str con"],
  ["Raised by Belief", ""],
  ["Sailor", "str dex"],
  ["Scholar", "int wis"],
  ["Scout", "dex wis"],
  ["Street Urchin", "dex con"],
  ["Teacher", "int wis"],
  ["Tinker", "dex int"],
  ["Warrior", "str con"],
];

const backgroundRows2 = [
  ["Amnesiac", "", 3],
  ["Astrologer", "int wis"],
  ["Barber", "dex wis"],
  ["Blessed", "wis cha"],
  ["Bookkeeper", "int wis"],
  ["Courier", "dex int"],
  ["Cursed", "int cha"],
  ["Driver", "str dex"],
  ["Feral Child", "str dex con", 1],
  ["Feybound", "dex cha"],
  ["Haunted", "wis cha"],
  ["Insurgent", "str wis"],
  ["Outrider", "con wis"],
  ["Pilgrim", "wis cha"],
  ["Refugee", "con wis"],
  ["Returned", "con wis"],
  ["Root Worker", "int wis"],
  ["Royalty", "int cha"],
  ["Saboteur", "str dex"],
  ["Scavenger", "int wis"],
  ["Servant", "dex cha"],
  ["Squire", "str con"],
  ["Tax Collector", "str cha"],
  ["Ward", "con cha"],
];

function backgroundOptions(rows, core2) {
  return rows.map(([name, restricted, count = 2]) => [
    name,
    { restricted: restricted ? restricted.split(" ") : attributeIds, count, core2 },
  ]);
}

export const backgrounds = catalog([
  ...backgroundOptions(backgroundRows, false),
  ...backgroundOptions(backgroundRows2, true),
]);

export const classes = catalog([
  ["Bard", { keys: ["cha"] }],
  ["Cleric", { keys: ["wis"] }],
  ["Druid", { keys: ["wis"] }],
  ["Fighter", { keys: ["str", "dex"] }],
  ["Ranger", { keys: ["str", "dex"] }],
  ["Rogue", { keys: ["str", "dex", "int", "cha"] }],
  ["Witch", { keys: ["int"] }],
  ["Wizard", { keys: ["int"] }],
  ["Alchemist", { keys: ["int"], core2: true }],
  ["Barbarian", { keys: ["str"], core2: true }],
  ["Champion", { keys: ["str", "dex"], core2: true }],
  ["Investigator", { keys: ["int"], core2: true }],
  ["Monk", { keys: ["str", "dex"], core2: true }],
  ["Oracle", { keys: ["cha"], core2: true }],
  ["Sorcerer", { keys: ["cha"], core2: true }],
  ["Swashbuckler", { keys: ["dex"], core2: true }],
]);
