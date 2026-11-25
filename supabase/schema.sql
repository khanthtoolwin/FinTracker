-- FinTracker Supabase PostgreSQL Schema & Row-Level Security
-- Run this script in your Supabase Project -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  amount numeric(12, 2) not null check (amount > 0 and amount <= 999999999.99),
  category text not null check (
    category in (
      'Food & Dining',
      'Transport',
      'Groceries',
      'Utilities & Bills',
      'Shopping',
      'Health',
      'Entertainment',
      'Other'
    )
  ),
  expense_date date not null,
  payment_method text not null default 'Card' check (
    payment_method in ('Card', 'Cash', 'Bank Transfer', 'Digital Wallet')
  ),
  currency text not null default 'USD' check (
    currency in ('USD', 'THB', 'MMK')
  ),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists currency text not null default 'USD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_currency_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_currency_check
      check (currency in ('USD', 'THB', 'MMK'));
  end if;
end
$$;

create index if not exists idx_expenses_user_date
  on public.expenses (user_id, expense_date desc, created_at desc);

create index if not exists idx_expenses_user_category
  on public.expenses (user_id, category);

create or replace function public.set_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row
  execute function public.set_expenses_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
  on public.expenses
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
  on public.expenses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Hardened & throttled email registration lookup for Forgot Password flow
create table if not exists public.auth_email_lookup_attempts (
  email_key text primary key,
  attempt_count integer not null default 1,
  window_started_at timestamptz not null default now()
);

alter table public.auth_email_lookup_attempts enable row level security;

create or replace function public.check_email_registered(email_input text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_attempts integer;
  v_exists boolean;
begin
  v_email := lower(trim(coalesce(email_input, '')));

  if char_length(v_email) < 3
     or char_length(v_email) > 254
     or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object(
      'registered', false,
      'rate_limited', false,
      'invalid', true
    );
  end if;

  insert into public.auth_email_lookup_attempts (
    email_key,
    attempt_count,
    window_started_at
  )
  values (v_email, 1, now())
  on conflict (email_key) do update
  set
    attempt_count = case
      when public.auth_email_lookup_attempts.window_started_at < now() - interval '15 minutes'
        then 1
      else least(public.auth_email_lookup_attempts.attempt_count + 1, 1000)
    end,
    window_started_at = case
      when public.auth_email_lookup_attempts.window_started_at < now() - interval '15 minutes'
        then now()
      else public.auth_email_lookup_attempts.window_started_at
    end
  returning attempt_count into v_attempts;

  if v_attempts > 5 then
    return jsonb_build_object(
      'registered', false,
      'rate_limited', true,
      'invalid', false
    );
  end if;

  select exists (
    select 1
    from auth.users
    where lower(email) = v_email
  ) into v_exists;

  return jsonb_build_object(
    'registered', v_exists,
    'rate_limited', false,
    'invalid', false
  );
end;
$$;

revoke all on function public.check_email_registered(text) from public;
grant execute on function public.check_email_registered(text) to anon, authenticated;
