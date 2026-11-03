# Cloud-sharing plan (Option A)

Status: **prepared but not enabled**. No Supabase project exists yet in the connected account. Do not switch the GitHub Pages production dashboard to cloud mode without deploying and verifying the schema, admin identity, API configuration, and historical-data migration.

## Permission boundary

| Resource | Anonymous site visitor | Authenticated allowlisted administrator |
|---|---|---|
| `mall_month_reports` (pre-aggregated month dashboard payload) | SELECT | SELECT / INSERT / UPDATE / DELETE |
| `mall_lifecycle_reports` (pre-aggregated quarter lifecycle summaries) | SELECT | SELECT / INSERT / UPDATE / DELETE |
| `mall_private_month_archives` (parsed original report rows and file manifests) | no access | SELECT / INSERT / UPDATE / DELETE |
| `mall_admins` | no access | SELECT own membership only |
| `mall-order-source` private Storage bucket | no access | authenticated storage CRUD |

**Important:** Users with the link can view analytics; this is not company-only network access. Never publish individual order files or the private archive JSON as `mall_month_reports.report`. The `report` payload must be derived data only: monthly totals, daily totals, category aggregates, SKU-level totals, and the published new-product metrics needed for the graphs. For the lifecycle page, publish computed results to `mall_lifecycle_reports` without exposing raw files.

The static GitHub Pages website may embed only the Supabase **project URL** and **publishable key**. Never embed a secret/service-role key. Admin authorization is a Supabase Auth identity plus an explicit entry in `public.mall_admins`; ordinary authenticated users are not admins. Creating an account or changing its email does not grant writes.

## Activation checklist

1. Confirm which Supabase organization owns the database and quote/approve the creation cost. Create the project in the agreed region.
2. Apply `supabase/migrations/20261103_shared_mall_dashboard.sql` to the new project.
3. Verify all public tables have RLS. Check anon SELECT and denied anon INSERT/UPDATE/DELETE on both public report tables and private archives.
4. Enroll a real administrator in Supabase Auth and use the dashboard SQL editor to insert only that user's **auth.users.id** into `mall_admins`. Do not expose this action to the website.
5. Point the existing dashboard at the new project with its publishable key, leaving the old browser data untouched until all migration checks pass.
6. On the admin browser, migrate each stored month to the private archive and publish a sanitized month report. Build/publish quarterly lifecycle result snapshots. Store original Excel/CSV files only in the private Storage bucket.
7. Verify in a clean incognito browser: report tables readable without login, private archives/files denied, analysis pages and charts show real data, and no upload/edit controls can write.
8. Verify the authenticated admin can upload, replace and clear one selected month's data without affecting another month's archives; verify reset/password protections.
9. Ensure public read never falls back to a viewer's stale local archives. Publish should report sync failures and never silently claim the latest data was shared.
10. Only then enable cloud-first mode in GitHub Pages and announce that sharing is live.

## Current behavior

The production site remains **local-first** until Supabase project, identity setup, and end-to-end testing are complete. Prepared SQL is not executed just by committing it to GitHub. The files above are implementation scaffolding, not proof of cloud deployment.
