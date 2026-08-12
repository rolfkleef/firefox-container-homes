const form = document.querySelector("#homes");
const status = document.querySelector("#status");
const saveButton = document.createElement("button");

function addField({ cookieStoreId, name, colorCode, iconUrl }, homes) {
  const label = document.createElement("label");
  const nameWrap = document.createElement("span");
  const icon = document.createElement("span");
  const nameText = document.createElement("span");
  const input = document.createElement("input");

  icon.className = "identity-icon";
  if (iconUrl) {
    icon.style.setProperty("--identity-icon", `url("${iconUrl}")`);
    icon.style.setProperty("--identity-color", colorCode || "currentColor");
  } else {
    icon.classList.add("identity-icon--default");
  }

  nameText.textContent = name;

  nameWrap.className = "identity-name";
  nameWrap.append(icon, nameText);

  input.type = "url";
  input.name = cookieStoreId;
  input.value = homes[cookieStoreId] || "";
  input.placeholder = "https://example.org/";
  input.autocomplete = "off";

  label.append(nameWrap, input);
  form.append(label);
}

async function load() {
  const { homes = {} } = await browser.storage.local.get("homes");
  const containers = await browser.contextualIdentities.query({});

  form.replaceChildren();

  addField(
    { cookieStoreId: "firefox-default", name: "No container / Default" },
    homes
  );

  for (const container of containers) {
    addField(container, homes);
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

  for (const input of form.querySelectorAll("input")) {
    const url = input.value.trim();

    if (!url) continue;

    try {
      homes[input.name] = new URL(url).href;
    } catch {
      status.textContent = `Not a valid URL: ${url}`;
      return;
    }
  }

  await browser.storage.local.set({ homes });
  status.textContent = "Saved.";
  saveButton.disabled = true;
});

load().catch((error) => {
  console.error(error);
  status.textContent = `Could not load containers: ${error.message}`;
});
