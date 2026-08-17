const SLOT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const form = document.querySelector("#config");
const status = document.querySelector("#status");
const saveButton = document.createElement("button");

function homeInputName(cookieStoreId) {
  return `home:${cookieStoreId}`;
}

function slotInputName(cookieStoreId, slotNumber) {
  return `slot:${cookieStoreId}:${slotNumber}`;
}

function addRow(section, labelText, name, value) {
  const label = document.createElement("label");
  const labelSpan = document.createElement("span");
  const input = document.createElement("input");

  labelSpan.textContent = labelText;
  labelSpan.className = "row-label";

  input.type = "url";
  input.name = name;
  input.value = value || "";
  input.placeholder = "https://example.org/";
  input.autocomplete = "off";

  label.className = "row";
  label.append(labelSpan, input);
  section.append(label);
}

function addContainerSection({ cookieStoreId, name, colorCode, iconUrl }, homes, slots) {
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
  for (const slotNumber of SLOT_NUMBERS) {
    addRow(
      section,
      `Slot ${slotNumber}`,
      slotInputName(cookieStoreId, slotNumber),
      containerSlots[slotNumber]
    );
  }

  form.append(section);
}

async function load() {
  const { homes = {}, slots = {} } = await browser.storage.local.get([
    "homes",
    "slots"
  ]);
  const containers = await browser.contextualIdentities.query({});

  form.replaceChildren();

  addContainerSection(
    { cookieStoreId: "firefox-default", name: "No container / Default" },
    homes,
    slots
  );

  for (const container of containers) {
    addContainerSection(container, homes, slots);
  }

  saveButton.type = "submit";
  saveButton.textContent = "Save";
  saveButton.disabled = true;
  form.append(saveButton);
}

form.addEventListener("input", (event) => {
  if (!event.target.matches("input")) return;

  status.textContent = "";
  saveButton.disabled = false;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const homes = {};
  const slots = {};

  for (const input of form.querySelectorAll("input")) {
    const url = input.value.trim();

    if (!url) continue;

    let href;
    try {
      href = new URL(url).href;
    } catch {
      status.textContent = `Not a valid URL: ${url}`;
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

  await browser.storage.local.set({ homes, slots });
  status.textContent = "Saved.";
  saveButton.disabled = true;
});

load().catch((error) => {
  console.error(error);
  status.textContent = `Could not load containers: ${error.message}`;
});
