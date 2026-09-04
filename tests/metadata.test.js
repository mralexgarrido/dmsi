import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalUrl = "https://mralexgarrido.github.io/dmsi/";

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

function getMetaContent(html, attribute, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapedValue}"\\s+content="([^"]+)"`,
    "i",
  );
  return html.match(pattern)?.[1] ?? null;
}

function readPngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", "Expected a PNG signature.");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("publishes complete canonical, index, and social metadata", async () => {
  const html = await readProjectFile("index.html");
  const description = getMetaContent(html, "name", "description");
  const openGraphImage = getMetaContent(html, "property", "og:image");

  assert.match(html, /<title>Decision-Making Style Inventory for Creative Teams \| DMSI<\/title>/);
  assert.ok(description.length >= 120 && description.length <= 170);
  assert.equal(getMetaContent(html, "name", "author"), "Alex Garrido");
  assert.match(getMetaContent(html, "name", "robots"), /^index, follow,/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalUrl}"`));
  assert.equal(getMetaContent(html, "property", "og:url"), canonicalUrl);
  assert.equal(getMetaContent(html, "property", "og:type"), "website");
  assert.equal(getMetaContent(html, "property", "og:site_name"), "DMSI");
  assert.equal(getMetaContent(html, "property", "og:image:type"), "image/png");
  assert.equal(getMetaContent(html, "property", "og:image:width"), "1200");
  assert.equal(getMetaContent(html, "property", "og:image:height"), "630");
  assert.ok(getMetaContent(html, "property", "og:image:alt"));
  assert.equal(getMetaContent(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(getMetaContent(html, "name", "twitter:image"), openGraphImage);
  assert.ok(getMetaContent(html, "name", "twitter:title"));
  assert.ok(getMetaContent(html, "name", "twitter:description"));
  assert.ok(getMetaContent(html, "name", "twitter:image:alt"));
  assert.doesNotMatch(html, /name="keywords"/i);
});

test("serves a correctly sized PNG social preview", async () => {
  const image = await readFile(path.join(projectRoot, "assets/social-card.png"));
  assert.deepEqual(readPngDimensions(image), { width: 1200, height: 630 });
});

test("publishes truthful WebApplication structured data allowed by the CSP", async () => {
  const html = await readProjectFile("index.html");
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "Expected one JSON-LD block.");

  const rawJsonLd = match[1];
  const data = JSON.parse(rawJsonLd);
  const expectedHash = `sha256-${createHash("sha256").update(rawJsonLd).digest("base64")}`;

  assert.match(html, new RegExp(`script-src 'self' '${expectedHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "WebApplication");
  assert.equal(data.name, "Decision-Making Style Inventory");
  assert.equal(data.url, canonicalUrl);
  assert.equal(data.applicationCategory, "EducationalApplication");
  assert.equal(data.operatingSystem, "Any");
  assert.equal(data.softwareVersion, "2.2.0");
  assert.equal(data.isAccessibleForFree, true);
  assert.equal(data.offers.price, "0");
  assert.equal(data.author.name, "Alex Garrido");
  assert.match(data.image, /social-card\.png$/);
  assert.ok(Array.isArray(data.featureList) && data.featureList.length >= 4);
  assert.equal(data.aggregateRating, undefined, "Do not fabricate ratings for rich-result eligibility.");
  assert.equal(data.review, undefined, "Do not fabricate reviews for rich-result eligibility.");
});

test("keeps the manifest, crawler directives, and sitemap aligned", async () => {
  const [manifestText, robots, sitemap, buildScript] = await Promise.all([
    readProjectFile("site.webmanifest"),
    readProjectFile("robots.txt"),
    readProjectFile("sitemap.xml"),
    readProjectFile("scripts/build.mjs"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "Decision-Making Style Inventory");
  assert.equal(manifest.id, "/dmsi/");
  assert.equal(manifest.scope, "/dmsi/");
  assert.equal(manifest.icons.length, 2);
  await Promise.all(manifest.icons.map(({ src }) => access(path.join(projectRoot, src))));

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${canonicalUrl}sitemap\\.xml`));
  assert.match(sitemap, new RegExp(`<loc>${canonicalUrl}<\\/loc>`));
  assert.match(sitemap, /<lastmod>2026-09-04<\/lastmod>/);

  for (const publicArtifact of [
    ".well-known",
    "humans.txt",
    "llms.txt",
    "site.webmanifest",
  ]) {
    assert.ok(buildScript.includes(`"${publicArtifact}"`));
  }
});

test("publishes machine-readable security and project context", async () => {
  const [securityText, llmsText, humansText] = await Promise.all([
    readProjectFile(".well-known/security.txt"),
    readProjectFile("llms.txt"),
    readProjectFile("humans.txt"),
  ]);

  assert.match(securityText, /^Contact: https:\/\/github\.com\/mralexgarrido\/dmsi\/security\/advisories\/new/m);
  assert.match(securityText, /^Canonical: https:\/\/mralexgarrido\.github\.io\/dmsi\/\.well-known\/security\.txt/m);
  assert.match(llmsText, /Scoring and interpretation/);
  assert.match(llmsText, /DMSI is an educational self-reflection tool/);
  assert.match(humansText, /Creator: Alex Garrido/);
});
