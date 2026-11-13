import { buildRows, handleKey } from "./popup-logic.js";

const heading = document.querySelector("#container");
const list = document.querySelector("#rows");
const empty = document.querySelector("#empty");
const status = document.querySelector("#status");

let rows = [];
let selectedIndex = 0;

function select(index) {
  selectedIndex = index;
  list.querySelectorAll(".row").forEach((item, i) => {
    item.setAttribute("aria-selected", String(i === index));
  });
  const selected = list.children[index];
  if (selected) {
    list.setAttribute("aria-activedescendant", selected.id);
    selected.scrollIntoView({ block: "nearest" });
  }
}

// Guards against a double-click opening the same slot twice while the first
// request is still resolving.
let opening = false;

async function open(index) {
  const row = rows[index];
  if (!row || opening) return;
  opening = true;
  try {
    await browser.runtime.sendMessage({ type: "openRow", kind: row.kind, slotNumber: row.slotNumber });
    window.close();
  } catch (error) {
    console.error("Container Homes: couldn't open", row.url, error);
    status.textContent = `Couldn’t open ${row.label}.`;
    status.hidden = false;
    opening = false;
  }
}

function renderHeading({ name, colorCode }) {
  heading.replaceChildren();
  if (colorCode) {
    const dot = document.createElement("span");
    dot.className = "container-dot";
    dot.style.setProperty("--container-color", colorCode);
    heading.append(dot);
  }
  heading.append(name);
}

function renderRow(row, index) {
  const item = document.createElement("li");
  item.id = `row-${row.key}`;
  item.className = row.kind === "home" ? "row row--home" : "row";
  item.setAttribute("role", "option");
  item.title = row.url;

  const key = document.createElement("span");
  key.className = "row-key";
  // "Home" doesn't fit the key column; show a house, like the toolbar icon.
  key.textContent = row.kind === "home" ? "⌂" : row.key;
  if (row.kind === "home") key.title = "Home key";

  const marker = document.createElement("span");
  marker.className = "row-open";
  if (row.open) {
    marker.textContent = "●";
    marker.setAttribute("aria-hidden", "true");
  }

  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = row.label;
  if (row.open) {
    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = " (open)";
    label.append(hidden);
  }

  item.append(key, marker, label);
  item.addEventListener("click", () => open(index));
  item.addEventListener("mousemove", () => {
    if (selectedIndex !== index) select(index);
  });
  return item;
}

document.addEventListener("keydown", (event) => {
  const action = handleKey(event, rows, selectedIndex);
  if (!action) return;
  event.preventDefault();
  if (action.type === "select") select(action.index);
  else open(action.index);
});

document.querySelector("#open-options").addEventListener("click", async () => {
  await browser.runtime.openOptionsPage();
  window.close();
});

async function init() {
  const state = await browser.runtime.sendMessage({ type: "getPopupState" });
  renderHeading(state.container);

  rows = buildRows(state);
  if (rows.length === 0) {
    empty.hidden = false;
    return;
  }

  list.replaceChildren(...rows.map(renderRow));
  list.hidden = false;
  select(0);
  // Focus the listbox so screen readers follow aria-activedescendant.
  list.focus();
}

init().catch((error) => {
  console.error("Container Homes: popup failed to load:", error);
  heading.textContent = "Couldn’t load slots.";
});
