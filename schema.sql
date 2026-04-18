-- ============================================================
-- Custodis — AML Compliance Platform
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Firms
create table if not exists public.firms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- Profiles (one per auth user)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  firm_id    uuid references public.firms(id) on delete set null,
  full_name  text,
  role       text not null default 'solicitor',
  created_at timestamptz default now()
);

-- Clients
create table if not exists public.clients (
  id                 uuid primary key default gen_random_uuid(),
  firm_id            uuid not null references public.firms(id) on delete cascade,
  full_name          text not null,
  email              text,
  matter_type        text not null default 'conveyancing',
  matter_description text,
  risk_level         text not null default 'low' check (risk_level in ('low','medium','high')),
  cdd_status         text not null default 'pending' check (cdd_status in ('pending','complete','overdue')),
  cdd_completed_at   timestamptz,
  cdd_expires_at     timestamptz,
  is_company         boolean not null default false,
  pep                boolean not null default false,
  source_of_funds    text,
  notes              text,
  created_at         timestamptz default now(),
  created_by         uuid references public.profiles(id) on delete set null
);

-- Business Risk Assessments (one per firm)
create table if not exists public.business_risk_assessments (
  id               uuid primary key default gen_random_uuid(),
  firm_id          uuid not null unique references public.firms(id) on delete cascade,
  content          jsonb not null default '{}',
  last_reviewed_at timestamptz,
  next_review_at   timestamptz,
  status           text not null default 'draft' check (status in ('draft','complete')),
  updated_by       uuid references public.profiles(id) on delete set null,
  updated_at       timestamptz default now()
);

-- Audit log (append-only)
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  firm_id     uuid references public.firms(id) on delete set null,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.firms                    enable row level security;
alter table public.profiles                 enable row level security;
alter table public.clients                  enable row level security;
alter table public.business_risk_assessments enable row level security;
alter table public.audit_log                enable row level security;

-- Helper: get the firm_id for the current user
create or replace function public.my_firm_id()
returns uuid language sql security definer stable as $$
  select firm_id from public.profiles where id = auth.uid()
$$;

-- Firms: users can insert a new firm at signup; can only read/update/delete their own firm
create policy "firms: insert" on public.firms
  for insert with check (auth.uid() is not null);

create policy "firms: own firm" on public.firms
  for select using (id = public.my_firm_id());

create policy "firms: update own firm" on public.firms
  for update using (id = public.my_firm_id());

create policy "firms: delete own firm" on public.firms
  for delete using (id = public.my_firm_id());

-- Profiles: users can insert their own profile; can read profiles in their firm
create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles: own firm" on public.profiles
  for select using (firm_id = public.my_firm_id() or id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- Clients: firm-scoped
create policy "clients: own firm" on public.clients
  for all using (firm_id = public.my_firm_id());

-- BRA: firm-scoped
create policy "bra: own firm" on public.business_risk_assessments
  for all using (firm_id = public.my_firm_id());

-- Audit log: firm-scoped, insert only for own firm
create policy "audit_log: own firm" on public.audit_log
  for all using (firm_id = public.my_firm_id());
