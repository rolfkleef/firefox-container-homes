// Pure helpers for the slot popup: no browser APIs, so they can be tested
// with Node's test runner.

// Host + path, without scheme, query, hash or a trailing slash. Input that
// isn't a valid URL is returned as is, so a bad stored value still shows.
export function shortenUrl(url) {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

// Popup state (from the background's "getPopupState") to display rows:
// Home first if configured, then slots in ascending number. Home and each
// slot show their label if they have one, else their shortened URL.
export function buildRows({ home, homeLabel, slots }) {
  const rows = [];

  if (home) {
    rows.push({ key: "Home", kind: "home", slotNumber: null, url: home, label: homeLabel || shortenUrl(home), open: false });
  }

  for (const { number, url, label, open } of [...slots].sort((a, b) => a.number - b.number)) {
    rows.push({ key: String(number), kind: "slot", slotNumber: number, url, label: label || shortenUrl(url), open });
  }

  return rows;
}

// Maps a keydown to a popup action: { type: "open" | "select", index }, or
// null when the popup should leave the key alone. Held arrow keys keep
// moving; a held open key opens only once.
export function handleKey({ key, ctrlKey, altKey, metaKey, repeat }, rows, selectedIndex) {
  if (ctrlKey || altKey || metaKey || rows.length === 0) return null;

  if (key === "ArrowDown") return { type: "select", index: (selectedIndex + 1) % rows.length };
  if (key === "ArrowUp") return { type: "select", index: (selectedIndex - 1 + rows.length) % rows.length };
  if (repeat) return null;
  if (key === "Enter") return { type: "open", index: selectedIndex };

  // Row keys are the digits 1-9 and "Home", matched exactly against event.key.
  const index = rows.findIndex((row) => row.key === key);
  return index === -1 ? null : { type: "open", index };
}
