-- Fix security warnings by adding search_path to new functions
create or replace function auth_role() returns text
language sql stable
set search_path = public
as $$ select current_setting('request.jwt.claims', true)::jsonb ->> 'role' $$;

create or replace function auth_org_id() returns uuid
language sql stable
set search_path = public
as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::uuid $$;

create or replace function auth_user_id() returns uuid
language sql stable
set search_path = public
as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id','')::uuid $$;

create or replace function auth_is_super_admin() returns boolean
language sql stable
set search_path = public
as $$ select auth_role() = 'super_admin' $$;