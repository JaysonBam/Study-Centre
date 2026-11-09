# Contributor instructions

Read `CONTRIBUTING.md` and `docs/architecture.md` and `docs/web-architecture.md` before editing. Application READMEs and feature guides supply local context. These are the same instructions used by human contributors.

Use root npm workspaces and the root lockfile. Keep changes inside the owning application or service unless a contract requires coordinated edits. Preserve existing dependency versions during unrelated changes.

Run the checks relevant to the change and report their results. Do not use hosted services for fixture tests. Do not deploy, publish, change credentials, or include real operational data as part of a code-only change. Follow `docs/public-repository.md` for all committed files.
