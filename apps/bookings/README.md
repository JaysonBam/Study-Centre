# Staff bookings

Room bookings, room configuration, staff access and a printing collection desk.

## Development

From the repository root, run `npm ci`. Copy this directory's `.env.example` to `.env`, obtain approved development values privately, then run:

```sh
npm run dev:bookings
```

Run `npm run build:bookings`, `npm run typecheck:bookings`, `npm run lint:bookings` and `npm run test:bookings` from the root. Use the existing fixture tests before changing behaviour.

All `VITE_*` values are browser-visible. Keep configuration scoped to this app and never put server secrets in the frontend environment.

## Working on this application

- [Application architecture](docs/architecture.md)
- [Contributor guide](../../CONTRIBUTING.md)
- [System architecture](../../docs/architecture.md)
- [Deployment](../../docs/deployment.md)
