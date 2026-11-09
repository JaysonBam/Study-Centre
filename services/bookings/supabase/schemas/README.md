# Schema reference files

These SQL files summarize table definitions and older baseline policies. The complete, ordered database definition and upgrade path is [the migration history](../migrations), including [access expiry enforcement](../migrations/20260930160000_user_access_expiry.sql).

The reference files are not a current standalone bootstrap: expiry functions, restrictive policies and triggers are defined in the migration, and `users.sql` retains the earlier authorization-helper body. Running a reference file after migrations can replace security behavior. `bugs.sql` also includes older explanatory comments about public access; the expiry migration now restricts that access.

`config.toml` includes these files in `schema_paths`. Before using a declarative schema diff, reconcile them with the migrated database and inspect the generated SQL for removed policies/functions/triggers. For ordinary changes, add and test a timestamped migration. Do not delete or rewrite applied migration history.

See [development and release](../../../../CONTRIBUTING.md#database-changes) for checks and [architecture](../../../../docs/architecture.md) for current application behavior.
