# Migration verification

The monorepo starts with one clean Git history on `main`. There are no submodules, nested repositories or per-application Git histories. The previous repositories remain outside this source tree.

The subsequent [source parity audit](migration-parity.md) compares this structure with the preserved original source and distinguishes local verification from production cutover acceptance.

## Checks

Validated locally on Windows with Node.js 24.13.0 and npm 11.6.2:

- Clean dependency installation with `npm ci` using the root lockfile.
- `npm run check`: public-file scan, architecture and formatting checks, application/shared-contract TypeScript checks, 159 tool/application/helper tests, 53 printing performance regressions, lint regression gate and all application/shared-contract builds.
- `npm run test:browser`: 40 booking browser tests across desktop and mobile.
- Windows portable helper packaging and packaged smoke test: isolated startup, health, project folder creation, file discovery, workflow-folder move and process cleanup.
- All four web apps build independently with the shared contracts output removed, matching separate deployment builds.
- Public viewer loading, successful responses, navigation and service-error handling checked locally with artificial responses.
- Printing staff fixture renders dashboard, projects, intake/review, quote, production, collection, settings and login screens without browser exceptions.
- Relative documentation links and repository layout checks.
- Migration definitions retained with the same decoded SQL content. One legacy UTF-16 file was converted to UTF-8 for consistent tooling; no migration statement was changed.

The lint regression gate retains 79 pre-existing Bookings errors and 13 warnings. The other web apps have no current lint errors. `npm run lint:strict` exposes the complete existing findings; the normal gate fails on new errors. This is tracked debt, not a claim that strict lint is clean.

One booking error-toast assertion timed out during an earlier run. The next complete run and the final run after React runtime deduplication both passed all 40 tests; no production booking logic was changed to accommodate the assertion.

## Verification limits

Automated browser, database and performance tests use artificial data and simulated services or local in-process databases. They do not prove live Google sign-in, Gmail sending, hosted backend configuration, physical printer operation or workstation slicer integration. Confirm those with approved test data during the preview cutover described in [deployment](deployment.md).

CI is configured for the full application checks and browser suite on Linux, plus helper packaging and smoke on Windows. Hosted CI and deployments have not run as part of this local migration. Hosted backend data, migrations, secrets and authentication configuration have not been changed.
