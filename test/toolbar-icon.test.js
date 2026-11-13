import { test } from "node:test";
import assert from "node:assert/strict";

import { iconColors } from "../src/background/toolbar-icon.js";

test("iconColors uses the container's color for the dot", () => {
  assert.equal(iconColors({ colorCode: "#37adff", dark: false }).dot, "#37adff");
  assert.equal(iconColors({ colorCode: "#37adff", dark: true }).dot, "#37adff");
});

test("iconColors uses the teal dot for tabs without a container", () => {
  assert.equal(iconColors({ colorCode: null, dark: false }).dot, "#159a91");
  assert.equal(iconColors({ colorCode: null, dark: true }).dot, "#5ad1c9");
});

test("iconColors uses a navy house on light toolbars and a light one on dark", () => {
  assert.equal(iconColors({ colorCode: null, dark: false }).house, "#2b3a67");
  assert.equal(iconColors({ colorCode: null, dark: true }).house, "#f4f6fb");
});
