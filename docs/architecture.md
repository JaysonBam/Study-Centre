# Architecture

## Applications and boundaries

The repository contains five separately built applications. A shared repository lets a pull request update a contract and its consumers together; it does not combine their runtime processes or access permissions.

| Component | Owns | Connects to |
| --- | --- | --- |
| `apps/bookings` | Room booking, availability settings, staff access and collection desk | Booking backend; printing collection/access functions |
| `apps/availability` | Public room availability display | Booking availability function and public settings |
| `apps/hexforge` | Intake, quotes, payments, printing, correspondence and collection | Printing backend; optional local helper |
| `apps/printing-status` | Public project progress, issued quote and collection barcode | Restricted printing status RPC |
| `apps/windows-helper` | Local workflow folders, slicers and printer media operations | Loopback requests from approved browser origins |

`services/bookings/supabase` and `services/printing/supabase` are separate backend projects. Each owns its own migration history and functions. `schemas/` contains reference definitions; `migrations/` is the authoritative upgrade path.

## Contracts to preserve

- Availability calls `slots-available-` and displays aggregate capacity. Staff booking operations remain authenticated.
- The printing viewer calls `get_public_project_status`. Public project links must not expose staff notes, private student details, file paths or credentials.
- The booking collection/access clients call the printing backend's `bookings-collection` and `bookings-profile-access` functions. Those functions validate the booking caller before acting on printing data.
- Printing state changes use backend transition functions. Payment gates, audit events, issued quote snapshots and print attempts remain server-controlled.
- Gmail credentials and token exchange belong in server functions. Browser code uses the scoped proxy and must never receive service credentials or Google refresh tokens.
- `@study-centre/contracts/helper` exports the helper protocol to both the printing frontend and the Electron helper. The frontend does not depend on the Electron app.

## Code map

All four web apps use `src/app/`, `src/pages/`, `src/features/`, `src/api/` and `src/shared/`. See [working on the web apps](web-architecture.md) for responsibilities, feature entrypoints, import rules, tests and the simpler helper layout.

The shared protocol and common printing status types live in `packages/contracts/`. Each application owns its API adapters and dependencies. The root package supplies common commands and one lockfile. Each web app retains its own build and deployment root.

## Change ownership

A frontend-only change belongs to its app. A database/function change belongs to the relevant service and requires checks for affected clients. A helper protocol change requires both the helper and printing frontend checks. Keep releases compatible: one repository commit does not make independently deployed components update atomically.
