import { blendProfiles, questions, styleProfiles } from "./questions.js";
import {
  MAX_STYLE_SCORE,
  RANK_SCORES,
  STYLE_KEYS,
  TOTAL_ASSESSMENT_SCORE,
  calculateScores,
  getBlendKey,
  getLeadingStyleKeys,
  getLowestStyleKey,
  isValidAssessment,
  rankStyles,
  sumScores,
} from "./scoring.js";

const SITE_URL = "https://mralexgarrido.github.io/dmsi/";
const ADAPTIVE_GENERALIST = {
  title: "The adaptive generalist",
  description:
    "Your leading scores are distributed across several styles. That range can make you highly adaptive, but it can also make your decision process less visible to others. Name the style you are using at each phase so the team understands when you are exploring, evaluating, aligning, or closing.",
};

export function buildResultsSummary(responses) {
  const result = getResultData(responses);
  const scoreLines = result.rankedStyles.map(
    ({ key, score }) => `- ${styleProfiles[key].label}: ${score} / ${MAX_STYLE_SCORE}`,
  );

  return [
    "DECISION-MAKING STYLE INVENTORY",
    result.primaryLine,
    `Secondary style: ${result.secondaryProfile.label}`,
    "",
    "Scores",
    ...scoreLines,
    `Total: ${sumScores(result.scores)} / ${TOTAL_ASSESSMENT_SCORE}`,
    "",
    "What I tend to contribute",
    ...result.primaryProfile.strengths.map((strength) => `- ${strength}`),
    "",
    `Profile combination: ${result.blend.title}`,
    result.blend.description,
    "",
    `Stretch question: ${result.primaryProfile.stretch}`,
    "",
    "Results describe preferences for reflection and discussion. They are not a psychological diagnosis.",
    SITE_URL,
  ].join("\n");
}

export function buildDetailedResultsExport(responses, exportDate = new Date()) {
  const result = getResultData(responses);
  const profileKeys =
    result.leadingStyleKeys.length === 1 ? [result.primaryKey] : result.leadingStyleKeys;
  const profiles = profileKeys.map((styleKey) => styleProfiles[styleKey]);
  const strengths = profiles.flatMap(({ strengths: items }) => items);
  const watchouts = profiles.flatMap(({ watchouts: items }) => items);
  const stretchQuestions = profiles.map(({ stretch }) => stretch);
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
  const counterweightLines =
    new Set(Object.values(result.scores)).size === 1
      ? [
          "No single low style",
          "Your scores are evenly distributed. Focus on making your current decision mode explicit so teammates can follow your reasoning.",
        ]
      : [styleProfiles[result.lowestKey].label, styleProfiles[result.lowestKey].counterweight];

  return [
    "DECISION-MAKING STYLE INVENTORY",
    `Generated: ${formatDisplayDate(exportDate)}`,
    "",
    "PROFILE",
    result.primaryLine,
    `Secondary style: ${result.secondaryProfile.label}`,
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

function getResultData(responses) {
  if (!isValidAssessment(responses)) {
    throw new TypeError("A complete assessment is required to export results.");
  }

  const scores = calculateScores(responses);
  const rankedStyles = rankStyles(scores);
  const leadingStyleKeys = getLeadingStyleKeys(scores);
  const primaryKey = rankedStyles[0].key;
  const secondaryKey = rankedStyles[1].key;
  const leadingLabels = leadingStyleKeys.map((styleKey) => styleProfiles[styleKey].label);
  const primaryProfile = styleProfiles[primaryKey];

  return {
    scores,
    rankedStyles,
    leadingStyleKeys,
    primaryKey,
    primaryProfile,
    secondaryProfile: styleProfiles[secondaryKey],
    lowestKey: getLowestStyleKey(scores),
    primaryLine:
      leadingLabels.length === 1
        ? `Primary style: ${primaryProfile.label}`
        : `Shared primary styles: ${leadingLabels.join(" + ")}`,
    blend:
      leadingStyleKeys.length > 2
        ? ADAPTIVE_GENERALIST
        : blendProfiles[getBlendKey(primaryKey, secondaryKey)],
  };
}
