# Working on the web apps

All four web apps follow the same five source-area conventions; a small app creates `shared/` only when it has shared code. Keep related work close together and add a directory only when it has a useful owner.

```text
src/
  app/        startup, route composition, providers and overall layout
  pages/      route-level composition and static pages
  features/   feature components, hooks, actions, state and pure model functions
  api/        application operations and external-service adapters
  shared/     app-wide UI, contexts, events and reusable model/helpers
```

Each app keeps its own package, environment, Vite build and Vercel project root. The repository still has one Git history. There is no shared frontend server and no application imports another application's internals.

## Find the right owner

| Change | Start here |
| --- | --- |
| Booking form layout | `apps/bookings/src/features/bookings/components/BookingPanel.tsx` |
| Booking draft, room selection and available durations | `apps/bookings/src/features/bookings/hooks/useBookingDraft.tsx` |
| Single/group/bulk saves and deletion | `apps/bookings/src/features/bookings/hooks/useBookingActions.tsx` |
| Booking date/time validation shared with settings | `apps/bookings/src/shared/lib/bookingEntry.ts` |
| Room recommendations | `apps/bookings/src/features/bookings/model/roomRecommendations.ts` |
| Booking database operations | `apps/bookings/src/api/bookings.ts` |
| Printing collection requests from Bookings | `apps/bookings/src/api/printingCollections.ts` |
| Printing intake, quotes, production and collection | `apps/hexforge/src/features/workflow/components/` and `hooks/` |
| Project cache, save queues and transitions | `apps/hexforge/src/features/projects/context/ProjectContext.tsx` |
| Printing API operations and application-facing project types | `apps/hexforge/src/api/` |
| Gmail UI, mailbox state and orchestration | `apps/hexforge/src/features/gmail/components/`, `state/`, `actions/` and `hooks/` |
| Public availability lifecycle | `apps/availability/src/features/availability/hooks/useAvailability.ts` |
| Public printing fetch lifecycle and display rules | `apps/printing-status/src/features/project-status/hooks/` and `model/` |
| Local helper protocol or common printing status values | `packages/contracts/src/` |

## Components, hooks and rules

Pages compose features. Feature components render UI and keep small presentation state, such as whether a dialog is open. Hooks own React lifecycle, draft state and user interactions. Actions coordinate asynchronous work that does not need to be a React hook. State/context modules own shared feature state. Model files hold calculations, validation and selectors without React lifecycle or service SDK calls. File parsers and document generators live in feature `lib/` directories.

Not every feature needs all these folders. Keep a small static page self-contained. Split large code by responsibility rather than adding a controller/service/repository wrapper to every function.

The project context intentionally keeps its existing save queues, mutation ordering and cache reconciliation together. The two booking soft-state helpers also retain their existing distinction: one works with database day/time fields, the schedule helper works with already-combined timestamps. Do not unify these behaviours incidentally while moving files.

## External services

Components and hooks call semantic operations from `api/`. Supabase configuration, SDK clients and raw credentials remain in `api/_internal/`; Gmail and the local helper have their own API modules. Shared code and API modules must not depend on feature components or routes.

The booking collection/access adapters deliberately send the booking session to designated printing functions with the printing project's public key. Printing staff calls use their own session. Public viewers use restricted public capabilities. The loopback helper never receives a cloud bearer token. Gmail provider credentials remain server-owned.

API result shapes and existing error handling are preserved so a structural move does not change the application's failure behaviour. Public auth methods expose application-facing identity/session information; the printing API's provider-session accessor is private to API implementations.

Authorization, overlap constraints, payment gates and authoritative workflow changes remain backend responsibilities. Changing a frontend folder or type does not change those rules or deploy a backend.

## Types and imports

- Keep component-only props beside their feature/component. Feature-only draft and presentation types stay with their owner.
- Application-facing API types stay in `api/`; they do not require UI feature imports. Public printing responses are distinct from staff project models.
- `@study-centre/contracts/helper` is the single runtime protocol shared by the helper and printing frontend. `@study-centre/contracts/printing` owns shared printing status/source types. The contracts package has no React or provider SDK dependency.
- Use `@/` for imports across source areas/features and relative imports inside a feature. All four web apps configure the same alias. Each build also deduplicates React and React DOM to the owning app's installed versions, so hoisted UI dependencies use the same React runtime as their renderer.
- Prefer explicit module imports. Do not add an application-wide export barrel.

`npm run check:architecture` checks source areas and import direction, including SDK/private-client boundaries and React-free model modules. `npm run format` and `npm run format:check` use the shared formatting configuration. Historical migrations and source assets are excluded from automatic formatting.

## Tests and builds

Pure module tests live beside their implementation as `*.test.ts`. Cross-module/backend tests live in `tests/integration/`; browser tests are in `tests/e2e/`. The helper retains its small filesystem/API test suite in `tests/`. Production TypeScript compilation excludes colocated tests, matching the previous separation of app builds and test execution.

Run `npm run build:contracts` before directly testing a consumer in a fresh checkout. Root `npm test` and `npm run build` handle this ordering. Use the commands in [CONTRIBUTING.md](../CONTRIBUTING.md) for full verification.

## Local helper

The helper preserves Electron's process boundaries:

```text
src/
  main/
    app/           startup and IPC registration
    api/           loopback HTTP server
    config/        workstation settings persistence
    features/      folder/file/copy operations
    integrations/  Windows and slicer operations
    shared/        logging and opaque identifiers
  preload/         restricted IPC bridge
  renderer/
    app/           settings page entry
    api/           typed access to the preload bridge
    features/      settings form and DOM interactions
```

The helper build clears only its generated `dist/`, compiles the main/preload code and bundles the sandboxed renderer. The bundle includes the shared protocol, so the browser context does not need Node package resolution. Existing workstation configuration and executable identity are preserved.
