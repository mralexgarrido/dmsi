import test from "node:test";
import assert from "node:assert/strict";
import { RANK_LABELS, getRankProgress } from "../js/rank-progress.js";

test("presents the intended green-to-red ranking language", () => {
  assert.deepEqual(
    RANK_LABELS.map(({ badge }) => badge),
    ["Most like me", "More like me", "Less like me", "Least like me"],
  );
});

test("starts with four choices remaining and the top rank active", () => {
  const progress = getRankProgress(0);

  assert.equal(progress.currentRank, 1);
  assert.equal(progress.currentLabel, "Choose now: Most like me");
  assert.equal(progress.remaining, 4);
  assert.equal(progress.remainingLabel, "4 choices remaining");
  assert.equal(progress.isComplete, false);
  assert.deepEqual(
    progress.steps.map(({ state }) => state),
    ["current", "upcoming", "upcoming", "upcoming"],
  );
});

test("shows two choices remaining after the first two ranks", () => {
  const progress = getRankProgress(2);

  assert.equal(progress.currentRank, 3);
  assert.equal(progress.currentLabel, "Choose now: Less like me");
  assert.equal(progress.remainingLabel, "2 choices remaining");
  assert.deepEqual(
    progress.steps.map(({ state }) => state),
    ["complete", "complete", "current", "upcoming"],
  );
});

test("marks the ranking ready to continue after four choices", () => {
  const progress = getRankProgress(4);

  assert.equal(progress.currentRank, null);
  assert.equal(progress.currentLabel, "All choices ranked");
  assert.equal(progress.remaining, 0);
  assert.equal(progress.remainingLabel, "Ready to continue");
  assert.equal(progress.isComplete, true);
  assert.deepEqual(
    progress.steps.map(({ state }) => state),
    ["complete", "complete", "complete", "complete"],
  );
});

test("rejects impossible selection counts", () => {
  for (const selectionCount of [-1, 1.5, 5]) {
    assert.throws(() => getRankProgress(selectionCount), RangeError);
  }
});
