-- Run in Supabase SQL Editor if meeting-preferences.sql is already installed.
-- Aligns the validation trigger with the existing CHECK constraint values.
-- No existing rows, CHECK constraints or access policies are changed.
begin;

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

notify pgrst, 'reload schema';
commit;

