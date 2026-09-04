import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

test("references local runtime assets that exist", async () => {
  const html = await readProjectFile("index.html");
  const localReferences = [...html.matchAll(/(?:href|src)="((?:assets|css|js)\/[^"#?]+)"/g)].map(
    ([, reference]) => reference,
  );

  assert.deepEqual(localReferences.sort(), [
    "assets/favicon.svg",
    "css/styles.css",
    "js/app.js",
    "js/theme-init.js",
  ]);
  await Promise.all(localReferences.map((reference) => access(path.join(projectRoot, reference))));
});

test("exposes persistent theme, download, and print controls", async () => {
  const html = await readProjectFile("index.html");

  assert.match(html, /data-action="toggle-theme"/i);
  assert.match(html, /data-action="export"/i);
  assert.match(html, /data-action="print"/i);
  assert.match(html, /class="print-header"/i);
  assert.ok(
    html.indexOf('src="js/theme-init.js"') < html.indexOf('href="css/styles.css"'),
    "The initial theme must be applied before the stylesheet loads.",
  );
});

test("loads no third-party scripts, stylesheets, fonts, or images at runtime", async () => {
  const html = await readProjectFile("index.html");

  assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i);
  assert.doesNotMatch(html, /<link(?=[^>]+rel="stylesheet")[^>]+href="https?:\/\//i);
  assert.doesNotMatch(html, /<img[^>]+src="https?:\/\//i);
});

test("declares restrictive browser and privacy defaults", async () => {
  const html = await readProjectFile("index.html");

  assert.match(html, /Content-Security-Policy/i);
  assert.match(html, /connect-src 'none'/i);
  assert.match(html, /form-action 'none'/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/mralexgarrido\.github\.io\/dmsi\/">/i);
  assert.match(html, /Responses remain in your browser\./i);
});

test("preserves the original article link with a root redirect", async () => {
  const legacyHtml = await readProjectFile("dmsiform.html");

  assert.match(legacyHtml, /http-equiv="refresh" content="0; url=\.\/"/i);
  assert.match(legacyHtml, /<a href="\.\/">continue to the DMSI<\/a>/i);
  assert.match(legacyHtml, /name="robots" content="noindex"/i);
});
