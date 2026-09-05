import { blendProfiles, styleProfiles } from "./questions.js";
import { STYLE_KEYS, calculateScores, getBlendKey, isValidAssessment, rankStyles } from "./scoring.js";

// Coaching prompts, not new measured personality types. Preserve all six tied-pair profiles.
export const directionalBlends = {
  "directive|analytical": {
    title: "The evidence-aware driver",
    description: "Your scores put action first, supported by careful evaluation. You may find it useful to set a decision deadline and name the evidence that could genuinely change your mind. Before closing, ask whether the analysis tested the preferred answer or only justified it.",
  },
  "analytical|directive": {
    title: "The action-minded analyst",
    description: "Your scores put evaluation first, supported by a practical push toward action. Define enough evidence before beginning the search, then turn the conclusion into an owner and a next step. A useful stretch is to distinguish a necessary check from another round of reassurance.",
  },
  "directive|conceptual": {
    title: "The possibility-driven executor",
    description: "Your scores put forward motion first, with imagination supporting the direction. Choose the opportunity worth pursuing, then test one assumption before accelerating. Leave a deliberate opening for an alternative that might change the plan, not just decorate it.",
  },
  "conceptual|directive": {
    title: "The action-oriented visionary",
    description: "Your scores put possibilities first, with action helping bring them into the world. Keep the central idea clear, choose a small deliverable, and set a point when exploration becomes commitment. The stretch is to finish a useful version before the next possibility takes over.",
  },
  "directive|behavioral": {
    title: "The people-aware driver",
    description: "Your scores put decisiveness first, supported by attention to people. Explain both the decision and why it matters, then invite concerns before asking for commitment. Check that agreement is genuine rather than a quick response to your momentum.",
  },
  "behavioral|directive": {
    title: "The decisive facilitator",
    description: "Your scores put people and participation first, with action helping the group move forward. Invite the important voices, name the unresolved disagreement, and clarify who will make the call. The stretch is to make room for dissent without requiring unanimous approval.",
  },
  "analytical|conceptual": {
    title: "The possibility-testing strategist",
    description: "Your scores put evidence and evaluation first, with imagination expanding what you consider. Protect a little time to generate possibilities before evaluating them. An early idea does not need a complete business case to deserve exploration. Then select the assumption most worth testing.",
  },
  "conceptual|analytical": {
    title: "The evidence-seeking innovator",
    description: "Your scores put imagination first, with analysis helping test the possibilities. Define evaluation criteria before becoming attached to a favorite idea. Use the evidence to challenge the vision, not only to defend it, and choose a concrete experiment that could prove useful either way.",
  },
  "analytical|behavioral": {
    title: "The people-aware analyst",
    description: "Your scores put careful reasoning first, supported by attention to people. Translate the evidence into its practical human consequences and invite questions about what the data may miss. Understanding the analysis and agreeing with the decision are different conversations.",
  },
  "behavioral|analytical": {
    title: "The evidence-grounded collaborator",
    description: "Your scores put relationships and participation first, with evidence supporting the conversation. Agree on criteria before negotiating a preferred answer. Use those criteria to surface a respectful disagreement, especially when a comfortable compromise would leave the real problem unresolved.",
  },
  "conceptual|behavioral": {
    title: "The people-centered explorer",
    description: "Your scores put new possibilities first, with attention to people shaping the idea. Ask whose experience the concept improves, then test that assumption with someone affected. The stretch is to let concrete feedback narrow the vision without treating constraints as a loss of creativity.",
  },
  "behavioral|conceptual": {
    title: "The possibility-minded collaborator",
    description: "Your scores put people first, with imagination helping find a way forward. Make the underlying need explicit before generating solutions together. Consider whether a fresh approach serves that need better than the option everyone already finds comfortable.",
  },
};

export function labelStyles(keys) {
  return keys.map((key) => styleProfiles[key].label).join(" + ");
}

function balancedItems(keys, field, perStyle) {
  // Round-robin selection gives every tied style equal representation.
  const items = [];
  for (let i = 0; i < perStyle; i += 1) {
    for (const key of keys) {
      const text = styleProfiles[key][field][i];
      if (text) items.push(keys.length > 1 ? `${styleProfiles[key].label}: ${text}` : text);
    }
  }
  return items;
}

export function interpretScores(scores) {
  if (!scores || STYLE_KEYS.some((key) => !Number.isInteger(scores[key]) || scores[key] < 20 || scores[key] > 160) ||
      STYLE_KEYS.reduce((sum, key) => sum + scores[key], 0) !== 300) {
    throw new TypeError("Interpretation requires four valid scores totaling 300.");
  }
  const rankedStyles = rankStyles(scores);
  const leadingStyleKeys = rankedStyles.filter(({ score }) => score === rankedStyles[0].score).map(({ key }) => key);
  const secondaryKeys = leadingStyleKeys.length === 1
    ? rankedStyles.filter(({ score }) => score === rankedStyles[1].score).map(({ key }) => key)
    : [];
  const lowestKeys = rankedStyles.filter(({ score }) => score === rankedStyles.at(-1).score).map(({ key }) => key);
  const leadingLabel = labelStyles(leadingStyleKeys);
  const primaryKey = leadingStyleKeys[0];
  const primary = styleProfiles[primaryKey];
  const gap = leadingStyleKeys.length === 1 ? rankedStyles[0].score - rankedStyles[1].score : 0;
  const gapText = leadingStyleKeys.length === 1
    ? `${primary.label} leads ${labelStyles(secondaryKeys)} by ${gap} ${gap === 1 ? "point" : "points"}. This is a score difference within your responses, not a confidence rating or population percentile.`
    : `${leadingStyleKeys.length} styles share the highest score of ${rankedStyles[0].score}. No single leading style is assigned. Equal scores do not, by themselves, demonstrate adaptability.`;
  let blend;
  if (leadingStyleKeys.length === 2) {
    blend = blendProfiles[getBlendKey(...leadingStyleKeys)];
  } else if (leadingStyleKeys.length > 2) {
    blend = {
      title: "A shared preference pattern",
      description: `Your leading scores are shared by ${leadingLabel}. Explore when each perspective shows up in your work rather than choosing a single label. For the next decision, say whether you are exploring options, evaluating evidence, considering people, or committing to action.`,
    };
  } else if (secondaryKeys.length > 1) {
    blend = {
      title: `${primary.label} with shared supporting preferences`,
      description: `${primary.label} has the highest score, while ${labelStyles(secondaryKeys)} share second place. None of those supporting styles outranks the others. Ask which perspective the particular decision needs rather than assigning an arbitrary secondary label.`,
    };
  } else {
    blend = directionalBlends[`${primaryKey}|${secondaryKeys[0]}`];
  }
  return {
    scores: { ...scores }, rankedStyles, leadingStyleKeys, secondaryKeys, lowestKeys, gap, gapText,
    primaryLine: `${leadingStyleKeys.length === 1 ? "Primary style" : "Shared primary styles"}: ${leadingLabel}`,
    secondaryLine: secondaryKeys.length ? `${secondaryKeys.length === 1 ? "Secondary style" : "Shared secondary styles"}: ${labelStyles(secondaryKeys)}` : "",
    title: leadingStyleKeys.length === 1 ? `Your primary style is ${primary.label}.` : `Your profile blends ${leadingLabel}.`,
    lede: leadingStyleKeys.length === 1
      ? `${primary.tagline} Your scores describe relative preferences in this assessment, not limits on how you can decide.`
      : "These preferences share your highest score. Use the circumstances of a real decision to explore which perspective would help.",
    profileLabel: leadingStyleKeys.length === 1 ? "Primary style" : "Shared primary styles",
    profileName: leadingLabel,
    tagline: leadingStyleKeys.map((key) => styleProfiles[key].tagline).join(" "),
    description: leadingStyleKeys.length === 1 ? primary.description : "Your response pattern gives these styles equal standing. The contributions and watch-outs below represent each one; consider which descriptions fit your experience.",
    strengths: balancedItems(leadingStyleKeys, "strengths", leadingStyleKeys.length === 1 ? 3 : 2),
    watchouts: balancedItems(leadingStyleKeys, "watchouts", 2),
    stretches: leadingStyleKeys.map((key) => styleProfiles[key].stretch),
    blend,
    counterweightName: lowestKeys.length === STYLE_KEYS.length ? "No single low style" : labelStyles(lowestKeys),
    counterweightCopy: lowestKeys.length === STYLE_KEYS.length
      ? "All four scores are equal. Ask which perspective this decision needs rather than treating one style as a deficit."
      : `${lowestKeys.length > 1 ? "These styles share your lowest score. " : ""}A lower score indicates less emphasis in this response pattern, not a lack of ability. ${lowestKeys.map((key) => `${styleProfiles[key].label}: ${styleProfiles[key].counterweight}`).join(" ")}`,
  };
}

export function getResultData(responses) {
  if (!isValidAssessment(responses)) throw new TypeError("A complete assessment is required to interpret or export results.");
  return interpretScores(calculateScores(responses));
}
