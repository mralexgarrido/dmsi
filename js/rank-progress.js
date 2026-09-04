import { RANK_SCORES } from "./scoring.js";

export const RANK_LABELS = Object.freeze([
  Object.freeze({
    short: "1st",
    phrase: "most like you",
    badge: "Most like me",
    icon: "★",
    prompt: "Choose your top choice. Select the statement that is most like you.",
  }),
  Object.freeze({
    short: "2nd",
    phrase: "more like you",
    badge: "More like me",
    icon: "◆",
    prompt: "Choose your second choice. Select the statement that is more like you.",
  }),
  Object.freeze({
    short: "3rd",
    phrase: "less like you",
    badge: "Less like me",
    icon: "●",
    prompt: "Choose your third choice. Select the statement that is less like you.",
  }),
  Object.freeze({
    short: "4th",
    phrase: "least like you",
    badge: "Least like me",
    icon: "▼",
    prompt: "Choose your final choice. Select the statement that is least like you.",
  }),
]);

export function getRankProgress(selectionCount) {
  if (
    !Number.isInteger(selectionCount) ||
    selectionCount < 0 ||
    selectionCount > RANK_LABELS.length
  ) {
    throw new RangeError(`selectionCount must be an integer from 0 to ${RANK_LABELS.length}.`);
  }

  const remaining = RANK_LABELS.length - selectionCount;
  const isComplete = remaining === 0;
  const current = isComplete ? null : RANK_LABELS[selectionCount];

  return {
    currentRank: isComplete ? null : selectionCount + 1,
    currentLabel: isComplete ? "All choices ranked" : `Choose now: ${current.badge}`,
    isComplete,
    remaining,
    remainingLabel: isComplete
      ? "Ready to continue"
      : `${remaining} ${remaining === 1 ? "choice" : "choices"} remaining`,
    statusMessage: isComplete
      ? "Ranking complete. Continue when you are ready."
      : current.prompt,
    steps: RANK_LABELS.map((rank, index) => {
      const state = index < selectionCount ? "complete" : index === selectionCount ? "current" : "upcoming";
      return {
        ...rank,
        rank: index + 1,
        score: RANK_SCORES[index],
        state,
        stateLabel: state === "complete" ? "Done" : state === "current" ? "Now" : "Next",
      };
    }),
  };
}
