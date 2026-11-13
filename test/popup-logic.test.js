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
  assert.deepEqual(rows.map((row) => row.key), ["Home", "2", "7"]);
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

test("buildRows shows a slot's label instead of its URL when it has one", () => {
  const rows = buildRows({
    container,
    home: null,
    slots: [{ ...slot(1), label: "Mail" }, slot(2)]
  });
  assert.equal(rows[0].label, "Mail");
  assert.equal(rows[0].url, "https://app1.example/");
  assert.equal(rows[1].label, "app2.example");
});

test("buildRows shows Home's label instead of its URL when it has one", () => {
  const rows = buildRows({ ...stateWithHome, homeLabel: "Intranet" });
  assert.equal(rows[0].label, "Intranet");
  assert.equal(rows[0].url, "https://intra.example/");
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

test("handleKey opens Home for the Home key", () => {
  assert.deepEqual(handleKey({ key: "Home" }, rows, 2), { type: "open", index: 0 });
});

test("handleKey no longer opens Home for h or H", () => {
  assert.equal(handleKey({ key: "h" }, rows, 2), null);
  assert.equal(handleKey({ key: "H" }, rows, 2), null);
});

test("handleKey ignores the Home key when Home isn't configured", () => {
  const noHome = buildRows({ ...stateWithHome, home: null });
  assert.equal(handleKey({ key: "Home" }, noHome, 0), null);
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

test("handleKey ignores auto-repeated open keys, so a held key opens once", () => {
  assert.equal(handleKey({ key: "7", repeat: true }, rows, 0), null);
  assert.equal(handleKey({ key: "Enter", repeat: true }, rows, 0), null);
});

test("handleKey still moves the selection on held arrow keys", () => {
  assert.deepEqual(handleKey({ key: "ArrowDown", repeat: true }, rows, 0), { type: "select", index: 1 });
});

test("handleKey ignores keys pressed with Ctrl, Alt or Meta", () => {
  assert.equal(handleKey({ key: "1", ctrlKey: true }, rows, 0), null);
  assert.equal(handleKey({ key: "Home", altKey: true }, rows, 0), null);
  assert.equal(handleKey({ key: "Enter", metaKey: true }, rows, 0), null);
});
