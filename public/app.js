import { ancestryRule, backgroundSlots, calculate, classKeys, normalizeBuild, parseBuild, serializeBuild } from "./build.js";
import { ancestries, attributeIds, attributes, backgrounds, classes } from "./options.js";

const byId = (id) => document.getElementById(id);
const requestedBuild = new URLSearchParams(location.search).get("build");
const restored = requestedBuild === null ? null : parseBuild(requestedBuild);
const initialBuild = serializeBuild(normalizeBuild());
let build = restored ?? normalizeBuild();
let previousBuild = null;
let feedbackRevision = 0;

function optionsFor(catalog, placeholder, custom) {
  const entries = Object.entries(catalog);
  const group = (core2) => entries
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

function field(id, label, choices, value, empty = "Choose attribute", names = attributes) {
  const options = choices.map((choice) =>
    `<option value="${choice}" ${choice === value ? "selected" : ""}>${names[choice]}</option>`);
  return `<label>${label}
    <select id="${id}"><option value="">${empty}</option>${options.join("")}</select>
  </label>`;
}

function choiceButtons(group, label, selected, allowed, max) {
  return `<div class="choices" role="group" aria-label="${label}">
    ${attributeIds.map((id) => {
      const pressed = selected.includes(id);
      const disabled = !allowed.includes(id) || (!pressed && selected.length >= max);
      return `<button id="choice-${group}-${id}" type="button" aria-label="${attributes[id]}"
        aria-pressed="${pressed}" data-group="${group}" data-attribute="${id}" ${disabled ? "disabled" : ""}>
        ${id.toUpperCase()}
      </button>`;
    }).join("")}
  </div>`;
}

function available(allowed, selections, index) {
  return allowed.filter((id) => !selections.some((selected, slot) => slot !== index && selected === id));
}

function countBadge(count, max) {
  return `<span class="step-count ${count === max ? "complete" : ""}">${count} / ${max} boosts</span>`;
}

function setCount(id, count, max) {
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
    <div class="fields">
      ${build.ancestryBoosts.map((id, index) => field(
        `ancestry-boost-${index}`, free > 1 ? `Free boost ${index + 1}` : "Free ancestry boost",
        available(boostChoices, build.ancestryBoosts, index), id,
      )).join("")}
    </div>`;

  setCount("ancestry-count", fixed.length + build.ancestryBoosts.filter(Boolean).length, fixed.length + free);
  byId("voluntary-choices").innerHTML = choiceButtons(
    "flaws", "Voluntary flaws", build.flaws, attributeIds.filter((id) => id !== flaw), 6,
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
    <div class="fields">${slots.map((slot, index) => field(
      `background-boost-${index}`, labels[index], available(slot, choices, index), choices[index],
    )).join("")}</div>
    ${note ? `<p class="muted small option-note">${note}</p>` : ""}`;
}

function renderClass() {
  const keys = classKeys(build.characterClass);
  const names = build.characterClass === "rogue" ? {
    str: "Strength (Ruffian)",
    dex: "Dexterity",
    int: "Intelligence (Mastermind)",
    cha: "Charisma (Scoundrel)",
  } : attributes;

  setCount("class-count", Number(Boolean(build.key)), 1);
  const details = byId("class-choices");
  if (keys.length === 0) {
    details.innerHTML = '<p class="muted small option-note">Your class boosts its key attribute.</p>';
  } else if (keys.length === 1) {
    details.innerHTML = `<div class="fixed"><span class="tag">+1 ${attributes[build.key]}</span></div>`;
  } else {
    details.innerHTML = `<div class="fields">
      ${field("key-attribute", "Key attribute", keys, build.key, "Choose key attribute", names)}
    </div>`;
  }
}

function renderMilestones(levels) {
  byId("milestone-choices").innerHTML = levels.map((level) => {
    const label = level === 1 ? "Free boosts" : `Level ${level} boosts`;
    const mark = level === 1 ? "D" : level;
    const selected = build.boosts[level];
    return `<section class="panel step" aria-labelledby="boosts-${level}-title">
      <div class="step-heading">
        <span class="step-letter" aria-hidden="true">${mark}</span>
        <h3 id="boosts-${level}-title">${label}</h3>
        ${countBadge(selected.length, 4)}
      </div>
      ${choiceButtons(level, `Level ${level} boosts`, selected, attributeIds, 4)}
    </section>`;
  }).join("");
}

const signed = (value) => value < 0 ? `−${Math.abs(value)}` : `+${value}`;
const contribution = (value) => `<td class="${value < 0 ? "negative" : value === 0 ? "row-empty" : ""}">${value ? signed(value) : "—"}</td>`;

function renderLedger({ rows, remaining, activeMilestones }) {
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
  byId("ancestry").value = build.ancestry;
  byId("background").value = build.background;
  byId("character-class").value = build.characterClass;
  byId("level").value = build.level;
  const result = calculate(build);
  renderAncestry();
  renderBackground();
  renderClass();
  renderMilestones(result.activeMilestones);
  renderLedger(result);
  byId("undo").hidden = !previousBuild;
  byId("reset").disabled = serializeBuild(build) === initialBuild;
  if (focus && document.activeElement === document.body) byId(focus)?.focus({ preventScroll: true });
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

function applyBuild(next, message) {
  build = normalizeBuild(next);
  history.replaceState(null, "", buildUrl());
  showFeedback(message);
  render();
}

const setupChanges = {
  ancestry: (value) => ({ ancestry: value, ancestryBoosts: [], alternate: false }),
  "ancestry-method": (value) => ({ alternate: value === "alternate", ancestryBoosts: [] }),
  "custom-flaw": (value) => ({ customFlaw: value }),
  background: (value) => ({ background: value, backgroundBoosts: [] }),
  "character-class": (value) => ({ characterClass: value, key: "" }),
  "key-attribute": (value) => ({ key: value }),
  level: (value) => ({ level: Number(value) }),
};

const slotGroups = {
  "ancestry-boost": "ancestryBoosts",
  "background-boost": "backgroundBoosts",
  "custom-fixed": "customFixed",
};

byId("setup-title").closest("section").addEventListener("change", ({ target }) => {
  const { id, value } = target;
  let changes = setupChanges[id]?.(value);
  const slot = id.match(/^(.+)-(\d)$/);
  const group = slotGroups[slot?.[1]];
  if (group) {
    const choices = [...build[group]];
    choices[Number(slot[2])] = value;
    changes = { [group]: choices };
  }
  if (changes) {
    previousBuild = null;
    applyBuild({ ...build, ...changes });
  }
});

function toggle(selected, id) {
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
}

byId("setup-title").closest("section").addEventListener("click", ({ target }) => {
  const button = target.closest("button[data-group]");
  if (!button || button.disabled) return;
  const { group, attribute } = button.dataset;
  const changes = group === "flaws"
    ? { flaws: toggle(build.flaws, attribute) }
    : { boosts: { ...build.boosts, [group]: toggle(build.boosts[group], attribute) } };
  previousBuild = null;
  applyBuild({ ...build, ...changes });
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
    const input = byId("share-url");
    input.value = url.href;
    input.hidden = false;
    input.select();
  }
});

byId("print").addEventListener("click", () => window.print());

byId("reset").addEventListener("click", () => {
  previousBuild = build;
  applyBuild(normalizeBuild(), "Build reset.");
  byId("undo").focus();
});

byId("undo").addEventListener("click", () => {
  const restore = previousBuild;
  previousBuild = null;
  applyBuild(restore, "Previous build restored.");
  byId("reset").focus();
});

render();
if (requestedBuild !== null && !restored) showFeedback("This build link could not be opened. A fresh build is ready.");
if (build.flaws.length) document.querySelector(".flaws").open = true;
