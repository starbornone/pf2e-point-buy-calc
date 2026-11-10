import { ancestries, attributeIds, backgrounds, classes, milestones } from "./options.js";

const isAttribute = (id) => attributeIds.includes(id);
const validAttribute = (id) => isAttribute(id) ? id : "";
const validPreset = (catalog, id, fallback) =>
  typeof id === "string" && (id === "custom" || Object.hasOwn(catalog, id)) ? id : fallback;

function distinctAttributes(values, allowed = attributeIds) {
  return Array.isArray(values)
    ? [...new Set(values.filter((id) => allowed.includes(id)))]
    : [];
}

function assignSlots(values, slots, used = []) {
  const selected = new Set(used);
  return slots.map((allowed, index) => {
    const id = values?.[index];
    if (!allowed.includes(id) || selected.has(id)) return "";
    selected.add(id);
    return id;
  });
}

export function ancestryRule(build) {
  const preset = build.ancestry === "custom"
    ? { fixed: build.customFixed.filter(Boolean), flaw: build.customFlaw }
    : ancestries[build.ancestry];
  const fixed = build.alternate ? [] : preset.fixed;
  const flaw = build.alternate ? "" : preset.flaw ?? "";
  const free = (flaw ? 3 : 2) - fixed.length;
  return { fixed, flaw, free };
}

export function backgroundSlots(id) {
  if (id === "custom") return [attributeIds, attributeIds];
  if (!id) return [];
  const { restricted, count } = backgrounds[id];
  return Array.from({ length: count }, (_, index) => index === 0 ? restricted : attributeIds);
}

export function classKeys(id) {
  return id === "custom" ? attributeIds : classes[id]?.keys ?? [];
}

export function normalizeBuild(value = {}) {
  const level = Number.isInteger(value.level) && value.level >= 1 && value.level <= 20 ? value.level : 1;
  const ancestry = validPreset(ancestries, value.ancestry, "human");
  const background = validPreset(backgrounds, value.background, "");
  const characterClass = validPreset(classes, value.characterClass, "");
  const alternate = value.alternate === true;
  const customFixed = assignSlots(value.customFixed, [attributeIds, attributeIds]);
  const customFlaw = validAttribute(value.customFlaw);
  const rule = ancestryRule({ ancestry, alternate, customFixed, customFlaw });
  const choices = attributeIds.filter((id) => !rule.fixed.includes(id));
  const keys = classKeys(characterClass);

  return {
    level,
    ancestry,
    background,
    characterClass,
    alternate,
    customFixed,
    customFlaw,
    ancestryBoosts: assignSlots(value.ancestryBoosts, Array(rule.free).fill(choices)),
    flaws: distinctAttributes(value.flaws, attributeIds.filter((id) => id !== rule.flaw)),
    backgroundBoosts: assignSlots(value.backgroundBoosts, backgroundSlots(background)),
    key: keys.length === 1 ? keys[0] : keys.includes(value.key) ? value.key : "",
    boosts: Object.fromEntries(milestones.map((level) => [
      level, distinctAttributes(value.boosts?.[level]).slice(0, 4),
    ])),
  };
}

export function calculate(build) {
  const rule = ancestryRule(build);
  const ancestryBoosts = [...rule.fixed, ...build.ancestryBoosts];
  const activeMilestones = milestones.filter((level) => level <= build.level);
  const remaining =
    rule.free - build.ancestryBoosts.filter(Boolean).length +
    (build.background ? build.backgroundBoosts.filter((id) => !id).length : 2) +
    Number(!build.key) +
    activeMilestones.reduce((sum, level) => sum + 4 - build.boosts[level].length, 0);

  const rows = attributeIds.map((id) => {
    const ancestry = Number(ancestryBoosts.includes(id)) - Number(rule.flaw === id || build.flaws.includes(id));
    const background = Number(build.backgroundBoosts.includes(id));
    const classBoost = Number(build.key === id);
    const free = Number(build.boosts[1].includes(id));
    const starting = ancestry + background + classBoost + free;
    let total = starting;
    let partial = false;

    for (const level of activeMilestones.slice(1)) {
      if (!build.boosts[level].includes(id)) continue;
      if (total < 4 || partial) {
        total += 1;
        partial = false;
      } else {
        partial = true;
      }
    }

    return { id, ancestry, background, classBoost, free, advancement: total - starting, total, partial };
  });

  return { rows, remaining, activeMilestones };
}

const backupFormat = "pf2e-point-buy-calc";

export function serializeBuild(build, { backup = false } = {}) {
  const data = { version: 1, ...build };
  return backup
    ? JSON.stringify({ format: backupFormat, ...data }, null, 2)
    : JSON.stringify(data);
}

export function parseBuild(serialized, { backup = false } = {}) {
  try {
    const value = JSON.parse(serialized);
    if (value?.version !== 1 || (backup && value.format !== backupFormat)) return null;
    return normalizeBuild(value);
  } catch {
    return null;
  }
}
