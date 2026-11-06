-- ============================================================================
-- NautilusClaw — Supabase schema + Row-Level Security
-- Run this in your Supabase project: Dashboard > SQL Editor > New query > Run.
-- RLS is the heart of the GDPR/COPPA data-isolation story:
-- a parent can only ever read or write rows belonging to their own family.
-- ============================================================================

-- 1. PARENT profile (1:1 with the Supabase auth user)
create table if not exists public.parent (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  created_at  timestamptz not null default now()
);

-- Per-account app state (kid profile, progress, chat history, concerns) as JSON,
-- so everything syncs across the kid's tablet and the parent's phone.
-- RLS "parent self" already protects this. (Relational message/concern/summary
-- tables below remain for richer querying / server-side summaries.)
alter table public.parent add column if not exists state jsonb not null default '{}'::jsonb;

-- 2. CHILD profiles, owned by a parent. parent_id auto-fills to the signed-in user.
create table if not exists public.child (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid not null default auth.uid() references public.parent(id) on delete cascade,
  display_name  text not null,
  age_band      text not null check (age_band in ('3-5','6-8','9-12')),
  created_at    timestamptz not null default now()
);
create index if not exists child_parent_idx on public.child(parent_id);

-- 3. MESSAGES — the raw material for every dashboard metric
create table if not exists public.message (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.child(id) on delete cascade,
  role        text not null check (role in ('kid','naut')),
  text        text not null,
  emotion     text,
  safety_flag text,
  created_at  timestamptz not null default now()
);
create index if not exists message_child_idx on public.message(child_id, created_at);

-- 4. CONCERNS — crisis | wellbeing | moderation
create table if not exists public.concern (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.child(id) on delete cascade,
  type        text not null check (type in ('crisis','wellbeing','moderation')),
  trigger     text,
  message_id  uuid references public.message(id) on delete set null,
  status      text not null default 'open' check (status in ('open','reviewed')),
  created_at  timestamptz not null default now()
);
create index if not exists concern_child_idx on public.concern(child_id, created_at);

-- 5. WEEKLY LEARNING SUMMARIES (Problem #3 will write these server-side)
create table if not exists public.summary (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.child(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  content_json  jsonb not null,
  created_at    timestamptz not null default now()
);
create index if not exists summary_child_idx on public.summary(child_id, period_end);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.parent  enable row level security;
alter table public.child   enable row level security;
alter table public.message enable row level security;
alter table public.concern enable row level security;
alter table public.summary enable row level security;

drop policy if exists "parent self" on public.parent;
create policy "parent self" on public.parent
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own children" on public.child;
create policy "own children" on public.child
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

drop policy if exists "messages of own children" on public.message;
create policy "messages of own children" on public.message
  for all
  using (exists (select 1 from public.child c where c.id = message.child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from public.child c where c.id = message.child_id and c.parent_id = auth.uid()));

drop policy if exists "concerns of own children" on public.concern;
create policy "concerns of own children" on public.concern
  for all
  using (exists (select 1 from public.child c where c.id = concern.child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from public.child c where c.id = concern.child_id and c.parent_id = auth.uid()));

drop policy if exists "summaries of own children" on public.summary;
create policy "summaries of own children" on public.summary
  for all
  using (exists (select 1 from public.child c where c.id = summary.child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from public.child c where c.id = summary.child_id and c.parent_id = auth.uid()));

-- ============================================================================
-- Auto-create a parent profile row whenever a new auth user signs up
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.parent (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
