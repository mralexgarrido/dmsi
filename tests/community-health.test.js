import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

const requiredCommunityFiles = [
  ".github/CODEOWNERS",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/dependabot.yml",
  "CHANGELOG.md",
  "CITATION.cff",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "NOTICE.md",
  "SECURITY.md",
  "SUPPORT.md",
  "docs/ACCESSIBILITY.md",
  "docs/MAINTAINER_GUIDE.md",
  "docs/PRIVACY.md",
  "docs/SCORING.md",
];

test("includes a complete, project-specific community health baseline", async () => {
  await Promise.all(requiredCommunityFiles.map((file) => access(path.join(projectRoot, file))));

  const [contributing, security, conduct, owners, dependabot] = await Promise.all([
    readProjectFile("CONTRIBUTING.md"),
    readProjectFile("SECURITY.md"),
    readProjectFile("CODE_OF_CONDUCT.md"),
    readProjectFile(".github/CODEOWNERS"),
    readProjectFile(".github/dependabot.yml"),
  ]);

  assert.match(contributing, /Project invariants/);
  assert.match(contributing, /npm run check/);
  assert.match(security, /private GitHub Security Advisory/);
  assert.match(conduct, /Expected behavior/);
  assert.match(owners, /@mralexgarrido/);
  assert.match(dependabot, /package-ecosystem: github-actions/);
});

test("keeps repository, citation, package, and structured-data versions aligned", async () => {
  const [citation, packageText, html, changelog] = await Promise.all([
    readProjectFile("CITATION.cff"),
    readProjectFile("package.json"),
    readProjectFile("index.html"),
    readProjectFile("CHANGELOG.md"),
  ]);
  const packageData = JSON.parse(packageText);
  const citationVersion = citation.match(/^version: ([^\s]+)$/m)?.[1];

  assert.equal(packageData.version, "2.1.0");
  assert.equal(citationVersion, packageData.version);
  assert.match(html, new RegExp(`"softwareVersion": "${packageData.version}"`));
  assert.match(changelog, new RegExp(`## ${packageData.version} - 2026-09-04`));
  assert.equal(packageData.license, "MIT");
  assert.equal(packageData.homepage, "https://mralexgarrido.github.io/dmsi/");
  assert.equal(packageData.repository.url, "git+https://github.com/mralexgarrido/dmsi.git");
});

test("uses structured issue forms and a substantive pull-request checklist", async () => {
  const [bugForm, featureForm, pullRequestTemplate] = await Promise.all([
    readProjectFile(".github/ISSUE_TEMPLATE/bug_report.yml"),
    readProjectFile(".github/ISSUE_TEMPLATE/feature_request.yml"),
    readProjectFile(".github/PULL_REQUEST_TEMPLATE.md"),
  ]);

  for (const form of [bugForm, featureForm]) {
    assert.match(form, /^name:/m);
    assert.match(form, /^description:/m);
    assert.match(form, /^body:/m);
    assert.match(form, /validations:/);
    assert.match(form, /required: true/);
  }

  assert.match(pullRequestTemplate, /npm run check/);
  assert.match(pullRequestTemplate, /keyboard-only interaction/);
  assert.match(pullRequestTemplate, /scoring invariants/);
  assert.match(pullRequestTemplate, /analytics, tracking, external scripts/);
});

test("resolves local links in project documentation", async () => {
  const documentationFiles = requiredCommunityFiles.filter((file) => file.endsWith(".md"));
  documentationFiles.push("README.md");

  for (const documentationFile of documentationFiles) {
    const contents = await readProjectFile(documentationFile);
    const links = [...contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(([, target]) => target);

    for (const target of links) {
      if (/^(?:https?:|mailto:|#)/.test(target)) {
        continue;
      }

      const localTarget = decodeURIComponent(target.split("#")[0].split("?")[0]);
      const resolvedTarget = path.resolve(projectRoot, path.dirname(documentationFile), localTarget);
      await assert.doesNotReject(
        access(resolvedTarget),
        `${documentationFile} links to missing local path ${target}`,
      );
    }
  }
});
