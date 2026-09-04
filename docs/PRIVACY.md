# Privacy and data handling

DMSI is designed to work without an account, server-side application, analytics service, or data collection endpoint.

## Data flow

| Data | Location | Lifetime | Leaves the browser automatically? |
|---|---|---|---|
| Ranked responses and progress | `localStorage`, key `dmsi-assessment-v2` | Until restart or site-data removal | No |
| Theme preference | `localStorage`, key `dmsi-theme` | Until site-data removal | No |
| Results summary | Clipboard, only after Copy | Controlled by the browser and operating system | No |
| Full result report | Local text file, only after Download | Controlled by the participant | No |
| Printed result | Browser print workflow, only after Print | Controlled by the participant and print destination | No |

The application does not request names, email addresses, student identifiers, demographic information, or authentication credentials.

## Network behavior

The production page loads its HTML, CSS, JavaScript, and images from the same GitHub Pages origin. It has no external fonts, scripts, images, tracking pixels, analytics, advertising, APIs, or form submissions. The Content Security Policy sets `connect-src 'none'` and `form-action 'none'` as defense-in-depth controls.

GitHub Pages, the participant's network, and the browser may independently produce standard infrastructure logs. Those systems are outside the DMSI application and are governed by their respective providers.

## Participant control

Selecting **Clear my responses and start again** removes the saved assessment state. Clearing browser data for the site removes both assessment and theme storage. Private browsing behavior depends on the browser.

Exported, copied, or printed results are outside the application's control after the participant creates them. Instructors should not require students to disclose complete ranked responses when a score summary or private reflection would meet the teaching objective.

## Contributor requirement

Any proposal that introduces analytics, telemetry, remote storage, accounts, third-party resources, or new browser permissions requires an explicit privacy review, visible participant disclosure, documentation updates, and project-owner approval.

