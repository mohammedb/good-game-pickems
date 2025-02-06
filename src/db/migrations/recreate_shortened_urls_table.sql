-- First, drop existing table and related objects
drop trigger if exists handle_shortened_urls_updated_at on public.shortened_urls;
drop function if exists public.handle_updated_at();
drop table if exists public.shortened_urls;

-- Create the shortened_urls table
create table public.shortened_urls (
  id uuid default gen_random_uuid() primary key,
  short_code text not null unique,
  long_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.shortened_urls enable row level security;

-- Allow anyone to read and create URLs (we don't need authentication for this feature)
create policy "Allow public access"
  on public.shortened_urls
  for all  -- This allows select, insert, update, delete
  to public
  using (true)
  with check (true);

-- Create index for faster lookups
create index shortened_urls_short_code_idx on public.shortened_urls (short_code);

-- Grant necessary permissions
grant all on public.shortened_urls to public;
grant usage on schema public to public; 