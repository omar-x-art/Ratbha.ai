# Supabase Migrations

## How to apply

1. Open https://app.supabase.com/project/_/sql.
2. Copy each `migrations/*.sql` file in numerical order and run.

## Files

- `0001_init.sql` — Initial schema (`users`, `tasks`, `plans`, `plan_items`, `calendar_connections`, `audit_logs`) + RLS policies.
- `0002_email_natural_key.sql` — Phase 5: makes `email` the natural unique key on `users` so we can upsert without depending on `auth.users.id`.

## Rollback

If you need to drop everything:

```sql
drop table if exists public.audit_logs cascade;
drop table if exists public.plan_items cascade;
drop table if exists public.plans cascade;
drop table if exists public.tasks cascade;
drop table if exists public.calendar_connections cascade;
drop table if exists public.users cascade;
```
