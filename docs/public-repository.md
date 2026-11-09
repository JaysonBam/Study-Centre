# Public repository policy

Commit source code, generic setup instructions, migration definitions, dependency lockfiles and artificial test data.

Keep the following in private operational records or ignored local files:

- Credentials, tokens, private keys, OAuth secrets, database connection strings and real `.env` files.
- Production domains and service endpoints, hosting account/project identifiers, backend project references and dashboard links.
- Real names, personal contact details, student identifiers, real correspondence, booking exports, database dumps and operational screenshots or recordings.
- Workstation-specific paths, logs, investigation captures, backups and generated build artifacts.

Environment examples contain variable names and blank or local placeholder values only. Tests use reserved example/invalid domains and synthetic identities. Runtime environment values belong in deployment settings, not hardcoded defaults. Public browser configuration is still configuration; do not publish your actual deployment inventory here.

Domain-specific parsing tests also use a deliberately synthetic student address required by the existing institutional email format. The checker allows that one artificial address only in printing tests. Dependency lockfiles may contain third-party maintainers' public registry metadata; credential and endpoint checks still apply to them.

Run `npm run check:public` before committing. The check reports filenames and rule names rather than reproducing potential secrets. It detects common patterns; it is not proof that arbitrary documents, images or data are safe. Review new assets and fixtures manually. Do not add blanket exclusions to make the check pass.

The initial monorepo is a clean source snapshot. Historical repositories and migration reconciliation notes remain outside this repository so old commits cannot silently reintroduce private operational details. If importing history later, review the entire reachable history before publishing it.
