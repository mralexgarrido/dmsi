import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = await readFile(path.join(projectRoot, "css/styles.css"), "utf8");

function extractVariable(block, name) {
  const value = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  assert.ok(value, `Missing --${name}.`);
  return value;
}

function hexToRgb(hex) {
  const numeric = Number.parseInt(hex.slice(1), 16);
  return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
}

function relativeLuminance(hex) {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test("uses four distinct rank colors with readable icon and badge contrast", () => {
  const darkBlock = styles.match(/:root\s*{([\s\S]*?)\n}/)?.[1];
  const lightBlock = styles.match(/:root\[data-theme="light"\]\s*{([\s\S]*?)\n}/)?.[1];
  assert.ok(darkBlock && lightBlock);

  for (const block of [darkBlock, lightBlock]) {
    const colors = ["one", "two", "three", "four"].map((rank) =>
      extractVariable(block, `rank-${rank}`),
    );
    assert.equal(new Set(colors).size, 4);

    ["one", "two", "three", "four"].forEach((rank) => {
      const background = extractVariable(block, `rank-${rank}`);
      const foreground = extractVariable(block, `rank-${rank}-on`);
      assert.ok(
        contrastRatio(background, foreground) >= 4.5,
        `${rank} rank cue must meet 4.5:1 contrast.`,
      );
    });
  }
});

