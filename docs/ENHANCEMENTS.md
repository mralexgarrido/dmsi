# Ranking, interpretation, and personal playbook upgrade

Status: proposed enhancement. Production remains unchanged until the pull request is explicitly approved and merged.

## Experience

Participants select their top three statements. The remaining statement receives the fourth rank automatically, with an explicit status message. Continue never auto-advances. Selecting an assigned statement opens a keyboard-accessible rank editor; exchanging two assigned ranks leaves the other statements unchanged. Undo restores the previous change, including a clear or swap. After reloading, undo removes the last explicit choice and its implied fourth rank.

Review answers is available during the assessment and from results. It lists all 20 prompts, supports direct editing, and prevents incomplete assessments from reaching results. Returning from a review edit goes back to review, rather than advancing to an unrelated question.

The 20 questions, answer order, and 8/4/2/1 scoring are unchanged. The original scoring functions remain the source of truth. Each complete profile still totals 300.

## One interpretation model

`js/interpretation.js` supplies the on-screen profile, summary, and text report. It covers 12 directional primary/secondary combinations, preserves the original six tied-pair interpretations, and explicitly handles ties for primary, secondary, and lowest scores. Three- and four-way leading ties give every leading style equal representation. Equal scores are not presented as proof of adaptability.

The exact leading score gap is described without arbitrary near-tie thresholds, population percentiles, or invented statistical confidence. These are coaching prompts, not newly validated personality types. Introductory style cards have equal visual emphasis.

## Participant-owned playbook

The results include five editable fields: contribution, helpful conditions, a practice goal, a useful question, and a team commitment. Workplace and group-project drafts are available. The participant can copy or download the playbook alone, or include it in the full report and print layout. Printed output uses the complete text rather than clipped textareas.

Custom wording is preserved when answers change. A visible notice asks the participant to review it or regenerate the draft. Replacing custom text requires confirmation. Generated wording is explicitly labeled as a starting suggestion. Editing the playbook never changes assessment answers or scores.

## Persistence and privacy

The existing `dmsi-assessment-v2` localStorage key and state version remain compatible. The saved state gains optional `reviewReturn` and `playbook` properties. Older saved answers, including incomplete three-rank drafts, continue to load. A playbook is versioned independently, restricted to known fields, and limited to 1,200 characters per field. User text is rendered with `textContent` or form values, never HTML.

No accounts, analytics, backend, cookies, external runtime requests, or new permissions are added to the app. The Content Security Policy is unchanged. Browser storage failures now show a persistent, truthful warning. Clear-data confirmation removes both the assessment and its playbook; a failed removal is reported instead of claiming success.

A rollback to older code preserves the answer-array format, but an older version saving the same state may discard the new optional playbook fields. Participants should export custom wording they want to keep before a rollback or clearing site data.

## Validation

Run the existing dependency-free checks:

```sh
npm run check
npm run build
```

`tests/enhancements.test.js` exercises all 24 ranking orders, rank swaps, undo, all 12 directional combinations, ties, export consistency, playbook bounds, and schema validation. The existing site-integrity test now covers the additional local stylesheet and visible ranking status.

Optional real-browser checks use development-only Python Playwright. They do not change the app's package manager, lockfile, or shipped dependencies:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/browser-requirements.txt
.venv/bin/python -m playwright install chromium
npm run build
.venv/bin/python scripts/browser-smoke.py
```

The `DMSI browser smoke checks` workflow runs on relevant pull requests. It has read-only repository access, does not persist checkout credentials, uses pinned official actions, and does not deploy anything. Artifacts contain the static build and synthetic test evidence only. Never replace the synthetic inputs with real participant data.

Browser checks cover completion, direct review edits, modal keyboard focus, saved-state compatibility, editable wording, clipboard and downloads, print text, blocked storage, malformed state, and narrow layouts in light/dark themes. The script writes its actual outcome to `browser-results/dmsi-browser-results.json` only after all checks pass. A successful Chromium run is not a complete accessibility audit or verification on real Safari/iOS/Android hardware.

## Approval and rollback

The existing GitHub Pages workflow remains unchanged. A feature branch or pull request does not create a public Pages preview. Review the static build and screenshot artifacts, then explicitly approve merging before production deployment.

Baseline production commit: `49f568839681c4884bf513da1cdce1ad492189b7`. Roll back by reverting the enhancement commit on a review branch and approving its merge. Do not force-push or rewrite shared history.

## Deferred

Share images, assessment history, teammate comparison, Decision Lab, optional practice questions, and facilitator dashboards are intentionally outside this first implementation.
