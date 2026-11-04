# Mall Data Center · Supabase cloud-sharing operation guide

**Project:** `zsymjxmhomftiesmlhgk` · `ap-southeast-1` · https://supabase.com/dashboard/project/zsymjxmhomftiesmlhgk

**Implemented:** database tables and RLS, private source bucket, verified allowlisted admin account, public month reports, admin cloud writes, original-file uploads, historical local IndexedDB migration, and read-only cloud analysis UI.

**Still pending:** public quarterly lifecycle reports. `mall_lifecycle_reports` is prepared but not wired to published lifecycle output. The embedded legacy quarterly page remains admin-only.

## Access model

| Resource | Public anonymous visitor | Verified, allowlisted admin |
|---|---|---|
| `mall_month_reports` | SELECT | SELECT / INSERT / UPDATE / DELETE |
| `mall_lifecycle_reports` | SELECT (no published data yet) | CRUD |
| `mall_private_month_archives` | DENIED | CRUD |
| `mall_admins` | DENIED | SELECT own membership |
| `mall-order-source` private bucket | DENIED | CRUD |

The frontend ships only the Supabase project URL and **publishable** key. Never put service-role/secret keys in GitHub Pages. All writes require Supabase Auth plus membership in `mall_admins`; CSS visibility is not an authorization boundary.

## First historical publication

The database was created empty. Existing files live in the administrator's original browser until migrated. In that same browser open [Data Management](https://beaver123-sketch.github.io/mall-lifecycle-sop/#data), sign in at `cloud-admin.html` if needed, and click **一键同步本地历史数据**. The migration copies original file blobs to private Storage if still present, private parsed rows to `mall_private_month_archives`, and sanitized month aggregates to `mall_month_reports`. Months already published are skipped to avoid accidental overwrite; partially published archives can be retried.

No backend has access to the previous browser's IndexedDB before this button is clicked. Visitors will see an empty month until the corresponding cloud report is published. They can refresh or switch to an available month after publication.

## Verification

- `public.mall_month_reports`, `mall_private_month_archives`, `mall_admins`, and `mall_lifecycle_reports` have RLS enabled.
- SQL security advisory check initially found no warnings.
- Role grants: `anon` has SELECT only on public reports and no INSERT or private archive SELECT.
- GitHub Actions browser test runs with a fake cloud backend (not live production writes). It verifies monthly updates, history migration, independent viewer read-only rendering, and direct delete.
- After the actual migration, check on the [Supabase Table Editor](https://supabase.com/dashboard/project/zsymjxmhomftiesmlhgk/editor) that `mall_month_reports` contains published months. Then use a different browser/incognito profile to confirm anonymous analysis and no admin controls.
- Do not grant admin status merely because a user registered. Admin IDs must be selected from verified `auth.users` and explicitly inserted into `mall_admins`.

**Warning:** URL-sharing is not strict internal-only isolation. Anyone with the link can read public aggregates. Raw uploads remain private.
