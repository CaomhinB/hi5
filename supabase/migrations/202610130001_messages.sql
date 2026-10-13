-- Messages and timed incoming Hi requests. Existing messages/history are preserved.
begin;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_thread_order on public.messages(match_id, created_at desc, id desc);
create index if not exists messages_unread on public.messages(match_id, sender_id) where read_at is null;

-- A request snapshots a send, independently of the recommendation batch deadline.
create table public.message_hi_requests (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references public.interactions(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  sent_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'passed')),
  responded_at timestamptz,
  unique (interaction_id, sent_at),
  check (sender_id <> recipient_id),
  check (expires_at = sent_at + interval '120 hours')
);
create index message_hi_requests_inbox on public.message_hi_requests(recipient_id, expires_at) where status = 'pending';
alter table public.message_hi_requests enable row level security;
alter table public.messages enable row level security;
create policy message_hi_requests_read on public.message_hi_requests for select to authenticated
  using (recipient_id in (select id from public.users where auth_user_id = (select auth.uid())));
create policy messages_participant_guard on public.messages as restrictive for select to authenticated
  using (exists (select 1 from public.matches m join public.users u on u.auth_user_id = (select auth.uid())
    where m.id = messages.match_id and m.status = 'active' and u.id in (m.user_1_id, m.user_2_id)));
-- Also works on an environment without the existing permissive read policy.
create policy messages_participant_read on public.messages for select to authenticated
  using (exists (select 1 from public.matches m join public.users u on u.auth_user_id = (select auth.uid())
    where m.id = messages.match_id and m.status = 'active' and u.id in (m.user_1_id, m.user_2_id)));
revoke all on public.message_hi_requests from anon, authenticated;
grant select on public.message_hi_requests to authenticated;
revoke all on public.messages from anon, authenticated;
revoke insert (id, match_id, sender_id, body, created_at, read_at),
  update (id, match_id, sender_id, body, created_at, read_at) on public.messages from authenticated;
grant select on public.messages to authenticated;

create function public.messages_capture_hi() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.action <> 'hi' then
    update public.message_hi_requests set status = 'passed', responded_at = clock_timestamp()
      where interaction_id = new.id and status = 'pending';
    return new;
  end if;
  if new.action = 'hi' then
    if tg_op = 'UPDATE' then
      if old.action = new.action and old.updated_at = new.updated_at then return new; end if;
    end if;
    update public.message_hi_requests set status = 'passed', responded_at = clock_timestamp()
      where interaction_id = new.id and status = 'pending';
    insert into public.message_hi_requests(interaction_id, sender_id, recipient_id, sent_at, expires_at)
      values(new.id, new.from_user_id, new.to_user_id, new.updated_at, new.updated_at + interval '120 hours')
      on conflict (interaction_id, sent_at) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.messages_capture_hi() from public, anon, authenticated;
create trigger messages_capture_hi after insert or update on public.interactions
  for each row execute function public.messages_capture_hi();

insert into public.message_hi_requests(interaction_id, sender_id, recipient_id, sent_at, expires_at)
select id, from_user_id, to_user_id, updated_at, updated_at + interval '120 hours'
from public.interactions where action = 'hi' and updated_at + interval '120 hours' > now()
  and (expires_at is null or expires_at > now());

create function public.messages_owner(expected_auth_user_id uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_owner uuid;
begin
  if auth.uid() is null or auth.uid() is distinct from expected_auth_user_id then
    raise exception 'messages_auth_required' using errcode = '42501';
  end if;
  select id into v_owner from public.users where auth_user_id = auth.uid();
  if v_owner is null then raise exception 'messages_profile_missing'; end if;
  return v_owner;
end;
$$;
revoke all on function public.messages_owner(uuid) from public, anon, authenticated;

create function public.get_messages_inbox(expected_auth_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := public.messages_owner(expected_auth_user_id); v_result jsonb;
begin
  select jsonb_build_object('server_time', clock_timestamp(), 'requests',
    coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('profile', to_jsonb(p)) order by r.expires_at)
      from public.message_hi_requests r join public.user_profiles p on p.id = r.sender_id
      where r.recipient_id = v_owner and r.status = 'pending' and r.expires_at > clock_timestamp()
      and not exists (select 1 from public.matches m where m.user_1_id = least(r.sender_id, v_owner)
        and m.user_2_id = greatest(r.sender_id, v_owner) and m.status = 'active')), '[]'::jsonb),
    'conversations', coalesce((select jsonb_agg(c order by c.activity_at desc, c.id) from (
      select m.id, m.matched_at, to_jsonb(p) as profile, to_jsonb(last_message) as last_message,
        coalesce(last_message.created_at, m.matched_at) as activity_at,
        (select count(*) from public.messages msg where msg.match_id = m.id and msg.sender_id <> v_owner
          and msg.read_at is null) as unread_count
      from public.matches m join public.user_profiles p on p.id = case when m.user_1_id = v_owner then m.user_2_id else m.user_1_id end
      left join lateral (select msg.* from public.messages msg where msg.match_id = m.id
        order by msg.created_at desc, msg.id desc limit 1) last_message on true
      where m.status = 'active' and v_owner in (m.user_1_id, m.user_2_id)
    ) c), '[]'::jsonb)) into v_result;
  return v_result;
end;
$$;

create function public.respond_to_message_hi(expected_auth_user_id uuid, request_id uuid, response text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := public.messages_owner(expected_auth_user_id); v_request public.message_hi_requests%rowtype;
  v_match uuid; v_now timestamptz;
begin
  if response not in ('hi', 'pass') or response is null then raise exception 'messages_invalid_response'; end if;
  select * into v_request from public.message_hi_requests where id = request_id and recipient_id = v_owner;
  if not found then raise exception 'messages_request_unavailable'; end if;
  -- Same pair-lock order as the existing Discovery/Hi5 interaction functions.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hi5:profile:' || least(v_owner, v_request.sender_id)::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hi5:profile:' || greatest(v_owner, v_request.sender_id)::text, 0));
  select * into v_request from public.message_hi_requests where id = request_id and recipient_id = v_owner for update;
  select id into v_match from public.matches where user_1_id = least(v_owner, v_request.sender_id)
    and user_2_id = greatest(v_owner, v_request.sender_id) and status = 'active';
  if v_match is not null then return jsonb_build_object('match_id', v_match); end if;
  v_now := clock_timestamp();
  if v_request.status <> 'pending' or v_request.expires_at <= v_now then raise exception 'messages_request_expired'; end if;
  if response = 'pass' then
    update public.message_hi_requests set status = 'passed', responded_at = v_now where id = request_id;
    return jsonb_build_object('match_id', null);
  end if;
  -- Accepting an incoming request is independent of the recipient's shortlist choices.
  -- Do not rewrite either person's final recommendation decisions or renew the request.
  insert into public.matches(user_1_id, user_2_id, status, matched_at)
    values(least(v_owner, v_request.sender_id), greatest(v_owner, v_request.sender_id), 'active', v_now)
    on conflict (user_1_id, user_2_id) do update set status = 'active', unmatched_at = null, matched_at = excluded.matched_at
    returning id into v_match;
  update public.message_hi_requests set status = 'accepted', responded_at = v_now
    where status = 'pending' and ((sender_id = v_owner and recipient_id = v_request.sender_id)
      or (sender_id = v_request.sender_id and recipient_id = v_owner));
  perform public._hi5_sync_pair(v_owner, v_request.sender_id);
  return jsonb_build_object('match_id', v_match);
end;
$$;

create function public.get_message_thread(expected_auth_user_id uuid, target_match_id uuid,
  before_created_at timestamptz default null, before_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := public.messages_owner(expected_auth_user_id);
begin
  if not exists (select 1 from public.matches where id = target_match_id and status = 'active'
    and v_owner in (user_1_id, user_2_id)) then raise exception 'messages_conversation_unavailable' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(msg order by msg.created_at, msg.id) from (
    select * from public.messages where match_id = target_match_id
      and (before_created_at is null or (created_at, id) < (before_created_at, before_id))
    order by created_at desc, id desc limit 50
  ) msg), '[]'::jsonb);
end;
$$;

create function public.send_chat_message(expected_auth_user_id uuid, target_match_id uuid, message_id uuid, message_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := public.messages_owner(expected_auth_user_id); v_message public.messages%rowtype;
begin
  perform 1 from public.matches where id = target_match_id and status = 'active'
    and v_owner in (user_1_id, user_2_id) for update;
  if not found then raise exception 'messages_conversation_unavailable' using errcode = '42501'; end if;
  if message_id is null or message_body is null or char_length(btrim(message_body)) not between 1 and 5000 then
    raise exception 'messages_invalid_body'; end if;
  insert into public.messages(id, match_id, sender_id, body) values(message_id, target_match_id, v_owner, btrim(message_body))
    on conflict (id) do nothing returning * into v_message;
  if v_message.id is null then
    select * into v_message from public.messages where id = message_id and match_id = target_match_id
      and sender_id = v_owner and body = btrim(message_body);
    if not found then raise exception 'messages_invalid_retry'; end if;
  end if;
  return to_jsonb(v_message);
end;
$$;

create function public.mark_chat_read(expected_auth_user_id uuid, target_match_id uuid, through_created_at timestamptz, through_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := public.messages_owner(expected_auth_user_id);
begin
  if not exists (select 1 from public.matches where id = target_match_id and status = 'active'
    and v_owner in (user_1_id, user_2_id)) then raise exception 'messages_conversation_unavailable' using errcode = '42501'; end if;
  update public.messages set read_at = clock_timestamp() where match_id = target_match_id and sender_id <> v_owner
    and read_at is null and (created_at, id) <= (through_created_at, through_id);
end;
$$;

revoke all on function public.get_messages_inbox(uuid), public.respond_to_message_hi(uuid, uuid, text),
  public.get_message_thread(uuid, uuid, timestamptz, uuid), public.send_chat_message(uuid, uuid, uuid, text),
  public.mark_chat_read(uuid, uuid, timestamptz, uuid) from public, anon;
grant execute on function public.get_messages_inbox(uuid), public.respond_to_message_hi(uuid, uuid, text),
  public.get_message_thread(uuid, uuid, timestamptz, uuid), public.send_chat_message(uuid, uuid, uuid, text),
  public.mark_chat_read(uuid, uuid, timestamptz, uuid) to authenticated;

do $$ declare v_table text; begin
  foreach v_table in array array['messages', 'message_hi_requests', 'matches'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end; $$;
notify pgrst, 'reload schema';
commit;
