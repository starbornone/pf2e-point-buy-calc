import assert from "node:assert/strict";
import test from "node:test";
import { calculate, normalizeBuild, parseBuild, serializeBuild } from "../public/build.js";

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
  const modifierAt = (level) => {
    const { rows } = calculate(normalizeBuild({ ...build, level }));
    const { total, partial } = rows.find(({ id }) => id === "wis");
    return [total, partial];
  };
  assert.deepEqual([4, 5, 9, 10, 15, 20].map(modifierAt), [
    [4, false], [4, true], [4, true], [5, false], [5, true], [6, false],
  ]);
});

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
  assert.deepEqual(decoded, build);
  assert.deepEqual(calculate(decoded).activeMilestones, [1, 5]);
  assert.equal(calculate(decoded).rows.find(({ id }) => id === "con").total, 1);
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
