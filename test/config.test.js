import { test } from "node:test";
import assert from "node:assert/strict";

import { buildExport, parseImport, SCHEMA_VERSION } from "../src/options/config.js";

const containers = [{ cookieStoreId: "firefox-container-1", name: "Work", icon: "briefcase", color: "blue" }];
const homes = { "firefox-container-1": "https://intra.example/" };
const slots = { "firefox-container-1": { 1: "https://mail.example/", 2: "https://chat.example/" } };
const commands = [{ name: "open-slot-1", shortcut: "Alt+Shift+1" }];

function exportWith(slotLabels) {
  return buildExport(containers, homes, slots, commands, slotLabels);
}

test("buildExport includes slot labels for containers that have them", () => {
  const data = exportWith({ "firefox-container-1": { 1: "Mail" } });
  const work = data.containers.find((container) => container.name === "Work");
  assert.deepEqual(work.slotLabels, { 1: "Mail" });
});

test("buildExport leaves out slotLabels when a container has none", () => {
  const data = exportWith({});
  for (const container of data.containers) {
    assert.equal("slotLabels" in container, false);
  }
});

test("an export with labels imports them again", () => {
  const data = JSON.parse(JSON.stringify(exportWith({ "firefox-container-1": { 2: "Chat" } })));
  const work = parseImport(data).entries.find((entry) => entry.name === "Work");
  assert.deepEqual(work.slots, { 1: "https://mail.example/", 2: "https://chat.example/" });
  assert.deepEqual(work.slotLabels, { 2: "Chat" });
});

test("a file without slotLabels imports with no labels", () => {
  const data = { schemaVersion: SCHEMA_VERSION, containers: [{ name: "Work", slots: { 1: "https://mail.example/" } }] };
  assert.deepEqual(parseImport(data).entries[0].slotLabels, {});
});

test("imported labels are trimmed, and blank labels dropped", () => {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    containers: [{
      name: "Work",
      slots: { 1: "https://mail.example/", 2: "https://chat.example/" },
      slotLabels: { 1: "  Mail  ", 2: "   " }
    }]
  };
  assert.deepEqual(parseImport(data).entries[0].slotLabels, { 1: "Mail" });
});

function importLabels(slotLabels) {
  return () => parseImport({
    schemaVersion: SCHEMA_VERSION,
    containers: [{ name: "Work", slots: { 1: "https://mail.example/" }, slotLabels }]
  });
}

test("import rejects slotLabels that aren't an object", () => {
  assert.throws(importLabels(["Mail"]), /labels for Work are not an object/);
});

test("import rejects a label that isn't text", () => {
  assert.throws(importLabels({ 1: 42 }), /Work has a slot label that isn't text/);
});

test("import rejects a label for an unknown slot number", () => {
  assert.throws(importLabels({ 10: "Ten" }), /Work has an unknown slot "10"/);
});

test("import rejects a label for a slot without a URL", () => {
  assert.throws(importLabels({ 3: "Docs" }), /Work has a label for slot 3, which has no URL/);
});
