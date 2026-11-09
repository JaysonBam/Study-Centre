# Public printing status

Read-only project status, issued quotes, payment messages, parts and collection barcodes. A project code is required.

## Development

From the repository root, run `npm ci`. Copy this directory's `.env.example` to `.env`, obtain approved development values privately, then run:

```sh
npm run dev:printing-status
```

Run `npm run build:printing-status`, `npm run typecheck:printing-status`, `npm run lint:printing-status` and `npm run test:printing-status` from the root. Use the existing fixture tests before changing behaviour.

All `VITE_*` values are browser-visible. Keep configuration scoped to this app and never put server secrets in the frontend environment.

## Working on this application

- [Application architecture](docs/architecture.md)
- [Contributor guide](../../CONTRIBUTING.md)
- [System architecture](../../docs/architecture.md)
- [Deployment](../../docs/deployment.md)
