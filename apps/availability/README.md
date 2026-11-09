# Public room availability

Read-only room capacity display, time navigation, mobile guidance and QR links.

## Development

From the repository root, run `npm ci`. Copy this directory's `.env.example` to `.env`, obtain approved development values privately, then run:

```sh
npm run dev:availability
```

Run `npm run build:availability`, `npm run typecheck:availability`, `npm run lint:availability` and `npm run test:availability` from the root. Availability has no automated behaviour suite yet; its test shortcut runs lint and types.

All `VITE_*` values are browser-visible. Keep configuration scoped to this app and never put server secrets in the frontend environment.

## Working on this application

- [Application architecture](docs/architecture.md)
- [Contributor guide](../../CONTRIBUTING.md)
- [System architecture](../../docs/architecture.md)
- [Deployment](../../docs/deployment.md)
