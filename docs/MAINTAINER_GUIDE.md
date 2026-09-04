# Maintainer guide

This guide covers one-time GitHub settings and the repeatable release work that cannot be encoded entirely in repository files.

## GitHub repository profile

Configure the repository **About** panel with these values:

- **Description:** Free, private Decision-Making Style Inventory for students, educators, and creative teams.
- **Website:** `https://mralexgarrido.github.io/dmsi/`
- **Topics:** `decision-making`, `self-assessment`, `creative-teams`, `education`, `classroom-tool`, `vanilla-javascript`, `accessibility`, `privacy-first`, `github-pages`
- **Social preview:** Upload `assets/social-card.png`

The description, website, topics, and social preview are GitHub repository settings. They are not derived from `README.md` or the deployed page. See GitHub's guidance for [classifying a repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) and [customizing a social preview](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

## Recommended controls

- Keep GitHub Pages configured to deploy through GitHub Actions.
- Add a `main` branch ruleset that requires the validation job to pass and blocks force pushes and branch deletion.
- Enable private vulnerability reporting so the link in `SECURITY.md` is available to outside reporters.
- Keep Dependabot alerts and security updates enabled.
- Disable the wiki if it is not actively maintained. Durable documentation belongs in the versioned `docs/` directory.
- Enable Discussions only when there is enough participation to moderate a second support channel.

## Release checklist

1. Update `package.json`, `CITATION.cff`, structured data, and `CHANGELOG.md` to the same version.
2. Update `sitemap.xml` only when the canonical page materially changes.
3. Run `npm run check` and `npm run build`.
4. Review the pull request in both themes at desktop and mobile widths.
5. Merge only after required checks pass.
6. Confirm that the GitHub Pages deployment completed successfully.
7. Verify the canonical page, social image, manifest, sitemap, `llms.txt`, and `/.well-known/security.txt` on the public origin.
8. Create a Git tag and GitHub release for meaningful versions, using the matching changelog entry.
9. Refresh social-card caches through the relevant platform debuggers when preview content changes.

## Search registration

The site can be crawled without registering with a search platform, but verification provides diagnostics and faster issue discovery.

- Add the URL-prefix property `https://mralexgarrido.github.io/dmsi/` to Google Search Console and submit `sitemap.xml`.
- Add the site to Bing Webmaster Tools and submit the same sitemap.
- Use each platform's URL inspection tool after a material release. Indexing is controlled by the search engine and is never guaranteed by a meta tag or sitemap alone.
- Do not add a verification token to the repository until the platform provides the exact token for this property.

