import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_STYLE_SCORE,
  MIN_STYLE_SCORE,
  TOTAL_ASSESSMENT_SCORE,
  calculateScores,
  getBlendKey,
  getLeadingStyleKeys,
  isCompleteResponse,
  isValidAssessment,
  rankStyles,
  sumScores,
} from "../js/scoring.js";

function repeatRanking(ranking) {
  return Array.from({ length: 20 }, () => [...ranking]);
}

test("recognizes a complete four-option ranking", () => {
  assert.equal(isCompleteResponse([0, 1, 2, 3]), true);
  assert.equal(isCompleteResponse([0, 1, 1, 3]), false);
  assert.equal(isCompleteResponse([0, 1, 2]), false);
  assert.equal(isCompleteResponse([0, 1, 2, 4]), false);
});

test("validates exactly 20 complete responses", () => {
  assert.equal(isValidAssessment(repeatRanking([0, 1, 2, 3])), true);
  assert.equal(isValidAssessment(repeatRanking([0, 1, 2, 3]).slice(0, 19)), false);
});

test("awards 8, 4, 2, and 1 points according to rank", () => {
  const scores = calculateScores(repeatRanking([0, 1, 2, 3]));

  assert.deepEqual(scores, {
    directive: MAX_STYLE_SCORE,
    analytical: 80,
    conceptual: 40,
    behavioral: MIN_STYLE_SCORE,
  });
  assert.equal(sumScores(scores), TOTAL_ASSESSMENT_SCORE);
});

test("preserves style mapping when ranking order is reversed", () => {
  const scores = calculateScores(repeatRanking([3, 2, 1, 0]));

  assert.deepEqual(scores, {
    directive: MIN_STYLE_SCORE,
    analytical: 40,
    conceptual: 80,
    behavioral: MAX_STYLE_SCORE,
  });
});

test("identifies balanced ties and uses stable ranking order", () => {
  const cycle = [
    [0, 1, 2, 3],
    [1, 2, 3, 0],
    [2, 3, 0, 1],
    [3, 0, 1, 2],
  ];
  const responses = Array.from({ length: 5 }, () => cycle).flat().map((ranking) => [...ranking]);
  const scores = calculateScores(responses);

  assert.deepEqual(scores, {
    directive: 75,
    analytical: 75,
    conceptual: 75,
    behavioral: 75,
  });
  assert.deepEqual(getLeadingStyleKeys(scores), [
    "directive",
    "analytical",
    "conceptual",
    "behavioral",
  ]);
  assert.deepEqual(
    rankStyles(scores).map(({ key }) => key),
    ["directive", "analytical", "conceptual", "behavioral"],
  );
});

test("creates a consistent key for two-style blend content", () => {
  assert.equal(getBlendKey("directive", "conceptual"), "conceptual|directive");
  assert.equal(getBlendKey("conceptual", "directive"), "conceptual|directive");
});

test("rejects incomplete assessment data before scoring", () => {
  const incomplete = repeatRanking([0, 1, 2, 3]);
  incomplete[10] = [0, 1];

  assert.throws(
    () => calculateScores(incomplete),
    /complete assessment must contain 20 valid response rankings/i,
  );
});
