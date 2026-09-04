export const questions = [
  {
    prompt: "My prime objective is to:",
    options: [
      "Have a position with status",
      "Be the best in my field",
      "Achieve recognition for my work",
      "Feel secure in my job",
    ],
  },
  {
    prompt: "I enjoy jobs that:",
    options: [
      "Are technical and well defined",
      "Have considerable variety",
      "Allow independent action",
      "Involve people",
    ],
  },
  {
    prompt: "I expect people working for me to be:",
    options: [
      "Productive and fast",
      "Highly capable",
      "Committed and responsive",
      "Receptive to suggestions",
    ],
  },
  {
    prompt: "In my job, I look for:",
    options: [
      "Practical results",
      "The best solutions",
      "New approaches or ideas",
      "Good working environment",
    ],
  },
  {
    prompt: "I communicate best with others:",
    options: [
      "On a direct, one-to-one basis",
      "In writing",
      "By having a group discussion",
      "In a formal meeting",
    ],
  },
  {
    prompt: "In my planning, I emphasize:",
    options: ["Current problems", "Meeting objectives", "Future goals", "Developing people"],
  },
  {
    prompt: "When faced with solving a problem, I:",
    options: [
      "Rely on proven approaches",
      "Apply careful analysis",
      "Look for creative approaches",
      "Rely on my feelings",
    ],
  },
  {
    prompt: "When using information, I prefer:",
    options: [
      "Specific facts",
      "Accurate and complete data",
      "Broad coverage of many options",
      "Limited data that is easily understood",
    ],
  },
  {
    prompt: "When I am not sure about what to do, I:",
    options: [
      "Rely on intuition",
      "Search for facts",
      "Look for a possible compromise",
      "Wait before making a decision",
    ],
  },
  {
    prompt: "Whenever possible, I avoid:",
    options: ["Long debates", "Incomplete work", "Using numbers or formulas", "Conflict with others"],
  },
  {
    prompt: "I am especially good at:",
    options: [
      "Remembering dates and facts",
      "Solving difficult problems",
      "Seeing many possibilities",
      "Interacting with others",
    ],
  },
  {
    prompt: "When time is important, I:",
    options: [
      "Decide and act quickly",
      "Follow plans and priorities",
      "Refuse to be pressured",
      "Seek guidance or support",
    ],
  },
  {
    prompt: "In social settings, I generally:",
    options: [
      "Speak with others",
      "Think about what is being said",
      "Observe what is going on",
      "Listen to the conversation",
    ],
  },
  {
    prompt: "I am good at remembering:",
    options: ["People's names", "Places we met", "People's faces", "People's personality"],
  },
  {
    prompt: "The work I do provides me:",
    options: [
      "The power to influence others",
      "Challenging assignments",
      "Achieving my personal goals",
      "Acceptance by the group",
    ],
  },
  {
    prompt: "I work well with those who are:",
    options: ["Energetic and ambitious", "Self-confident", "Open-minded", "Polite and trusting"],
  },
  {
    prompt: "When under stress, I:",
    options: ["Become anxious", "Concentrate on the problem", "Become frustrated", "Am forgetful"],
  },
  {
    prompt: "Others consider me:",
    options: ["Aggressive", "Disciplined", "Imaginative", "Supportive"],
  },
  {
    prompt: "My decisions typically are:",
    options: [
      "Realistic and direct",
      "Systematic or abstract",
      "Broad and flexible",
      "Sensitive to the needs of others",
    ],
  },
  {
    prompt: "I dislike:",
    options: ["Losing control", "Boring work", "Following rules", "Being rejected"],
  },
];

export const styleOrder = ["directive", "analytical", "conceptual", "behavioral"];

export const styleProfiles = {
  directive: {
    label: "Directive",
    abbreviation: "D",
    tagline: "Turns ambiguity into action.",
    description:
      "You tend to favor clear, practical choices and visible progress. In creative work, you help a team convert possibilities into priorities, owners, and deadlines.",
    strengths: [
      "Creates momentum when a team is stuck",
      "Clarifies ownership, priorities, and next steps",
      "Protects timelines from endless discussion",
    ],
    watchouts: [
      "A fast decision can arrive before quieter perspectives surface",
      "Exploration may look like delay even when it could improve the work",
    ],
    stretch: "What evidence or perspective could change this decision before we close it?",
    teamNeed: "Give this style a clear objective, decision rights, constraints, and a deadline.",
    counterweight:
      "Invite this perspective when the team needs momentum, sharper priorities, or a clear final choice.",
  },
  analytical: {
    label: "Analytical",
    abbreviation: "A",
    tagline: "Builds confidence through evidence.",
    description:
      "You tend to examine facts, assumptions, and tradeoffs before committing. In creative work, you improve rigor, test feasibility, and help the team distinguish a promising idea from a merely exciting one.",
    strengths: [
      "Surfaces risk and weak assumptions early",
      "Brings useful evidence into subjective debates",
      "Creates repeatable standards for evaluating work",
    ],
    watchouts: [
      "The search for certainty can outlast the value of more information",
      "A technically sound answer may still need an emotional or social case",
    ],
    stretch: "What is the smallest amount of evidence we need to make a responsible next move?",
    teamNeed: "Give this style credible evidence, evaluation criteria, and time to examine assumptions.",
    counterweight:
      "Invite this perspective when enthusiasm needs a reality check, criteria are unclear, or risk is hidden.",
  },
  conceptual: {
    label: "Conceptual",
    abbreviation: "C",
    tagline: "Sees possibilities beyond the brief.",
    description:
      "You tend to connect ideas, imagine alternatives, and consider the long view. In creative work, you expand the option space and help a team see opportunities that are easy to miss when attention stays on the immediate task.",
    strengths: [
      "Finds unexpected connections and fresh directions",
      "Keeps long-term opportunity visible",
      "Reframes the problem when the obvious answer is too narrow",
    ],
    watchouts: [
      "New possibilities can keep arriving after the team needs convergence",
      "A compelling vision may overlook operational constraints",
    ],
    stretch: "Which part of this idea creates the most value, and what can we remove to make it real?",
    teamNeed: "Give this style room to explore, a meaningful challenge, and a clear moment for convergence.",
    counterweight:
      "Invite this perspective when the team is solving the wrong problem, repeating old patterns, or thinking too narrowly.",
  },
  behavioral: {
    label: "Behavioral",
    abbreviation: "B",
    tagline: "Builds commitment through people.",
    description:
      "You tend to notice relationships, participation, and the human impact of a choice. In creative work, you help people feel heard, translate tension, and build the commitment required to turn a decision into coordinated action.",
    strengths: [
      "Creates trust and psychological room for contribution",
      "Anticipates stakeholder reactions and adoption barriers",
      "Builds alignment across different perspectives",
    ],
    watchouts: [
      "The desire for agreement can slow a necessary decision",
      "Avoiding conflict can leave the most important disagreement unresolved",
    ],
    stretch: "What respectful disagreement needs to happen before genuine alignment is possible?",
    teamNeed: "Give this style context about people, space for dialogue, and clarity about who is affected.",
    counterweight:
      "Invite this perspective when a decision needs trust, stakeholder insight, or commitment across the team.",
  },
};

export const blendProfiles = {
  "analytical|directive": {
    title: "The disciplined executor",
    description:
      "You combine momentum with scrutiny. You are likely to move efficiently once the evidence meets a practical threshold. Your advantage is turning analysis into action. Your risk is narrowing the conversation before more imaginative or human-centered possibilities have surfaced.",
  },
  "conceptual|directive": {
    title: "The visionary driver",
    description:
      "You pair possibility with forward motion. You can imagine a bold direction and mobilize people around it quickly. Your advantage is escaping incremental thinking. Your risk is moving from inspiration to execution before feasibility and stakeholder impact receive enough attention.",
  },
  "behavioral|directive": {
    title: "The mobilizing leader",
    description:
      "You balance decisive action with awareness of people. You can give a team direction while maintaining energy and commitment. Your advantage is practical alignment. Your risk is resolving tension quickly when a deeper analytical or conceptual debate would strengthen the decision.",
  },
  "analytical|conceptual": {
    title: "The strategic architect",
    description:
      "You combine expansive thinking with disciplined evaluation. You can see new possibilities and examine how they might work. Your advantage is sophisticated strategy. Your risk is building an elegant model that takes too long to convert into a clear decision and coordinated action.",
  },
  "analytical|behavioral": {
    title: "The evidence-informed facilitator",
    description:
      "You combine careful reasoning with attention to people. You can make evidence understandable and help groups work through complex tradeoffs. Your advantage is credible alignment. Your risk is waiting for both certainty and consensus when the team needs a timely choice.",
  },
  "behavioral|conceptual": {
    title: "The human-centered innovator",
    description:
      "You pair imagination with empathy. You can generate new possibilities while considering how people will experience them. Your advantage is relevant innovation. Your risk is protecting harmony and possibility at the expense of hard constraints, prioritization, or a final decision.",
  },
};
