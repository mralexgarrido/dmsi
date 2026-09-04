# Scoring and interpretation

This document defines the behavioral contract implemented in `js/scoring.js`. It is intended for instructors, reviewers, and contributors who need to audit how a result is produced.

## Response model

Each of the 20 prompts contains four response positions. Across every prompt, those positions map in the same order:

| Position | Style |
|---:|---|
| 1 | Directive |
| 2 | Analytical |
| 3 | Conceptual |
| 4 | Behavioral |

A participant must rank all four responses once. Duplicate or incomplete ranks are rejected.

## Point model

| Participant rank | Points |
|---|---:|
| Most like me | 8 |
| Second most like me | 4 |
| Third most like me | 2 |
| Least like me | 1 |

For each prompt, the selected rank's point value is added to the style associated with that response position.

The invariants are:

- Each prompt contributes 15 points.
- A complete assessment contributes 300 points.
- Each style has a theoretical minimum of 20 and maximum of 160.
- Four style scores are always reported. Scores are not normalized or converted to percentages.

These properties are enforced by automated tests in `tests/scoring.test.js`.

## Result interpretation

Scores are ordered from highest to lowest. The highest score is the primary preference and the next score informs the two-style interpretation. Equal highest scores are explicitly reported as shared leading styles. A tie is never resolved through an undisclosed rule.

If more than two styles share the highest score, the interface presents a broadly balanced profile. If all four scores are equal, no single counterweight is named.

Interpretation text describes preferences and reflection prompts. It does not claim ability, personality type, diagnosis, or predictive validity. DMSI should not be used as the sole basis for hiring, grading, promotion, clinical care, or another high-stakes decision.

## Source attribution

The decision-style framework and source questionnaire are attributed to:

Rowe, A. J., & Mason, R. O. (1987). *Managing with style: A guide to understanding, assessing, and improving decision making*. Jossey-Bass.

See [NOTICE.md](../NOTICE.md) for the boundary between the repository's MIT-licensed implementation and third-party source material.

