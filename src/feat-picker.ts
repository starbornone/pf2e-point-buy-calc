import type { Build } from "./build.ts";
import type { Feat } from "./feat-data.ts";
import { featLevels, featSlots, grantedBackgroundFeats, manualFeat, manualFeatName, maxManualFeatLength } from "./feats.ts";
import type { FeatSlot, FeatSlotId } from "./feats.ts";
import { backgrounds } from "./options.ts";

function textElement<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function rulesLink(name: string, label: string) {
  const link = textElement("a", label);
  const url = new URL("https://2e.aonprd.com/Search.aspx");
  url.searchParams.set("q", name);
  link.href = url.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function featBook(feat: Feat) {
  return feat.book === 2 ? "Player Core 2" : "Player Core";
}

function featName(slot: FeatSlot, value: string) {
  return manualFeatName(value) || slot.options.find(({ id }) => id === value)?.name || "";
}

export function createFeatPicker(
  section: HTMLElement,
  summary: HTMLElement,
  dialog: HTMLDialogElement,
  levelPicker: HTMLSelectElement,
  onChoose: (slot: FeatSlotId, value: string) => void,
) {
  function control<T extends HTMLElement>(selector: string): T {
    const element = dialog.querySelector<T>(selector);
    if (!element) throw new Error(`Missing feat picker control ${selector}`);
    return element;
  }

  const title = control("#feat-dialog-title");
  const slotNote = control("#feat-slot-note");
  const search = control<HTMLInputElement>("#feat-search");
  const results = control("#feat-results");
  const resultCount = control("#feat-result-count");
  const preview = control("#feat-preview");
  const manual = control<HTMLInputElement>("#feat-manual");
  const manualDetails = control<HTMLDetailsElement>("#feat-manual-details");
  const apply = control<HTMLButtonElement>("#feat-apply");
  const clear = control<HTMLButtonElement>("#feat-clear");
  manual.maxLength = maxManualFeatLength;
  levelPicker.append(...featLevels.map((level) => new Option(String(level), String(level))));

  let build: Build;
  let active: FeatSlot | undefined;
  let draft = "";

  function renderPreview() {
    if (!active) return;
    const feat = active.options.find(({ id }) => id === draft);
    const name = featName(active, draft);
    apply.disabled = !name;
    preview.replaceChildren();
    results.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.feat === draft));
    });
    if (!name) {
      preview.append(textElement("p", "Select a feat to see its details.", "muted"));
      return;
    }
    preview.append(textElement("h3", name));
    if (!feat) {
      preview.append(textElement("p", "Recorded by name.", "muted"));
      return;
    }
    const metadata = [`Level ${feat.level}`, featBook(feat), feat.rarity].filter(Boolean).join(" · ");
    preview.append(textElement("p", metadata, "feat-meta"));
    if (feat.traits.length) preview.append(textElement("p", feat.traits.join(" · "), "muted small"));
    if (feat.prerequisites) {
      preview.append(textElement("p", "Prerequisites", "feat-meta"), textElement("p", feat.prerequisites));
    }
    if (feat.id === "natural-ambition") preview.append(textElement("p", "Adds a first-level class feat."));
    if (feat.id === "general-training") preview.append(textElement("p", "Adds a first-level general feat."));
    if (feat.id === "advanced-general-training") preview.append(textElement("p", "Adds a general feat of level 7 or lower."));
    if (feat.id === "ancestral-paragon") preview.append(textElement("p", "Adds a first-level ancestry feat."));
    preview.append(rulesLink(feat.name, "Look up feat rules ↗"));
  }

  function renderResults() {
    if (!active) return;
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = active.options.filter((feat) => {
      const searchable = [feat.name, `level ${feat.level}`, featBook(feat), feat.rarity, feat.prerequisites, ...feat.traits]
        .join(" ").toLowerCase();
      return terms.every((term) => searchable.includes(term));
    }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "en"));
    resultCount.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "feat" : "feats"}`
      : "No matching feats. Try another search or enter a feat by name.";
    results.replaceChildren(...matches.map((feat) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.feat = feat.id;
      button.setAttribute("aria-pressed", String(feat.id === draft));
      button.append(
        textElement("span", feat.name),
        textElement("small", [`Level ${feat.level}`, featBook(feat), feat.rarity].filter(Boolean).join(" · "), "muted"),
      );
      item.append(button);
      return item;
    }));
  }

  function open(slot: FeatSlot) {
    active = slot;
    draft = build.feats[slot.id] ?? "";
    title.textContent = `Level ${slot.level} · ${slot.label}`;
    slotNote.textContent = slot.note ?? "";
    slotNote.hidden = !slot.note;
    search.value = "";
    manual.value = manualFeatName(draft);
    manualDetails.open = Boolean(manual.value);
    clear.hidden = !draft;
    renderResults();
    renderPreview();
    dialog.showModal();
    (manualDetails.open ? manual : search).focus();
  }

  function save(value: string) {
    if (!active) return;
    const { id } = active;
    dialog.close();
    onChoose(id, value);
    document.getElementById(`choose-feat-${id}`)?.focus({ preventScroll: true });
  }

  search.addEventListener("input", renderResults);
  results.addEventListener("click", ({ target }) => {
    if (!(target instanceof Element)) return;
    const id = target.closest<HTMLButtonElement>("button[data-feat]")?.dataset.feat;
    if (!id) return;
    draft = id;
    manual.value = "";
    renderPreview();
  });
  manual.addEventListener("input", () => {
    draft = manualFeat(manual.value);
    renderPreview();
  });
  apply.addEventListener("click", () => save(draft));
  clear.addEventListener("click", () => save(""));

  function renderLevel() {
    const level = Number(levelPicker.value);
    const cards: HTMLElement[] = [];

    const background = backgrounds[build.background];
    if (level === 1 && background) {
      const grants = grantedBackgroundFeats(build.background);
      const card = document.createElement("div");
      card.className = "feat-card";
      card.append(
        textElement("p", "Granted by background", "feat-meta"),
        textElement("p", grants.join(" · ") || "No starting feat granted."),
      );
      if (grants.length) {
        card.append(rulesLink(background.name, "Look up background rules ↗"));
      }
      cards.push(card);
    }

    for (const slot of featSlots(build, build.feats, level)) {
      const name = featName(slot, build.feats[slot.id] ?? "");
      const card = document.createElement("div");
      card.className = "feat-card";
      card.append(textElement("p", slot.label, "feat-meta"));
      if (name) {
        card.append(textElement("p", name));
      }
      if (slot.note) card.append(textElement("p", slot.note, "muted small"));

      const button = textElement("button", name ? "Change feat" : "Choose feat");
      button.id = `choose-feat-${slot.id}`;
      button.type = "button";
      button.disabled = Boolean(slot.unavailable);
      button.setAttribute("aria-label", `${button.textContent} for ${slot.label.toLowerCase()}`);
      button.addEventListener("click", () => open(slot));
      card.append(button);
      cards.push(card);
    }

    if (!cards.length) {
      const message = build.characterClass ? "No feat choices at this level." : "Choose a class to see its feat schedule.";
      cards.push(textElement("p", message, "muted small"));
    }
    section.replaceChildren(...cards);
  }

  levelPicker.addEventListener("change", renderLevel);

  return (next: Build) => {
    if (build?.level !== next.level) levelPicker.value = String(next.level);
    build = next;
    renderLevel();
    const selected = grantedBackgroundFeats(build.background).map((name) => `Level 1 · Background · ${name}`);
    if (Object.keys(build.feats).length) {
      for (const level of featLevels) {
        for (const slot of featSlots(build, build.feats, level)) {
          const name = featName(slot, build.feats[slot.id] ?? "");
          if (name) selected.push(`Level ${level} · ${slot.label} · ${name}`);
        }
      }
    }
    const list = document.createElement("ul");
    list.append(...selected.map((name) => textElement("li", name)));
    summary.replaceChildren(textElement("h3", "Recorded feats"), list);
    summary.hidden = selected.length === 0;
  };
}
