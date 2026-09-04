import { blendProfiles, questions, styleOrder, styleProfiles } from "./questions.js";
import {
  buildDetailedResultsExport,
  buildResultsSummary,
  formatDisplayDate,
  formatFileDate,
} from "./export.js";
import {
  MAX_STYLE_SCORE,
  RANK_SCORES,
  STYLE_KEYS,
  calculateScores,
  getBlendKey,
  getLeadingStyleKeys,
  getLowestStyleKey,
  isCompleteResponse,
  isValidAssessment,
  rankStyles,
} from "./scoring.js";

const STORAGE_KEY = "dmsi-assessment-v2";
const THEME_STORAGE_KEY = "dmsi-theme";
const STATE_VERSION = 2;
const RANK_LABELS = [
  { short: "1st", phrase: "most like you", badge: "Most like me" },
  { short: "2nd", phrase: "second most like you", badge: "Second" },
  { short: "3rd", phrase: "third most like you", badge: "Third" },
  { short: "4th", phrase: "least like you", badge: "Least like me" },
];

const elements = {
  views: [...document.querySelectorAll("[data-view]")],
  themeToggle: document.querySelector("[data-action='toggle-theme']"),
  themeLabel: document.querySelector("[data-theme-label]"),
  themeColor: document.querySelector("[data-theme-color]"),
  headerAction: document.querySelector("[data-action='save-exit']"),
  startButton: document.querySelector("[data-action='start']"),
  resumeNote: document.querySelector("[data-resume-note]"),
  questionCounter: document.querySelector("[data-question-counter]"),
  completionCounter: document.querySelector("[data-completion-counter]"),
  progress: document.querySelector("[data-progress]"),
  questionTitle: document.querySelector("[data-question-title]"),
  options: document.querySelector("[data-options]"),
  selectionStatus: document.querySelector("[data-selection-status]"),
  undoButton: document.querySelector("[data-action='undo']"),
  clearQuestionButton: document.querySelector("[data-action='clear-question']"),
  previousButton: document.querySelector("[data-action='previous']"),
  nextButton: document.querySelector("[data-action='next']"),
  resultTitle: document.querySelector("[data-result-title]"),
  resultLede: document.querySelector("[data-result-lede]"),
  scoreList: document.querySelector("[data-score-list]"),
  profileLabel: document.querySelector("[data-profile-label]"),
  profileName: document.querySelector("[data-profile-name]"),
  profileTagline: document.querySelector("[data-profile-tagline]"),
  profileDescription: document.querySelector("[data-profile-description]"),
  strengthList: document.querySelector("[data-strength-list]"),
  watchoutList: document.querySelector("[data-watchout-list]"),
  stretchQuestion: document.querySelector("[data-stretch-question]"),
  blendTitle: document.querySelector("[data-blend-title]"),
  blendDescription: document.querySelector("[data-blend-description]"),
  counterweightName: document.querySelector("[data-counterweight-name]"),
  counterweightCopy: document.querySelector("[data-counterweight-copy]"),
  styleGuide: document.querySelector("[data-style-guide]"),
  resultActionStatus: document.querySelector("[data-result-action-status]"),
  printDate: document.querySelector("[data-print-date]"),
};

let state = loadState();
let resultActionStatusTimer;

initialize();

function initialize() {
  bindActions();
  renderThemeControl();
  renderStyleGuide();
  renderIntroState();

  const requestedView = window.location.hash.replace("#", "");
  let initialView = "intro";

  if (requestedView === "results" && isValidAssessment(state.responses)) {
    initialView = "results";
    renderResults();
  } else if (requestedView === "assessment" && state.started) {
    initialView = "assessment";
    renderQuestion();
  }

  showView(initialView, { updateHistory: false, focus: false });
  window.history.replaceState({ view: initialView }, "", `#${initialView}`);
}

function bindActions() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.startButton.addEventListener("click", startOrResumeAssessment);
  elements.headerAction.addEventListener("click", saveAndExit);
  elements.undoButton.addEventListener("click", undoLastSelection);
  elements.clearQuestionButton.addEventListener("click", clearCurrentQuestion);
  elements.previousButton.addEventListener("click", showPreviousQuestion);
  elements.nextButton.addEventListener("click", showNextQuestion);

  document.querySelectorAll("[data-action='show-intro']").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      saveAndExit();
    });
  });

  document.querySelector("[data-action='print']").addEventListener("click", () => window.print());
  document.querySelector("[data-action='export']").addEventListener("click", exportDetailedResults);
  document.querySelector("[data-action='copy']").addEventListener("click", copyResultsSummary);
  document.querySelector("[data-action='restart']").addEventListener("click", restartAssessment);

  window.addEventListener("popstate", () => {
    const requestedView = window.location.hash.replace("#", "");
    if (requestedView === "results" && isValidAssessment(state.responses)) {
      renderResults();
      showView("results", { updateHistory: false });
      return;
    }

    if (requestedView === "assessment" && state.started) {
      renderQuestion();
      showView("assessment", { updateHistory: false });
      return;
    }

    showView("intro", { updateHistory: false });
  });
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // The visual preference still applies for the current visit.
  }

  renderThemeControl();
}

function renderThemeControl() {
  const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const nextThemeLabel = `${nextTheme[0].toUpperCase()}${nextTheme.slice(1)}`;
  const accessibleLabel = `Switch to ${nextTheme} theme`;

  elements.themeLabel.textContent = nextThemeLabel;
  elements.themeToggle.setAttribute("aria-label", accessibleLabel);
  elements.themeToggle.title = accessibleLabel;
  elements.themeColor.content = currentTheme === "dark" ? "#121416" : "#f5f2ed";
}

function createInitialState() {
  return {
    version: STATE_VERSION,
    started: false,
    completed: false,
    currentQuestion: 0,
    responses: Array.from({ length: questions.length }, () => []),
  };
}

function loadState() {
  const emptyState = createInitialState();

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return emptyState;
    }

    const parsed = JSON.parse(storedValue);
    if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.responses)) {
      return emptyState;
    }

    const responses = Array.from({ length: questions.length }, (_, questionIndex) =>
      sanitizePartialResponse(parsed.responses[questionIndex]),
    );

    return {
      version: STATE_VERSION,
      started: Boolean(parsed.started),
      completed: isValidAssessment(responses),
      currentQuestion: clampQuestionIndex(parsed.currentQuestion),
      responses,
    };
  } catch {
    return emptyState;
  }
}

function sanitizePartialResponse(response) {
  if (!Array.isArray(response)) {
    return [];
  }

  const safeResponse = [];
  for (const optionIndex of response) {
    if (
      Number.isInteger(optionIndex) &&
      optionIndex >= 0 &&
      optionIndex < STYLE_KEYS.length &&
      !safeResponse.includes(optionIndex)
    ) {
      safeResponse.push(optionIndex);
    }

    if (safeResponse.length === STYLE_KEYS.length) {
      break;
    }
  }

  return safeResponse;
}

function clampQuestionIndex(questionIndex) {
  const numericIndex = Number.isInteger(questionIndex) ? questionIndex : 0;
  return Math.min(Math.max(numericIndex, 0), questions.length - 1);
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The assessment remains functional when browser storage is unavailable.
  }
}

function clearSavedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No action is required when browser storage is unavailable.
  }
}

function renderIntroState() {
  const completedCount = countCompletedQuestions();
  const hasProgress = completedCount > 0 || state.responses.some((response) => response.length > 0);

  if (isValidAssessment(state.responses)) {
    elements.startButton.textContent = "View my results";
    elements.resumeNote.textContent = "Your completed profile is saved on this device.";
    elements.resumeNote.hidden = false;
    return;
  }

  if (hasProgress) {
    const resumeIndex = getResumeQuestionIndex();
    elements.startButton.textContent = `Resume at question ${resumeIndex + 1}`;
    elements.resumeNote.textContent = `${completedCount} of ${questions.length} questions complete. Your progress is saved on this device.`;
    elements.resumeNote.hidden = false;
    return;
  }

  elements.startButton.textContent = "Start the assessment";
  elements.resumeNote.hidden = true;
}

function startOrResumeAssessment() {
  if (isValidAssessment(state.responses)) {
    renderResults();
    showView("results");
    return;
  }

  state.started = true;
  state.completed = false;
  state.currentQuestion = getResumeQuestionIndex();
  saveState();
  renderQuestion();
  showView("assessment");
}

function getResumeQuestionIndex() {
  const currentResponse = state.responses[state.currentQuestion];
  if (currentResponse && !isCompleteResponse(currentResponse)) {
    return state.currentQuestion;
  }

  const firstIncompleteIndex = state.responses.findIndex((response) => !isCompleteResponse(response));
  return firstIncompleteIndex === -1 ? questions.length - 1 : firstIncompleteIndex;
}

function saveAndExit() {
  saveState();
  renderIntroState();
  showView("intro");
}

function showView(viewName, { updateHistory = true, focus = true } = {}) {
  elements.views.forEach((view) => {
    view.hidden = view.dataset.view !== viewName;
  });

  elements.headerAction.hidden = viewName !== "assessment";
  document.body.dataset.activeView = viewName;

  if (updateHistory) {
    window.history.pushState({ view: viewName }, "", `#${viewName}`);
  }

  if (focus) {
    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      const focusTarget =
        viewName === "assessment"
          ? elements.questionTitle
          : viewName === "results"
            ? elements.resultTitle
            : document.querySelector("#intro-title");
      focusTarget?.focus({ preventScroll: true });
    });
  }
}

function renderQuestion({ focusOptionIndex = null, focusTitle = false } = {}) {
  const question = questions[state.currentQuestion];
  const response = state.responses[state.currentQuestion];
  const completeCount = countCompletedQuestions();

  elements.questionCounter.textContent = `Question ${state.currentQuestion + 1} of ${questions.length}`;
  elements.completionCounter.textContent = `${completeCount} complete`;
  elements.progress.value = completeCount;
  elements.progress.textContent = `${completeCount} of ${questions.length} questions complete`;
  elements.questionTitle.textContent = question.prompt;
  elements.options.replaceChildren();

  question.options.forEach((optionText, optionIndex) => {
    const rankIndex = response.indexOf(optionIndex);
    const isRanked = rankIndex !== -1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-button${isRanked ? " is-ranked" : ""}`;
    button.dataset.optionIndex = String(optionIndex);
    button.setAttribute("aria-pressed", String(isRanked));

    if (isRanked) {
      button.dataset.rank = String(rankIndex + 1);
      button.setAttribute(
        "aria-label",
        `${optionText}. Ranked ${RANK_LABELS[rankIndex].phrase}, ${RANK_SCORES[rankIndex]} points. Select to remove this ranking.`,
      );
    } else {
      const nextRankIndex = Math.min(response.length, RANK_LABELS.length - 1);
      button.setAttribute(
        "aria-label",
        `${optionText}. Select as ${RANK_LABELS[nextRankIndex].phrase}, ${RANK_SCORES[nextRankIndex]} points.`,
      );
    }

    const copy = document.createElement("span");
    copy.className = "option-copy";
    copy.textContent = optionText;

    const badge = document.createElement("span");
    badge.className = "rank-badge";
    badge.setAttribute("aria-hidden", "true");

    if (isRanked) {
      const badgeLabel = document.createElement("span");
      badgeLabel.textContent = `${RANK_LABELS[rankIndex].short} · ${RANK_LABELS[rankIndex].badge}`;
      const badgeScore = document.createElement("strong");
      badgeScore.textContent = `${RANK_SCORES[rankIndex]} pts`;
      badge.append(badgeLabel, badgeScore);
    } else {
      const badgeLabel = document.createElement("span");
      badgeLabel.textContent = "Select";
      const badgeScore = document.createElement("strong");
      badgeScore.textContent = `${RANK_SCORES[Math.min(response.length, 3)]} pts`;
      badge.append(badgeLabel, badgeScore);
    }

    button.append(copy, badge);
    button.addEventListener("click", () => selectOption(optionIndex));
    elements.options.append(button);
  });

  const isComplete = isCompleteResponse(response);
  if (isComplete) {
    elements.selectionStatus.textContent = "Ranking complete. Continue when you are ready.";
    elements.selectionStatus.classList.add("is-complete");
  } else {
    elements.selectionStatus.textContent = `Select the statement that is ${RANK_LABELS[response.length].phrase}.`;
    elements.selectionStatus.classList.remove("is-complete");
  }

  elements.undoButton.disabled = response.length === 0;
  elements.clearQuestionButton.disabled = response.length === 0;
  elements.previousButton.disabled = state.currentQuestion === 0;
  elements.nextButton.disabled = !isComplete;
  elements.nextButton.textContent =
    state.currentQuestion === questions.length - 1 ? "See my results" : "Continue";

  window.requestAnimationFrame(() => {
    if (focusTitle) {
      elements.questionTitle.focus({ preventScroll: true });
      return;
    }

    if (focusOptionIndex !== null) {
      elements.options
        .querySelector(`[data-option-index="${focusOptionIndex}"]`)
        ?.focus({ preventScroll: true });
    }
  });
}

function selectOption(optionIndex) {
  const response = state.responses[state.currentQuestion];
  const existingRankIndex = response.indexOf(optionIndex);

  if (existingRankIndex !== -1) {
    response.splice(existingRankIndex, 1);
  } else if (response.length < STYLE_KEYS.length) {
    response.push(optionIndex);
  }

  state.completed = false;
  saveState();
  renderQuestion({ focusOptionIndex: optionIndex });
}

function undoLastSelection() {
  const response = state.responses[state.currentQuestion];
  if (response.length === 0) {
    return;
  }

  const removedOptionIndex = response.pop();
  state.completed = false;
  saveState();
  renderQuestion({ focusOptionIndex: removedOptionIndex });
}

function clearCurrentQuestion() {
  state.responses[state.currentQuestion] = [];
  state.completed = false;
  saveState();
  renderQuestion({ focusTitle: true });
}

function showPreviousQuestion() {
  if (state.currentQuestion === 0) {
    return;
  }

  state.currentQuestion -= 1;
  saveState();
  renderQuestion({ focusTitle: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showNextQuestion() {
  if (!isCompleteResponse(state.responses[state.currentQuestion])) {
    return;
  }

  if (state.currentQuestion < questions.length - 1) {
    state.currentQuestion += 1;
    saveState();
    renderQuestion({ focusTitle: true });
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (!isValidAssessment(state.responses)) {
    state.currentQuestion = getResumeQuestionIndex();
    saveState();
    renderQuestion({ focusTitle: true });
    return;
  }

  state.completed = true;
  saveState();
  renderResults();
  showView("results");
}

function countCompletedQuestions() {
  return state.responses.filter(isCompleteResponse).length;
}

function renderResults() {
  if (!isValidAssessment(state.responses)) {
    renderIntroState();
    showView("intro");
    return;
  }

  const scores = calculateScores(state.responses);
  const rankedStyles = rankStyles(scores);
  const leadingStyleKeys = getLeadingStyleKeys(scores);
  const primaryKey = rankedStyles[0].key;
  const secondaryKey = rankedStyles[1].key;
  const lowestKey = getLowestStyleKey(scores);

  elements.printDate.textContent = `Generated ${formatDisplayDate(new Date())}`;

  renderResultHeading(scores, rankedStyles, leadingStyleKeys);
  renderScores(rankedStyles, leadingStyleKeys);
  renderProfile(leadingStyleKeys, primaryKey);
  renderBlend(leadingStyleKeys, primaryKey, secondaryKey);
  renderCounterweight(scores, lowestKey);
}

function renderResultHeading(scores, rankedStyles, leadingStyleKeys) {
  const primary = styleProfiles[rankedStyles[0].key];
  const secondary = styleProfiles[rankedStyles[1].key];

  if (leadingStyleKeys.length === 1) {
    elements.resultTitle.textContent = `Your primary style is ${primary.label}.`;
    elements.resultLede.textContent = `${primary.tagline} Your secondary preference is ${secondary.label}. Together, they show the approach you are most likely to reach for first, not a limit on how you can decide.`;
    return;
  }

  if (leadingStyleKeys.length === 2) {
    const [firstKey, secondKey] = leadingStyleKeys;
    elements.resultTitle.textContent = `Your profile blends ${styleProfiles[firstKey].label} and ${styleProfiles[secondKey].label}.`;
    elements.resultLede.textContent = `Your two highest scores are tied at ${scores[firstKey]} points. Treat both styles as active preferences and use the context of a decision to determine which one should lead.`;
    return;
  }

  elements.resultTitle.textContent = "Your profile is broadly balanced.";
  elements.resultLede.textContent = `${leadingStyleKeys.length} styles share your highest score. You may adapt your approach readily across situations, so your most useful reflection is to notice which style appears under time pressure.`;
}

function renderScores(rankedStyles, leadingStyleKeys) {
  elements.scoreList.replaceChildren();

  rankedStyles.forEach(({ key, score }) => {
    const scoreItem = document.createElement("div");
    scoreItem.className = `score-item${leadingStyleKeys.includes(key) ? " is-primary" : ""}`;

    const scoreHeading = document.createElement("div");
    scoreHeading.className = "score-item-heading";

    const name = document.createElement("strong");
    name.textContent = styleProfiles[key].label;

    const value = document.createElement("span");
    value.textContent = `${score} / ${MAX_STYLE_SCORE}`;

    const progress = document.createElement("progress");
    progress.className = "score-bar";
    progress.max = MAX_STYLE_SCORE;
    progress.value = score;
    progress.setAttribute(
      "aria-label",
      `${styleProfiles[key].label}: ${score} of ${MAX_STYLE_SCORE} points`,
    );

    scoreHeading.append(name, value);
    scoreItem.append(scoreHeading, progress);
    elements.scoreList.append(scoreItem);
  });
}

function renderProfile(leadingStyleKeys, primaryKey) {
  const profileKeys = leadingStyleKeys.length === 1 ? [primaryKey] : leadingStyleKeys;
  const profiles = profileKeys.map((styleKey) => styleProfiles[styleKey]);

  elements.profileLabel.textContent = profileKeys.length === 1 ? "Primary style" : "Shared primary styles";
  elements.profileName.textContent = profiles.map(({ label }) => label).join(" + ");
  elements.profileTagline.textContent = profiles.map(({ tagline }) => tagline).join(" ");
  elements.profileDescription.textContent = profiles.map(({ description }) => description).join(" ");

  const strengths = profiles.flatMap(({ strengths: items }) => items).slice(0, profileKeys.length === 1 ? 3 : 4);
  const watchouts = profiles.flatMap(({ watchouts: items }) => items).slice(0, profileKeys.length === 1 ? 2 : 4);
  renderList(elements.strengthList, strengths);
  renderList(elements.watchoutList, watchouts);

  elements.stretchQuestion.textContent = profiles.map(({ stretch }) => stretch).join(" Then ask: ");
}

function renderBlend(leadingStyleKeys, primaryKey, secondaryKey) {
  if (leadingStyleKeys.length > 2) {
    elements.blendTitle.textContent = "The adaptive generalist";
    elements.blendDescription.textContent =
      "Your leading scores are distributed across several styles. That range can make you highly adaptive, but it can also make your decision process less visible to others. Name the style you are using at each phase so the team understands when you are exploring, evaluating, aligning, or closing.";
    return;
  }

  const blend = blendProfiles[getBlendKey(primaryKey, secondaryKey)];
  elements.blendTitle.textContent = blend.title;
  elements.blendDescription.textContent = blend.description;
}

function renderCounterweight(scores, lowestKey) {
  const uniqueScores = new Set(Object.values(scores));
  if (uniqueScores.size === 1) {
    elements.counterweightName.textContent = "No single low style";
    elements.counterweightCopy.textContent =
      "Your scores are evenly distributed. Focus on making your current decision mode explicit so teammates can follow your reasoning.";
    return;
  }

  const profile = styleProfiles[lowestKey];
  elements.counterweightName.textContent = profile.label;
  elements.counterweightCopy.textContent = profile.counterweight;
}

function renderList(listElement, items) {
  listElement.replaceChildren();
  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    listElement.append(listItem);
  });
}

function renderStyleGuide() {
  elements.styleGuide.replaceChildren();

  styleOrder.forEach((styleKey) => {
    const profile = styleProfiles[styleKey];
    const card = document.createElement("article");
    card.className = "style-guide-card";

    const icon = document.createElement("span");
    icon.className = "style-guide-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = profile.abbreviation;

    const copy = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = profile.label;
    const description = document.createElement("p");
    description.textContent = profile.teamNeed;

    copy.append(heading, description);
    card.append(icon, copy);
    elements.styleGuide.append(card);
  });
}

async function copyResultsSummary() {
  if (!isValidAssessment(state.responses)) {
    return;
  }

  const summary = buildResultsSummary(state.responses);

  try {
    await navigator.clipboard.writeText(summary);
    showResultActionStatus("Summary copied to your clipboard.");
  } catch {
    const temporaryTextArea = document.createElement("textarea");
    temporaryTextArea.value = summary;
    temporaryTextArea.setAttribute("readonly", "");
    temporaryTextArea.className = "clipboard-fallback";
    document.body.append(temporaryTextArea);
    temporaryTextArea.select();

    const copied = document.execCommand("copy");
    temporaryTextArea.remove();
    showResultActionStatus(
      copied
        ? "Summary copied to your clipboard."
        : "Copy was unavailable. Download or print your results instead.",
    );
  }
}

function exportDetailedResults() {
  if (!isValidAssessment(state.responses)) {
    return;
  }

  const exportDate = new Date();
  const file = new Blob([buildDetailedResultsExport(state.responses, exportDate)], {
    type: "text/plain;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = `dmsi-results-${formatFileDate(exportDate)}.txt`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

  showResultActionStatus("Full results downloaded as a text file.");
}

function showResultActionStatus(message) {
  window.clearTimeout(resultActionStatusTimer);
  elements.resultActionStatus.textContent = message;
  resultActionStatusTimer = window.setTimeout(() => {
    elements.resultActionStatus.textContent = "";
  }, 5000);
}

function restartAssessment() {
  const shouldRestart = window.confirm(
    "Clear all saved responses and begin a new assessment? This action cannot be undone.",
  );

  if (!shouldRestart) {
    return;
  }

  clearSavedState();
  state = createInitialState();
  renderIntroState();
  showView("intro");
}
