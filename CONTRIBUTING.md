# Contributing

This guide applies to contributors working directly or with coding assistants. Start with [architecture](docs/architecture.md), then read the README and relevant feature guide beside the application you are changing.

## Setup

1. Install Node.js 24.13+ within Node 24 and npm 11.
2. Run `npm ci` at the repository root.
3. Copy the relevant application's `.env.example` to `.env`. Keep actual configuration private. Each app reads its own environment; there is no shared frontend `.env`.
4. Run `npm run dev:<application>` using the names in the root README. Separate ports allow all four websites to run together.

The web apps need their configured backend to use authenticated features. For an isolated backend, see [deployment](docs/deployment.md#local-backends). Use approved development data. The availability app can read a real backend if you configure one; its development proxy does not provide simulated data.

## Everyday commands

Run these from the root:

| Command | What it checks |
| --- | --- |
| `npm run typecheck` | TypeScript in all apps and shared contracts |
| `npm run check:architecture` | Source ownership and import boundaries |
| `npm run format:check` | Shared source formatting |
| `npm test` | Existing application and helper unit/integration tests |
| `npm run test:performance` | Printing API/cache/Gmail regression with fixtures |
| `npm run test:browser` | Booking browser tests using simulated service responses |
| `npm run lint` | ESLint regression gate against the verified migration baseline |
| `npm run lint:strict` | Full ESLint output, including existing errors |
| `npm run build` | All four websites and helper compilation |
| `npm run check:public` | Common sensitive-file and literal checks |
| `npm run check` | Public/import checks, formatting, types, tests, performance regression, lint and builds |
| `npm run package:helper` | Build a portable Windows executable |
| `npm run smoke:helper` | Exercise the packaged helper on Windows |

For a single app, use `npm run build:hexforge` or `npm run typecheck:bookings`. Any package script can also be run with `npm run <script> --workspace apps/<application>`. Availability currently has no automated behaviour suite; `npm run test:availability` runs lint and types. Check its loading/error states, time navigation, mobile dialogs and QR destination manually when changing its behaviour.

Booking browser tests use installed Microsoft Edge by default. `BOOKINGS_TEST_BROWSER_CHANNEL=chromium` uses Playwright's browser after `npx playwright install chromium` (other supported channels may also be selected). These tests run on a separate fixture port. They do not require production credentials. The performance regression also uses fixture data; it does not send email or call production.

## Git workflow

This is one Git repository with one `main` branch. Applications, shared packages and backend services are ordinary directories. There are no submodules, nested repositories or separate app histories to manage.

For a change, create a short feature branch from current `main`, make the change, run the relevant checks and merge it back. A pull request is useful for review or handover even with one maintainer. Use small descriptive commits and avoid long-lived per-application branches. The clean initial commit starts the monorepo history; the previous repositories remain available separately for historical reference.

## Changing code

Follow [the common web structure](docs/web-architecture.md). Run `npm run check:architecture` to check import boundaries and `npm run format:check` to check formatting. Unit tests are colocated; integration tests and browser tests stay in their respective app test directories. Root commands build shared contracts before their consumers.


- Keep feature code inside the owning application. Public viewers receive restricted backend responses; do not import staff-only application internals into them.
- Declare direct dependencies in the workspace that imports them. Use `npm install <dependency> --workspace apps/<application>` from the root and commit the resulting root lockfile.
- Existing apps intentionally use different React, UI and Vite versions. Upgrade them deliberately, separately from structural moves.
- Create a shared package for a stable contract or implementation needed by multiple consumers. Name it explicitly, declare consumer dependencies and document its checks. Avoid broad shared utility buckets.
- When a response contract changes, update its backend, every consumer and meaningful regression checks together. Roll out backward-compatible backend changes before dependent frontends.
- Preserve workflow transitions, authentication checks, data visibility boundaries, queued saves and issued quote history. Read the existing tests before changing those paths.
- Historical database migrations are the upgrade record. Add a new migration for a schema change; do not rewrite deployed migrations or use reference schema files as a replacement.

Before proposing a change, run checks for affected components. For workspace/configuration changes, run `npm run check` and booking browser tests. Helper packaging and the packaged smoke test require Windows. Report which checks passed and any check that could not run; a mock test does not prove a production integration works.

The migration preserves 79 existing lint errors in Bookings. `scripts/lint-baseline.json` records their file, rule, message and count; the root lint command fails when a new error appears. It does not disable any lint rule. Fix these incrementally and remove resolved baseline entries; do not regenerate the baseline to accept new failures. Application-level lint commands remain strict. Backend functions are outside the frontend lint scope. This refactor relocated the same known findings; it did not increase their rule/message counts.

Bookings' TypeScript configuration resolves hoisted library declarations against its own React 18 definitions. Other apps keep React 19. The root editor overrides retain the original compatible Tiptap 3.26 dependency family, including transitive extensions. Update that family together when deliberately upgrading the editor.

## Documentation and public files

Keep setup instructions here and feature-specific explanations next to their application. Use generic examples, fixture identities and relative links. Production URLs, account/project identifiers, real contact details, credentials, exports, workstation paths and captured user data belong in private operational records. Read [the public repository policy](docs/public-repository.md) before adding assets, fixtures or deployment notes.
