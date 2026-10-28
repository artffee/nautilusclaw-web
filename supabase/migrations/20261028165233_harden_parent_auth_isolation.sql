-- Preserve every existing row. Restrict browser roles to family-scoped CRUD.
revoke all privileges on table public.parent, public.child, public.message,
  public.concern, public.summary from public, anon;
revoke truncate, references, trigger on table public.parent, public.child,
  public.message, public.concern, public.summary from authenticated;
grant select, insert, update, delete on table public.parent, public.child,
  public.message, public.concern, public.summary to authenticated;

alter policy "parent self" on public.parent to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy "own children" on public.child to authenticated
  using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
alter policy "messages of own children" on public.message to authenticated
  using (exists (select 1 from public.child c where c.id = message.child_id and c.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.child c where c.id = message.child_id and c.parent_id = (select auth.uid())));
alter policy "summaries of own children" on public.summary to authenticated
  using (exists (select 1 from public.child c where c.id = summary.child_id and c.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.child c where c.id = summary.child_id and c.parent_id = (select auth.uid())));
alter policy "concerns of own children" on public.concern to authenticated
  using (exists (select 1 from public.child c where c.id = concern.child_id and c.parent_id = (select auth.uid())))
  with check (
    exists (select 1 from public.child c where c.id = concern.child_id and c.parent_id = (select auth.uid()))
    and (message_id is null or exists (
      select 1 from public.message m where m.id = concern.message_id and m.child_id = concern.child_id
    ))
  );

-- This function is invoked only by the auth.users trigger, never as a public RPC.
-- Trigger execution remains functional without granting browser roles EXECUTE.
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
