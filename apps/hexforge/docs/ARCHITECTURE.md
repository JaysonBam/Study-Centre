# Architecture

## Applications and services

```text
HexForge web ── Supabase Auth / database / Storage
          ├── Gmail Edge Functions ── Google OAuth / Gmail API
          └── Windows File Helper ── local folders / slicers / printer media

Public 3D tracker ── restricted project-status RPC in HexForge Supabase
Bookings ── authorized collection and profile-access Edge Functions
```

The staff site is a client-rendered Vite SPA. Vercel rewrites route requests to `index.html`. The optional helper listens on `127.0.0.1`; application work can continue without it.

## Frontend map

Paths below are relative to `src/`. The `@/` import alias points to that directory.

| Location | Responsibility |
| --- | --- |
| `app/App.tsx` | Public routes and authenticated workspace routes |
| `app/providers/AppProviders.tsx` | Router/feedback globally; helper, projects, settings and technician session inside the authenticated workspace |
| `app/layout/Layout.tsx` | Navigation, staff identity, save feedback and helper connection |
| `pages/` | Home, project list, project workspace, settings, login and legal pages |
| `features/workflow/components/` | Intake, parts, payments, production and collection |
| `features/projects/context/` | Project loading, queued saves and workflow mutations |
| `features/settings/context/` | Shared suggestions, prices, modules and email settings |
| `features/gmail/` | Thread selection/cache, replies and attachment downloads |
| `features/local-files/` | Optional folder resolution, imports and media copying |
| `api/supabase/`, `api/google/gmail/`, `api/windows-helper/` | External service boundaries |
| `domain/` | Validation, state labels, quotes, filament sources and templates |
| `lib/slicer-parsers/`, `lib/reports/` | Bambu/Cura imports, quote PDFs and collection XLSX |

Primary routes are `/`, `/projects`, `/project/new`, `/project/:id` and `/settings`. A project's Overview, Parts, Payments, Production and Collection are in-page tabs. `/login`, `/auth-callback`, `/about`, `/privacy` and `/terms` are public.

## Data and workflow

`projects` stores intake/payment information and project state. `parts` stores materials, weights, verification, print and collection status. `print_runs` records each printing attempt. `project_cost_snapshots` preserves issued quote versions. `audit_events` stores workflow history. `config` holds shared settings; `profiles` is the staff access list. Storage holds part thumbnails and public email images.

Use `transition_project_state` and `transition_part_status` for managed state changes. SQL guards reject direct managed-state updates. These functions validate actions, enforce payment requirements, update related records and append audit events. Do not bypass them with browser-side writes. Ordinary field editing uses API adapters and context save queues.

An edit flows from a checkpoint to `ProjectContext`, then a Supabase API adapter. Ordinary edits are merged into a 600 ms save queue; transitions flush relevant edits before calling the RPC. Transition results update the local state, and failed writes refresh server data and expose a save warning. Keep this sequence when adding fields or actions.

Home reads lightweight project summaries with part statuses. Project routes read only the selected project's full record, parts, quotes and print runs; full projects remain distinct from summaries. Previously loaded views can display from memory during scoped revalidation. The Projects/report page retains its full workspace read. See [PERFORMANCE.md](PERFORMANCE.md) for measured before/after evidence and the test harness.

`parts."projectId"` references `projects.id`; print runs reference their part and project, and snapshots reference the project. Project deletion cascades parts, print runs and snapshots; the web deletion path also attempts thumbnail cleanup. Audit events retain project/part identifiers without foreign keys and are protected against mutation. Cancellation/archive preserves the project and its history.

Typical flow: review parts → quote → payment/approved production override → printing → collection → closed. Parts progress independently; failed attempts remain visible and can be retried. Production release requires an issued quote. Changed draft prices do not silently replace issued prices. Collection still requires a receipt when student payment is required, even when a production override was approved.

Each finished or collected part in Collection has a **Reprint** button. `RETURN_FOR_REPRINT` atomically marks that part ready, clears its current collection and printer assignment, and reopens/unarchives the project in production so it appears in the normal dashboard swimlane. Other parts, queue priority, receipt, issued quotes and prior print runs are preserved. The return audit event retains the previous collection details. Staff use the normal start/finish actions, then explicitly move the reprint to collection; other collected parts do not move the project out of production during the new attempt.

The current public tracker calls only `get_public_project_status`. The backend also defines `get_global_queue`, but the tracker does not call it. Keep public payloads restricted; never replace the status RPC with unrestricted staff-table reads.

## Authentication and integrations

Sign-in uses Google identity through Supabase. The callback checks a matching `profiles.email`, activates a pending profile and updates identity metadata. This frontend allow-list check is distinct from database authorization: current `projects` and `parts` policies allow the `authenticated` role, while profile policies restrict each user to their own email. Do not assume those table policies independently check membership of the staff list. The name selected in the header records the technician using the workstation; it is distinct from the authenticated account and is stored locally with a one-hour inactivity timeout.

Gmail uses `gmail-connection`, `gmail-oauth-callback` and `gmail-proxy`. Credentials are encrypted in service-role-only tables. The proxy validates the caller, allowed operation and rate limit. Cached project correspondence is in `project_gmail_messages` and `project_gmail_attachments`. Access to live linked threads is tied to the owning account. The retired `refresh-google-token` function has no source in the tracked repository and is not used by the current browser.

`bookings-profile-access` requires the caller's Bookings profile to have `authorisation = true` before administering HexForge profiles. `bookings-collection` requires an active Bookings profile and uses the printing backend for help-desk release/collection. Its `collect_project_parts` RPC updates selected parts atomically; `release_project_to_collection_from_bookings` handles release. Caller checks live inside these functions; preserve them when changing deployment settings.

The helper contract is `packages/contracts/src/helper.ts`, exported as `@study-centre/contracts/helper`. Web code imports this contract only, never privileged Electron/filesystem implementation. Helper requests use opaque IDs; exact browser origins, loopback binding, path containment and idempotency protect local operations.

Migrations in `services/printing/supabase/migrations/` are the deployment history and authority for deployed SQL changes. `services/printing/supabase/schemas/` contains declarative reference files used by CLI schema comparisons; editing them alone does not change a deployed database. They are not a complete replacement for the migration history: `collect_project_parts`, for example, is defined in `20260712100000_atomic_part_collection.sql` rather than the reference files. Review the latest migration that replaces a function before modifying it, and inspect generated diffs before applying them.
