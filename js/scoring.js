export const RANK_SCORES = [8, 4, 2, 1];
export const STYLE_KEYS = ["directive", "analytical", "conceptual", "behavioral"];
export const EXPECTED_QUESTION_COUNT = 20;
export const MIN_STYLE_SCORE = EXPECTED_QUESTION_COUNT;
export const MAX_STYLE_SCORE = EXPECTED_QUESTION_COUNT * RANK_SCORES[0];
export const TOTAL_ASSESSMENT_SCORE =
  EXPECTED_QUESTION_COUNT * RANK_SCORES.reduce((sum, score) => sum + score, 0);

export function isCompleteResponse(response) {
  if (!Array.isArray(response) || response.length !== STYLE_KEYS.length) {
    return false;
  }

  const uniqueValues = new Set(response);
  return (
    uniqueValues.size === STYLE_KEYS.length &&
    response.every(
      (optionIndex) => Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < STYLE_KEYS.length,
    )
  );
}

export function isValidAssessment(responses) {
  return (
    Array.isArray(responses) &&
    responses.length === EXPECTED_QUESTION_COUNT &&
    responses.every(isCompleteResponse)
  );
}

export function calculateScores(responses) {
  if (!isValidAssessment(responses)) {
    throw new TypeError("A complete assessment must contain 20 valid response rankings.");
  }

  const scores = Object.fromEntries(STYLE_KEYS.map((styleKey) => [styleKey, 0]));

  for (const response of responses) {
    response.forEach((optionIndex, rankIndex) => {
      const styleKey = STYLE_KEYS[optionIndex];
      scores[styleKey] += RANK_SCORES[rankIndex];
    });
  }

  return scores;
}

export function rankStyles(scores) {
  return STYLE_KEYS.map((styleKey, originalIndex) => ({
    key: styleKey,
    score: scores[styleKey],
    originalIndex,
  }))
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map(({ key, score }) => ({ key, score }));
}

export function getLeadingStyleKeys(scores) {
  const ranked = rankStyles(scores);
  const highScore = ranked[0].score;
  return ranked.filter(({ score }) => score === highScore).map(({ key }) => key);
}

export function getLowestStyleKey(scores) {
  return rankStyles(scores).at(-1).key;
}

export function getBlendKey(firstStyleKey, secondStyleKey) {
  return [firstStyleKey, secondStyleKey].sort().join("|");
}

export function sumScores(scores) {
  return STYLE_KEYS.reduce((total, styleKey) => total + scores[styleKey], 0);
}
