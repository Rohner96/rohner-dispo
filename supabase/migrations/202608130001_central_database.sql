create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_users (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null,
  display_name text not null,
  role text not null check (role in ('admin', 'employee')),
  driver_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, username)
);

create table if not exists public.app_records (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('customers', 'projects', 'drivers', 'vehicles', 'trailers', 'orders', 'absences', 'repairs')),
  record_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, kind, record_id)
);

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.portal_users where auth_user_id = auth.uid() and active = true limit 1 $$;

create or replace function public.current_portal_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.portal_users where auth_user_id = auth.uid() and active = true limit 1 $$;

create or replace function public.current_portal_user_id()
returns text language sql stable security definer set search_path = public
as $$ select id from public.portal_users where auth_user_id = auth.uid() and active = true limit 1 $$;

create or replace function public.current_driver_id()
returns text language sql stable security definer set search_path = public
as $$ select driver_id from public.portal_users where auth_user_id = auth.uid() and active = true limit 1 $$;

revoke all on function public.current_organization_id() from public;
revoke all on function public.current_portal_role() from public;
revoke all on function public.current_portal_user_id() from public;
revoke all on function public.current_driver_id() from public;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_portal_role() to authenticated;
grant execute on function public.current_portal_user_id() to authenticated;
grant execute on function public.current_driver_id() to authenticated;

alter table public.organizations enable row level security;
alter table public.portal_users enable row level security;
alter table public.app_records enable row level security;

create policy "organization members read organization" on public.organizations for select to authenticated
using (id = public.current_organization_id());

create policy "organization members read portal users" on public.portal_users for select to authenticated
using (organization_id = public.current_organization_id());
create policy "admins create portal users" on public.portal_users for insert to authenticated
with check (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin');
create policy "admins update portal users" on public.portal_users for update to authenticated
using (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin')
with check (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin');

create policy "organization members read app records" on public.app_records for select to authenticated
using (organization_id = public.current_organization_id());
create policy "admins create app records" on public.app_records for insert to authenticated
with check (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin');
create policy "admins update app records" on public.app_records for update to authenticated
using (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin')
with check (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin');
create policy "admins delete app records" on public.app_records for delete to authenticated
using (organization_id = public.current_organization_id() and public.current_portal_role() = 'admin');
create policy "employees create own repairs" on public.app_records for insert to authenticated
with check (organization_id = public.current_organization_id() and kind = 'repairs' and payload ->> 'reportedByUserId' = public.current_portal_user_id() and public.current_portal_role() = 'employee');
create policy "employees update assigned orders" on public.app_records for update to authenticated
using (organization_id = public.current_organization_id() and kind = 'orders' and payload ->> 'driverId' = public.current_driver_id() and public.current_portal_role() = 'employee')
with check (organization_id = public.current_organization_id() and kind = 'orders' and payload ->> 'driverId' = public.current_driver_id() and public.current_portal_role() = 'employee');
create policy "employees update own repairs" on public.app_records for update to authenticated
using (organization_id = public.current_organization_id() and kind = 'repairs' and payload ->> 'reportedByUserId' = public.current_portal_user_id() and public.current_portal_role() = 'employee')
with check (organization_id = public.current_organization_id() and kind = 'repairs' and payload ->> 'reportedByUserId' = public.current_portal_user_id() and public.current_portal_role() = 'employee');

create index if not exists app_records_organization_kind_idx on public.app_records (organization_id, kind);
create index if not exists portal_users_auth_user_idx on public.portal_users (auth_user_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_records') then
    alter publication supabase_realtime add table public.app_records;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'portal_users') then
    alter publication supabase_realtime add table public.portal_users;
  end if;
end $$;
