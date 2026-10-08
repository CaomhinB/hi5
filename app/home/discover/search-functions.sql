-- Run in the Supabase SQL Editor as the project's database administrator.
-- Adds read-only computed fields for any-word searching before pagination.
begin;

create or replace function public.discovery_search_words(text)
returns text[]
language sql immutable parallel safe security invoker
set search_path = ''
as $$
  select coalesce(array_agg(distinct word order by word), array[]::text[])
  from (
    select btrim(token, '.') as word
    from regexp_split_to_table(lower(coalesce($1, '')), '[^[:alnum:]#+.]+') as parts(token)
  ) as words
  where word ~ '[[:alnum:]]';
$$;

create or replace function public.discovery_array_words(text[])
returns text[]
language sql immutable parallel safe security invoker
set search_path = ''
as $$
  select public.discovery_search_words(pg_catalog.array_to_string($1, ' '));
$$;

-- Unnamed row arguments expose these as PostgREST computed fields.
-- Fully qualified helpers let these small wrappers be inlined into queries.
create or replace function public.discovery_profession_words(public.user_profiles)
returns text[]
language sql immutable parallel safe security invoker
as $$
  select public.discovery_search_words(($1).job_title);
$$;

create or replace function public.discovery_skill_words(public.user_profiles)
returns text[]
language sql immutable parallel safe security invoker
as $$
  select public.discovery_array_words(($1).skills);
$$;

create index if not exists user_profiles_discovery_profession_words_idx
  on public.user_profiles using gin (public.discovery_search_words(job_title));
create index if not exists user_profiles_discovery_skill_words_idx
  on public.user_profiles using gin (public.discovery_array_words(skills));

revoke all on function public.discovery_search_words(text) from public;
revoke all on function public.discovery_array_words(text[]) from public;
revoke all on function public.discovery_profession_words(public.user_profiles) from public;
revoke all on function public.discovery_skill_words(public.user_profiles) from public;
grant execute on function public.discovery_search_words(text) to anon, authenticated;
grant execute on function public.discovery_array_words(text[]) to anon, authenticated;
grant execute on function public.discovery_profession_words(public.user_profiles) to anon, authenticated;
grant execute on function public.discovery_skill_words(public.user_profiles) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
