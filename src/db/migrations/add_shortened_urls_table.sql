-- Create the shortened_urls table
create table if not exists public.shortened_urls (
  id uuid default gen_random_uuid() primary key,
  short_code text not null unique,
  long_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.shortened_urls enable row level security;

create policy "Allow public read access"
  on public.shortened_urls
  for select
  to public
  using (true);

create policy "Allow authenticated insert"
  on public.shortened_urls
  for insert
  to authenticated
  with check (true);

-- Create index for faster lookups
create index if not exists shortened_urls_short_code_idx on public.shortened_urls (short_code);

-- Add function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add trigger to update updated_at
create trigger handle_shortened_urls_updated_at
  before update
  on public.shortened_urls
  for each row
  execute function public.handle_updated_at(); 