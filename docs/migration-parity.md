# Source parity and cutover readiness

The monorepo is prepared to become the maintained source for all four websites, the Windows helper and both backend definitions. Publication and production cutover are separate steps. Existing deployments remain the rollback reference until preview acceptance is complete.

## Comparison reference

The comparison uses the preserved migration snapshots from the four original repositories: latest fetched `main` with reconciled local work. Those snapshots and the original working directories remain outside the public repository. This identifies the source reference; it does not establish which commit is currently running in production.

## Verified locally

- Runtime dependency versions match the original lockfiles. Version ranges were pinned; shared protocol imports now use the contracts workspace.
- CSS, logos, icons, fonts present in source and other application image assets retain their original bytes. The helper settings HTML/CSS and protocol were retained.
- All decoded SQL migration content and backend function source were retained. Backend configuration changes assign distinct local identities, ports and development redirects; they do not change hosted projects.
- All 68 original Bookings database-query occurrences have matching query shapes in its 53 adapter occurrences. All 37 printing query occurrences also match. The comparison checks methods, literal tables, selected fields and filter structure; it does not independently prove every payload value or execution ordering.
- Original and refactored applications were built with matching artificial data and clocks. There were 42 distinct route/state/viewport comparisons, including booking forms, access, collections, settings, reports, public/legal pages, printing intake/review/payments/production/collection, and public viewer success/error states. Desktop, mobile and dark mode were included.
- Rendered text, input values, DOM structure, geometry and sampled computed styles matched exactly in 40 comparisons. Two remaining observations were focus ownership between simultaneous frames and a 0.1-pixel inline-text measurement difference. These checks are not a pixel-by-pixel screenshot guarantee.
- The privacy-cleaned feedback contact wording can now reproduce the original text using private deployment configuration. Its matching desktop/mobile comparisons passed after configuration.
- The full repository check passed: formatting, import boundaries, TypeScript, 159 tool/application/helper tests, 53 printing performance regressions, lint regression gate and application builds. A fresh booking browser run passed all 40 desktop/mobile tests.
- Checked 731 local import paths for filename case; no mismatches were found. Hosted Linux CI still needs to run after publication.
- The current public-file scan and reachable Git history policy scan passed. Private configuration, original snapshots, comparison fixtures and generated captures remain excluded from Git.

Existing Bookings lint debt remains tracked separately in [verification](verification.md). The portable helper packaging and packaged smoke results are also recorded there.

## Configuration that preserves the current deployment

Retain each existing Vercel project's environment values and domains. Compare Production and Preview scopes separately; local recovered configuration is a candidate handover, not a copy of the hosting dashboard.

Bookings adds `VITE_SUPPORT_CONTACT_INSTRUCTION` for the existing feedback contact wording. Supply its original wording privately to preserve that text. Leaving it blank deliberately shows a generic support-team reference. The value is browser-visible, like other `VITE_*` settings, but is not stored in public source.

Keep the booking and printing backend connections distinct. Bookings also retains its separate printing collection/access configuration. Preserve public-viewer URLs, QR destinations, quote/payment/collection text, optional helper port overrides and support configuration. These values can change visible content or integrations even when the source is identical.

Domain-verification markers were intentionally excluded from public Git. Confirm continuing ownership verification through privately managed DNS or an equivalent approved mechanism before replacing a build that serves a verification file.

## Production acceptance

Use the existing four Vercel projects with the new repository and app roots in [deployment](deployment.md). Keep current production deployments available while validating previews. A new repository does not require moving the Supabase projects, their data, Auth users, Storage or functions.

Before production promotion, verify with approved test data:

1. Real staff Google sign-in, callback, sign-out and access restrictions.
2. Booking create/edit/delete, bulk/group operations, expiry, availability and collection/access communication with printing.
3. Printing intake, parts, quote/PDF content, payment records, production, collection, public status links and Gmail access/sending.
4. Helper connection from the approved browser origin, folder operations, slicer launch and a safe copy destination on the intended workstation.
5. Existing domains, direct SPA links/refresh, QR targets, domain verification and redirect/CORS/origin settings. Preview domains may need separately approved redirect/origin entries.

These live checks have not been performed by the fixture suites. Hosted account settings and production data were not modified during this audit.

After acceptance, make changes in this monorepo and keep the old repositories as historical references rather than maintaining both copies. Roll back a frontend through its retained Vercel deployment if needed; this source move requires no database rollback.
