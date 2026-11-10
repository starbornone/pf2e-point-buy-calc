import { backgroundFeatGrants, classesWithStartingFeat, featCatalog } from "./feat-data.ts";
import type { Feat, FeatCategory } from "./feat-data.ts";

export type FeatSlotId =
  | "ancestry" | "background" | "class" | "skill" | "ambition" | "training"
  | `${FeatCategory}-${number}` | `grant-${string}`;
export type FeatChoices = Partial<Record<FeatSlotId, string>>;
export const maxManualFeatLength = 100;
export const featLevels = Array.from({ length: 20 }, (_, index) => index + 1);

interface FeatContext {
  ancestry: string;
  background: string;
  characterClass: string;
}

export interface FeatSlot {
  id: FeatSlotId;
  label: string;
  level: number;
  options: readonly Feat[];
  note?: string;
  unavailable?: boolean;
}

const orderAndMuseGrants = new Set([
  "animal-companion", "animal-companion-druid", "bardic-lore", "fire-lung",
  "leshy-familiar", "lingering-composition", "martial-performance", "shore-step",
  "steadying-stone", "storm-born", "untamed-form", "versatile-performance",
]);

const skillFeats = featCatalog.filter(({ category }) => category === "skill");
const generalFeats = featCatalog.filter(({ traits }) => traits.includes("general"));
const generalByName = new Map(generalFeats.map((feat) => [feat.name.toLowerCase(), feat]));

export function grantedBackgroundFeats(background: string): readonly string[] {
  return Object.hasOwn(backgroundFeatGrants, background) ? backgroundFeatGrants[background] : [];
}

function atMost(options: readonly Feat[], level: number): Feat[] {
  return options.filter((feat) => feat.level <= level);
}

function forTrait(category: "ancestry" | "class", trait: string): Feat[] {
  return featCatalog.filter((feat) => feat.category === category && feat.traits.includes(trait));
}

function baseSlots(context: FeatContext, level: number): FeatSlot[] {
  const { characterClass } = context;
  const slots: FeatSlot[] = [];
  const even = level % 2 === 0;
  const id = (category: "ancestry" | "class" | "skill"): FeatSlotId => level === 1 ? category : `${category}-${level}`;

  if (level % 4 === 1) {
    slots.push({
      id: id("ancestry"), label: "Ancestry feat", level,
      options: atMost(forTrait("ancestry", context.ancestry), level),
    });
  }
  if (level === 1 && context.background === "custom") {
    slots.push({
      id: "background", label: "Background feat", level, options: atMost(generalFeats, level),
      note: "Record the feat granted by your background.",
    });
  }
  if (characterClass && (even || (level === 1 && (
    classesWithStartingFeat.includes(characterClass) || characterClass === "custom"
  )))) {
    slots.push({
      id: id("class"), label: "Class feat", level,
      options: atMost(forTrait("class", characterClass), level),
    });
  }
  if (level % 4 === 3) {
    slots.push({ id: `general-${level}`, label: "General feat", level, options: atMost(generalFeats, level) });
  }

  const lesson = characterClass === "investigator" && level >= 3 && !even;
  const stylishTrick = characterClass === "swashbuckler" && [3, 7, 15].includes(level);
  if (characterClass && (even || characterClass === "rogue" || lesson || stylishTrick)) {
    const label = lesson ? "Skillful Lessons feat" : stylishTrick ? "Stylish Tricks feat"
      : characterClass === "rogue" ? "Rogue skill feat" : "Skill feat";
    const note = lesson ? "Choose a feat for an Intelligence, Wisdom, or Charisma skill, or for the skill from your methodology."
      : stylishTrick ? "Choose a feat for Acrobatics or the skill from your swashbuckler style." : undefined;
    slots.push({ id: id("skill"), label, level, options: atMost(skillFeats, level), note });
  }
  return slots;
}

function grantedSlot(context: FeatContext, slot: FeatSlot, feat: string | undefined): FeatSlot | undefined {
  const { level } = slot;
  const grantId: FeatSlotId = `grant-${slot.id}`;
  if (feat === "natural-ambition") {
    return {
      id: slot.id === "ancestry" ? "ambition" : grantId, label: "Natural Ambition class feat", level,
      options: atMost(forTrait("class", context.characterClass), 1).filter(({ id }) => !orderAndMuseGrants.has(id)),
      note: context.characterClass ? "Choose a level 1 class feat." : "Choose a class to see its feats.",
      unavailable: !context.characterClass,
    };
  }
  if (feat === "general-training" || feat === "advanced-general-training") {
    const advanced = feat === "advanced-general-training";
    return {
      id: slot.id === "ancestry" ? "training" : grantId,
      label: advanced ? "Advanced General Training feat" : "General Training feat",
      level, options: atMost(generalFeats, advanced ? 7 : 1),
      note: advanced ? "Choose a general feat of level 7 or lower." : "Choose a level 1 general feat.",
    };
  }
  if (feat === "ancestral-paragon") {
    return {
      id: grantId, label: "Ancestral Paragon feat", level,
      options: atMost(forTrait("ancestry", context.ancestry), 1),
      note: "Choose a level 1 ancestry feat.",
    };
  }
}

function canTake(feat: Feat, timesTaken: number) {
  return feat.maxTakes === null || timesTaken < (feat.maxTakes ?? 1);
}

function backgroundFeatCounts(background: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const grant of grantedBackgroundFeats(background)) {
    const name = grant.replace(/ \([^)]*\)$/, "").toLowerCase();
    const feat = generalByName.get(name);
    if (feat) counts.set(feat.id, (counts.get(feat.id) ?? 0) + 1);
  }
  return counts;
}

function walkSlots(context: FeatContext, level: number, select: (slot: FeatSlot) => string | undefined): FeatSlot[] {
  const slots = baseSlots(context, level);
  for (const slot of slots) {
    const grant = grantedSlot(context, slot, select(slot));
    if (grant) slots.push(grant);
  }
  return slots;
}

export function featSlots(context: FeatContext, feats: FeatChoices, level = 1): FeatSlot[] {
  if (!featLevels.includes(level)) return [];
  const counts = backgroundFeatCounts(context.background);
  for (const value of Object.values(feats)) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return walkSlots(context, level, ({ id }) => feats[id]).map((slot) => ({
    ...slot,
    options: slot.options.filter((feat) => feat.id === feats[slot.id] || canTake(feat, counts.get(feat.id) ?? 0)),
  }));
}

export function manualFeat(name: string): string {
  const trimmed = name.trim().slice(0, maxManualFeatLength);
  return trimmed ? `manual:${trimmed}` : "";
}

export function manualFeatName(value: string): string {
  return value.startsWith("manual:") ? value.slice("manual:".length) : "";
}

export function normalizeFeats(input: unknown, context: FeatContext): FeatChoices {
  const raw = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const choices: FeatChoices = {};

  if (!Object.keys(raw).length) return choices;
  const counts = backgroundFeatCounts(context.background);

  for (const level of featLevels) {
    walkSlots(context, level, ({ id, options, unavailable }) => {
      const value = raw[id];
      if (typeof value !== "string" || unavailable) return;
      const manual = manualFeat(manualFeatName(value));
      if (manual) {
        choices[id] = manual;
        return manual;
      }
      const feat = options.find((option) => option.id === value);
      const timesTaken = counts.get(value) ?? 0;
      if (feat && canTake(feat, timesTaken)) {
        choices[id] = value;
        counts.set(value, timesTaken + 1);
        return value;
      }
    });
  }
  return choices;
}
