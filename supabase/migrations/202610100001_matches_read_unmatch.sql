-- Matches feature: read access and unmatch. NOT YET APPLIED. Review before running.
-- Can also run in the Supabase SQL Editor. No tables or columns change. No rows are deleted.
begin;

-- 1. Let a signed-in user read only the matches they are part of.
drop policy if exists hi5_matches_read_own on public.matches;
create policy hi5_matches_read_own
  on public.matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.auth_user_id = (select auth.uid())
        and u.id in (matches.user_1_id, matches.user_2_id)
    )
  );

-- 2. Unmatch: the only way the app can change a match.
--    Sets status to 'unmatched' and unmatched_at to now. Nothing else can be edited.
create or replace function public.unmatch(target_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  updated_id uuid;
begin
  select u.id
  into current_user_id
  from public.users u
  where u.auth_user_id = (select auth.uid());

  if current_user_id is null then
    raise exception 'Authenticated user does not have a public.users record';
  end if;

  update public.matches m
  set status = 'unmatched',
      unmatched_at = now()
  where m.id = target_match_id
    and m.status = 'active'
    and current_user_id in (m.user_1_id, m.user_2_id)
  returning m.id into updated_id;

  if updated_id is null then
    raise exception 'Match not found or already unmatched';
  end if;

  return jsonb_build_object('success', true, 'match_id', updated_id);
end;
$$;

-- Only signed-in users may call it (the existing say_hi function is open to anon).
revoke all on function public.unmatch(uuid) from public, anon;
grant execute on function public.unmatch(uuid) to authenticated;

commit;
