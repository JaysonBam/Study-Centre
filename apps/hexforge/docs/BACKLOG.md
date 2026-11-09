# Maintenance backlog

Current implementation constraints worth revisiting. These are proposals, not required release steps; recheck the code before starting an item.

| Area | Remaining work and compatibility concern |
| --- | --- |
| Error handling | Map raw Supabase/Google/helper errors to stable user messages and sanitize diagnostics without removing useful support evidence. |
| Server state | Consider a shared query/cache layer for repeated reads, retries and invalidation. Preserve optimistic transitions, queued saves and timing. |
| Forms | Consider shared form/schema validation for larger screens. Preserve validation timing and defaults. |
| Component size | Extract cohesive sections from large checkpoint/context files only when the state/save boundary is clear. |
| OAuth callback typing | Replace broad response-shape fallbacks and `any` escape hatches after testing the supported Supabase callback paths. |
| Styling | Review the balance between Tailwind utilities and semantic CSS. Tailwind remains in active use; preserve responsive and PDF/print styles. |
| Dependencies | Review the root lockfile and both workspace dependency trees when updating packages; verify helper packaging and smoke checks after a change. |
| Feedback | `RichEmailEditor.tsx` still uses native link prompts and an image-upload alert. Reuse application feedback if its interaction timing can be preserved. |
| Project reads | Consider a view/RPC to combine project, part, quote and print-run reads; preserve ordering, optional-data handling and row-level security. |
| Gmail cache | Review cache payload validation, combined writes and provider error mapping. Preserve linked-thread ownership, messages, replies and attachment status. |
| Backend validation | Tighten awkward frontend/backend contracts only with migrations and compatibility checks for existing records. |
| SQL reference coverage | Reconcile migration-only functions such as `collect_project_parts` with the declarative reference files before relying on schema-generated diffs. |
| Local setup | The CLI config has placeholder Auth defaults and no tracked seed. Keep a development-only Google configuration and fixture plan when using the local stack. |

Verify helper packaging and its smoke check from a clean root workspace when changing dependencies.
