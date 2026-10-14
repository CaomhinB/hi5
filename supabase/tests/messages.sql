-- Run after the Messages migration. Fixtures and messages are always rolled back.
begin;
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  pa uuid; pb uuid; pc uuid; request uuid;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (a, 'messages-test-' || a || '@example.invalid', '{"full_name":"Messages Test A"}'),
    (b, 'messages-test-' || b || '@example.invalid', '{"full_name":"Messages Test B"}'),
    (c, 'messages-test-' || c || '@example.invalid', '{"full_name":"Messages Test C"}');
  select id into pa from public.users where auth_user_id = a;
  select id into pb from public.users where auth_user_id = b;
  select id into pc from public.users where auth_user_id = c;
  perform set_config('hi5_test.auth_a', a::text, true);
  perform set_config('hi5_test.auth_b', b::text, true);
  perform set_config('hi5_test.auth_c', c::text, true);
  perform set_config('hi5_test.public_a', pa::text, true);
  perform set_config('hi5_test.public_b', pb::text, true);
  -- A recommendation expires in a minute, but its new request still gets 120 hours.
  insert into public.interactions(from_user_id, to_user_id, action, source, expires_at, updated_at)
    values(pa, pb, 'hi', 'hi5', now() + interval '1 minute', now());
  select id into request from public.message_hi_requests where sender_id = pa and recipient_id = pb;
  assert request is not null, 'Hi did not create a request';
  assert (select expires_at - sent_at = interval '120 hours' from public.message_hi_requests where id = request), 'Incorrect response window';
  perform set_config('hi5_test.request', request::text, true);
  -- Prove the request can be accepted after the original batch-bound Hi expires.
  update public.interactions set expires_at = now() - interval '1 minute'
    where from_user_id = pa and to_user_id = pb;
  insert into public.interactions(from_user_id, to_user_id, action, source, updated_at)
    values(pa, pc, 'hi', 'discover', now() - interval '6 days');
  select id into request from public.message_hi_requests where sender_id = pa and recipient_id = pc;
  perform set_config('hi5_test.expired', request::text, true);
end; $$;

set local role authenticated;
do $$ declare result jsonb; match uuid; message uuid := gen_random_uuid(); inbox jsonb; failed boolean; begin
  perform set_config('request.jwt.claim.sub', current_setting('hi5_test.auth_b'), true);
  inbox := public.get_messages_inbox(current_setting('hi5_test.auth_b')::uuid);
  assert jsonb_array_length(inbox->'requests') = 1, 'Recipient cannot see request';
  result := public.respond_to_message_hi(current_setting('hi5_test.auth_b')::uuid, current_setting('hi5_test.request')::uuid, 'hi');
  match := (result->>'match_id')::uuid;
  assert match is not null, 'Accept did not create match';
  perform set_config('hi5_test.match', match::text, true);
  assert public.respond_to_message_hi(current_setting('hi5_test.auth_b')::uuid, current_setting('hi5_test.request')::uuid, 'hi')->>'match_id' = match::text, 'Accept retry not idempotent';
  inbox := public.get_messages_inbox(current_setting('hi5_test.auth_b')::uuid);
  assert jsonb_array_length(inbox->'requests') = 0, 'Accepted request still in inbox';
  assert jsonb_array_length(inbox->'conversations') = 1, 'Accepted chat missing';
  result := public.send_chat_message(current_setting('hi5_test.auth_b')::uuid, match, message, 'Hello from B');
  assert result->>'sender_id' = current_setting('hi5_test.public_b'), 'Wrong sender';
  perform public.send_chat_message(current_setting('hi5_test.auth_b')::uuid, match, message, 'Hello from B');
  assert jsonb_array_length(public.get_message_thread(current_setting('hi5_test.auth_b')::uuid, match)) = 1, 'Send retry duplicated message';
  failed := false;
  begin perform public.send_chat_message(current_setting('hi5_test.auth_b')::uuid, match, gen_random_uuid(), '   ');
  exception when others then failed := true; end;
  assert failed, 'Blank message accepted';
  failed := false;
  begin insert into public.messages(match_id, sender_id, body) values(match, current_setting('hi5_test.public_a')::uuid, 'Forged');
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Direct forged message accepted';
  perform set_config('hi5_test.message', message::text, true);
  perform set_config('request.jwt.claim.sub', current_setting('hi5_test.auth_a'), true);
  inbox := public.get_messages_inbox(current_setting('hi5_test.auth_a')::uuid);
  assert (inbox->'conversations'->0->>'unread_count')::int = 1, 'Unread count missing';
  perform public.mark_chat_read(current_setting('hi5_test.auth_a')::uuid, match, (result->>'created_at')::timestamptz, message);
  inbox := public.get_messages_inbox(current_setting('hi5_test.auth_a')::uuid);
  assert (inbox->'conversations'->0->>'unread_count')::int = 0, 'Read receipt not saved';
  assert (select read_at is not null from public.messages where id = message), 'Read timestamp missing';
  failed := false;
  begin perform public.get_messages_inbox(current_setting('hi5_test.auth_b')::uuid);
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Account mismatch allowed';
  perform set_config('request.jwt.claim.sub', current_setting('hi5_test.auth_c'), true);
  assert (select count(*) = 0 from public.messages where match_id = match), 'Outsider read messages';
  failed := false;
  begin perform public.get_message_thread(current_setting('hi5_test.auth_c')::uuid, match);
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Outsider read thread RPC';
  failed := false;
  begin perform public.send_chat_message(current_setting('hi5_test.auth_c')::uuid, match, gen_random_uuid(), 'Intruder');
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Outsider sent message';
  failed := false;
  begin perform public.respond_to_message_hi(current_setting('hi5_test.auth_c')::uuid, current_setting('hi5_test.expired')::uuid, 'hi');
  exception when others then failed := true; end;
  assert failed, 'Expired Hi accepted';
end; $$;
reset role;

set local role anon;
do $$ declare failed boolean := false; begin
  begin perform public.get_messages_inbox(current_setting('hi5_test.auth_a')::uuid);
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Anonymous inbox access allowed';
end; $$;
reset role;
select 'Messages integration checks passed; all fixtures rolled back.' as result;
rollback;
