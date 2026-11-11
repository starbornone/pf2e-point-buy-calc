import assert from "node:assert/strict";
import test from "node:test";
import { calculate, normalizeBuild, parseBuild, serializeBuild } from "../src/build.ts";
import { featSlots, grantedBackgroundFeats } from "../src/feats.ts";

const dwarfDruid = {
  ancestry: "dwarf",
  ancestryBoosts: ["dex"],
  background: "nomad",
  backgroundBoosts: ["wis", "con"],
  characterClass: "druid",
  boosts: { 1: ["wis", "str", "dex", "con"] },
};

test("matches Player Core’s sample dwarf druid", () => {
  const { rows, remaining } = calculate(normalizeBuild(dwarfDruid));
  assert.deepEqual(rows.map(({ total }) => total), [1, 2, 3, 0, 4, -1]);
  assert.equal(remaining, 0);
  assert.deepEqual(rows.find(({ id }) => id === "wis"), {
    id: "wis", ancestry: 1, background: 1, classBoost: 1, free: 1,
    advancement: 0, total: 4, partial: false,
  });
});

test("alternate ancestry boosts replace both fixed boosts and the printed flaw", () => {
  const build = normalizeBuild({
    ...dwarfDruid, alternate: true, ancestryBoosts: ["cha", "str"], flaws: ["cha", "cha"],
  });
  assert.deepEqual(build.flaws, ["cha"]);
  assert.deepEqual(calculate(build).rows.map(({ ancestry }) => ancestry), [1, 0, 0, 0, 0, 0]);
});

test("an ancestry boost can offset a flaw while each attribute receives at most one flaw", () => {
  const build = normalizeBuild({ ancestry: "dwarf", ancestryBoosts: ["cha"], flaws: ["cha", "wis", "wis"] });
  assert.deepEqual(build.flaws, ["wis"]);
  assert.deepEqual(calculate(build).rows.map(({ ancestry }) => ancestry), [0, 0, 1, 0, 0, 0]);
});

test("preset exceptions grant their actual number of background boosts", () => {
  const feralChild = normalizeBuild({ ...dwarfDruid, background: "feral-child", backgroundBoosts: ["wis", "con"] });
  assert.deepEqual(feralChild.backgroundBoosts, [""]);
  assert.equal(calculate(feralChild).remaining, 1);
  const amnesiac = normalizeBuild({ ...dwarfDruid, background: "amnesiac", backgroundBoosts: ["wis", "con", "cha"] });
  assert.deepEqual(amnesiac.backgroundBoosts, ["wis", "con", "cha"]);
  assert.equal(calculate(amnesiac).remaining, 0);
});

test("class choices and boost groups reject invalid attributes and duplicate boosts", () => {
  const build = normalizeBuild({
    ancestry: "dwarf",
    ancestryBoosts: ["con"],
    background: "nomad",
    backgroundBoosts: ["wis", "wis"],
    characterClass: "fighter",
    key: "wis",
    boosts: { 1: ["wis", "wis", "dex", "con", "unknown", "int", "cha"] },
  });
  assert.deepEqual(build.ancestryBoosts, [""]);
  assert.deepEqual(build.backgroundBoosts, ["wis", ""]);
  assert.equal(build.key, "");
  assert.deepEqual(build.boosts[1], ["wis", "dex", "con", "int"]);
  assert.equal(calculate(build).remaining, 3);
});

test("milestones bank partial boosts until a second boost raises the modifier", () => {
  const build = {
    ...dwarfDruid,
    boosts: { ...dwarfDruid.boosts, 5: ["wis"], 10: ["wis"], 15: ["wis"], 20: ["wis"] },
  };
  const modifierAt = (level: number) => {
    const { rows } = calculate(normalizeBuild({ ...build, level }));
    const wisdom = rows.find(({ id }) => id === "wis");
    assert.ok(wisdom);
    const { total, partial } = wisdom;
    return [total, partial];
  };
  assert.deepEqual([4, 5, 9, 10, 15, 20].map(modifierAt), [
    [4, false], [4, true], [4, true], [5, false], [5, true], [6, false],
  ]);
});

// The version 1 share and backup contract is documented in docs/build-formats.md.
test("versioned share data round-trips custom choices and hidden milestones", () => {
  const build = normalizeBuild({
    level: 5,
    ancestry: "custom",
    customFixed: ["con", "str"],
    customFlaw: "dex",
    ancestryBoosts: ["wis"],
    background: "custom",
    backgroundBoosts: ["cha", "int"],
    characterClass: "custom",
    key: "cha",
    boosts: { 1: ["str"], 5: ["dex"], 20: ["con"] },
  });
  const decoded = parseBuild(serializeBuild(build));
  assert.ok(decoded);
  assert.deepEqual(decoded, build);
  assert.deepEqual(calculate(decoded).activeMilestones, [1, 5]);
  assert.equal(calculate(decoded).rows.find(({ id }) => id === "con")?.total, 1);
  assert.equal(parseBuild("{"), null);
  assert.equal(parseBuild('{"version":2}'), null);
});

test("JSON backups restore a build without treating other versioned JSON as a backup", () => {
  const build = normalizeBuild({ ...dwarfDruid, level: 10, boosts: { ...dwarfDruid.boosts, 10: ["wis"] } });
  const backup = serializeBuild(build, { backup: true });
  assert.deepEqual(parseBuild(backup, { backup: true }), build);
  assert.equal(parseBuild(serializeBuild(build), { backup: true }), null);
  assert.equal(parseBuild('{"format":"pf2e-point-buy-calc","version":2}', { backup: true }), null);
});

test("starting feat choices round-trip through links and backups without changing attribute totals", () => {
  const build = normalizeBuild({
    ...dwarfDruid, ancestry: "human", characterClass: "fighter",
    feats: { ancestry: "natural-ambition", class: "vicious-swing", ambition: "double-slice" },
  });
  assert.deepEqual(build.feats, {
    ancestry: "natural-ambition", class: "vicious-swing", ambition: "double-slice",
  });
  assert.deepEqual(parseBuild(serializeBuild(build)), build);
  assert.deepEqual(parseBuild(serializeBuild(build, { backup: true }), { backup: true }), build);
  assert.deepEqual(calculate(build), calculate(normalizeBuild({ ...build, feats: {} })));

  const previous = parseBuild('{"version":1,"ancestry":"dwarf","background":"nomad","characterClass":"druid"}');
  assert.ok(previous);
  assert.deepEqual(previous.feats, {});
  assert.equal(Object.hasOwn(JSON.parse(serializeBuild(previous)), "feats"), false);
});

test("starting feat slots follow the ancestry and class grants", () => {
  const fighter = normalizeBuild({
    ancestry: "human", characterClass: "fighter",
    feats: { ancestry: "natural-ambition", class: "vicious-swing", ambition: "vicious-swing", skill: "assurance" },
  });
  assert.deepEqual(fighter.feats, { ancestry: "natural-ambition", class: "vicious-swing" });
  assert.deepEqual(normalizeBuild({ ...fighter, ancestry: "dwarf", characterClass: "druid" }).feats, {});

  const rogue = normalizeBuild({
    ancestry: "human", characterClass: "rogue",
    feats: { ancestry: "general-training", skill: "assurance", training: "toughness" },
  });
  assert.deepEqual(featSlots(rogue, rogue.feats).map(({ id }) => id), ["ancestry", "class", "skill", "training"]);
  assert.deepEqual(rogue.feats, { ancestry: "general-training", skill: "assurance", training: "toughness" });
  assert.deepEqual(grantedBackgroundFeats("nomad"), ["Assurance (Survival)"]);
  assert.deepEqual(grantedBackgroundFeats("amnesiac"), []);
});

test("advancement offers the slots the class gains at that level", () => {
  const slots = (characterClass: string, level: number) =>
    featSlots({ ancestry: "human", background: "", characterClass }, {}, level);
  const ids = (characterClass: string, level: number) => slots(characterClass, level).map(({ id }) => id);

  assert.deepEqual(ids("fighter", 5), ["ancestry-5"]);
  assert.deepEqual(ids("fighter", 19), ["general-19"]);
  assert.deepEqual(ids("fighter", 20), ["class-20", "skill-20"]);
  assert.deepEqual(ids("bard", 1), ["ancestry"]);
  assert.deepEqual(ids("rogue", 5), ["ancestry-5", "skill-5"]);
  assert.match(slots("investigator", 3).find(({ id }) => id === "skill-3")?.note ?? "", /methodology/);
  assert.match(slots("swashbuckler", 15).find(({ id }) => id === "skill-15")?.note ?? "", /Acrobatics/);
  assert.deepEqual(ids("swashbuckler", 11), ["general-11"]);

  const fighterAt18 = slots("fighter", 18).find(({ id }) => id === "class-18");
  const fighterAt20 = slots("fighter", 20).find(({ id }) => id === "class-20");
  assert.ok(fighterAt18 && fighterAt20);
  assert.equal(fighterAt18.options.some(({ id }) => id === "weapon-supremacy"), false);
  assert.equal(fighterAt20.options.some(({ id }) => id === "weapon-supremacy"), true);
  assert.equal(fighterAt20.options.some(({ id }) => id === "vicious-swing"), true);
  assert.equal(slots("fighter", 19)[0].options.some(({ id }) => id === "scare-to-death"), true);
});

test("share links and JSON backups keep valid planned feats above the character's current level", () => {
  const build = normalizeBuild({
    level: 4, ancestry: "human", background: "warrior", characterClass: "fighter",
    feats: {
      class: "vicious-swing", "class-4": "weapon-supremacy", "class-6": "vicious-swing",
      "class-20": "weapon-supremacy", "skill-2": "assurance", "skill-20": "assurance",
      "skill-4": "intimidating-glare", "general-19": "scare-to-death", "ancestry-9": "cooperative-soul",
      "class-21": "weapon-supremacy",
    },
  });
  assert.deepEqual(build.feats, {
    class: "vicious-swing", "skill-2": "assurance", "ancestry-9": "cooperative-soul",
    "general-19": "scare-to-death", "class-20": "weapon-supremacy", "skill-20": "assurance",
  });
  assert.deepEqual(parseBuild(serializeBuild(build)), build);
  assert.deepEqual(parseBuild(serializeBuild(build, { backup: true }), { backup: true }), build);
  assert.deepEqual(normalizeBuild({ ...build, level: 1 }).feats, build.feats);
  const bard = normalizeBuild({ ...build, characterClass: "bard" });
  assert.equal(bard.feats["class-20"], undefined);
  assert.equal(bard.feats["general-19"], "scare-to-death");
});

test("advancement grants enforce their own feat level limits and disappear with the parent choice", () => {
  const build = normalizeBuild({
    ancestry: "human", characterClass: "fighter",
    feats: {
      "ancestry-13": "advanced-general-training",
      "grant-ancestry-13": "ancestral-paragon",
      "grant-grant-ancestry-13": "general-training",
      "grant-grant-grant-ancestry-13": "toughness",
    },
  });
  assert.equal(build.feats["grant-grant-grant-ancestry-13"], "toughness");
  assert.equal(featSlots(build, build.feats, 13).find(({ id }) => id === "grant-ancestry-13")
    ?.options.some(({ id }) => id === "incredible-investiture"), false);
  assert.deepEqual(normalizeBuild({
    ...build, feats: { ...build.feats, "ancestry-13": "cooperative-soul" },
  }).feats, { "ancestry-13": "cooperative-soul" });
});
