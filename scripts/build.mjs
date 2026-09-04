import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");
const publicFiles = [
  ".nojekyll",
  "404.html",
  "dmsiform.html",
  "index.html",
  "robots.txt",
  "sitemap.xml",
];
const publicDirectories = ["assets", "css", "js"];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(projectRoot, file), path.join(outputDirectory, file));
}

for (const directory of publicDirectories) {
  await cp(path.join(projectRoot, directory), path.join(outputDirectory, directory), {
    recursive: true,
  });
}

console.log(`Built static site in ${path.relative(projectRoot, outputDirectory)}/`);
