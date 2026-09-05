import { getResultData } from "./interpretation.js";

export const PLAYBOOK_LIMIT = 1200;
export const PLAYBOOK_FIELDS = [
  { key: "contribution", label: "What I contribute" },
  { key: "needs", label: "What helps me contribute" },
  { key: "practice", label: "What I am practicing" },
  { key: "question", label: "A useful question to ask me" },
  { key: "commitment", label: "My commitment to the team" },
];
const drafts = {
  directive: {
    contribution: "I help us turn a discussion into priorities, owners, and next steps.",
    needs: "Give me a clear objective, the constraints, and the decision deadline.",
    practice: "I am making space for perspectives that could change the decision before I close it.",
    question: "What important perspective have we not heard yet?",
    commitment: "I will explain the decision, invite the most important concern, and make the next step clear.",
  },
  analytical: {
    contribution: "I help us identify assumptions and compare options using evidence.",
    needs: "Give me the objective, the relevant evidence, and the decision deadline.",
    practice: "I am distinguishing information that could change the decision from information that would merely make me feel more comfortable.",
    question: "What would be enough evidence to take the next reversible step?",
    commitment: "I will raise my most important concern early and help define a practical path forward.",
  },
  conceptual: {
    contribution: "I help us see alternatives, connect ideas, and consider the longer view.",
    needs: "Give me the problem we are trying to solve, room to explore, and a clear point for choosing a direction.",
    practice: "I am narrowing possibilities into a useful first version before moving on to another idea.",
    question: "Which part of this idea matters most, and what could we test first?",
    commitment: "I will explain the core idea, welcome useful constraints, and help turn it into a concrete next step.",
  },
  behavioral: {
    contribution: "I help us hear different perspectives and consider how a decision affects people.",
    needs: "Give me context about who is affected and space to raise questions about participation and commitment.",
    practice: "I am making room for respectful disagreement instead of treating quick agreement as genuine alignment.",
    question: "What important disagreement would help us make a better decision?",
    commitment: "I will name a concern respectfully and help us move forward without requiring everyone to agree.",
  },
};

export function assessmentSignature(responses) {
  return responses.map((response) => response.join("")).join(".");
}

export function createPlaybook(responses, context = "work") {
  const result = getResultData(responses);
  const selectedContext = context === "class" ? "class" : "work";
  const fields = Object.fromEntries(PLAYBOOK_FIELDS.map(({ key }) => [
    key, result.leadingStyleKeys.map((style) => drafts[style][key]).join(" "),
  ]));
  if (selectedContext === "class") {
    fields.commitment = `For our next group assignment: ${fields.commitment}`;
    fields.needs += " Let us agree on each person's responsibilities and an internal deadline before the submission date.";
  }
  return { version: 1, signature: assessmentSignature(responses), context: selectedContext, edited: false, fields };
}

/** Treat saved browser data as untrusted. Never render saved text as HTML. */
export function sanitizePlaybook(value) {
  if (!value || value.version !== 1 || !value.fields || typeof value.fields !== "object") return null;
  return {
    version: 1,
    signature: typeof value.signature === "string" ? value.signature.slice(0, 200) : "",
    context: value.context === "class" ? "class" : "work",
    edited: value.edited === true,
    fields: Object.fromEntries(PLAYBOOK_FIELDS.map(({ key }) => [
      key, typeof value.fields[key] === "string" ? value.fields[key].slice(0, PLAYBOOK_LIMIT) : "",
    ])),
  };
}

export function buildPlaybookText(value) {
  const playbook = sanitizePlaybook(value);
  if (!playbook) throw new TypeError("A valid playbook is required.");
  return [
    "HOW TO WORK WITH ME", "DMSI personal decision-making playbook",
    `Context: ${playbook.context === "class" ? "Group project" : "Workplace"}`,
    playbook.edited ? "Participant-edited wording. Review before sharing." : "Suggested starting draft. Review and personalize before sharing.",
    "", ...PLAYBOOK_FIELDS.flatMap(({ key, label }) => [label, playbook.fields[key] || "Not provided.", ""]),
    "This playbook is a conversation starter, not an evaluation of ability.",
  ].join("\n");
}
