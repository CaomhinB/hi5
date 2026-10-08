-- Run in the Supabase SQL Editor for this app's project.
-- The meeting_preferences table already exists. Profile IDs are public.users IDs.
-- Existing profiles need no backfill: the first save inserts their preferences.
begin;

alter table public.meeting_preferences add column if not exists travel_radius integer;

-- Upserts require one preferences row per profile. Do not remove duplicate rows.
do $$
begin
  if not exists (
    select 1 from pg_index i join pg_attribute a
      on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.meeting_preferences'::regclass and i.indisunique
      and i.indisvalid and i.indnkeyatts = 1 and i.indpred is null and i.indexprs is null
      and a.attname = 'user_profile_id'
  ) then
    create unique index meeting_preferences_one_per_profile on public.meeting_preferences(user_profile_id);
  end if;
  if not exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.meeting_preferences'::regclass and c.contype = 'f'
      and c.confrelid = 'public.user_profiles'::regclass
      and c.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = c.conrelid and a.attname = 'user_profile_id')]
      and c.confkey = array[(select a.attnum from pg_attribute a where a.attrelid = c.confrelid and a.attname = 'id')]
  ) then
    alter table public.meeting_preferences add constraint hi5_meeting_preferences_profile_fk
      foreign key (user_profile_id) references public.user_profiles(id) on delete cascade;
  end if;
end;
$$;

-- Validate values and manage timestamps for every client using the table.
create or replace function public.hi5_validate_meeting_preferences()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  -- Translate older form identifiers before applying the table's canonical checks.
  new.meeting_types := array(select case m
    when 'coffee' then 'coffee_casual'
    when 'coworking' then 'coworking_work_session'
    else m end from unnest(new.meeting_types) m);
  new.location_preference := case new.location_preference
    when 'in_person' then 'in_person_only'
    when 'remote' then 'remote_only'
    else new.location_preference end;
  if coalesce(cardinality(new.meeting_types), 0) not between 1 and 5
    or exists (select 1 from unnest(new.meeting_types) m where m is null or m not in ('coffee_casual', 'video_call', 'phone_call', 'coworking_work_session', 'networking_event'))
    or (select count(distinct m) from unnest(new.meeting_types) m) <> cardinality(new.meeting_types) then
    raise exception 'Choose at least one valid meeting type.' using errcode = '23514';
  end if;
  if new.location_preference is null or new.location_preference not in ('in_person_only', 'remote_only', 'both') then
    raise exception 'Choose a valid meeting location preference.' using errcode = '23514';
  end if;
  if new.travel_radius is not null and new.travel_radius not in (5, 10, 25, 50) then
    raise exception 'Choose a valid travel distance.' using errcode = '23514';
  end if;
  if new.location_preference = 'remote_only' and new.travel_radius is not null then
    raise exception 'Remote meetings cannot have a travel distance.' using errcode = '23514';
  end if;
  new.availability := coalesce(new.availability, array[]::text[]);
  if cardinality(new.availability) > 5
    or exists (select 1 from unnest(new.availability) a where a is null or a not in ('weekday_mornings', 'weekday_afternoons', 'weekday_evenings', 'weekends', 'flexible'))
    or (select count(distinct a) from unnest(new.availability) a) <> cardinality(new.availability) then
    raise exception 'Choose valid meeting availability.' using errcode = '23514';
  end if;
  if new.preferred_duration is null or new.preferred_duration not in ('15_30_minutes', '30_60_minutes', '1_2_hours', 'flexible') then
    raise exception 'Choose a valid meeting duration.' using errcode = '23514';
  end if;
  new.additional_preferences := btrim(coalesce(new.additional_preferences, ''));
  if char_length(new.additional_preferences) > 300 then
    raise exception 'Keep additional preferences within 300 characters.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.user_profile_id is distinct from old.user_profile_id then
      raise exception 'A meeting preferences record cannot be moved to another profile.' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid = 'public.meeting_preferences'::regclass and tgname = 'hi5_meeting_preferences_validate') then
    create trigger hi5_meeting_preferences_validate before insert or update on public.meeting_preferences
      for each row execute function public.hi5_validate_meeting_preferences();
  end if;
end;
$$;

alter table public.meeting_preferences enable row level security;

-- Reads follow profile visibility. Restrictive guards protect writes even when
-- unrelated, broader permissive policies exist on this table.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences insert owner guard') then
    create policy "Hi5 meeting preferences insert owner guard" on public.meeting_preferences
      as restrictive for insert to authenticated
      with check (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences update owner guard') then
    create policy "Hi5 meeting preferences update owner guard" on public.meeting_preferences
      as restrictive for update to authenticated
      using (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())))
      with check (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences delete owner guard') then
    create policy "Hi5 meeting preferences delete owner guard" on public.meeting_preferences
      as restrictive for delete to authenticated
      using (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences visible profile reads') then
    create policy "Hi5 meeting preferences visible profile reads" on public.meeting_preferences
      for select to anon, authenticated
      using (exists (select 1 from public.user_profiles p where p.id = meeting_preferences.user_profile_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences read own') then
    create policy "Hi5 meeting preferences read own" on public.meeting_preferences for select to authenticated
      using (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences insert own') then
    create policy "Hi5 meeting preferences insert own" on public.meeting_preferences for insert to authenticated
      with check (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meeting_preferences' and policyname = 'Hi5 meeting preferences update own') then
    create policy "Hi5 meeting preferences update own" on public.meeting_preferences for update to authenticated
      using (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())))
      with check (exists (select 1 from public.users u where u.id = meeting_preferences.user_profile_id and u.auth_user_id = (select auth.uid())));
  end if;
end;
$$;

-- Replace our earlier ALL-command guard: it also blocked reads of other profiles.
-- The new write guards above preserve ownership checks in the same transaction.
drop policy if exists "Hi5 meeting preferences owner guard" on public.meeting_preferences;

revoke all on table public.meeting_preferences from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update on table public.meeting_preferences to authenticated;
grant select (user_profile_id, meeting_types, location_preference, travel_radius,
  availability, preferred_duration, additional_preferences)
  on table public.meeting_preferences to anon;
revoke all on function public.hi5_validate_meeting_preferences() from public, anon;
grant execute on function public.hi5_validate_meeting_preferences() to authenticated;

notify pgrst, 'reload schema';
commit;
