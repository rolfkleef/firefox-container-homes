import { test } from "node:test";
import assert from "node:assert/strict";

import { shortenUrl, buildRows, handleKey } from "../src/popup/popup-logic.js";

const container = { name: "Work", colorCode: "#37adff" };

function slot(number, url = `https://app${number}.example/`, open = false) {
  return { number, url, open };
}

const stateWithHome = {
  container,
  home: "https://intra.example/",
  slots: [slot(2), slot(7, "https://github.com/org", true)]
};

test("shortenUrl drops the scheme and a trailing slash", () => {
  assert.equal(shortenUrl("https://outlook.office.com/mail/"), "outlook.office.com/mail");
  assert.equal(shortenUrl("https://app.slack.com/"), "app.slack.com");
});

test("shortenUrl drops query and hash", () => {
  assert.equal(shortenUrl("https://github.com/org?tab=repos#x"), "github.com/org");
});

test("shortenUrl returns unparseable input unchanged", () => {
  assert.equal(shortenUrl("not a url"), "not a url");
});

test("buildRows puts Home first, then slots by number", () => {
  const rows = buildRows(stateWithHome);
  assert.deepEqual(rows.map((row) => row.key), ["H", "2", "7"]);
  assert.equal(rows[0].kind, "home");
  assert.equal(rows[0].slotNumber, null);
  assert.equal(rows[0].open, false);
  assert.equal(rows[0].label, "intra.example");
  assert.equal(rows[2].kind, "slot");
  assert.equal(rows[2].slotNumber, 7);
  assert.equal(rows[2].open, true);
  assert.equal(rows[2].url, "https://github.com/org");
  assert.equal(rows[2].label, "github.com/org");
});

test("buildRows leaves out Home when it isn't configured", () => {
  const rows = buildRows({ ...stateWithHome, home: null });
  assert.deepEqual(rows.map((row) => row.key), ["2", "7"]);
});

test("buildRows returns no rows when nothing is configured", () => {
  assert.deepEqual(buildRows({ container, home: null, slots: [] }), []);
});

test("buildRows sorts slots given out of order", () => {
  const rows = buildRows({ container, home: null, slots: [slot(7), slot(2)] });
  assert.deepEqual(rows.map((row) => row.key), ["2", "7"]);
});

const rows = buildRows(stateWithHome);

test("handleKey opens the slot for its number key", () => {
  assert.deepEqual(handleKey({ key: "7" }, rows, 0), { type: "open", index: 2 });
});

test("handleKey ignores a number with no configured slot", () => {
  assert.equal(handleKey({ key: "3" }, rows, 0), null);
});

test("handleKey opens Home for h or H", () => {
  assert.deepEqual(handleKey({ key: "h" }, rows, 2), { type: "open", index: 0 });
  assert.deepEqual(handleKey({ key: "H" }, rows, 2), { type: "open", index: 0 });
});

test("handleKey ignores H when Home isn't configured", () => {
  const noHome = buildRows({ ...stateWithHome, home: null });
  assert.equal(handleKey({ key: "h" }, noHome, 0), null);
});

test("handleKey moves the selection with arrows, wrapping at both ends", () => {
  assert.deepEqual(handleKey({ key: "ArrowDown" }, rows, 0), { type: "select", index: 1 });
  assert.deepEqual(handleKey({ key: "ArrowDown" }, rows, 2), { type: "select", index: 0 });
  assert.deepEqual(handleKey({ key: "ArrowUp" }, rows, 0), { type: "select", index: 2 });
});

test("handleKey opens the selected row on Enter", () => {
  assert.deepEqual(handleKey({ key: "Enter" }, rows, 1), { type: "open", index: 1 });
});

test("handleKey does nothing without rows", () => {
  assert.equal(handleKey({ key: "Enter" }, [], 0), null);
  assert.equal(handleKey({ key: "ArrowDown" }, [], 0), null);
});

test("handleKey ignores keys pressed with Ctrl, Alt or Meta", () => {
  assert.equal(handleKey({ key: "1", ctrlKey: true }, rows, 0), null);
  assert.equal(handleKey({ key: "h", altKey: true }, rows, 0), null);
  assert.equal(handleKey({ key: "Enter", metaKey: true }, rows, 0), null);
});
