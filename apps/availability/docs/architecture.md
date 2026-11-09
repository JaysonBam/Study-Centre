# Architecture

This guide describes the source contract. Verify the target backend before a backend change.

## Scope and request flow

This is a React 19 / TypeScript / Vite single-page frontend with no login, router, database writes or booking forms.

```text
Browser → Supabase Edge Function slots-available- → availability response
Browser → room cards, time navigation, mobile information dialogs
```

`src/pages/availability/AvailabilityPage.tsx` composes feature UI and `useAvailability`. The hook calls `src/api/availability.ts`, which invokes `slots-available-` with `{ date: "YYYY-MM-DD" }`. Backend source lives at `services/bookings/supabase/functions/slots-available-/index.ts` at the repository root. Coordinate response changes with that backend before changing the frontend.

The browser receives aggregate counts, not room IDs, student identities or booking records. The function uses server-side access to Bookings `settings`, `rooms` and `bookings`; the frontend must never receive its service-role key. This frontend build does not deploy the backend migrations or functions.

The date currently comes from `new Date().toISOString()` (UTC), while opening-hours checks and the selected time use the browser's local clock. Keep display devices in the center's timezone. The mismatch can affect displays around local midnight; account for it when modifying date handling.

## Availability contract

The response types are in `src/api/types.ts`:

| Field | Meaning |
| --- | --- |
| `operation_hours` | Weekday `start` / `end`, formatted `HH:MM`. |
| `saturday_hours` | Saturday `start` / `end` and `enabled`. |
| `totals` | Capacity for `open room`, `closed room`, `boardroom`. |
| `grid` | Ordered slots with `start`, `end` and availability for those room types. |
| Duration counts | Counts keyed by minutes: `120`, `90`, `60`, `30`. Cards sum all returned counts, but display only those four keys. |

All three room keys must appear in `totals` and every slot's `availability`, even when their counts are zero. Times must remain zero-padded `HH:MM` because the frontend compares them as strings. `src/api/types.ts` supplies compile-time types only; fetched data is not validated at runtime.

Keep counts in distinct duration buckets to avoid counting the same room twice. Room totals and operational hours come from the backend; group-size guidance and booking rules in the help dialog are hard-coded and must be kept aligned with the booking application's settings.

The deployed version counts enabled rooms whose `min_people` is exactly 2, 4 or 6. It intentionally excludes availability of only 30 minutes. Ended intervals look ahead from the next half-hour, so confirm the actual booking time at the desk rather than treating the displayed counts as a reservation. On Saturdays, returned `operation_hours` is replaced by the Saturday schedule.

The frontend treats Sunday as closed and Saturday according to `enabled`. During opening hours, refresh selects the current slot or the next available slot. Refresh also resets any manually selected slot. After-hours replaces the entire normal page with the closed screen. Initial loading replaces the page; later refresh keeps existing cards visible until it finishes. A fetch error replaces the page with **Unavailable**, including after an earlier successful fetch.

## File map

| File | Responsibility |
| --- | --- |
| `src/pages/availability/AvailabilityPage.tsx` | Route-level composition of availability UI. |
| `src/features/availability/hooks/useAvailability.ts` | Fetch lifecycle, current slot, hours checks, refresh and live mode. |
| `src/api/availability.ts` | Public availability operation. |
| `src/api/_internal/supabase.ts` | Public Supabase client; development uses the page origin. |
| `vite.config.ts` | Development `/functions` proxy. |
| `src/api/types.ts` | Backend response types. |
| `src/features/availability/model/time.ts` | Time formatting, count sum, color thresholds and duration labels. |
| `src/features/availability/components/Header.tsx`, `MobileNav.tsx` | Desktop/mobile time navigation and refresh state. |
| `src/features/availability/components/RoomCard.tsx`, `QRCodeCard.tsx` | Availability and QR display. |
| `src/features/availability/components/HelpWidget.tsx`, `OperationalInfoWidget.tsx` | Mobile booking guidance and opening hours. |
| `src/features/availability/components/StatusScreens.tsx` | Loading, unavailable and closed screens. |
| `src/features/availability/components/styles.ts`, `src/index.css` | Layout, colors and shared styling. |
| `src/main.tsx`, `index.html`, `public/MISC-CDIO.png` | React entry point, document title and favicon. |
| App `package.json`, root `package-lock.json` | Commands and reproducible workspace dependencies. |

## Runtime behavior

- Both Instagram variables are optional, but without either the rendered operational link has an empty destination.
- `Ctrl+L` toggles five-second polling. Each fetch can reselect the current slot. The closed screen still polls if live mode was already enabled.
- Opening hours are reevaluated only when data is fetched. Refresh or live mode is needed for an unattended display to switch between open and closed automatically.
- Desktop is the kiosk layout; the QR card is hidden on mobile. Help and Hours buttons are hidden on desktop. Mobile arrows remain visible during live mode.

## Current limitations to account for

- The exported availability function returns only `{ "message": "Closed on Saturdays" }` with HTTP 200 when Saturday is disabled. `features/availability/hooks/useAvailability.ts` expects a complete availability response and reads `saturday_hours` and hours from it. Verify this path explicitly; it is not a guaranteed closed-screen response.
- Group-size labels, help rules and duration labels are hard-coded. Changing backend room categories or booking policy alone will not update them.
- Date selection uses UTC but hours use the device's local timezone. There is no date picker or server-synchronized clock.
- `Ctrl+L` can be intercepted by the browser's address-bar shortcut. Confirm it reaches the page on the actual display device; live mode is not persisted after reload.
- Zero room capacity can produce an undefined progress percentage (`0 / 0`), although the count and zero-availability color still render. Include an empty category in UI verification.

See [development](development.md) for change locations and verification, and [maintenance](maintenance.md) for incident handling.
