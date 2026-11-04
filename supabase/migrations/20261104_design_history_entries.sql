-- Historical design title/object/status corrections. Sale source remains published month reports.
-- Applied to Mall Data Center 2026-11-04.
create table if not exists public.mall_design_history_entries (
 entry_id uuid primary key default gen_random_uuid(),
 platform text not null check(platform in ('POPPO','VONE')),
 category text not null check(category in ('头像框','资料卡','派对背景','聊天气泡','座驾')),
 sku_id text check(sku_id is null or length(sku_id) between 1 and 64),
 name text not null check(length(name) between 1 and 120),
 design_object text not null default '' check(length(design_object)<=120),
 theme text not null default '' check(length(theme)<=60),
 elements text[] not null default '{}',
 status text not null default '待设计' check(status in ('待设计','设计中','已完成','已上架','已下架')),
 notes text not null default '' check(length(notes)<=500),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(platform,category,sku_id)
);
create index if not exists mall_design_history_platform_idx on public.mall_design_history_entries(platform,updated_at desc);
alter table public.mall_design_history_entries enable row level security;
revoke all on public.mall_design_history_entries from anon,authenticated;
grant select on public.mall_design_history_entries to anon,authenticated;
grant insert,update,delete on public.mall_design_history_entries to authenticated;
create policy "everyone reads design history" on public.mall_design_history_entries for select to anon,authenticated using(true);
create policy "mall admin adds design history" on public.mall_design_history_entries for insert to authenticated
 with check(exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
create policy "mall admin edits design history" on public.mall_design_history_entries for update to authenticated
 using(exists(select 1 from public.mall_admins where user_id=(select auth.uid())))
 with check(exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
create policy "mall admin removes design history" on public.mall_design_history_entries for delete to authenticated
 using(exists(select 1 from public.mall_admins where user_id=(select auth.uid())));
