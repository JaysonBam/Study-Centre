# Study-Centre

Applications for room bookings and 3D printing operations, with separate staff tools and public viewers.

## Get started

Use Node.js 24.13 or later in the Node 24 release line, and npm 11. Install from this directory:

```sh
npm ci
```

Copy the `.env.example` in the application you want to run to `.env`, and set its local configuration. Obtain approved environment values privately from a maintainer. Then start that application:

```sh
npm run dev:bookings
```

## Applications

| Directory | Purpose | Start command | Local port |
| --- | --- | --- | --- |
| [apps/bookings](apps/bookings) | Staff bookings, collection desk and access management | `npm run dev:bookings` | 5173 |
| [apps/availability](apps/availability) | Public room availability | `npm run dev:availability` | 5174 |
| [apps/hexforge](apps/hexforge) | Staff printing workflow | `npm run dev:hexforge` | 5175 |
| [apps/printing-status](apps/printing-status) | Public project status and collection barcode | `npm run dev:printing-status` | 5176 |
| [apps/windows-helper](apps/windows-helper) | Optional Windows file companion | `npm run dev:helper` | Loopback API |

Each application keeps its own dependencies and can be built independently. Install dependencies from the repository root; one lockfile covers all workspaces.

## Find your way around

- [CONTRIBUTING.md](CONTRIBUTING.md): setup, commands, code changes and checks.
- [Web code structure](docs/web-architecture.md): feature ownership, API boundaries and shared contracts.
- [Architecture](docs/architecture.md): boundaries and which component owns each responsibility.
- [Deployment](docs/deployment.md): application build settings and migration cutover.
- [Public repository policy](docs/public-repository.md): what belongs in source control.
- [Migration verification](docs/verification.md): completed checks and their limits.
- `services/bookings/supabase/`: booking migrations, functions and reference schemas.
- `services/printing/supabase/`: printing migrations, functions, reference schemas and SQL tests.
- `packages/`: shared packages when multiple consumers need the same code.

Run `npm run check` for public-file/import checks, formatting, types, automated tests, performance regression, lint and builds. Booking browser tests are available separately with `npm run test:browser`. See the contributor guide for test configuration and checks requiring Windows or local backend services.
