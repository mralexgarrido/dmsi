import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const themeScript = await readFile(path.join(projectRoot, "js/theme-init.js"), "utf8");

function resolveInitialTheme({ savedTheme = null, systemDark = false, storageThrows = false } = {}) {
  const document = { documentElement: { dataset: {} } };
  const window = {
    localStorage: {
      getItem() {
        if (storageThrows) {
          throw new Error("Storage unavailable");
        }
        return savedTheme;
      },
    },
    matchMedia() {
      return { matches: systemDark };
    },
  };

  vm.runInNewContext(themeScript, { document, window });
  return document.documentElement.dataset.theme;
}

test("uses a saved theme preference before the system preference", () => {
  assert.equal(resolveInitialTheme({ savedTheme: "light", systemDark: true }), "light");
  assert.equal(resolveInitialTheme({ savedTheme: "dark", systemDark: false }), "dark");
});

test("follows the system theme on a visitor's first use", () => {
  assert.equal(resolveInitialTheme({ systemDark: true }), "dark");
  assert.equal(resolveInitialTheme({ systemDark: false }), "light");
});

test("still follows the system theme when local storage is unavailable", () => {
  assert.equal(resolveInitialTheme({ storageThrows: true, systemDark: true }), "dark");
});
