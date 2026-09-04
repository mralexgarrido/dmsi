# Security policy

## Supported version

DMSI is a continuously deployed static application. Security fixes are applied to the latest version on the `main` branch and the public GitHub Pages site. Earlier commits and forks are not maintained by this project.

## Report a vulnerability

Please report suspected vulnerabilities through a [private GitHub Security Advisory](https://github.com/mralexgarrido/dmsi/security/advisories/new). Do not open a public issue or pull request that reveals an unpatched vulnerability.

Include, when possible:

- The affected page, file, or commit
- Clear reproduction steps
- The security or privacy impact
- A minimal proof of concept
- Any suggested remediation

The maintainer aims to acknowledge a complete report within seven days. Resolution time will depend on severity and complexity. Please allow a reasonable remediation period before public disclosure.

## Security model

DMSI has no server-side application, user accounts, database, analytics, advertising, third-party scripts, or form submissions. Responses and theme preferences are stored in the browser. Participants can explicitly create a local text download, use the clipboard, or invoke the browser's print workflow.

The site applies a restrictive Content Security Policy and is deployed through GitHub Pages. A report is in scope when it could compromise the hosted project, execute unintended code, expose locally stored assessment responses, alter scoring without detection, or compromise the deployment workflow.

General GitHub Pages or browser vulnerabilities should be reported to the relevant vendor.

