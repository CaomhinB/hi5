-- Approved signup/onboarding migration. Can also run in the Supabase SQL Editor.
-- Verified against the linked schema on 2026-10-06. No data is deleted.
begin;

-- Stop if required types/defaults differ from the inspected database.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name = 'id' and udt_name = 'uuid' and column_default is not null
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name = 'auth_user_id' and udt_name = 'uuid'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles'
      and column_name = 'id' and udt_name = 'uuid'
  ) or (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles'
      and column_name in ('interests', 'industries') and udt_name = '_text'
  ) <> 2 then
    raise exception 'Hi5 signup schema does not match. Review types/defaults before applying.';
  end if;
end;
$$;

create or replace function public.hi5_create_signup_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_user_id public.users.id%type;
  profile_name text;
  profile_interests text[];
  profile_industries text[];
  interest_metadata jsonb := coalesce(new.raw_user_meta_data -> 'interests', '[]'::jsonb);
  industry_metadata jsonb := coalesce(new.raw_user_meta_data -> 'industries', '[]'::jsonb);
begin
  profile_name := btrim(new.raw_user_meta_data ->> 'full_name');
  if profile_name is null or profile_name = '' or length(profile_name) > 120 then
    raise exception 'A valid full_name is required for Hi5 signup';
  end if;
  if new.email is null then
    raise exception 'An email is required for Hi5 signup';
  end if;
  if jsonb_typeof(interest_metadata) <> 'array'
    or jsonb_typeof(industry_metadata) <> 'array' then
    raise exception 'Hi5 interests and industries must be arrays';
  end if;
  if exists (
    select 1 from jsonb_array_elements(interest_metadata || industry_metadata) as item(value)
    where jsonb_typeof(value) <> 'string' or length(value #>> '{}') > 120
  ) or jsonb_array_length(interest_metadata) > 100
    or jsonb_array_length(industry_metadata) > 100 then
    raise exception 'Invalid Hi5 interest or industry metadata';
  end if;

  select coalesce(array_agg(value order by position), array[]::text[])
    into profile_interests
    from jsonb_array_elements_text(interest_metadata) with ordinality as items(value, position);
  select coalesce(array_agg(value order by position), array[]::text[])
    into profile_industries
    from jsonb_array_elements_text(industry_metadata) with ordinality as items(value, position);

  -- Omit id: use the existing users.id UUID default. Never reuse auth.users.id.
  insert into public.users (auth_user_id, email)
    values (new.id, new.email)
    returning id into app_user_id;
  insert into public.user_profiles (id, name, interests, industries)
    values (app_user_id, profile_name, profile_interests, profile_industries);
  return new;
end;
$$;

revoke all on function public.hi5_create_signup_profile() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass and tgname = 'hi5_on_auth_signup') then
    create trigger hi5_on_auth_signup
      after insert on auth.users
      for each row execute function public.hi5_create_signup_profile();
  end if;
end;
$$;

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;

-- Create only Hi5's named policies; preserve unrelated existing policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='hi5_users_read_own') then
    create policy hi5_users_read_own on public.users for select to authenticated
      using (auth_user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='hi5_users_update_own') then
    create policy hi5_users_update_own on public.users for update to authenticated
      using (auth_user_id = (select auth.uid()))
      with check (auth_user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='hi5_profiles_read_authenticated') then
    create policy hi5_profiles_read_authenticated on public.user_profiles for select to authenticated
      using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='hi5_profiles_update_own') then
    create policy hi5_profiles_update_own on public.user_profiles for update to authenticated
      using (exists (select 1 from public.users u where u.id = user_profiles.id and u.auth_user_id = (select auth.uid())))
      with check (exists (select 1 from public.users u where u.id = user_profiles.id and u.auth_user_id = (select auth.uid())));
  end if;
end;
$$;

-- RLS restricts rows; column grants also prevent changing ownership identifiers.
revoke all on table public.users, public.user_profiles from anon, public;
revoke insert, update, delete, truncate, references, trigger
  on table public.users, public.user_profiles from authenticated;
grant select on table public.users, public.user_profiles to authenticated;
grant update (email) on public.users to authenticated;
grant update (name, age, organisation, location, job_title, bio, skills,
  experience, industries, interests, current_projects, portfolio_url,
  linkedin_url, github_url, image_path)
  on public.user_profiles to authenticated;

commit;
