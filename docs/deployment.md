# Deployment and cutover

The four web apps build separately. The helper is a Windows executable; the two backend projects have independent deployment histories. Actual hosting accounts, project references, domains and environment values are maintained privately.

## Web build configuration

For Vercel, connect each existing web project to the new repository and set its Root Directory to the appropriate `apps/<application>` folder. Enable access to source outside the Root Directory for workspace dependencies. Use Node 24, npm and the root lockfile. Leave dependency installation at the workspace-aware default; if overriding, run `npm ci` from the repository root. Do not create app-local lockfiles.

| Application | Root Directory | Build command | Output |
| --- | --- | --- | --- |
| Bookings | `apps/bookings` | `npm run build` | `dist` |
| Availability | `apps/availability` | `npm run build` | `dist` |
| Printing staff | `apps/hexforge` | `npm run build` | `dist` |
| Printing status | `apps/printing-status` | `npm run build` | `dist` |

Each app contains a `vercel.json` with the same build/output conventions and a SPA rewrite. The printing app's former root-level `build:web` command and `web/dist` output path no longer apply. Keep environment variables scoped to the appropriate app and deployment environment. All `VITE_*` values are browser-visible build inputs; never use them for service credentials or OAuth secrets.

Prefer reconnecting the existing four Vercel projects so their domains and environment assignments remain associated with the same projects. Review old dashboard overrides: a saved build command or output path can override the intended monorepo settings. Keep current production deployments available while validating previews. See [source parity and acceptance](migration-parity.md) for the comparison results and release checks.

Bookings adds `VITE_SUPPORT_CONTACT_INSTRUCTION` to retain the original feedback contact wording without committing personal details. Obtain its value privately; an empty value uses generic support wording. Preserve all other existing per-app settings, including public link/QR targets and quote contact/payment details. Local candidate values must be compared with the existing hosting environment before use.

Vercel documents the separate-project/root-directory model in [monorepo deployment](https://vercel.com/docs/monorepos). Supabase documents [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls); changing Git repositories alone does not change those URLs, while changing domains can require allowed-redirect updates.

## Cutover order

1. Run `npm ci`, `npm run check` and `npm run test:browser` in a clean checkout.
2. Review the public-file scan and commit contents. Keep private configuration and captured data out of the repository and its history.
3. Push to the selected repository. Verify repository access, default branch and deployment permissions.
4. Configure preview builds for each app using the new roots. Keep current production deployments available for rollback. Reconnecting a production branch may trigger a release; use the hosting provider's deployment controls during setup.
5. Confirm existing environment values are still assigned correctly. Test staff sign-in, booking create/edit, availability, printing workflows, project status links and the optional helper with approved test data.
6. Confirm direct SPA links, browser refresh, redirects, approved origins and helper connectivity. If actual domains remain unchanged, existing redirect/origin settings should usually continue to apply. Preview URLs may require separately approved development origins.
7. Release the frontends, monitor their existing operational checks, and retire the old source repositories only after the cutover is accepted.

Moving source directories does not require a hosted database migration, data transfer, Auth reset or Edge Function redeployment. Do not deploy the backend simply because its files moved. Existing migrations must not be replayed into production. Retain current provider project settings and compare migration histories before any later backend release.

Provider-specific domain verification files were excluded from the public source snapshot. Preserve existing domain ownership verification privately in the hosting configuration or use a privately maintained DNS verification record before releasing a replacement build.

## Backend command locations

Use the root-installed Supabase CLI with the correct working directory, for example:

```sh
npx supabase --workdir services/bookings --help
npx supabase --workdir services/printing --help
```

Confirm command flags with `--help` before running backend operations. Link a hosted project only as a separate intentional operation, using the privately maintained project reference. Runtime secrets remain in private provider configuration.

## Local backends

Docker is required for local Supabase. Local config files use distinct project names and port ranges: bookings uses 543xx and printing uses 553xx. These names are local identifiers, not hosted project references.

Start only the backend you need, using `start` with its `--workdir`. Confirm the resulting local URLs with CLI status, then put those values in each consuming app's ignored `.env`. Printing and printing-status share the printing project; bookings and availability share the booking project. Bookings also needs the printing project's public connection configuration for its collection/access clients.

Printing functions have a separate `.env.example` for local server secrets. Copy it to the ignored service `.env` and supply development-only values. Initial users, provider OAuth settings, allowlists and service secrets are private setup tasks; they are not seeded with real identities in this repository.

## Windows helper

Run `npm run package:helper` on Windows and `npm run smoke:helper` against the packaged result. The executable is `apps/windows-helper/release/HexForgeFileHelper.exe`. Releases and workstation configuration are distributed separately; build output is ignored by Git.
