-- Rattabha AI Calendar — initial schema (per plan §14)
-- Apply manually in Supabase: SQL editor → run.
-- All tables enable RLS and grant access only to the row's owner.

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique,                  -- Supabase auth.users.id
  email text unique,
  name text,
  timezone text default 'Asia/Riyadh',
  locale text default 'ar',
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'google',
  google_calendar_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'inbox',
  source_text text,
  due_date date,
  preferred_start timestamptz,
  preferred_end timestamptz,
  duration_minutes int default 30,
  priority text default 'medium',
  energy text default 'medium',
  flexibility text default 'flexible',
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  plan_date date,
  status text not null default 'draft',
  ai_model text,
  input_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_items (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  item_type text not null default 'proposed_task',
  google_event_id text,
  is_locked boolean default false,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_plans_user on public.plans(user_id);
create index if not exists idx_plan_items_plan on public.plan_items(plan_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.tasks enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.audit_logs enable row level security;

-- Owner-only policies (match by Supabase auth.uid())
create policy if not exists "users_self_select"
  on public.users for select using (auth.uid() = auth_id);
create policy if not exists "users_self_update"
  on public.users for update using (auth.uid() = auth_id);

create policy if not exists "tasks_owner_all"
  on public.tasks for all
  using (user_id in (select id from public.users where auth_id = auth.uid()))
  with check (user_id in (select id from public.users where auth_id = auth.uid()));

create policy if not exists "plans_owner_all"
  on public.plans for all
  using (user_id in (select id from public.users where auth_id = auth.uid()))
  with check (user_id in (select id from public.users where auth_id = auth.uid()));

create policy if not exists "plan_items_owner_all"
  on public.plan_items for all
  using (
    plan_id in (
      select id from public.plans
      where user_id in (select id from public.users where auth_id = auth.uid())
    )
  )
  with check (
    plan_id in (
      select id from public.plans
      where user_id in (select id from public.users where auth_id = auth.uid())
    )
  );

create policy if not exists "calendar_owner_all"
  on public.calendar_connections for all
  using (user_id in (select id from public.users where auth_id = auth.uid()))
  with check (user_id in (select id from public.users where auth_id = auth.uid()));

create policy if not exists "audit_owner_select"
  on public.audit_logs for select
  using (user_id in (select id from public.users where auth_id = auth.uid()));
