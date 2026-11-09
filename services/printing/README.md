# Printing backend

`supabase/migrations/` is the authoritative upgrade history. `supabase/schemas/` contains reference definitions; functions live in `supabase/functions/`. Keep this backend separate from the other service.

Run the root-installed CLI with `--workdir services/printing`. See [deployment and local setup](../../docs/deployment.md). Moving this directory does not require changing a hosted backend. Do not deploy or replay migrations as part of the repository cutover.
