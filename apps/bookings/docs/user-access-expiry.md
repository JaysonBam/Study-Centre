# User access expiry

`profiles.access_expires_at` is nullable: `NULL` means permanent access; an expired timestamp means inactive. The migration is `services/bookings/supabase/migrations/20260930160000_user_access_expiry.sql`.


## Staff controls

- Add a primary Google account with `Never`, `8 hours`, `24 hours`, or `7 days`. The duration begins when saved using database time.
- `Set expiry date` restarts the chosen duration when saved.
- `Deactivate` expires access immediately. The profile remains under `Inactive users`.
- `Activate` assigns a new duration and retains identity and permissions.
- `Delete` removes the application's allow-list profile, not the Google account.
- `pending` means the allowed account has not completed its first sign-in. It is separate from inactive/expired access.

Only staff with current `authorisation` access can change expiry or administrative permissions. Existing permanent users retain permanent access. Desktop expiry labels expose an exact-time tooltip; relative labels are refreshed when the page renders, not as a live countdown.

## Enforcement

The migration adds restrictive RLS guards and expired-write rejection to `profiles`, `bookings`, `rooms`, `courses`, `settings`, `bugs`, and `logs`. Checks use current database state on every request, including old JWTs. `set_profile_access_expiry` applies durations and adds profiles atomically. Ordinary users may update permitted Google identity details but cannot grant permissions or extend their own access.

The application rechecks access on navigation, browser focus/visibility, once per minute, and at a known expiry deadline. It returns users to sign-in when access ends. Existing HexForge integrations validate a booking profile; expired booking callers fail those checks. Independent access for direct HexForge sign-in remains separate.

## Regression checks

Use Node.js 24, `npm ci`, then `npm test`, `npm run test:browser`, and `npm run build`. Tests apply the complete migration history to local PGlite and simulate Auth, HTTP, and HexForge responses. They do not use production credentials or services.

Maintain coverage for permanent/pending users, expiry with an already-open session, deactivation/reactivation, permission changes, denied expired writes, unchanged booking CRUD, maintenance, bug votes, settings, and protected navigation. Browser tests use installed Edge; `BOOKINGS_TEST_BROWSER_CHANNEL=chrome` selects Chrome. Generated results remain ignored by Git.
