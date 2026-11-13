import { SLOT_NUMBERS, DEFAULT_COOKIE_STORE_ID, buildExport, parseImport } from "./config.js";

const form = document.querySelector("#config");
const status = document.querySelector("#status");
const ioStatus = document.querySelector("#io-status");
const exportButton = document.querySelector("#export");
const importInput = document.querySelector("#import");
const importButton = document.querySelector("#import-button");
const saveButton = document.createElement("button");

// Shows a message styled by kind ("error" or "success"); an empty text hides
// it. Errors use role="alert" so screen readers announce them right away.
function showMessage(element, text, kind = "success") {
  element.textContent = text;
  element.hidden = !text;
  element.className = text ? `message message--${kind}` : "message";
  element.setAttribute("role", kind === "error" ? "alert" : "status");
}

function homeInputName(cookieStoreId) {
  return `home:${cookieStoreId}`;
}

function slotInputName(cookieStoreId, slotNumber) {
  return `slot:${cookieStoreId}:${slotNumber}`;
}

function slotLabelInputName(cookieStoreId, slotNumber) {
  return `label:${cookieStoreId}:${slotNumber}`;
}

// One row: a heading ("Home", "Slot 3"), an optional label field (slots
// only; Home gets an empty cell so the URL fields line up), and a URL field.
function addRow(section, rowTitle, name, value, labelField = null) {
  const row = document.createElement("div");
  const titleSpan = document.createElement("span");
  const input = document.createElement("input");

  titleSpan.textContent = rowTitle;
  titleSpan.className = "row-label";

  input.type = "url";
  input.name = name;
  input.value = value || "";
  input.placeholder = "https://example.org/";
  input.autocomplete = "off";
  input.setAttribute("aria-label", `${rowTitle} URL`);

  let labelCell = document.createElement("span");
  if (labelField) {
    labelCell = document.createElement("input");
    labelCell.type = "text";
    labelCell.name = labelField.name;
    labelCell.value = labelField.value || "";
    labelCell.placeholder = "Label (optional)";
    labelCell.autocomplete = "off";
    labelCell.setAttribute("aria-label", `${rowTitle} label`);
  }

  row.className = "row row--slot";
  row.append(titleSpan, labelCell, input);
  section.append(row);
}

function addGeneralSection(autoGroupNewTabs) {
  const section = document.createElement("fieldset");
  const legend = document.createElement("legend");
  const label = document.createElement("label");
  const input = document.createElement("input");
  const labelSpan = document.createElement("span");

  legend.textContent = "General";
  section.append(legend);

  input.type = "checkbox";
  input.name = "autoGroupNewTabs";
  input.checked = autoGroupNewTabs;

  labelSpan.textContent = "Automatically add new tabs to their container's tab group";

  label.className = "row row--checkbox";
  label.append(input, labelSpan);
  section.append(label);
  form.append(section);
}

function addContainerSection({ cookieStoreId, name, colorCode, iconUrl }, homes, slots, slotLabels) {
  const section = document.createElement("fieldset");
  const legend = document.createElement("legend");
  const icon = document.createElement("span");
  const nameText = document.createElement("span");

  icon.className = "identity-icon";
  if (iconUrl) {
    icon.style.setProperty("--identity-icon", `url("${iconUrl}")`);
    icon.style.setProperty("--identity-color", colorCode || "currentColor");
  } else {
    icon.classList.add("identity-icon--default");
  }

  nameText.textContent = name;

  legend.className = "identity-name";
  legend.append(icon, nameText);
  section.append(legend);

  addRow(section, "Home", homeInputName(cookieStoreId), homes[cookieStoreId]);

  const containerSlots = slots[cookieStoreId] || {};
  const containerLabels = slotLabels[cookieStoreId] || {};
  for (const slotNumber of SLOT_NUMBERS) {
    addRow(
      section,
      `Slot ${slotNumber}`,
      slotInputName(cookieStoreId, slotNumber),
      containerSlots[slotNumber],
      { name: slotLabelInputName(cookieStoreId, slotNumber), value: containerLabels[slotNumber] }
    );
  }

  form.append(section);
}

async function load() {
  const {
    homes = {},
    slots = {},
    slotLabels = {},
    autoGroupNewTabs = false
  } = await browser.storage.local.get(["homes", "slots", "slotLabels", "autoGroupNewTabs"]);
  const containers = await browser.contextualIdentities.query({});

  form.replaceChildren();

  addGeneralSection(autoGroupNewTabs);

  addContainerSection(
    { cookieStoreId: "firefox-default", name: "No container / Default" },
    homes,
    slots,
    slotLabels
  );

  for (const container of containers) {
    addContainerSection(container, homes, slots, slotLabels);
  }

  saveButton.type = "submit";
  saveButton.textContent = "Save";
  saveButton.disabled = true;
  form.append(saveButton);
}

// The checkbox is a standalone preference: save it right away, like Firefox's
// own settings, rather than waiting for the URL form's Save button.
form.addEventListener("change", async (event) => {
  if (!event.target.matches('input[name="autoGroupNewTabs"]')) return;

  await browser.storage.local.set({ autoGroupNewTabs: event.target.checked });
});

form.addEventListener("input", (event) => {
  if (!event.target.matches('input[type="url"], input[name^="label:"]')) return;

  showMessage(status, "");
  saveButton.disabled = false;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const homes = {};
  const slots = {};

  for (const input of form.querySelectorAll('input[type="url"]')) {
    const url = input.value.trim();

    if (!url) continue;

    let href;
    try {
      href = new URL(url).href;
    } catch {
      showMessage(status, `Not a valid URL: ${url}`, "error");
      return;
    }

    if (input.name.startsWith("home:")) {
      const cookieStoreId = input.name.slice("home:".length);
      homes[cookieStoreId] = href;
    } else if (input.name.startsWith("slot:")) {
      const [, cookieStoreId, slotNumber] = input.name.split(":");
      slots[cookieStoreId] ??= {};
      slots[cookieStoreId][slotNumber] = href;
    }
  }

  // A label only counts for a slot that has a URL; blank labels are dropped
  // so the popup shows the URL instead.
  const slotLabels = {};
  for (const input of form.querySelectorAll('input[name^="label:"]')) {
    const slotLabel = input.value.trim();
    const [, cookieStoreId, slotNumber] = input.name.split(":");
    if (!slotLabel || !slots[cookieStoreId]?.[slotNumber]) continue;
    slotLabels[cookieStoreId] ??= {};
    slotLabels[cookieStoreId][slotNumber] = slotLabel;
  }

  await browser.storage.local.set({ homes, slots, slotLabels });
  showMessage(status, "Saved.");
  saveButton.disabled = true;
});

exportButton.addEventListener("click", async () => {
  const { homes = {}, slots = {}, slotLabels = {} } = await browser.storage.local.get([
    "homes",
    "slots",
    "slotLabels"
  ]);
  const containers = await browser.contextualIdentities.query({});
  const commands = await browser.commands.getAll();
  const data = buildExport(containers, homes, slots, commands, slotLabels);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "container-homes-config.json";
  link.click();
  URL.revokeObjectURL(url);
});

importButton.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", async () => {
  const [file] = importInput.files;
  importInput.value = "";
  if (!file) return;

  showMessage(ioStatus, "");

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showMessage(ioStatus, "Could not import: not valid JSON.", "error");
    return;
  }

  let parsed;
  try {
    parsed = parseImport(data);
  } catch (error) {
    showMessage(ioStatus, `Could not import: ${error.message}`, "error");
    return;
  }

  const confirmed = confirm(
    `Replace all current settings with the ${parsed.entries.length} container(s) in this file? ` +
      "Containers that don't exist yet (by name) will be created."
  );
  if (!confirmed) return;

  const homes = {};
  const slots = {};
  const slotLabels = {};
  const existing = await browser.contextualIdentities.query({});
  const claimed = new Set();
  let created = 0;

  for (const entry of parsed.entries) {
    let { cookieStoreId } = entry;
    if (!cookieStoreId) {
      const match = existing.find(
        (identity) => identity.name === entry.name && !claimed.has(identity.cookieStoreId)
      );
      if (match) {
        cookieStoreId = match.cookieStoreId;
      } else {
        const identity = await browser.contextualIdentities.create({
          name: entry.name,
          icon: entry.icon,
          color: entry.color
        });
        cookieStoreId = identity.cookieStoreId;
        created++;
      }
      claimed.add(cookieStoreId);
    }

    if (entry.homeUrl) homes[cookieStoreId] = entry.homeUrl;
    if (Object.keys(entry.slots).length > 0) slots[cookieStoreId] = entry.slots;
    if (Object.keys(entry.slotLabels).length > 0) slotLabels[cookieStoreId] = entry.slotLabels;
  }

  await browser.storage.local.set({ homes, slots, slotLabels });

  const failedShortcuts = [];
  if (parsed.shortcuts) {
    const knownCommands = new Set((await browser.commands.getAll()).map(({ name }) => name));
    for (const [name, shortcut] of Object.entries(parsed.shortcuts)) {
      if (!knownCommands.has(name)) continue;
      try {
        await browser.commands.update({ name, shortcut });
      } catch {
        failedShortcuts.push(name);
      }
    }
  }

  await load();
  if (failedShortcuts.length > 0) {
    showMessage(
      ioStatus,
      `Imported, but could not set shortcuts for: ${failedShortcuts.join(", ")}.`,
      "error"
    );
    return;
  }
  showMessage(ioStatus, created > 0 ? `Imported; created ${created} container(s).` : "Imported.");
});

load().catch((error) => {
  console.error(error);
  showMessage(ioStatus, `Could not load containers: ${error.message}`, "error");
});
