import { questions, styleProfiles } from "./questions.js";
import {
  MAX_STYLE_SCORE,
  RANK_SCORES,
  STYLE_KEYS,
  TOTAL_ASSESSMENT_SCORE,
  sumScores,
} from "./scoring.js";

import { getResultData } from "./interpretation.js";
import { buildPlaybookText } from "./playbook.js";

const SITE_URL = "https://mralexgarrido.github.io/dmsi/";

export function buildResultsSummary(responses) {
  const result = getResultData(responses);
  const scoreLines = result.rankedStyles.map(
    ({ key, score }) => `- ${styleProfiles[key].label}: ${score} / ${MAX_STYLE_SCORE}`,
  );

  return [
    "DECISION-MAKING STYLE INVENTORY",
    result.primaryLine,
    ...(result.secondaryLine ? [result.secondaryLine] : []),
    "",
    result.gapText,
    "",
    "Scores",
    ...scoreLines,
    `Total: ${sumScores(result.scores)} / ${TOTAL_ASSESSMENT_SCORE}`,
    "",
    "What I tend to contribute",
    ...result.strengths.map((strength) => `- ${strength}`),
    "",
    `Profile combination: ${result.blend.title}`,
    result.blend.description,
    "",
    `Stretch questions: ${result.stretches.join(" Then ask: ")}`,
    "",
    "Results describe preferences for reflection and discussion. They are not a psychological diagnosis.",
    SITE_URL,
  ].join("\n");
}

export function buildDetailedResultsExport(responses, exportDate = new Date(), playbook = null) {
  const result = getResultData(responses);
  const { strengths, watchouts, stretches: stretchQuestions } = result;
  const responseLines = questions.flatMap((question, questionIndex) => {
    const rankings = responses[questionIndex].map((optionIndex, rankIndex) => {
      const styleKey = STYLE_KEYS[optionIndex];
      const score = RANK_SCORES[rankIndex];
      const pointLabel = score === 1 ? "point" : "points";
      return `   ${rankIndex + 1}. ${question.options[optionIndex]} (${styleProfiles[styleKey].label}, ${score} ${pointLabel})`;
    });

    return [`${questionIndex + 1}. ${question.prompt}`, ...rankings, ""];
  });
  const scoreLines = result.rankedStyles.map(
    ({ key, score }) => `- ${styleProfiles[key].label}: ${score} / ${MAX_STYLE_SCORE}`,
  );
  const counterweightLines = [result.counterweightName, result.counterweightCopy];

  return [
    "DECISION-MAKING STYLE INVENTORY",
    `Generated: ${formatDisplayDate(exportDate)}`,
    "",
    "PROFILE",
    result.primaryLine,
    ...(result.secondaryLine ? [result.secondaryLine] : []),
    "",
    result.gapText,
    "",
    "Scores",
    ...scoreLines,
    `Total: ${sumScores(result.scores)} / ${TOTAL_ASSESSMENT_SCORE}`,
    "",
    "What I tend to contribute",
    ...strengths.map((strength) => `- ${strength}`),
    "",
    "What I should watch",
    ...watchouts.map((watchout) => `- ${watchout}`),
    "",
    `Profile combination: ${result.blend.title}`,
    result.blend.description,
    "",
    "Stretch questions",
    ...stretchQuestions.map((question) => `- ${question}`),
    "",
    "Useful counterweight",
    ...counterweightLines,
    "",
    ...(playbook ? [buildPlaybookText(playbook), ""] : []),
    "RANKED RESPONSES",
    "Responses are listed from most like me to least like me.",
    "",
    ...responseLines,
    "Results describe preferences for reflection and discussion. They are not a psychological diagnosis.",
    SITE_URL,
  ].join("\n");
}

export function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatFileDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

