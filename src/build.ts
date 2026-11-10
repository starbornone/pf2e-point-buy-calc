import { ancestries, attributeIds, backgrounds, classes, isAttribute, milestones } from "./options.ts";
import type { Attribute, Milestone } from "./options.ts";

export type AttributeChoice = Attribute | "";

export interface Build {
  level: number;
  ancestry: string;
  background: string;
  characterClass: string;
  alternate: boolean;
  customFixed: AttributeChoice[];
  customFlaw: AttributeChoice;
  ancestryBoosts: AttributeChoice[];
  flaws: Attribute[];
  backgroundBoosts: AttributeChoice[];
  key: AttributeChoice;
  boosts: Record<Milestone, Attribute[]>;
}

export function attributeChoice(id: unknown): AttributeChoice {
  return isAttribute(id) ? id : "";
}

function validPreset(catalog: Record<string, unknown>, id: unknown, fallback: string): string {
  return typeof id === "string" && (id === "custom" || Object.hasOwn(catalog, id)) ? id : fallback;
}

function fields(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function distinctAttributes(values: unknown, allowed: readonly Attribute[] = attributeIds): Attribute[] {
  return Array.isArray(values)
    ? [...new Set(values.filter((id): id is Attribute => isAttribute(id) && allowed.includes(id)))]
    : [];
}

function assignSlots(values: unknown, slots: readonly (readonly Attribute[])[]): AttributeChoice[] {
  const choices = Array.isArray(values) ? values : [];
  const selected = new Set<Attribute>();
  return slots.map((allowed, index) => {
    const id: unknown = choices[index];
    if (!isAttribute(id) || !allowed.includes(id) || selected.has(id)) return "";
    selected.add(id);
    return id;
  });
}

type AncestrySetup = Pick<Build, "ancestry" | "alternate" | "customFixed" | "customFlaw">;

export function ancestryRule(build: AncestrySetup) {
  const preset = build.ancestry === "custom"
    ? { fixed: build.customFixed.filter(isAttribute), flaw: build.customFlaw }
    : ancestries[build.ancestry];
  const fixed = build.alternate ? [] : preset.fixed;
  const flaw = build.alternate ? "" : preset.flaw ?? "";
  const free = (flaw ? 3 : 2) - fixed.length;
  return { fixed, flaw, free };
}

export function backgroundSlots(id: string): readonly (readonly Attribute[])[] {
  if (id === "custom") return [attributeIds, attributeIds];
  if (!id) return [];
  const { restricted, count } = backgrounds[id];
  return Array.from({ length: count }, (_, index) => index === 0 ? restricted : attributeIds);
}

export function classKeys(id: string): readonly Attribute[] {
  return id === "custom" ? attributeIds : classes[id]?.keys ?? [];
}

export function normalizeBuild(input?: unknown): Build {
  const value = fields(input);
  const level = typeof value.level === "number" && Number.isInteger(value.level) && value.level >= 1 && value.level <= 20
    ? value.level
    : 1;
  const ancestry = validPreset(ancestries, value.ancestry, "human");
  const background = validPreset(backgrounds, value.background, "");
  const characterClass = validPreset(classes, value.characterClass, "");
  const alternate = value.alternate === true;
  const customFixed = assignSlots(value.customFixed, [attributeIds, attributeIds]);
  const customFlaw = attributeChoice(value.customFlaw);
  const rule = ancestryRule({ ancestry, alternate, customFixed, customFlaw });
  const choices = attributeIds.filter((id) => !rule.fixed.includes(id));
  const keys = classKeys(characterClass);
  const key = attributeChoice(value.key);
  const rawBoosts = fields(value.boosts);
  const boosts = Object.fromEntries(milestones.map((level) => [
    level, distinctAttributes(rawBoosts[level]).slice(0, 4),
  ])) as Build["boosts"];

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
    key: keys.length === 1 ? keys[0] : key && keys.includes(key) ? key : "",
    boosts,
  };
}

export function calculate(build: Build) {
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

export function serializeBuild(build: Build, { backup = false } = {}): string {
  const data = { version: 1, ...build };
  return backup
    ? JSON.stringify({ format: backupFormat, ...data }, null, 2)
    : JSON.stringify(data);
}

export function parseBuild(serialized: string, { backup = false } = {}): Build | null {
  try {
    const value = fields(JSON.parse(serialized));
    if (value.version !== 1 || (backup && value.format !== backupFormat)) return null;
    return normalizeBuild(value);
  } catch {
    return null;
  }
}
