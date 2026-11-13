// Config export/import: pure functions, no browser APIs, so they can be
// tested with Node's test runner.

export const SLOT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const SCHEMA_VERSION = 2;
export const DEFAULT_COOKIE_STORE_ID = "firefox-default";

// Slot labels are optional: a container's entry only gets slotLabels when
// it has some, so files without labels look as they did before 0.7.
export function buildExport(containers, homes, slots, commands, slotLabels = {}) {
  function withLabels(entry, cookieStoreId) {
    const labels = slotLabels[cookieStoreId];
    return labels && Object.keys(labels).length > 0 ? { ...entry, slotLabels: labels } : entry;
  }

  const defaultEntry = withLabels({
    cookieStoreId: DEFAULT_COOKIE_STORE_ID,
    homeUrl: homes[DEFAULT_COOKIE_STORE_ID],
    slots: slots[DEFAULT_COOKIE_STORE_ID] || {}
  }, DEFAULT_COOKIE_STORE_ID);

  // Export every container with its identity (name, icon, color) so the import
  // can match by name or recreate it, even if cookieStoreIds differ.
  const exportedContainers = containers.map(({ cookieStoreId, name, icon, color }) => withLabels({
    name,
    icon,
    color,
    homeUrl: homes[cookieStoreId],
    slots: slots[cookieStoreId] || {}
  }, cookieStoreId));

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    containers: [defaultEntry, ...exportedContainers],
    shortcuts: Object.fromEntries(commands.map(({ name, shortcut }) => [name, shortcut || ""]))
  };
}

// Firefox's contextualIdentities values; anything else falls back to a
// default so a file from a newer Firefox still imports.
const CONTAINER_ICONS = [
  "fingerprint", "briefcase", "dollar", "cart", "circle", "gift", "vacation",
  "food", "fruit", "pet", "tree", "chill", "fence"
];
const CONTAINER_COLORS = [
  "blue", "turquoise", "green", "yellow", "orange", "red", "pink", "purple", "toolbar"
];

// Turns a parsed export file into { schemaVersion, entries, shortcuts }, or
// throws an Error describing the first problem found. Nothing is stored or
// created unless the whole file validates, so a bad file can't leave a
// half-imported config.
export function parseImport(data) {
  if (
    !data ||
    typeof data !== "object" ||
    ![1, SCHEMA_VERSION].includes(data.schemaVersion) ||
    !Array.isArray(data.containers)
  ) {
    throw new Error("unrecognized file format.");
  }

  const entries = data.containers.map((container) => {
    if (!container || typeof container !== "object") {
      throw new Error("a container entry is not an object.");
    }

    // The default container is keyed by its fixed id in every version; v1
    // files key all containers by id, v2 files by name.
    let entry;
    if (container.cookieStoreId === DEFAULT_COOKIE_STORE_ID || data.schemaVersion === 1) {
      const { cookieStoreId } = container;
      if (typeof cookieStoreId !== "string" || !cookieStoreId) {
        throw new Error("a container entry has no cookieStoreId.");
      }
      entry = { cookieStoreId, label: cookieStoreId };
    } else {
      const { name } = container;
      if (typeof name !== "string" || !name.trim()) {
        throw new Error("a container entry has no name.");
      }
      entry = {
        name,
        icon: CONTAINER_ICONS.includes(container.icon) ? container.icon : "fingerprint",
        color: CONTAINER_COLORS.includes(container.color) ? container.color : "blue",
        label: name
      };
    }

    if (container.homeUrl) {
      entry.homeUrl = parseImportedUrl(container.homeUrl, entry.label);
    }

    entry.slots = {};
    if (container.slots !== undefined) {
      if (!isPlainObject(container.slots)) {
        throw new Error(`slots for ${entry.label} are not an object.`);
      }

      for (const [slotNumber, url] of Object.entries(container.slots)) {
        checkSlotNumber(slotNumber, entry.label);
        entry.slots[slotNumber] = parseImportedUrl(url, entry.label);
      }
    }

    // Optional, added in 0.7; older files have none. Blank labels are
    // dropped, so the popup falls back to showing the URL.
    entry.slotLabels = {};
    if (container.slotLabels !== undefined) {
      if (!isPlainObject(container.slotLabels)) {
        throw new Error(`slot labels for ${entry.label} are not an object.`);
      }

      for (const [slotNumber, slotLabel] of Object.entries(container.slotLabels)) {
        checkSlotNumber(slotNumber, entry.label);
        if (typeof slotLabel !== "string") {
          throw new Error(`${entry.label} has a slot label that isn't text.`);
        }
        if (!entry.slots[slotNumber]) {
          throw new Error(`${entry.label} has a label for slot ${slotNumber}, which has no URL.`);
        }
        if (slotLabel.trim()) entry.slotLabels[slotNumber] = slotLabel.trim();
      }
    }

    return entry;
  });

  // Older exports have no shortcuts; leave the current ones alone then.
  let shortcuts = null;
  if (data.shortcuts !== undefined) {
    if (
      typeof data.shortcuts !== "object" ||
      data.shortcuts === null ||
      Array.isArray(data.shortcuts) ||
      !Object.values(data.shortcuts).every((shortcut) => typeof shortcut === "string")
    ) {
      throw new Error("shortcuts are not a map of command names to keys.");
    }
    shortcuts = data.shortcuts;
  }

  return { schemaVersion: data.schemaVersion, entries, shortcuts };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkSlotNumber(slotNumber, label) {
  if (!SLOT_NUMBERS.map(String).includes(slotNumber)) {
    throw new Error(`${label} has an unknown slot "${slotNumber}".`);
  }
}

function parseImportedUrl(url, label) {
  try {
    if (typeof url !== "string") throw new TypeError();
    return new URL(url).href;
  } catch {
    throw new Error(`${label} has an invalid URL.`);
  }
}
