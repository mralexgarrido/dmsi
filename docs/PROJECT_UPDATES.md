# Project updates and release handoff

## Find what changed

[CHANGELOG.md](../CHANGELOG.md) records versioned changes. [Pull requests](https://github.com/mralexgarrido/dmsi/pulls?q=is%3Apr+is%3Amerged) show the reviewed work behind changes, and [GitHub Releases](https://github.com/mralexgarrido/dmsi/releases) contains release announcements when the maintainer publishes them. A version in package.json is not, by itself, proof that a matching GitHub release has been published.

The existing changelog describes the 2.2.0 ranking gauge, clearer rank labels, and color/label hierarchy. Subsequent work can exist on main before its next versioned announcement. Use the actual reviewed commit when verifying a release rather than assuming the current branch exactly matches a historical version label.

## Release-note draft based on the existing 2.2.0 changelog

The following is editorial source material for a maintainer-reviewed announcement, not a published release:

> DMSI makes ranking easier to follow with a live guide to the current rank and remaining choices. Answer cards emphasize Most, More, Less, and Least like me, with clearer visual distinctions between selected and unselected answers. The update retains the original 8/4/2/1 scoring pattern and adds automated checks for ranking-progress states.

Select the commit that actually represents the intended release, verify its changes and tests, and edit this wording to match that exact commit. Do not attach the 2.2.0 label to later unversioned work without reviewing the difference.

## Maintainer checklist

Use the existing [maintainer guide](MAINTAINER_GUIDE.md) for hosting, repository settings, and version synchronization. Run `npm run check` and `npm run build`, then review the full assessment, tied results, saved progress, exports, both themes, and narrow-screen and keyboard operation. Record the commands and browser checks separately.

A release announcement should explain the participant benefit, fixes, limitations, and any effect on saved assessments. Record the exact commit and actual publication date. Do not create historic dates or imply a source review is an accessibility or psychometric certification.

Only publish a tag/release or merge to main after explicit maintainer approval. The existing workflow validates pull requests without deploying them; a merge to main can deploy.

## Repository presentation handoff

Suggested About description: **Explore four decision-making preferences with a guided reflection assessment and browser-local progress.** Use the verified assessment URL for the website field. The existing [maintainer guide](MAINTAINER_GUIDE.md) contains topics and social-preview instructions.

Those fields are GitHub settings, separate from the website metadata and README. Documentation changes do not configure them. Preserve the existing security, support, attribution, and contribution files.

## Rollback

Before merge, closing the documentation PR leaves production unchanged. After an approved merge, revert the documentation commit through a new PR. Keep the previous working Pages deployment recorded. This documentation update does not change the application, scoring, saved-data format, package version, or license.
