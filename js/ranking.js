import { STYLE_KEYS } from "./scoring.js";

function validateRanking(response) {
  if (!Array.isArray(response) || response.length > STYLE_KEYS.length ||
      new Set(response).size !== response.length ||
      response.some((value) => !Number.isInteger(value) || value < 0 || value >= STYLE_KEYS.length)) {
    throw new TypeError("Rankings must contain distinct option indexes from 0 to 3.");
  }
}

/** Adds one explicit choice. The fourth rank is implied after three choices. */
export function selectRank(response, optionIndex) {
  validateRanking(response);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= STYLE_KEYS.length) {
    throw new RangeError("Option index must be from 0 to 3.");
  }
  if (response.includes(optionIndex)) return [...response];
  const next = [...response, optionIndex];
  if (next.length === STYLE_KEYS.length - 1) {
    next.push(STYLE_KEYS.findIndex((_, index) => !next.includes(index)));
  }
  return next;
}

/** Exchanges two assigned ranks without shifting any other statement. */
export function swapRank(response, optionIndex, targetRank) {
  validateRanking(response);
  const sourceRank = response.indexOf(optionIndex);
  if (sourceRank < 0 || !Number.isInteger(targetRank) || targetRank < 0 || targetRank >= response.length) {
    throw new RangeError("Only already-assigned ranks can be exchanged.");
  }
  const next = [...response];
  [next[sourceRank], next[targetRank]] = [next[targetRank], next[sourceRank]];
  return next;
}

/** Resume-safe fallback when this visit has no undo snapshots. */
export function undoRanking(response) {
  validateRanking(response);
  return response.slice(0, response.length === STYLE_KEYS.length ? 2 : Math.max(0, response.length - 1));
}
