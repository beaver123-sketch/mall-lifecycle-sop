-- 2026-11-03  |  Mall shared dashboard (Option A)
-- Public readers: analytics aggregates only. Admins: authenticated and explicitly allowlisted.
-- This is a PREPARED migration. It has not been executed on a Supabase project.
begin;

create table if not exists public.mall_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.mall_month_reports (
  platform text not null check (platform in ('POPPO','VONE')),
  period text not null check (period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (platform, period)
);

create table if not exists public.mall_private_month_archives (
  platform text not null check (platform in ('POPPO','VONE')),
  period text not null check (period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  archive jsonb not null check (jsonb_typeof(archive) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (platform, period)
);

create table if not exists public.mall_lifecycle_reports (
  platform text not null check (platform in ('POPPO','VONE')),
  quarter text not null check (quarter ~ '^20[0-9]{2}-Q[1-4]$'),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (platform, quarter)
);

alter table public.mall_admins enable row level security;
alter table public.mall_month_reports enable row level security;
alter table public.mall_private_month_archives enable row level security;
alter table public.mall_lifecycle_reports enable row level security;

revoke all on public.mall_admins from anon, authenticated;
revoke all on public.mall_month_reports from anon, authenticated;
revoke all on public.mall_private_month_archives from anon, authenticated;
revoke all on public.mall_lifecycle_reports from anon, authenticated;

grant select on public.mall_admins to authenticated;
grant select on public.mall_month_reports to anon, authenticated;
grant select on public.mall_lifecycle_reports to anon, authenticated;
grant insert, update, delete on public.mall_month_reports to authenticated;
grant insert, update, delete on public.mall_lifecycle_reports to authenticated;
grant select, insert, update, delete on public.mall_private_month_archives to authenticated;

-- Authenticated users can only inspect their own admin membership; they cannot grant it.
create policy "admin membership only self" on public.mall_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Public (including anonymous) can read reports. No public write policy exists.
create policy "public can read monthly analytics" on public.mall_month_reports
  for select to anon, authenticated using (true);
create policy "public can read lifecycle analytics" on public.mall_lifecycle_reports
  for select to anon, authenticated using (true);

create policy "admin inserts monthly analytics" on public.mall_month_reports
  for insert to authenticated with check (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin updates monthly analytics" on public.mall_month_reports
  for update to authenticated
  using (exists(select 1 from public.mall_admins where user_id=(select auth.uid())))
  with check (exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
create policy "admin deletes monthly analytics" on public.mall_month_reports
  for delete to authenticated using (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );

create policy "admin inserts lifecycle analytics" on public.mall_lifecycle_reports
  for insert to authenticated with check (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin updates lifecycle analytics" on public.mall_lifecycle_reports
  for update to authenticated
  using (exists(select 1 from public.mall_admins where user_id=(select auth.uid())))
  with check (exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
create policy "admin deletes lifecycle analytics" on public.mall_lifecycle_reports
  for delete to authenticated using (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );

create policy "admin reads private monthly archives" on public.mall_private_month_archives
  for select to authenticated using (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin inserts private monthly archives" on public.mall_private_month_archives
  for insert to authenticated with check (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin updates private monthly archives" on public.mall_private_month_archives
  for update to authenticated
  using (exists(select 1 from public.mall_admins where user_id=(select auth.uid())))
  with check (exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
create policy "admin deletes private monthly archives" on public.mall_private_month_archives
  for delete to authenticated using (
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );

-- A PRIVATE bucket: raw uploaded order files must not be downloadable by anonymous viewers.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'mall-order-source',
  'mall-order-source',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/octet-stream'
  ]
) on conflict(id) do nothing;

create policy "admin can read source files" on storage.objects
  for select to authenticated using (
    bucket_id='mall-order-source' and
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin can upload source files" on storage.objects
  for insert to authenticated with check (
    bucket_id='mall-order-source' and
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin can replace source files" on storage.objects
  for update to authenticated
  using (
    bucket_id='mall-order-source' and
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  )
  with check (
    bucket_id='mall-order-source' and
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
create policy "admin can remove source files" on storage.objects
  for delete to authenticated using (
    bucket_id='mall-order-source' and
    exists(select 1 from public.mall_admins where user_id=(select auth.uid()))
  );
commit;
