-- Run in the Supabase SQL Editor as the project's database administrator.
-- Public demo: allow visitors and signed-in clients to READ these profiles only.
-- Existing policies and write permissions are left in place.
begin;

grant usage on schema public to anon, authenticated;
grant select on table public.user_profiles to anon, authenticated;

-- This policy applies if row-level security is enabled on the table.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles'
      and policyname = 'Discovery public demo reads'
  ) then
    create policy "Discovery public demo reads"
      on public.user_profiles for select to anon, authenticated using (true);
  else
    alter policy "Discovery public demo reads"
      on public.user_profiles to anon, authenticated using (true);
  end if;
end
$$;

commit;
