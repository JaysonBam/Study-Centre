# HexForge printing workspace

Intake, parts, issued quotes, payment records, printing, Gmail correspondence, notes and collection.

## Development

From the repository root, run `npm ci`. Copy this directory's `.env.example` to `.env`, obtain approved development values privately, then run:

```sh
npm run dev:hexforge
```

Run `npm run build:hexforge`, `npm run typecheck:hexforge`, `npm run lint:hexforge` and `npm run test:hexforge` from the root. Use the existing fixture tests before changing behaviour.

All `VITE_*` values are browser-visible. Keep configuration scoped to this app and never put server secrets in the frontend environment.

## Working on this application

- [Application architecture](docs/ARCHITECTURE.md)
- [Contributor guide](../../CONTRIBUTING.md)
- [System architecture](../../docs/architecture.md)
- [Deployment](../../docs/deployment.md)
