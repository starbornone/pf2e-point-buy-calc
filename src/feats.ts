import { backgroundFeatGrants, classesWithStartingFeat, startingFeats } from "./feat-data.ts";
import type { Feat } from "./feat-data.ts";

export type FeatSlotId = "ancestry" | "background" | "class" | "skill" | "ambition" | "training";
export type FeatChoices = Partial<Record<FeatSlotId, string>>;
export const maxManualFeatLength = 100;

interface FeatContext {
  ancestry: string;
  background: string;
  characterClass: string;
}

export interface FeatSlot {
  id: FeatSlotId;
  label: string;
  options: readonly Feat[];
  note?: string;
  unavailable?: boolean;
}

const orderAndMuseGrants = new Set([
  "animal-companion", "animal-companion-druid", "bardic-lore", "fire-lung",
  "leshy-familiar", "lingering-composition", "martial-performance", "shore-step",
  "steadying-stone", "storm-born", "untamed-form", "versatile-performance",
]);

const skillFeats = startingFeats.filter(({ category }) => category === "skill");
const generalFeats = startingFeats.filter(({ traits }) => traits.includes("general"));

export function grantedBackgroundFeats(background: string): readonly string[] {
  return Object.hasOwn(backgroundFeatGrants, background) ? backgroundFeatGrants[background] : [];
}

export function featSlots(context: FeatContext, feats: FeatChoices): FeatSlot[] {
  const ancestryOptions = startingFeats.filter(({ category, traits }) =>
    category === "ancestry" && traits.includes(context.ancestry));
  const classOptions = startingFeats.filter(({ category, traits }) =>
    category === "class" && traits.includes(context.characterClass));
  const slots: FeatSlot[] = [{ id: "ancestry", label: "Ancestry feat", options: ancestryOptions }];

  if (context.background === "custom") {
    slots.push({
      id: "background", label: "Background feat", options: generalFeats,
      note: "Record the feat granted by your background.",
    });
  }
  if (classesWithStartingFeat.includes(context.characterClass) || context.characterClass === "custom") {
    slots.push({ id: "class", label: "Class feat", options: classOptions.filter(({ id }) => id !== feats.ambition) });
  }
  if (context.characterClass === "rogue") {
    slots.push({ id: "skill", label: "Rogue skill feat", options: skillFeats });
  }
  if (context.ancestry === "human" && feats.ancestry === "natural-ambition") {
    slots.push({
      id: "ambition", label: "Natural Ambition class feat",
      options: classOptions.filter(({ id }) => !orderAndMuseGrants.has(id) && id !== feats.class),
      note: context.characterClass ? "Granted by Natural Ambition." : "Choose a class to see its feats.",
      unavailable: !context.characterClass,
    });
  }
  if (context.ancestry === "human" && feats.ancestry === "general-training") {
    slots.push({ id: "training", label: "General Training feat", options: generalFeats });
  }
  return slots;
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

  // The ancestry slot is evaluated first because it can add another slot.
  const slots = featSlots(context, { ancestry: typeof raw.ancestry === "string" ? raw.ancestry : "" });
  for (const { id, options, unavailable } of slots) {
    const value = raw[id];
    if (typeof value !== "string" || unavailable) continue;
    const manual = manualFeat(manualFeatName(value));
    if (manual) choices[id] = manual;
    else if (options.some((feat) => feat.id === value)) choices[id] = value;
  }
  if (choices.ambition === choices.class) delete choices.ambition;
  return choices;
}
