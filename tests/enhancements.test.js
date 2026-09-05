import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectRank, swapRank, undoRanking } from "../js/ranking.js";
import { calculateScores, isCompleteResponse, STYLE_KEYS } from "../js/scoring.js";
import { directionalBlends, getResultData, interpretScores } from "../js/interpretation.js";
import { assessmentSignature, buildPlaybookText, createPlaybook, PLAYBOOK_FIELDS, PLAYBOOK_LIMIT, sanitizePlaybook } from "../js/playbook.js";
import { buildDetailedResultsExport, buildResultsSummary } from "../js/export.js";

const repeated = (order) => Array.from({ length: 20 }, () => [...order]);
const rotations = Array.from({ length: 20 }, (_, q) => [0, 1, 2, 3].map((n) => (n + q) % 4));
const permutations = (values) => values.length ? values.flatMap((v, i) => permutations(values.filter((_, j) => j !== i)).map((rest) => [v, ...rest])) : [[]];

test("all 24 orders need only three selections and retain exactly the original ranking", () => {
  for (const order of permutations([0, 1, 2, 3])) {
    const response = order.slice(0, 3).reduce(selectRank, []);
    assert.deepEqual(response, order);
    assert.equal(isCompleteResponse(response), true);
    assert.deepEqual(calculateScores(repeated(response)), calculateScores(repeated(order)));
  }
});

test("selection does not mutate input, remove existing ranks, or reject a legacy three-rank draft", () => {
  const old = [0, 1];
  assert.deepEqual(selectRank(old, 2), [0, 1, 2, 3]);
  assert.deepEqual(old, [0, 1]);
  assert.deepEqual(selectRank(old, 0), old);
  assert.deepEqual(selectRank([3, 2, 1], 0), [3, 2, 1, 0]);
});

test("swapping each pair changes only those two ranks", () => {
  for (const response of permutations([0, 1, 2, 3])) {
    for (let from = 0; from < 4; from++) for (let to = 0; to < 4; to++) {
      const next = swapRank(response, response[from], to);
      assert.equal(next[to], response[from]);
      assert.equal(next[from], response[to]);
      response.forEach((v, i) => { if (i !== from && i !== to) assert.equal(next[i], v); });
      assert.equal(isCompleteResponse(next), true);
    }
  }
});

test("undo removes the implied last rank together with the third explicit selection", () => {
  assert.deepEqual(undoRanking([2, 0, 1, 3]), [2, 0]);
  assert.deepEqual(undoRanking([2]), []);
  assert.deepEqual(undoRanking([]), []);
});

test("invalid or duplicate rankings and swaps into unassigned ranks are rejected", () => {
  for (const bad of [null, [1, 1], [-1], [4], [0.5]]) assert.throws(() => selectRank(bad, 0));
  assert.throws(() => selectRank([], 8));
  assert.throws(() => swapRank([0, 1], 0, 3));
  assert.throws(() => swapRank([0, 1], 2, 0));
});

test("all twelve directional pairs have distinct coaching interpretations", () => {
  assert.equal(Object.keys(directionalBlends).length, 12);
  assert.equal(new Set(Object.values(directionalBlends).map((item) => item.description)).size, 12);
  for (const first of STYLE_KEYS) for (const second of STYLE_KEYS) {
    if (first === second) continue;
    const rest = STYLE_KEYS.filter((key) => key !== first && key !== second);
    const result = interpretScores({ [first]: 120, [second]: 90, [rest[0]]: 60, [rest[1]]: 30 });
    assert.deepEqual(result.blend, directionalBlends[`${first}|${second}`]);
    assert.deepEqual(result.leadingStyleKeys, [first]);
    assert.deepEqual(result.secondaryKeys, [second]);
  }
});

test("a one-point lead is described as a score gap, not invented statistical confidence", () => {
  const result = interpretScores({ directive: 100, analytical: 99, conceptual: 60, behavioral: 41 });
  assert.equal(result.gap, 1);
  assert.match(result.gapText, /by 1 point\./);
  assert.match(result.gapText, /not a confidence rating/);
});

test("secondary and lowest-score ties retain all three styles", () => {
  const result = interpretScores({ directive: 120, analytical: 60, conceptual: 60, behavioral: 60 });
  assert.deepEqual(result.secondaryKeys, ["analytical", "conceptual", "behavioral"]);
  assert.deepEqual(result.lowestKeys, result.secondaryKeys);
  assert.match(result.secondaryLine, /^Shared secondary styles:/);
  assert.match(result.blend.title, /shared supporting preferences/);
  assert.match(result.counterweightName, /Analytical \+ Conceptual \+ Behavioral/);
});

test("a two-way leading tie has no invented secondary winner and represents both counterweights", () => {
  const result = interpretScores({ directive: 100, analytical: 100, conceptual: 50, behavioral: 50 });
  assert.equal(result.secondaryLine, "");
  assert.deepEqual(result.secondaryKeys, []);
  assert.deepEqual(result.lowestKeys, ["conceptual", "behavioral"]);
  assert.match(result.counterweightName, /Conceptual \+ Behavioral/);
  assert.equal(result.strengths.filter((text) => text.startsWith("Directive:")).length, 2);
  assert.equal(result.strengths.filter((text) => text.startsWith("Analytical:")).length, 2);
});

test("three- and four-way leading ties give every leading style equal representation", () => {
  for (const scores of [{ directive: 90, analytical: 90, conceptual: 90, behavioral: 30 }, { directive: 75, analytical: 75, conceptual: 75, behavioral: 75 }]) {
    const result = interpretScores(scores);
    for (const key of result.leadingStyleKeys) {
      const label = key[0].toUpperCase() + key.slice(1);
      assert.equal(result.strengths.filter((text) => text.startsWith(`${label}:`)).length, 2);
      assert.equal(result.watchouts.filter((text) => text.startsWith(`${label}:`)).length, 2);
    }
    assert.equal(result.secondaryLine, "");
    assert.doesNotMatch(result.blend.description, /make you highly adaptive/);
    assert.match(result.gapText, /do not, by themselves, demonstrate adaptability/);
  }
});

test("fully balanced scoring, summary, and report agree on all four leading styles", () => {
  const result = getResultData(rotations);
  assert.equal(result.leadingStyleKeys.length, 4);
  assert.equal(result.counterweightName, "No single low style");
  const summary = buildResultsSummary(rotations);
  const report = buildDetailedResultsExport(rotations);
  for (const text of [summary, report]) {
    assert.ok(text.includes(result.primaryLine));
    assert.ok(text.includes(result.blend.title));
    assert.doesNotMatch(text, /Secondary style:/);
    assert.match(text, /Behavioral: Creates trust/);
  }
});

test("invalid scores and incomplete assessments cannot produce an interpretation", () => {
  assert.throws(() => interpretScores({ directive: 75, analytical: 75, conceptual: 75, behavioral: 76 }));
  assert.throws(() => interpretScores(null));
  assert.throws(() => getResultData([]), /complete assessment/);
});

test("workplace and classroom playbook drafts are explicit starting suggestions", () => {
  const responses = repeated([1, 2, 0, 3]);
  const work = createPlaybook(responses);
  const classroom = createPlaybook(responses, "class");
  assert.equal(work.edited, false);
  assert.equal(work.signature, assessmentSignature(responses));
  assert.match(work.fields.practice, /information that could change/);
  assert.match(classroom.fields.commitment, /next group assignment/);
  assert.match(classroom.fields.needs, /submission date/);
  for (const { key } of PLAYBOOK_FIELDS) assert.ok(work.fields[key].length <= PLAYBOOK_LIMIT);
  assert.match(buildPlaybookText(work), /Suggested starting draft/);
});

test("tied playbooks include all leading styles without changing assessment responses", () => {
  const before = JSON.stringify(rotations);
  const playbook = createPlaybook(rotations, "class");
  assert.match(playbook.fields.contribution, /priorities/);
  assert.match(playbook.fields.contribution, /evidence/);
  assert.match(playbook.fields.contribution, /alternatives/);
  assert.match(playbook.fields.contribution, /people/);
  assert.equal(JSON.stringify(rotations), before);
  for (const { key } of PLAYBOOK_FIELDS) assert.ok(playbook.fields[key].length <= PLAYBOOK_LIMIT);
});

test("saved playbooks are schema-checked, bounded, and restricted to known fields", () => {
  assert.equal(sanitizePlaybook(null), null);
  assert.equal(sanitizePlaybook({ version: 2, fields: {} }), null);
  const result = sanitizePlaybook({ version: 1, signature: "x".repeat(400), edited: "yes", context: "other", fields: { contribution: "x".repeat(2000), needs: 42, unexpected: "ignore" } });
  assert.equal(result.fields.contribution.length, PLAYBOOK_LIMIT);
  assert.equal(result.signature.length, 200);
  assert.equal(result.fields.needs, "");
  assert.equal(result.fields.unexpected, undefined);
  assert.equal(result.edited, false);
  assert.equal(result.context, "work");
});

test("the full export includes edited wording and all 80 original ranked responses", () => {
  const responses = repeated([0, 1, 2, 3]);
  const playbook = createPlaybook(responses);
  playbook.fields.contribution = "I ask one useful question before we decide.";
  playbook.edited = true;
  const report = buildDetailedResultsExport(responses, new Date(2026, 8, 4), playbook);
  assert.match(report, /Participant-edited wording/);
  assert.match(report, /I ask one useful question/);
  assert.equal((report.match(/\n   [1-4]\. /g) ?? []).length, 80);
  assert.match(report, /Total: 300 \/ 300/);
});

test("new interface has semantic review, modal, storage and playbook controls without external requests", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../js/playbook-view.js", import.meta.url), "utf8");
  assert.match(html, /<dialog[^>]*aria-labelledby="rank-editor-title"/);
  assert.match(html, /data-view="review"/);
  assert.match(html, /data-storage-status role="status"/);
  assert.match(html, /data-action="review-results" disabled/);
  assert.match(html, /data-playbook-status role="status"/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML/);
});
