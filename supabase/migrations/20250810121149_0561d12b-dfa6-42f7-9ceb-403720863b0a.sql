-- A) BLOCKER: Fix profiles RLS infinite recursion
-- A.1 Create JWT-only auth helpers (no table reads; safe in RLS)
create or replace function auth_role() returns text
language sql stable as
$$ select current_setting('request.jwt.claims', true)::jsonb ->> 'role' $$;

create or replace function auth_org_id() returns uuid
language sql stable as
$$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::uuid $$;

create or replace function auth_user_id() returns uuid
language sql stable as
$$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id','')::uuid $$;

create or replace function auth_is_super_admin() returns boolean
language sql stable as
$$ select auth_role() = 'super_admin' $$;

-- A.2 Replace any recursive profiles policies with pure predicates
-- Enable RLS and drop old policies (recursion came from functions selecting profiles)
alter table profiles enable row level security;

drop policy if exists profiles_sel on profiles;
drop policy if exists profiles_ins on profiles;
drop policy if exists profiles_upd on profiles;
drop policy if exists profiles_del on profiles;

-- Recreate policies with NO SELECTS/JOINS — jwt-only helpers + row columns
create policy profiles_sel on profiles
for select using (
  auth_is_super_admin()
  or (organization_id = auth_org_id())
);

create policy profiles_ins on profiles
for insert with check (
  auth_is_super_admin()
  or (organization_id = auth_org_id())
);

create policy profiles_upd on profiles
for update using (
  auth_is_super_admin()
  or (organization_id = auth_org_id() and user_id = auth_user_id())
)
with check (
  auth_is_super_admin()
  or (organization_id = auth_org_id() and user_id = auth_user_id())
);

create policy profiles_del on profiles
for delete using (
  auth_is_super_admin()
  or (organization_id = auth_org_id() and user_id = auth_user_id())
);

-- A.3 Admin RPC wrapper for privileged profile ops
create or replace function admin_update_profile_role(p_profile_id uuid, p_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not auth_is_super_admin() then
    raise exception 'forbidden';
  end if;

  update profiles
     set role = p_role
   where user_id = p_profile_id;
end;
$$;

revoke all on function admin_update_profile_role(uuid, user_role) from public;
grant execute on function admin_update_profile_role(uuid, user_role) to authenticated;

-- B) Dashboard data inconsistencies
-- B.1 Single source of truth for counts (view) - using actual column names
create or replace view dashboard_stats as
select
  (select count(*) from organizations) as orgs_active,
  (select count(*) from profiles where coalesce(is_deleted,false)=false and deleted_at is null) as users_total,
  (select count(*) from funds where is_active = true) as funds_active,
  (select count(*) from deals where status != 'rejected') as deals_pipeline;

-- B.2 Activities API must never return null
create or replace function list_platform_activities(p_limit int default 25, p_offset int default 0)
returns table(id uuid, title text, activity_type text, priority text, user_id uuid, fund_id uuid, created_at timestamptz)
language sql
stable
set search_path = public
as $$
  select a.id, a.title, a.activity_type::text, a.priority::text, a.user_id, a.fund_id, a.created_at
  from activity_events a
  order by a.created_at desc
  limit greatest(p_limit,0) offset greatest(p_offset,0);
$$;

-- C) deal_status enum error - normalize "archived" to "rejected"
update deals set status='rejected' where status::text='archived';

-- D) Sustainable guardrails
-- D.1 RLS linter views (keep recursion & gaps out forever) - fixed column name
create or replace view rls_gaps as
select n.nspname as schema, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relrowsecurity=true
and not exists (select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname);

-- Policies that smell (joins/selects inside quals)
create or replace view rls_smells as
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where lower(qual) like '% select %' or lower(with_check) like '% select %'
   or lower(qual) like '% join %' or lower(with_check) like '% join %';