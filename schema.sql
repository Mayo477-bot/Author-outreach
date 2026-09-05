-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  focus text,
  email text,
  website text,
  social text,
  status text not null default 'Not contacted',
  notes text,
  last_contact date,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;

create policy "Users can view their own contacts"
  on contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on contacts for delete
  using (auth.uid() = user_id);
