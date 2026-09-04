import test from "node:test";
import assert from "node:assert/strict";

import { blendProfiles, questions, styleOrder, styleProfiles } from "../js/questions.js";
import { STYLE_KEYS, getBlendKey } from "../js/scoring.js";

test("keeps the assessment at 20 prompts with four distinct responses each", () => {
  assert.equal(questions.length, 20);

  questions.forEach((question, index) => {
    assert.equal(typeof question.prompt, "string", `Question ${index + 1} needs a prompt.`);
    assert.ok(question.prompt.trim().length > 0, `Question ${index + 1} has an empty prompt.`);
    assert.equal(question.options.length, 4, `Question ${index + 1} must have four options.`);
    assert.equal(new Set(question.options).size, 4, `Question ${index + 1} has duplicate options.`);
  });
});

test("keeps content order synchronized with scoring order", () => {
  assert.deepEqual(styleOrder, STYLE_KEYS);
});

test("provides complete interpretation content for every style", () => {
  STYLE_KEYS.forEach((styleKey) => {
    const profile = styleProfiles[styleKey];
    assert.ok(profile, `${styleKey} needs a profile.`);
    assert.ok(profile.label);
    assert.ok(profile.tagline);
    assert.ok(profile.description);
    assert.equal(profile.strengths.length, 3);
    assert.equal(profile.watchouts.length, 2);
    assert.ok(profile.stretch);
    assert.ok(profile.teamNeed);
    assert.ok(profile.counterweight);
  });
});

test("covers every possible two-style profile combination", () => {
  const expectedBlendKeys = [];

  STYLE_KEYS.forEach((firstKey, firstIndex) => {
    STYLE_KEYS.slice(firstIndex + 1).forEach((secondKey) => {
      expectedBlendKeys.push(getBlendKey(firstKey, secondKey));
    });
  });

  assert.deepEqual(Object.keys(blendProfiles).sort(), expectedBlendKeys.sort());
  Object.values(blendProfiles).forEach((blend) => {
    assert.ok(blend.title);
    assert.ok(blend.description);
  });
});
