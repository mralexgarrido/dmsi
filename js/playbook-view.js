import { PLAYBOOK_FIELDS, PLAYBOOK_LIMIT, assessmentSignature, buildPlaybookText, createPlaybook } from "./playbook.js";

/** Owns the editable view only; assessment scores are never changed here. */
export function createPlaybookView({ getState, save, copyText, downloadText }) {
  const fields = document.querySelector("[data-playbook-fields]");
  const context = document.querySelector("[data-playbook-context]");
  const status = document.querySelector("[data-playbook-status]");
  const staleNote = document.querySelector("[data-playbook-stale]");
  const setStatus = (message) => { status.textContent = message; };

  function render() {
    const state = getState();
    const signature = assessmentSignature(state.responses);
    if (!state.playbook || (!state.playbook.edited && state.playbook.signature !== signature)) {
      state.playbook = createPlaybook(state.responses, state.playbook?.context);
      save();
    }
    context.value = state.playbook.context;
    staleNote.hidden = state.playbook.signature === signature;
    fields.replaceChildren();
    for (const { key, label } of PLAYBOOK_FIELDS) {
      const group = document.createElement("div");
      group.className = "playbook-field";
      const heading = document.createElement("label");
      heading.htmlFor = `playbook-${key}`;
      heading.textContent = label;
      const input = document.createElement("textarea");
      input.id = `playbook-${key}`;
      input.name = key;
      input.rows = 4;
      input.maxLength = PLAYBOOK_LIMIT;
      input.value = state.playbook.fields[key];
      const printLabel = document.createElement("h3");
      printLabel.className = "playbook-print";
      printLabel.textContent = label;
      const printValue = document.createElement("p");
      printValue.className = "playbook-print";
      printValue.textContent = input.value || "Not provided.";
      input.addEventListener("input", () => {
        const current = getState();
        current.playbook.fields[key] = input.value.slice(0, PLAYBOOK_LIMIT);
        current.playbook.edited = true;
        printValue.textContent = input.value || "Not provided.";
        save();
      });
      input.addEventListener("change", () => setStatus("Wording updated. Review your playbook before sharing it."));
      group.append(heading, input, printLabel, printValue);
      fields.append(group);
    }
  }

  function regenerate(nextContext) {
    const state = getState();
    if (state.playbook?.edited && !window.confirm("Replace your custom playbook wording with a new suggested draft? Your assessment answers will not change.")) {
      context.value = state.playbook.context;
      return;
    }
    state.playbook = createPlaybook(state.responses, nextContext);
    save();
    render();
    setStatus("New starting draft created. Edit anything that does not fit your experience.");
  }

  context.addEventListener("change", () => regenerate(context.value));
  document.querySelector("[data-action='reset-playbook']").addEventListener("click", () => regenerate(context.value));
  document.querySelector("[data-action='copy-playbook']").addEventListener("click", async () => {
    const copied = await copyText(buildPlaybookText(getState().playbook));
    setStatus(copied ? "Playbook copied. Share it only with people you choose." : "Copy was unavailable. Download the playbook instead.");
  });
  document.querySelector("[data-action='download-playbook']").addEventListener("click", () => {
    downloadText(buildPlaybookText(getState().playbook), "dmsi-my-playbook.txt");
    setStatus("Playbook downloaded as a text file.");
  });
  return { render };
}
