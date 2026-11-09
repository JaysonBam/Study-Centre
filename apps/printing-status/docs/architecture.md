# Architecture

## Request path

```text
Project link /<five-character code>
  → React Router → PublicProjectView
  → Supabase get_public_project_status(project_code)
  → status, issued quote, payment, parts → read-only page
```

This is a React 19 / TypeScript / Vite single-page application using MUI. It has no application server, sign-in flow, staff controls or write requests.

| File | Change here for |
| --- | --- |
| [`src/main.tsx`](../src/main.tsx) | React entry point |
| [`src/app/App.tsx`](../src/app/App.tsx) | Routes, root/missing-link message and light theme |
| [`src/features/project-status/components/PublicProjectScreen.tsx`](../src/features/project-status/components/PublicProjectScreen.tsx) | Project/part UI, payment presentation and barcode dialog |
| `src/features/project-status/hooks/usePublicProject.ts` | Fetch lifecycle and retry state |
| `src/api/projects.ts`, `src/api/types.ts` | Public RPC operation and response types |
| [`src/features/project-status/model/publicViewRules.ts`](../src/features/project-status/model/publicViewRules.ts) | Quote, completion summary and collection eligibility rules |
| [`src/api/_internal/supabase.ts`](../src/api/_internal/supabase.ts) | Browser Supabase client and required environment values |
| [`src/index.css`](../src/index.css), `public/` | Responsive styles, logo and favicon |
| [`src/features/project-status/model/publicViewRules.test.ts`](../src/features/project-status/model/publicViewRules.test.ts) | Node tests for extracted display rules |
| [`vercel.json`](../vercel.json), [`vite.config.ts`](../vite.config.ts) | SPA rewrite and frontend build configuration |

`/:projectId` renders one code; `/` shows the missing-link message. Unmatched multi-segment routes redirect to `/`. Route changes and retries start a new RPC request; a sequence counter prevents an older response from replacing the current project's data. Loading, not-found and service-error views are distinct. Data is held in React state; there is no application cache or background refresh.

## Shared backend contract

The viewer calls only `get_public_project_status({ project_code: projectId })`. The RPC is maintained in HexForge's [`supabase/schemas/workflow.sql`](../../../services/printing/supabase/schemas/workflow.sql) and versioned migrations, not here. It trims and uppercases codes and requires exactly five letters/digits. A missing project returns null; invalid codes raise a database error and therefore show the service-error view. The page accepts a JSON object or the first element of an array response. Its TypeScript cast is not runtime schema validation.

The viewer consumes these fields from `PublicProjectDto` and its nested DTOs:

| Group | Fields used |
| --- | --- |
| Project | `project_code`, `collection_code`, `state`, fallback `state_label`/`state_description`, `created_at`, `course`, optional `lecturer`, `currency` |
| Payment | `needs_payment`, `payment_state_label`, `receipt_number` |
| Issued quote | Nullable `quote_snapshot`; display uses `total_cost`, `currency`, `generated_at` |
| Summary | `part_summary.total_parts`, `part_summary.completed_parts` |
| Parts | `part_id`, `part_number`, `part_name`, `print_status`, `thumbnail_url`, `printer_name`, primary/secondary material, brand and estimated weight |

The backend returns additional fields, including provisional costs and quote lines, that this UI does not render. Preserve compatible shapes and null/default behavior when changing the RPC or DTOs; hiding a field in React does not remove it from the network response.

The RPC is `SECURITY DEFINER` with explicit execute grants to anonymous/authenticated clients. The URL code is a lookup identifier, not authentication: anyone with a valid code can request its public response. Review new fields at the backend boundary and do not add private student details, staff notes, model paths or credentials. Do not replace the RPC with direct anonymous table reads. Neither the anonymous browser key nor a client-side visibility check protects private data.

## Display rules

- Known project states use the viewer's own titles and descriptions. Unknown states fall back to the RPC's labels. Changing backend labels alone does not change known viewer titles.
- The cost shown is the issued `quote_snapshot.total_cost` and issue date. Without a snapshot, the page says **Quote being prepared**; it does not display provisional part costs.
- Payment labels select receipt-recorded, module/lecturer-paid or no-payment messages. The payment warning requires `needs_payment` and a label of `PAYMENT_REQUIRED` or `OVERRIDE_APPROVED`; cancellation hides the warning.
- A collection barcode is visible only in `READY_FOR_COLLECTION` and `PARTIALLY_COLLECTED`, even if the backend returns a code for `CLOSED`. JsBarcode is loaded on demand and produces CODE128 locally.
- Part badges show Reviewing during intake/review and Approved during quote/payment/scheduling. In production and collection, the part's status determines Queued, Printing, Printed or Collected. `POST_PROCESSING` displays Printed.
- Completed-part counts come from the RPC. A printed part counts as completed before collection; the project heading determines whether collection is available.
- Cancelled projects retain item information but hide the progress tracker, part badges, printer names, collection action and payment warning.
- Missing/broken thumbnails show an icon. The browser never updates records, collects payment, uploads receipts or downloads models.
- Data is fetched on route load/change and **Try again**. There is no subscription, polling or manual refresh button on a successful page; browser reload fetches current data.

The five milestone labels are Submitted → Reviewed → Quote → Production → Collection. They are stages, not time estimates or an indication that a printer is currently active. At `CLOSED`, all milestones are checked.

See [development](development.md) before changing this contract and [maintenance](maintenance.md) for deployment settings.
