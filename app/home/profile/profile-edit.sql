-- Run once in the Supabase SQL Editor as the project administrator.
-- Requires the existing app/onboarding/onboarding.sql setup for reads/uploads.
-- Each edit only updates its section; the user ID always comes from auth.uid().
begin;

create or replace function public.update_my_profile_section(
  expected_auth_user_id uuid, section_name text, section_input jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_auth_id uuid := auth.uid();
  v_user_id uuid;
  v_profile public.user_profiles;
  v_input public.user_profiles;
  v_fields text[];
  v_allowed_industries text[] := array['AI', 'B2B', 'Cloud Computing', 'Construction', 'Consulting', 'Consumer Apps', 'Creative', 'E-commerce', 'Education', 'Enterprise', 'Finance', 'FinTech', 'Healthcare', 'HR', 'Logistics', 'Marketing', 'Media', 'Mobile Technology', 'Pre-launch', 'Retail', 'SaaS', 'Small Business', 'Social Enterprise', 'Social Impact', 'Startups', 'Sustainability', 'Technology', 'Technology & Software', 'Artificial Intelligence & Machine Learning', 'Finance & FinTech', 'Healthcare & MedTech', 'Education & EdTech', 'E-commerce & Retail', 'Marketing & Advertising', 'Media & Entertainment', 'Manufacturing & Engineering', 'Energy & Sustainability', 'Real Estate & PropTech', 'Travel & Hospitality', 'Logistics & Supply Chain', 'Food & Beverage', 'Professional Services & Consulting'];
begin
  if v_auth_id is null then raise exception 'profile_auth_required'; end if;
  if v_auth_id is distinct from expected_auth_user_id then raise exception 'profile_account_changed'; end if;
  select u.id into v_user_id from public.users u where u.auth_user_id = v_auth_id;
  if v_user_id is null then raise exception 'profile_user_missing'; end if;

  case section_name
    when 'about' then v_fields := array['name', 'age', 'location', 'bio'];
    when 'work' then v_fields := array['job_title', 'organisation', 'experience', 'industries'];
    when 'skills' then v_fields := array['skills', 'interests', 'current_projects'];
    when 'photo' then v_fields := array['image_path', 'portfolio_url', 'linkedin_url', 'github_url'];
    else raise exception 'profile_invalid: Choose a valid profile section.';
  end case;
  if section_input is null or jsonb_typeof(section_input) <> 'object' then
    raise exception 'profile_invalid: Please check your profile details.';
  end if;
  if exists (select 1 from jsonb_object_keys(section_input) k where not (k = any(v_fields)))
    or not (section_input ?& v_fields) then
    raise exception 'profile_invalid: Please send all fields for this section only.';
  end if;
  begin
    v_input := jsonb_populate_record(null::public.user_profiles, section_input);
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'profile_invalid: Please check the numbers and selections in this section.';
  end;

  select p.* into v_profile from public.user_profiles p where p.id = v_user_id for update;
  if not found then raise exception 'profile_record_missing'; end if;

  case section_name
    when 'about' then
      if coalesce(char_length(btrim(v_input.name)), 0) not between 1 and 120 then
        raise exception 'profile_invalid: Enter your name (up to 120 characters).';
      end if;
      if coalesce(char_length(btrim(v_input.location)), 0) not between 1 and 160 then
        raise exception 'profile_invalid: Enter your location (up to 160 characters).';
      end if;
      if coalesce(char_length(btrim(v_input.bio)), 0) not between 1 and 600 then
        raise exception 'profile_invalid: Enter a bio (up to 600 characters).';
      end if;
      if v_input.age is not null and v_input.age not between 1 and 120 then
        raise exception 'profile_invalid: Enter an age from 1 to 120, or leave it empty.';
      end if;
      update public.user_profiles set
        name = btrim(v_input.name), age = v_input.age,
        location = btrim(v_input.location), bio = btrim(v_input.bio), updated_at = now()
      where id = v_user_id returning * into v_profile;

    when 'work' then
      if coalesce(char_length(btrim(v_input.job_title)), 0) not between 1 and 160 then
        raise exception 'profile_invalid: Enter your role (up to 160 characters).';
      end if;
      if v_input.experience is null or v_input.experience not between 0 and 100 then
        raise exception 'profile_invalid: Enter years of experience from 0 to 100.';
      end if;
      if coalesce(char_length(btrim(v_input.organisation)), 0) > 160 then
        raise exception 'profile_invalid: Keep your organisation name within 160 characters.';
      end if;
      if coalesce(cardinality(v_input.industries), 0) not between 1 and 3
        or exists (select 1 from unnest(v_input.industries) i where i is null or not (i = any(v_allowed_industries)))
        or (select count(distinct i) from unnest(v_input.industries) i) <> cardinality(v_input.industries) then
        raise exception 'profile_invalid: Choose between 1 and 3 industries from the provided list.';
      end if;
      update public.user_profiles set
        job_title = btrim(v_input.job_title), organisation = nullif(btrim(v_input.organisation), ''),
        experience = v_input.experience, industries = v_input.industries, updated_at = now()
      where id = v_user_id returning * into v_profile;

    when 'skills' then
      if coalesce(cardinality(v_input.skills), 0) < 1
        or exists (select 1 from unnest(v_input.skills) s where s is null or char_length(btrim(s)) not between 1 and 80) then
        raise exception 'profile_invalid: Add at least one skill, with up to 80 characters per skill.';
      end if;
      if exists (select 1 from unnest(v_input.interests) i where i is null or char_length(btrim(i)) not between 1 and 80) then
        raise exception 'profile_invalid: Keep each interest within 80 characters.';
      end if;
      if coalesce(char_length(btrim(v_input.current_projects)), 0) > 600 then
        raise exception 'profile_invalid: Keep your project description within 600 characters.';
      end if;
      update public.user_profiles set
        skills = v_input.skills, interests = coalesce(v_input.interests, array[]::text[]),
        current_projects = nullif(btrim(v_input.current_projects), ''), updated_at = now()
      where id = v_user_id returning * into v_profile;

    when 'photo' then
      if exists (
        select 1 from unnest(array[v_input.portfolio_url, v_input.linkedin_url, v_input.github_url]) u
        where nullif(btrim(u), '') is not null and (char_length(u) > 2048 or u !~ '^https?://[^[:space:]]+$')
      ) then
        raise exception 'profile_invalid: Links must start with https:// or http:// (up to 2048 characters).';
      end if;
      if nullif(btrim(v_input.image_path), '') is null then
        raise exception 'profile_invalid: Add a profile photo.';
      end if;
      if v_input.image_path is distinct from v_profile.image_path
        and left(v_input.image_path, char_length(v_auth_id::text) + 1) <> v_auth_id::text || '/' then
        raise exception 'profile_invalid: Please upload your own profile photo.';
      end if;
      if not exists (select 1 from storage.objects o where o.bucket_id = 'profile-images' and o.name = v_input.image_path) then
        raise exception 'profile_invalid: Your photo is not available. Please upload it again.';
      end if;
      update public.user_profiles set
        image_path = v_input.image_path, portfolio_url = nullif(btrim(v_input.portfolio_url), ''),
        linkedin_url = nullif(btrim(v_input.linkedin_url), ''), github_url = nullif(btrim(v_input.github_url), ''), updated_at = now()
      where id = v_user_id returning * into v_profile;
  end case;

  return jsonb_build_object(
    'success', true, 'auth_user_id', v_auth_id, 'user_id', v_user_id, 'profile', to_jsonb(v_profile),
    'photo_exists', exists (select 1 from storage.objects o where o.bucket_id = 'profile-images' and o.name = v_profile.image_path)
  );
end;
$$;

revoke all on function public.update_my_profile_section(uuid, text, jsonb) from public, anon;
grant execute on function public.update_my_profile_section(uuid, text, jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
