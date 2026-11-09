# Google sign-in configuration

The app uses Google only for staff identity through Supabase Auth. `src/features/auth/components/LoginScreen.tsx` requests `openid email profile`. It does not request Gmail, Drive, Calendar, Contacts, or other Google content APIs. Collection email previews are copied by staff; they do not use Gmail API access.

## Configuration map

| Location | Configure or verify |
| --- | --- |
| Google Auth Platform / Google Cloud OAuth client | App name, support/contact email, audience, identity scopes, authorized domains, Supabase callback |
| Supabase Auth → Google provider | OAuth client ID and secret from the correct Google project |
| Supabase Auth → URL configuration | Production site URL and allowed app redirect `${appOrigin}/login` |
| Google Search Console | Ownership of the production domain, when required for authorized domains |
| Public website | `/about`, `/privacy`, `/terms`, and `/login` accessible before sign-in |

Use the actual Vercel production domain for public consent links. Do not copy a placeholder domain into production. The Google OAuth client redirect is the Supabase callback:

```text
https://<bookings-project-ref>.supabase.co/auth/v1/callback
```

The application return URL is `/login` on the app's origin. It is a separate setting from Google's Supabase callback. Keep development localhost URLs in the development client/allow-list as appropriate, and match Vite's actual port. OAuth client secrets stay in provider/server configuration, never in `VITE_*` variables.

The consent app name should match the department-approved website name. Use monitored support/developer contacts and an approved logo. Choose Internal audience only when all permitted accounts belong to the relevant Google Workspace organization; otherwise configure External audience and follow Google's applicable publishing/verification process.

Domain ownership verification files are deployment configuration and are maintained privately. Preserve the existing hosted verification method during cutover.

## Data and permissions

| Data | Use/storage |
| --- | --- |
| Google email, Auth ID, display name, avatar | Sign-in/session identity; `profiles` email allow-list and identity fields |
| Administrative flags and `access_expires_at` | Settings, Analytics, Access Control, expiry/deactivation |
| Booking dates/times, rooms/courses, student numbers/count, staff, borrowed items, state/group | Operational room use and reports in `bookings` |
| Room capacities, availability, issues, items; course colors; hours/testing clock | `rooms`, `courses`, `settings` |
| Feedback/reporter/status/votes/admin update | `bugs` |
| Optional creation/transition timing details | `logs` when `VITE_LOGGING_ENABLED=true` |
| Theme preference and Auth session | Browser storage; theme key `booking-theme-mode` |

Students do not sign into this staff app. Authorized staff use operational pages; profile flags control administration. Database RLS and backend checks enforce access. HexForge's separate printing and collection data are covered by its own documentation; Bookings invokes its approved collection/access functions.

## Before publishing or changing auth

- Confirm only the required identity scopes in code and consent configuration.
- Verify the correct Google client/Supabase project pairing and exact callback.
- Verify the app origin and `/login` in Supabase's allowed redirects.
- Check that overview/privacy/terms links are public, correct, and approved by the departmental owner.
- Confirm domain ownership, contacts, app name, audience, and any required Google verification.
- Test an approved primary account and a denied account. Confirm sign-out and access expiry.
- Have the departmental owner approve retention/contact language when the data collected changes.

Authoritative references: [Google identity scopes](https://developers.google.com/identity/protocols/oauth2/scopes), [Google Auth Platform audience](https://support.google.com/cloud/answer/15549945), [OAuth clients and redirects](https://support.google.com/cloud/answer/15549257).
