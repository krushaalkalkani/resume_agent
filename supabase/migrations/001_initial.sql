-- Run in Supabase SQL Editor (Dashboard → SQL → New query).
-- Enables multi-user storage: one master resume per user + tailored history.

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Master resume',
  is_master boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resumes_one_master_per_user
  on public.resumes (user_id)
  where is_master = true;

create table if not exists public.tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  job_focus text not null default '',
  jd_text text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tailored_resumes_user_id_idx
  on public.tailored_resumes (user_id, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- Row Level Security (defense in depth; API also checks user_id)
alter table public.resumes enable row level security;
alter table public.tailored_resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

drop policy if exists "tailored_select_own" on public.tailored_resumes;
create policy "tailored_select_own" on public.tailored_resumes
  for select using (auth.uid() = user_id);

drop policy if exists "tailored_insert_own" on public.tailored_resumes;
create policy "tailored_insert_own" on public.tailored_resumes
  for insert with check (auth.uid() = user_id);
