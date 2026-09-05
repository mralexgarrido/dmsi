import { questions, styleOrder, styleProfiles } from "./questions.js";
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
  isCompleteResponse,
  isValidAssessment,
} from "./scoring.js";
import { RANK_LABELS, getRankProgress } from "./rank-progress.js";

import { getResultData } from "./interpretation.js";
import { selectRank, swapRank, undoRanking } from "./ranking.js";
import { sanitizePlaybook } from "./playbook.js";
import { createPlaybookView } from "./playbook-view.js";

const STORAGE_KEY = "dmsi-assessment-v2";
const THEME_STORAGE_KEY = "dmsi-theme";
const STATE_VERSION = 2;

const elements = {
  views: [...document.querySelectorAll("[data-view]")],
  storageStatus: document.querySelector("[data-storage-status]"),
  rankEditor: document.querySelector("[data-rank-editor]"),
  rankEditorStatement: document.querySelector("[data-rank-editor-statement]"),
  rankEditorChoices: document.querySelector("[data-rank-editor-choices]"),
  reviewTitle: document.querySelector("[data-review-title]"),
  reviewList: document.querySelector("[data-review-list]"),
  reviewCount: document.querySelector("[data-review-count]"),
  reviewResults: document.querySelector("[data-action='review-results']"),
  scoreGap: document.querySelector("[data-score-gap]"),
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
  rankProgress: document.querySelector("[data-rank-progress]"),
  rankCurrent: document.querySelector("[data-rank-current]"),
  rankRemaining: document.querySelector("[data-rank-remaining]"),
  rankSteps: [...document.querySelectorAll("[data-rank-step]")],
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

let storageIssue = "";
let state = loadState();
let rankingHistory = questions.map(() => []);
const playbookView = createPlaybookView({ getState: () => state, save: saveState, copyText, downloadText });
let resultActionStatusTimer;

initialize();

function initialize() {
  bindActions();
  renderThemeControl();
  renderStyleGuide();
  renderIntroState();
  renderStorageStatus();

  const requestedView = window.location.hash.replace("#", "");
  let initialView = "intro";

  if (requestedView === "results" && isValidAssessment(state.responses)) {
    initialView = "results";
    renderResults();
  } else if (requestedView === "review" && state.started) {
    initialView = "review";
    renderReview();
  } else if (requestedView === "assessment" && state.started) {
    initialView = "assessment";
    renderQuestion();
  }

  showView(initialView, { updateHistory: false, focus: false });
  window.history.replaceState({ view: initialView }, "", `#${initialView}`);
}

function bindActions() {
  elements.rankEditor.addEventListener("keydown", containRankEditorFocus);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.startButton.addEventListener("click", startOrResumeAssessment);
  elements.headerAction.addEventListener("click", saveAndExit);
  elements.undoButton.addEventListener("click", undoLastSelection);
  elements.clearQuestionButton.addEventListener("click", clearCurrentQuestion);
  elements.previousButton.addEventListener("click", showPreviousQuestion);
  elements.nextButton.addEventListener("click", showNextQuestion);
  document.querySelectorAll("[data-action='review-answers']").forEach((button) => {
    button.addEventListener("click", openReview);
  });
  document.querySelector("[data-action='close-rank-editor']").addEventListener("click", () => elements.rankEditor.close());
  elements.reviewResults.addEventListener("click", finishReview);
  document.querySelector("[data-action='jump-playbook']").addEventListener("click", (event) => {
    event.preventDefault();
    const heading = document.querySelector("#playbook-title");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "auto" });
  });
  document.querySelector("[data-action='review-resume']").addEventListener("click", () => {
    state.reviewReturn = false;
    state.currentQuestion = getResumeQuestionIndex();
    saveState();
    renderQuestion();
    showView("assessment");
  });

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

    if (requestedView === "review" && state.started) {
      renderReview();
      showView("review", { updateHistory: false });
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
    reviewReturn: false,
    playbook: null,
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
    if (!parsed || parsed.version !== STATE_VERSION || !Array.isArray(parsed.responses)) {
      return emptyState;
    }

    const responses = Array.from({ length: questions.length }, (_, questionIndex) =>
      sanitizePartialResponse(parsed.responses[questionIndex]),
    );

    return {
      version: STATE_VERSION,
      started: Boolean(parsed.started),
      reviewReturn: parsed.reviewReturn === true,
      playbook: sanitizePlaybook(parsed.playbook),
      completed: isValidAssessment(responses),
      currentQuestion: clampQuestionIndex(parsed.currentQuestion),
      responses,
    };
  } catch {
    storageIssue = "Saved progress could not be read. This visit still works, but progress may not be saved for later.";
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
    storageIssue = "";
  } catch {
    storageIssue = "Progress is available in this tab, but could not be saved for later. Keep this tab open and download your results or playbook when finished.";
  }
  renderStorageStatus();
  return storageIssue === "";
}

function clearSavedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    storageIssue = "";
    renderStorageStatus();
    return true;
  } catch {
    storageIssue = "Saved data could not be cleared. Use your browser's site-data settings to remove older responses and playbook wording. Your current session has not been reset.";
    renderStorageStatus();
    return false;
  }
}

function renderIntroState() {
  const completedCount = countCompletedQuestions();
  const hasProgress = completedCount > 0 || state.responses.some((response) => response.length > 0);

  if (isValidAssessment(state.responses)) {
    elements.startButton.textContent = "View my results";
    elements.resumeNote.textContent = storageIssue ? "Your completed profile is available in this tab. See the saving notice above." : "Your completed profile is saved on this device.";
    elements.resumeNote.hidden = false;
    return;
  }

  if (hasProgress) {
    const resumeIndex = getResumeQuestionIndex();
    elements.startButton.textContent = `Resume at question ${resumeIndex + 1}`;
    elements.resumeNote.textContent = `${completedCount} of ${questions.length} questions complete. ${storageIssue ? "Progress is available in this tab. See the saving notice above." : "Your progress is saved on this device."}`;
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
  if (elements.rankEditor.open) elements.rankEditor.close();
  elements.views.forEach((view) => {
    view.hidden = view.dataset.view !== viewName;
  });

  elements.headerAction.hidden = !["assessment", "review"].includes(viewName);
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
            : viewName === "review" ? elements.reviewTitle : document.querySelector("#intro-title");
      focusTarget?.focus({ preventScroll: true });
    });
  }
}

function renderQuestion({ focusOptionIndex = null, focusTitle = false, animateOptionIndex = null, message = "" } = {}) {
  const question = questions[state.currentQuestion];
  const response = state.responses[state.currentQuestion];
  const completeCount = countCompletedQuestions();
  const rankProgress = getRankProgress(response.length);
  const nextRankIndex = Math.min(response.length, RANK_LABELS.length - 1);

  elements.questionCounter.textContent = `Question ${state.currentQuestion + 1} of ${questions.length}`;
  elements.completionCounter.textContent = `${completeCount} complete`;
  elements.progress.value = completeCount;
  elements.progress.textContent = `${completeCount} of ${questions.length} questions complete`;
  elements.questionTitle.textContent = question.prompt;
  renderRankProgress(rankProgress);
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
      if (optionIndex === animateOptionIndex) {
        button.classList.add("is-new-rank");
      }
      button.setAttribute(
        "aria-label",
        `${optionText}. Ranked ${RANK_LABELS[rankIndex].phrase}, ${RANK_SCORES[rankIndex]} points. Select to change this rank.`,
      );
    } else {
      button.dataset.nextRank = String(nextRankIndex + 1);
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

    const displayedRankIndex = isRanked ? rankIndex : nextRankIndex;
    const badgeIcon = document.createElement("span");
    badgeIcon.className = "rank-badge-icon";
    badgeIcon.textContent = RANK_LABELS[displayedRankIndex].icon;

    const badgeCopy = document.createElement("span");
    badgeCopy.className = "rank-badge-copy";

    if (isRanked) {
      const badgeLabel = document.createElement("span");
      badgeLabel.className = "rank-badge-label";
      badgeLabel.textContent = RANK_LABELS[rankIndex].badge;
      const badgeMeta = document.createElement("span");
      badgeMeta.className = "rank-badge-meta";
      badgeMeta.textContent = `${RANK_LABELS[rankIndex].short} choice · ${RANK_SCORES[rankIndex]} ${RANK_SCORES[rankIndex] === 1 ? "point" : "points"} · Change rank`;
      badgeCopy.append(badgeLabel, badgeMeta);
    } else {
      const badgeLabel = document.createElement("span");
      badgeLabel.className = "rank-badge-label";
      badgeLabel.textContent = RANK_LABELS[nextRankIndex].badge;
      const badgeMeta = document.createElement("span");
      badgeMeta.className = "rank-badge-meta";
      badgeMeta.textContent = `Select as ${RANK_LABELS[nextRankIndex].short} choice`;
      badgeCopy.append(badgeLabel, badgeMeta);
    }

    badge.append(badgeIcon, badgeCopy);
    button.append(copy, badge);
    button.addEventListener("click", () => selectOption(optionIndex));
    elements.options.append(button);
  });

  const isComplete = rankProgress.isComplete;
  elements.selectionStatus.textContent = message || (isComplete ? "All four ranked. Select a statement to change its rank, or continue when ready." : rankProgress.statusMessage);

  elements.undoButton.disabled = response.length === 0 && rankingHistory[state.currentQuestion].length === 0;
  elements.clearQuestionButton.disabled = response.length === 0;
  elements.previousButton.disabled = state.currentQuestion === 0;
  elements.nextButton.disabled = !isComplete;
  elements.nextButton.textContent =
    state.reviewReturn ? "Return to review" : state.currentQuestion === questions.length - 1 ? "Review my answers" : "Continue";

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

function renderRankProgress(progress) {
  elements.rankProgress.dataset.state = progress.isComplete ? "complete" : "ranking";
  elements.rankCurrent.textContent = progress.currentLabel;
  elements.rankRemaining.textContent = progress.remainingLabel;

  if (progress.currentRank === null) {
    delete elements.rankProgress.dataset.currentRank;
  } else {
    elements.rankProgress.dataset.currentRank = String(progress.currentRank);
  }

  progress.steps.forEach((step, index) => {
    const stepElement = elements.rankSteps[index];
    stepElement.dataset.state = step.state;
    stepElement.querySelector("[data-rank-step-state]").textContent = step.stateLabel;
    stepElement.setAttribute(
      "aria-label",
      `${step.short} choice: ${step.badge}, ${step.score} ${step.score === 1 ? "point" : "points"}, ${step.stateLabel.toLowerCase()}.`,
    );

    if (step.state === "current") {
      stepElement.setAttribute("aria-current", "step");
    } else {
      stepElement.removeAttribute("aria-current");
    }
  });
}

function selectOption(optionIndex) {
  const response = state.responses[state.currentQuestion];
  if (response.includes(optionIndex)) {
    openRankEditor(optionIndex);
    return;
  }
  const wasAutoFilled = response.length === 2;
  updateResponse(selectRank(response, optionIndex));
  renderQuestion({ focusOptionIndex: optionIndex, animateOptionIndex: optionIndex,
    message: wasAutoFilled ? "All four ranked. The remaining statement was placed last automatically. Review your choices, then continue." : "" });
}

function undoLastSelection() {
  const index = state.currentQuestion;
  if (state.responses[index].length === 0 && rankingHistory[index].length === 0) return;
  state.responses[index] = rankingHistory[index].pop() ?? undoRanking(state.responses[index]);
  state.completed = false;
  saveState();
  renderQuestion({ focusTitle: true, message: "Last ranking change undone." });
}

function clearCurrentQuestion() {
  updateResponse([]);
  renderQuestion({ focusTitle: true, message: "This question was cleared. Undo restores the previous ranking." });
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
  if (!isCompleteResponse(state.responses[state.currentQuestion])) return;
  if (state.reviewReturn || state.currentQuestion === questions.length - 1) {
    state.reviewReturn = false;
    openReview();
    return;
  }
  state.currentQuestion += 1;
  saveState();
  renderQuestion({ focusTitle: true });
  window.scrollTo({ top: 0, behavior: "auto" });
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
  const result = getResultData(state.responses);
  elements.printDate.textContent = `Generated ${formatDisplayDate(new Date())}`;
  elements.resultTitle.textContent = result.title;
  elements.resultLede.textContent = result.lede;
  elements.scoreGap.textContent = result.gapText;
  renderScores(result.rankedStyles, result.leadingStyleKeys);
  elements.profileLabel.textContent = result.profileLabel;
  elements.profileName.textContent = result.profileName;
  elements.profileTagline.textContent = result.tagline;
  elements.profileDescription.textContent = result.description;
  renderList(elements.strengthList, result.strengths);
  renderList(elements.watchoutList, result.watchouts);
  elements.stretchQuestion.textContent = result.stretches.join(" Then ask: ");
  elements.blendTitle.textContent = result.blend.title;
  elements.blendDescription.textContent = result.blend.description;
  elements.counterweightName.textContent = result.counterweightName;
  elements.counterweightCopy.textContent = result.counterweightCopy;
  playbookView.render();
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
  if (!isValidAssessment(state.responses)) return;
  const copied = await copyText(buildResultsSummary(state.responses));
  showResultActionStatus(copied ? "Summary copied to your clipboard." : "Copy was unavailable. Download or print your results instead.");
}

function exportDetailedResults() {
  if (!isValidAssessment(state.responses)) return;
  const exportDate = new Date();
  downloadText(buildDetailedResultsExport(state.responses, exportDate, state.playbook), `dmsi-results-${formatFileDate(exportDate)}.txt`);
  showResultActionStatus("Full results and your playbook downloaded as a text file.");
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
    "Clear all saved responses and your playbook wording, then begin a new assessment? Download anything you want to keep first. This action cannot be undone.",
  );

  if (!shouldRestart) {
    return;
  }

  if (!clearSavedState()) return;
  state = createInitialState();
  rankingHistory = questions.map(() => []);
  renderIntroState();
  showView("intro");
}

function renderStorageStatus() {
  elements.storageStatus.hidden = !storageIssue;
  elements.storageStatus.textContent = storageIssue;
  elements.headerAction.textContent = storageIssue ? "Exit to introduction" : "Save and exit";
}

function updateResponse(next) {
  const index = state.currentQuestion;
  rankingHistory[index].push([...state.responses[index]]);
  if (rankingHistory[index].length > 50) rankingHistory[index].shift();
  state.responses[index] = next;
  state.completed = false;
  saveState();
}

function openRankEditor(optionIndex) {
  const response = state.responses[state.currentQuestion];
  const currentRank = response.indexOf(optionIndex);
  elements.rankEditorStatement.textContent = questions[state.currentQuestion].options[optionIndex];
  elements.rankEditorChoices.replaceChildren();
  RANK_LABELS.forEach((rank, targetRank) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary";
    button.textContent = `${rank.badge}${targetRank === currentRank ? " (current)" : targetRank >= response.length ? " (not assigned yet)" : ""}`;
    button.disabled = targetRank === currentRank || targetRank >= response.length;
    button.addEventListener("click", () => {
      updateResponse(swapRank(response, optionIndex, targetRank));
      elements.rankEditor.close();
      renderQuestion({ focusOptionIndex: optionIndex,
        message: `${RANK_LABELS[currentRank].badge} and ${rank.badge} exchanged ranks. Other statements stayed in place.` });
    });
    elements.rankEditorChoices.append(button);
  });
  elements.rankEditor.showModal();
}

function openReview() {
  saveState();
  renderReview();
  showView("review");
}

function renderReview() {
  const completed = countCompletedQuestions();
  elements.reviewCount.textContent = `${completed} of ${questions.length} questions fully ranked. ${completed === questions.length ? "Review any answer, then view your results." : "Finish the remaining rankings before viewing results."}`;
  elements.reviewResults.disabled = !isValidAssessment(state.responses);
  elements.reviewList.replaceChildren();
  questions.forEach((question, index) => {
    const response = state.responses[index];
    const card = document.createElement("article");
    card.className = "review-card panel";
    const heading = document.createElement("h2");
    heading.textContent = `${index + 1}. ${question.prompt}`;
    const list = document.createElement("ol");
    list.className = "review-ranks";
    [...response, ...question.options.map((_, i) => i).filter((i) => !response.includes(i))].forEach((optionIndex, rank) => {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      label.textContent = rank < response.length ? `${RANK_LABELS[rank].badge}: ` : "Not ranked: ";
      item.append(label, document.createTextNode(question.options[optionIndex]));
      list.append(item);
    });
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "button button-secondary";
    edit.textContent = isCompleteResponse(response) ? "Edit ranking" : "Finish ranking";
    edit.setAttribute("aria-label", `${edit.textContent} for question ${index + 1}`);
    edit.addEventListener("click", () => {
      state.currentQuestion = index;
      state.reviewReturn = true;
      saveState();
      renderQuestion();
      showView("assessment");
    });
    card.append(heading, list, edit);
    elements.reviewList.append(card);
  });
}

function finishReview() {
  if (!isValidAssessment(state.responses)) return;
  state.completed = true;
  state.reviewReturn = false;
  saveState();
  renderResults();
  showView("results");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const previousFocus = document.activeElement;
    const temporaryTextArea = document.createElement("textarea");
    temporaryTextArea.value = text;
    temporaryTextArea.setAttribute("readonly", "");
    temporaryTextArea.className = "clipboard-fallback";
    document.body.append(temporaryTextArea);
    temporaryTextArea.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { /* Download remains available. */ }
    temporaryTextArea.remove();
    previousFocus?.focus({ preventScroll: true });
    return copied;
  }
}

function downloadText(text, filename) {
  const file = new Blob([text], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

// Explicit wrapping also keeps keyboard focus inside the native dialog in headless Chromium.
function containRankEditorFocus(event) {
  if (event.key !== "Tab") return;
  const controls = [...elements.rankEditor.querySelectorAll("button:not(:disabled)")];
  const first = controls[0];
  const last = controls.at(-1);
  if (!first) return;
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !elements.rankEditor.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !elements.rankEditor.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}
