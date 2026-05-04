-- Phase 5: use email as the natural unique key (we don't depend on Supabase Auth yet).
alter table public.users
  alter column email set not null;

create unique index if not exists users_email_unique on public.users (email);
