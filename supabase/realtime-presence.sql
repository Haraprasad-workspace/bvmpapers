-- Anonymous public participation is intentional for this one room.
-- Keep the policies limited to Presence messages on exactly this topic.
-- In Supabase Dashboard > Realtime > Settings, disable "Allow public access"
-- so clients must join private channels and these policies are evaluated.

drop policy if exists "BVM Papers anon can read semester 5 presence" on realtime.messages;
create policy "BVM Papers anon can read semester 5 presence"
on realtime.messages
for select
to anon
using (
  realtime.topic() = 'semester-5'
  and extension = 'presence'
);

drop policy if exists "BVM Papers anon can publish semester 5 presence" on realtime.messages;
create policy "BVM Papers anon can publish semester 5 presence"
on realtime.messages
for insert
to anon
with check (
  realtime.topic() = 'semester-5'
  and extension = 'presence'
);
