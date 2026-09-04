import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDetailedResultsExport,
  buildResultsSummary,
  formatFileDate,
} from "../js/export.js";
import { questions } from "../js/questions.js";

const completeResponses = Array.from({ length: questions.length }, () => [0, 1, 2, 3]);

test("builds a concise shareable summary from a complete assessment", () => {
  const summary = buildResultsSummary(completeResponses);

  assert.match(summary, /Primary style: Directive/);
  assert.match(summary, /Directive: 160 \/ 160/);
  assert.match(summary, /Total: 300 \/ 300/);
  assert.match(summary, /Results describe preferences for reflection and discussion/);
});

test("exports all scores and every ranked response in a readable text report", () => {
  const exportDate = new Date(2026, 8, 4, 12, 0, 0);
  const report = buildDetailedResultsExport(completeResponses, exportDate);

  assert.match(report, /Generated: September 4, 2026/);
  assert.match(report, /RANKED RESPONSES/);
  assert.match(report, /\(Behavioral, 1 point\)/);
  assert.doesNotMatch(report, /\b1 points\b/);
  assert.equal((report.match(/\n   [1-4]\. /g) ?? []).length, questions.length * 4);

  questions.forEach((question, index) => {
    assert.ok(report.includes(`${index + 1}. ${question.prompt}`));
  });
});

test("refuses to export an incomplete assessment", () => {
  const incompleteResponses = completeResponses.map((response) => [...response]);
  incompleteResponses[0] = [0, 1, 2];

  assert.throws(
    () => buildDetailedResultsExport(incompleteResponses),
    /complete assessment is required/i,
  );
});

test("formats stable, filesystem-safe export dates", () => {
  assert.equal(formatFileDate(new Date(2026, 8, 4, 12, 0, 0)), "2026-09-04");
});
