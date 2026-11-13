// The toolbar button's icon: a house with a dot in the active tab's
// container color. Drawn at runtime because the dot color varies; the
// static icons/toolbar-*.svg are the same shape with the default dot.

// In a 128×128 box, matching icons/toolbar-*.svg.
const HOUSE_PATH = "M64 8 L124 62 H108 V120 H74 V88 H54 V120 H20 V62 H4 Z";
const DOT = { x: 102, y: 26, radius: 23 };
// Transparent ring cut out of the house around the dot.
const DOT_GAP_RADIUS = 31;

const HOUSE_COLOR = { light: "#2b3a67", dark: "#f4f6fb" };
// Teal dot for tabs without a container, a bit darker on light toolbars.
const DEFAULT_DOT_COLOR = { light: "#159a91", dark: "#5ad1c9" };

export function iconColors({ colorCode, dark }) {
  const mode = dark ? "dark" : "light";
  return { house: HOUSE_COLOR[mode], dot: colorCode || DEFAULT_DOT_COLOR[mode] };
}

// ImageData of the icon at size×size pixels.
export function drawIcon(size, { house, dot }) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.scale(size / 128, size / 128);

  ctx.fillStyle = house;
  ctx.fill(new Path2D(HOUSE_PATH));

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(DOT.x, DOT.y, DOT_GAP_RADIUS, 0, 2 * Math.PI);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(DOT.x, DOT.y, DOT.radius, 0, 2 * Math.PI);
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}
