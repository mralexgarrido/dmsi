# Contributing to DMSI

Thank you for helping improve the Decision-Making Style Inventory. DMSI is a small, dependency-free educational application, so contributions should preserve its clarity, privacy, accessibility, and scoring integrity.

## Before opening a change

- Use a [bug report](https://github.com/mralexgarrido/dmsi/issues/new?template=bug_report.yml) for reproducible problems.
- Use a [feature request](https://github.com/mralexgarrido/dmsi/issues/new?template=feature_request.yml) to propose a new capability or substantial interface change.
- Use [GitHub Security Advisories](https://github.com/mralexgarrido/dmsi/security/advisories/new) for vulnerabilities. Do not disclose security issues in a public issue.
- Review the [support guide](SUPPORT.md) when the request is about using or facilitating the assessment.

## Local setup

DMSI requires Node.js 20 or newer. It has no runtime or development dependencies.

```bash
git clone https://github.com/mralexgarrido/dmsi.git
cd dmsi
npm run check
npm run dev
```

Open `http://127.0.0.1:4173`. Run `npm run build` to create the same static artifact deployed to GitHub Pages.

## Change workflow

1. Create a focused branch from the latest `main`.
2. Keep each pull request limited to one coherent change.
3. Add or update tests whenever behavior, metadata, content contracts, or scoring changes.
4. Run `npm run check` and `npm run build` before opening the pull request.
5. Complete the pull-request checklist and explain any validation that was not performed.

## Project invariants

Every contribution must preserve these guarantees unless the project owner explicitly approves a documented change:

- The assessment contains 20 prompts and four uniquely ranked responses per prompt.
- Ranks award 8, 4, 2, and 1 points. All four style scores total 300.
- Equal leading scores are presented as a tie or balanced profile. They are not silently broken.
- Assessment responses stay on the participant's device unless the participant explicitly copies, downloads, or prints them.
- The production experience has no analytics, advertising, accounts, cookies, external scripts, or external fonts.
- Every task remains usable with a keyboard and does not depend on drag-and-drop, color, animation, or pointer precision.
- The legacy `dmsiform.html` address continues to forward to the canonical assessment.

See [Scoring and interpretation](docs/SCORING.md), [Privacy and data handling](docs/PRIVACY.md), and [Accessibility](docs/ACCESSIBILITY.md) for the implementation contracts behind these requirements.

## Code and content conventions

- Use semantic HTML and progressive enhancement.
- Use existing design tokens in `css/styles.css` rather than adding isolated colors or spacing values.
- Prefer small pure functions for scoring, formatting, and export behavior.
- Avoid dependencies when the browser or Node.js standard library provides the required capability.
- Write interface text in direct, inclusive language. Do not present the inventory as a diagnosis or validated selection instrument.
- Preserve source attribution and the boundaries described in [NOTICE.md](NOTICE.md).

## Pull-request review

Maintainers review changes for correctness, scope, accessibility, privacy, classroom usefulness, and maintainability. A contribution may be declined when it adds disproportionate complexity, weakens the project invariants, or falls outside the educational purpose of DMSI.

By contributing, you agree that your original code and interface assets may be distributed under the repository's [MIT License](LICENSE). You are responsible for ensuring that submitted content can legally be included.

