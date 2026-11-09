# Shared contracts

This workspace owns protocol and status definitions that have real consumers across application boundaries. It has no React, service SDK, credentials or deployment configuration.

- `@study-centre/contracts/helper`: loopback protocol, guards and constants used by the helper and printing frontend.
- `@study-centre/contracts/printing`: common printing state/status/source types.

Run `npm run build:contracts` from the repository root to produce the JavaScript used by Node/Electron tests and packaging. Vite browser builds consume the TypeScript source directly, so an individual web app can build in a fresh Vercel checkout without a separate contracts build. Node and Electron consume the built JavaScript. Add a new entrypoint only when a contract genuinely needs to be shared; keep app-specific API models with the owning app.
