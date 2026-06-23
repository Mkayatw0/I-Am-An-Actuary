-- Supabase SQL migration: Create profiles table
-- Run this in the Supabase SQL editor after project setup.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  user_type text not null check (user_type in ('student', 'actuary', 'investor', 'general_user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row-Level Security
alter table profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Allow the service-role (backend) to manage all rows
create policy "Service role can manage all profiles"
  on profiles for all
  using (true)
  with check (true);