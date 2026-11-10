import { ancestryRule, attributeChoice, backgroundSlots, calculate, classKeys, normalizeBuild, parseBuild, serializeBuild } from "./build.ts";
import type { AttributeChoice, Build } from "./build.ts";
import { ancestries, attributeIds, attributes, backgrounds, classes, isAttribute, milestones } from "./options.ts";
import type { Attribute, Milestone } from "./options.ts";

function byId(id: string): HTMLElement;
function byId<T extends HTMLElement>(id: string, type: new () => T): T;
function byId(id: string, type: new () => HTMLElement = HTMLElement): HTMLElement {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Missing or invalid element #${id}`);
  return element;
}

const setup = byId("setup");
const flawDetails = byId("voluntary-flaws", HTMLDetailsElement);
const requestedBuild = new URLSearchParams(location.search).get("build");
const restored = requestedBuild === null ? null : parseBuild(requestedBuild);
const initialBuild = serializeBuild(normalizeBuild());
const maxBackupSize = 64 * 1024;
let build = restored ?? normalizeBuild();
let previousBuild: { build: Build; label: string; focusId: string } | null = null;
let feedbackRevision = 0;

function optionsFor(catalog: Record<string, { name: string; core2?: boolean }>, placeholder: string, custom: string) {
  const entries = Object.entries(catalog);
  const group = (core2: boolean) => entries
    .filter(([, option]) => Boolean(option.core2) === core2)
    .map(([id, option]) => `<option value="${id}">${option.name}</option>`)
    .join("");
  return `
    ${placeholder ? `<option value="">${placeholder}</option>` : ""}
    <optgroup label="Player Core">${group(false)}</optgroup>
    <optgroup label="Player Core 2">${group(true)}</optgroup>
    <option value="custom">${custom}</option>`;
}

byId("ancestry").innerHTML = optionsFor(ancestries, "", "Custom ancestry");
byId("background").innerHTML = optionsFor(backgrounds, "Choose a background", "Custom background");
byId("character-class").innerHTML = optionsFor(classes, "Choose a class", "Custom class");
byId("level").innerHTML = Array.from({ length: 20 }, (_, index) => `<option>${index + 1}</option>`).join("");

function field(
  id: string, label: string, choices: readonly Attribute[], value: AttributeChoice,
  empty = "Choose attribute", names: Record<Attribute, string> = attributes,
) {
  const options = choices.map((choice) =>
    `<option value="${choice}" ${choice === value ? "selected" : ""}>${names[choice]}</option>`);
  return `<label>${label}
    <select id="${id}"><option value="">${empty}</option>${options.join("")}</select>
  </label>`;
}

type BoostGroup = Milestone | "flaws" | "ancestry-free" | "class-key" | `background-${number}`;

function choiceButtons(
  group: BoostGroup, label: string, selected: readonly Attribute[], options: readonly Attribute[],
  { limit, blocked = [], names = attributes }: {
    limit?: number; blocked?: readonly AttributeChoice[]; names?: Record<Attribute, string>;
  } = {},
) {
  const sign = group === "flaws" ? "−" : "+";
  return `<fieldset class="boost-group">
    <legend>${label}</legend>
    <div class="choices">${options.map((id) => {
      const pressed = selected.includes(id);
      const disabled = blocked.includes(id) || (!pressed && limit !== undefined && selected.length >= limit);
      return `<button id="choice-${group}-${id}" type="button"
        aria-pressed="${pressed}" data-group="${group}" data-attribute="${id}" ${disabled ? "disabled" : ""}>
        <span>${names[id]}</span><span class="choice-sign" aria-hidden="true">${sign}${pressed ? "1" : ""}</span>
      </button>`;
    }).join("")}</div>
  </fieldset>`;
}

function available(allowed: readonly Attribute[], selections: readonly AttributeChoice[], index: number) {
  return allowed.filter((id) => !selections.some((selected, slot) => slot !== index && selected === id));
}

function countBadge(count: number, max: number) {
  return `<span class="step-count ${count === max ? "complete" : ""}">${count} / ${max} boosts</span>`;
}

function setCount(id: string, count: number, max: number) {
  const badge = byId(id);
  badge.textContent = `${count} / ${max} boosts`;
  badge.classList.toggle("complete", count === max);
}

function renderAncestry() {
  const { fixed, flaw, free } = ancestryRule(build);
  const tags = fixed.map((id) => `<span class="tag">+ 1 ${attributes[id]}</span>`);
  if (flaw) tags.push(`<span class="tag negative">−1 ${attributes[flaw]}</span>`);

  const customFields = build.ancestry === "custom" && !build.alternate ? `<div class="fields">
    ${build.customFixed.map((id, index) => field(
      `custom-fixed-${index}`, `Fixed boost ${index + 1}`,
      available(attributeIds, build.customFixed, index), id, "None",
    )).join("")}
    ${field("custom-flaw", "Ancestry flaw", attributeIds, build.customFlaw, "None")}
  </div>` : "";

  const boostChoices = attributeIds.filter((id) => !fixed.includes(id));
  byId("ancestry-choices").innerHTML = `
    <div class="fields">
      <label>Ancestry boost method
        <select id="ancestry-method">
          <option value="standard">Standard ancestry boosts</option>
          <option value="alternate" ${build.alternate ? "selected" : ""}>Alternate — two free boosts</option>
        </select>
      </label>
    </div>
    ${customFields}
    ${tags.length ? `<div class="fixed">${tags.join("")}</div>` : ""}
    ${free ? choiceButtons("ancestry-free", `Choose ${free} free ancestry ${free === 1 ? "boost" : "boosts"}`,
      build.ancestryBoosts.filter(isAttribute), boostChoices, { limit: free },
    ) : ""}`;

  setCount("ancestry-count", fixed.length + build.ancestryBoosts.filter(Boolean).length, fixed.length + free);
  byId("voluntary-choices").innerHTML = choiceButtons(
    "flaws", "Choose voluntary flaws", build.flaws, attributeIds, { blocked: [flaw] },
  );
  byId("flaw-count").textContent = build.flaws.length ? `(${build.flaws.length})` : "";
}

function renderBackground() {
  const slots = backgroundSlots(build.background);
  const choices = build.backgroundBoosts;
  setCount("background-count", choices.filter(Boolean).length, slots.length || 2);
  if (!build.background) {
    byId("background-choices").innerHTML = '<p class="muted small option-note">Most backgrounds give you one restricted boost and one free boost.</p>';
    return;
  }

  let labels = ["Background boost", "Free background boost"];
  let note = "";
  if (build.background === "amnesiac") {
    labels = ["Free boost 1", "Free boost 2", "GM’s boost"];
  } else if (build.background === "raised-by-belief") {
    labels[0] = "Divine attribute";
    note = "Choose one of your deity’s divine attributes for the first boost.";
  } else if (build.background === "custom") {
    labels = ["Background boost 1", "Background boost 2"];
    note = "Choose the two attributes granted by your background.";
  }

  byId("background-choices").innerHTML = `
    ${slots.map((slot, index) => choiceButtons(
      `background-${index}`, labels[index], [choices[index]].filter(isAttribute), slot,
      { blocked: choices.filter((_, choiceIndex) => choiceIndex !== index) },
    )).join("")}
    ${note ? `<p class="muted small option-note">${note}</p>` : ""}`;
}

function renderClass() {
  const keys = classKeys(build.characterClass);
  const names = build.characterClass === "rogue" ? {
    ...attributes,
    str: "Strength (Ruffian)",
    int: "Intelligence (Mastermind)",
    cha: "Charisma (Scoundrel)",
  } : attributes;

  setCount("class-count", Number(Boolean(build.key)), 1);
  const details = byId("class-choices");
  if (keys.length === 0) {
    details.innerHTML = '<p class="muted small option-note">Your class boosts its key attribute.</p>';
  } else if (keys.length === 1) {
    details.innerHTML = `<div class="fixed"><span class="tag">+1 ${attributes[keys[0]]}</span></div>`;
  } else {
    details.innerHTML = choiceButtons("class-key", "Choose a key attribute", [build.key].filter(isAttribute), keys, { names });
  }
}

function renderMilestones(levels: readonly Milestone[]) {
  const panels = levels.map((level) => {
    const label = level === 1 ? "Free boosts" : `Level ${level} boosts`;
    const mark = level === 1 ? "D" : level;
    const selected = build.boosts[level];
    return `<section class="panel step" aria-labelledby="boosts-${level}-title">
      <div class="step-heading">
        <span class="step-letter" aria-hidden="true">${mark}</span>
        <h3 id="boosts-${level}-title">${label}</h3>
        ${countBadge(selected.length, 4)}
      </div>
      ${choiceButtons(level, "Choose four different attributes", selected, attributeIds, { limit: 4 })}
    </section>`;
  });
  byId("starting-boosts").innerHTML = panels[0];
  byId("milestone-choices").innerHTML = panels.slice(1).join("");
}

const signed = (value: number) => value < 0 ? `−${Math.abs(value)}` : `+${value}`;
const contribution = (value: number) => `<td class="${value < 0 ? "negative" : value === 0 ? "row-empty" : ""}">${value ? signed(value) : "—"}</td>`;

function renderLedger({ rows, remaining, activeMilestones }: ReturnType<typeof calculate>) {
  const advanced = activeMilestones.length > 1;
  byId("advancement-heading").hidden = !advanced;
  byId("character-summary").textContent = [
    `Level ${build.level}`,
    ancestries[build.ancestry]?.name ?? "Custom ancestry",
    backgrounds[build.background]?.name ?? (build.background ? "Custom background" : ""),
    classes[build.characterClass]?.name ?? (build.characterClass ? "Custom class" : ""),
  ].filter(Boolean).join(" · ");

  byId("modifiers").innerHTML = rows.map(({ id, ancestry, background, classBoost, free, advancement, total, partial }) => `
    <tr data-attribute="${id}">
      <th scope="row">
        <span class="long-attribute">${attributes[id]}</span>
        <abbr class="short-attribute" title="${attributes[id]}">${id.toUpperCase()}</abbr>
        ${id === build.key ? '<span class="key-tag">Key</span>' : ""}
      </th>
      ${[ancestry, background, classBoost, free].map(contribution).join("")}
      ${advanced ? contribution(advancement) : ""}
      <td class="total ${total < 0 ? "negative" : ""}">
        ${signed(total)}${partial ? ' <span class="partial-mark" aria-hidden="true">◐</span><span class="sr-only">, partial boost banked</span>' : ""}
      </td>
    </tr>`).join("");

  byId("partial-note").hidden = !rows.some(({ partial }) => partial);
  const progress = byId("progress");
  const message = remaining
    ? `${remaining} ${remaining === 1 ? "boost remains" : "boosts remain"} to be assigned.`
    : `All boosts assigned through level ${build.level}.`;
  if (progress.textContent !== message) progress.textContent = message;
  progress.dataset.complete = String(remaining === 0);
}

function render() {
  const focus = document.activeElement?.id;
  byId("ancestry", HTMLSelectElement).value = build.ancestry;
  byId("background", HTMLSelectElement).value = build.background;
  byId("character-class", HTMLSelectElement).value = build.characterClass;
  byId("level", HTMLSelectElement).value = String(build.level);
  const result = calculate(build);
  renderAncestry();
  renderBackground();
  renderClass();
  renderMilestones(result.activeMilestones);
  renderLedger(result);
  const undo = byId("undo");
  undo.hidden = !previousBuild;
  if (previousBuild) undo.textContent = previousBuild.label;
  byId("reset", HTMLButtonElement).disabled = serializeBuild(build) === initialBuild;
  if (focus && document.activeElement === document.body) document.getElementById(focus)?.focus({ preventScroll: true });
}

function buildUrl(includeDefault = false) {
  const url = new URL(location.href);
  const serialized = serializeBuild(build);
  if (includeDefault || serialized !== initialBuild) url.searchParams.set("build", serialized);
  else url.searchParams.delete("build");
  return url;
}

function showFeedback(message = "") {
  feedbackRevision += 1;
  byId("feedback").textContent = message;
  byId("share-url").hidden = true;
}

function applyBuild(next: Build, message?: string) {
  build = normalizeBuild(next);
  history.replaceState(null, "", buildUrl());
  showFeedback(message);
  render();
}

function changeBackground(background: string): Partial<Build> {
  const [restricted] = backgroundSlots(background);
  const [first = "", second = ""] = build.backgroundBoosts;
  if (first && restricted?.includes(first)) return { background, backgroundBoosts: [first, second] };
  if (second && restricted?.includes(second)) return { background, backgroundBoosts: [second, first] };
  return { background, backgroundBoosts: ["", second || first] };
}

const setupChanges: Partial<Record<string, (value: string) => Partial<Build>>> = {
  ancestry: (value) => ({ ancestry: value }),
  "ancestry-method": (value) => ({ alternate: value === "alternate" }),
  "custom-flaw": (value) => ({ customFlaw: attributeChoice(value) }),
  background: changeBackground,
  "character-class": (value) => ({ characterClass: value }),
  level: (value) => ({ level: Number(value) }),
};

setup.addEventListener("change", ({ target }) => {
  if (!(target instanceof HTMLSelectElement)) return;
  const { id, value } = target;
  let changes = setupChanges[id]?.(value);
  const fixedSlot = id.match(/^custom-fixed-(\d)$/);
  if (fixedSlot) {
    const customFixed = [...build.customFixed];
    customFixed[Number(fixedSlot[1])] = attributeChoice(value);
    changes = { customFixed };
  }
  if (!changes) return;
  const next = { ...build, ...changes };
  if (id === "ancestry" || id === "ancestry-method" || id === "custom-flaw" || fixedSlot) {
    const { fixed } = ancestryRule(next);
    next.ancestryBoosts = build.ancestryBoosts.filter((id) => id && !fixed.includes(id));
  }
  previousBuild = null;
  applyBuild(next);
});

function toggle(selected: readonly Attribute[], id: Attribute) {
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
}

setup.addEventListener("click", ({ target }) => {
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>("button[data-group]");
  if (!button || button.disabled) return;
  const { group, attribute } = button.dataset;
  if (!isAttribute(attribute)) return;
  const next = { ...build };
  const backgroundSlot = group?.match(/^background-(\d)$/);
  if (group === "flaws") {
    next.flaws = toggle(build.flaws, attribute);
  } else if (group === "ancestry-free") {
    next.ancestryBoosts = toggle(build.ancestryBoosts.filter(isAttribute), attribute);
  } else if (group === "class-key") {
    next.key = build.key === attribute ? "" : attribute;
  } else if (backgroundSlot) {
    const index = Number(backgroundSlot[1]);
    next.backgroundBoosts = [...build.backgroundBoosts];
    next.backgroundBoosts[index] = build.backgroundBoosts[index] === attribute ? "" : attribute;
  } else {
    const level = milestones.find((milestone) => String(milestone) === group);
    if (level === undefined) return;
    next.boosts = { ...build.boosts, [level]: toggle(build.boosts[level], attribute) };
  }
  previousBuild = null;
  applyBuild(next);
});

byId("share").addEventListener("click", async () => {
  const url = buildUrl(true);
  url.hash = "";
  const revision = ++feedbackRevision;
  try {
    await navigator.clipboard.writeText(url.href);
    if (revision === feedbackRevision) showFeedback("Build link copied.");
  } catch {
    if (revision !== feedbackRevision) return;
    showFeedback("Copy the selected link to share this build.");
    const input = byId("share-url", HTMLInputElement);
    input.value = url.href;
    input.hidden = false;
    input.select();
  }
});

byId("export-build").addEventListener("click", () => {
  const blob = new Blob([serializeBuild(build, { backup: true })], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pathfinder-2e-build.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

const fileInput = byId("build-file", HTMLInputElement);
byId("import-build").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (!file) return;
  if (file.size > maxBackupSize) {
    showFeedback("That file is too large to be a Pathfinder build.");
    return;
  }

  showFeedback();
  const revision = feedbackRevision;
  let contents;
  try {
    contents = await file.text();
  } catch {
    if (revision === feedbackRevision) showFeedback("The build file could not be read.");
    return;
  }
  if (revision !== feedbackRevision) return;

  const imported = parseBuild(contents, { backup: true });
  if (!imported) {
    showFeedback("Choose a JSON file exported by this calculator.");
    return;
  }
  if (serializeBuild(imported) !== serializeBuild(build)) {
    previousBuild = { build, label: "Undo import", focusId: "import-build" };
  }
  applyBuild(imported, "Build imported.");
  if (build.flaws.length) flawDetails.open = true;
});

byId("print").addEventListener("click", () => window.print());

byId("reset").addEventListener("click", () => {
  previousBuild = { build, label: "Undo reset", focusId: "reset" };
  applyBuild(normalizeBuild(), "Build reset.");
  byId("undo").focus();
});

byId("undo").addEventListener("click", () => {
  if (!previousBuild) return;
  const { build: restore, focusId } = previousBuild;
  previousBuild = null;
  applyBuild(restore, "Previous build restored.");
  byId(focusId).focus();
});

render();
if (requestedBuild !== null && !restored) showFeedback("This build link could not be opened. A fresh build is ready.");
if (build.flaws.length) flawDetails.open = true;
