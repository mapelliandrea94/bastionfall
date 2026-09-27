grant select, insert, update, delete on public.last_bastion_queue to authenticated;

drop policy if exists "last_bastion_queue_select" on public.last_bastion_queue;
create policy "last_bastion_queue_select"
on public.last_bastion_queue
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.bastionfall_server_write_allowed())
);

drop policy if exists "last_bastion_queue_insert_own" on public.last_bastion_queue;
create policy "last_bastion_queue_insert_own"
on public.last_bastion_queue
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

drop policy if exists "last_bastion_queue_update_own" on public.last_bastion_queue;
create policy "last_bastion_queue_update_own"
on public.last_bastion_queue
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "last_bastion_queue_delete_own" on public.last_bastion_queue;
create policy "last_bastion_queue_delete_own"
on public.last_bastion_queue
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.bastionfall_server_write_allowed())
);
