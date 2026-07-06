-- Run this in Supabase SQL Editor.
-- The website server uses SUPABASE_SERVICE_ROLE_KEY, so Row Level Security can stay enabled.

create table if not exists public.notes (
  id text primary key,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notes_created_at_idx on public.notes (created_at desc);

alter table public.notes enable row level security;

create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
