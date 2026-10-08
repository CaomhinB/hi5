-- Run in the Supabase SQL Editor as the project's administrator.
-- Signup already creates public.users and user_profiles. These RPCs only access
-- the authenticated user's own profile; existing public read policies remain.
begin;

create or replace function public.get_my_onboarding_profile(expected_auth_user_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_user_id uuid;
  v_profile public.user_profiles;
  v_photo_exists boolean := false;
begin
  if v_auth_id is null then raise exception 'onboarding_auth_required'; end if;
  if v_auth_id is distinct from expected_auth_user_id then raise exception 'onboarding_account_changed'; end if;
  select u.id into v_user_id from public.users u where u.auth_user_id = v_auth_id;
  if v_user_id is null then raise exception 'onboarding_user_missing'; end if;
  select p.* into v_profile from public.user_profiles p where p.id = v_user_id;
  if v_profile.image_path is not null then
    select exists (
      select 1 from storage.objects o
      where o.bucket_id = 'profile-images' and o.name = v_profile.image_path
    ) into v_photo_exists;
  end if;
  return jsonb_build_object(
    'auth_user_id', v_auth_id, 'user_id', v_user_id,
    'profile', case when v_profile.id is null then null else to_jsonb(v_profile) end,
    'photo_exists', v_photo_exists
  );
end;
$$;

create or replace function public.save_my_onboarding_profile(expected_auth_user_id uuid, profile_input jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_user_id uuid;
  v_input public.user_profiles;
  v_previous_image text;
  v_allowed_industries text[] := array['AI', 'B2B', 'Cloud Computing', 'Construction', 'Consulting', 'Consumer Apps', 'Creative', 'E-commerce', 'Education', 'Enterprise', 'Finance', 'FinTech', 'Healthcare', 'HR', 'Logistics', 'Marketing', 'Media', 'Mobile Technology', 'Pre-launch', 'Retail', 'SaaS', 'Small Business', 'Social Enterprise', 'Social Impact', 'Startups', 'Sustainability', 'Technology', 'Technology & Software', 'Artificial Intelligence & Machine Learning', 'Finance & FinTech', 'Healthcare & MedTech', 'Education & EdTech', 'E-commerce & Retail', 'Marketing & Advertising', 'Media & Entertainment', 'Manufacturing & Engineering', 'Energy & Sustainability', 'Real Estate & PropTech', 'Travel & Hospitality', 'Logistics & Supply Chain', 'Food & Beverage', 'Professional Services & Consulting'];
begin
  if v_auth_id is null then raise exception 'onboarding_auth_required'; end if;
  if v_auth_id is distinct from expected_auth_user_id then raise exception 'onboarding_account_changed'; end if;
  select u.id into v_user_id from public.users u where u.auth_user_id = v_auth_id;
  if v_user_id is null then raise exception 'onboarding_user_missing'; end if;
  if profile_input is null or jsonb_typeof(profile_input) <> 'object' then
    raise exception 'onboarding_invalid: Please check your profile details.';
  end if;
  v_input := jsonb_populate_record(null::public.user_profiles, profile_input);

  if coalesce(char_length(btrim(v_input.name)), 0) not between 1 and 120 then
    raise exception 'onboarding_invalid: Enter your name (up to 120 characters).';
  end if;
  if coalesce(char_length(btrim(v_input.location)), 0) not between 1 and 160 then
    raise exception 'onboarding_invalid: Enter your location (up to 160 characters).';
  end if;
  if coalesce(char_length(btrim(v_input.job_title)), 0) not between 1 and 160 then
    raise exception 'onboarding_invalid: Enter your role (up to 160 characters).';
  end if;
  if coalesce(char_length(btrim(v_input.bio)), 0) not between 1 and 600 then
    raise exception 'onboarding_invalid: Enter a bio (up to 600 characters).';
  end if;
  if v_input.experience is null or v_input.experience not between 0 and 100 then
    raise exception 'onboarding_invalid: Enter years of experience from 0 to 100.';
  end if;
  if v_input.age is not null and v_input.age not between 1 and 120 then
    raise exception 'onboarding_invalid: Enter an age from 1 to 120, or leave it empty.';
  end if;
  if coalesce(char_length(v_input.organisation), 0) > 160 or coalesce(char_length(v_input.current_projects), 0) > 600 then
    raise exception 'onboarding_invalid: Your organisation or project description is too long.';
  end if;
  if coalesce(cardinality(v_input.industries), 0) not between 1 and 3
    or exists (select 1 from unnest(v_input.industries) i where i is null or not (i = any(v_allowed_industries)))
    or (select count(distinct i) from unnest(v_input.industries) i) <> cardinality(v_input.industries) then
    raise exception 'onboarding_invalid: Choose between 1 and 3 industries from the provided list.';
  end if;
  if coalesce(cardinality(v_input.skills), 0) < 1
    or exists (select 1 from unnest(v_input.skills) s where s is null or char_length(btrim(s)) not between 1 and 80) then
    raise exception 'onboarding_invalid: Add at least one skill, with up to 80 characters per skill.';
  end if;
  if exists (select 1 from unnest(v_input.interests) i where i is null or char_length(btrim(i)) not between 1 and 80) then
    raise exception 'onboarding_invalid: Keep each interest within 80 characters.';
  end if;
  if exists (
    select 1 from unnest(array[v_input.portfolio_url, v_input.linkedin_url, v_input.github_url]) u
    where nullif(btrim(u), '') is not null and u !~ '^https?://[^[:space:]]+$'
  ) then
    raise exception 'onboarding_invalid: Links must start with https:// or http://.';
  end if;
  if nullif(btrim(v_input.image_path), '') is null then
    raise exception 'onboarding_invalid: Add a profile photo.';
  end if;

  select p.image_path into v_previous_image from public.user_profiles p where p.id = v_user_id for update;
  if v_input.image_path is distinct from v_previous_image
    and left(v_input.image_path, char_length(v_auth_id::text) + 1) <> v_auth_id::text || '/' then
    raise exception 'onboarding_invalid: Please upload your own profile photo.';
  end if;
  if not exists (
    select 1 from storage.objects o where o.bucket_id = 'profile-images' and o.name = v_input.image_path
  ) then
    raise exception 'onboarding_invalid: Your photo is not available. Please upload it again.';
  end if;

  insert into public.user_profiles (
    id, name, age, organisation, location, job_title, bio, skills, experience,
    industries, interests, current_projects, portfolio_url, linkedin_url, github_url, image_path
  ) values (
    v_user_id, btrim(v_input.name), v_input.age, nullif(btrim(v_input.organisation), ''),
    btrim(v_input.location), btrim(v_input.job_title), btrim(v_input.bio), v_input.skills,
    v_input.experience, v_input.industries, coalesce(v_input.interests, array[]::text[]),
    nullif(btrim(v_input.current_projects), ''), nullif(btrim(v_input.portfolio_url), ''),
    nullif(btrim(v_input.linkedin_url), ''), nullif(btrim(v_input.github_url), ''), v_input.image_path
  ) on conflict (id) do update set
    name = excluded.name, age = excluded.age, organisation = excluded.organisation,
    location = excluded.location, job_title = excluded.job_title, bio = excluded.bio,
    skills = excluded.skills, experience = excluded.experience, industries = excluded.industries,
    interests = excluded.interests, current_projects = excluded.current_projects,
    portfolio_url = excluded.portfolio_url, linkedin_url = excluded.linkedin_url,
    github_url = excluded.github_url, image_path = excluded.image_path, updated_at = now();
  return jsonb_build_object('success', true, 'user_id', v_user_id);
end;
$$;

revoke all on function public.get_my_onboarding_profile(uuid) from public, anon;
revoke all on function public.save_my_onboarding_profile(uuid, jsonb) from public, anon;
grant execute on function public.get_my_onboarding_profile(uuid) to authenticated;
grant execute on function public.save_my_onboarding_profile(uuid, jsonb) to authenticated;

-- Configure this existing public photo bucket for the supported upload formats.
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'profile-images';

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Hi5 own profile photo uploads') then
    create policy "Hi5 own profile photo uploads" on storage.objects for insert to authenticated
      with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Hi5 own profile photo reads') then
    create policy "Hi5 own profile photo reads" on storage.objects for select to authenticated
      using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
