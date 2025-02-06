-- Drop existing objects
drop trigger if exists handle_shortened_urls_updated_at on public.shortened_urls;
drop function if exists public.handle_updated_at();
drop function if exists public.cleanup_old_urls();
drop function if exists public.extract_domain();

-- Safely unschedule the cron job if it exists
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-old-urls') then
    perform cron.unschedule('cleanup-old-urls');
  end if;
end $$;

drop table if exists public.shortened_urls;

-- Create function to extract domain from URL
create or replace function public.extract_domain(url text)
returns text
language plpgsql
as $$
declare
  domain text;
begin
  -- Extract domain from URL (handles both http and https)
  domain := regexp_replace(url, '^https?://(?:www\.)?([^/]+).*$', '\1');
  return domain;
end;
$$;

-- Create the shortened_urls table
create table public.shortened_urls (
  id uuid default gen_random_uuid() primary key,
  short_code text not null unique,
  long_url text not null,
  ip_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint url_length_check check (length(long_url) <= 2048)
);

-- Add RLS policies
alter table public.shortened_urls enable row level security;

-- Allow anyone to read URLs (they're public)
create policy "Allow public read access"
  on public.shortened_urls
  for select
  to public
  using (true);

-- Allow anyone to create URLs, but with rate limiting
create policy "Allow public insert with rate limit"
  on public.shortened_urls
  for insert
  to public
  with check (
    -- Only allow URLs from our domain
    extract_domain(long_url) = current_setting('app.domain_name', true) and
    -- Rate limit by IP
    (
      select count(*)
      from shortened_urls
      where 
        ip_address = current_setting('request.ip', true) and
        created_at > now() - interval '1 minute'
    ) < 10
  );

-- Create indexes for faster lookups
create index shortened_urls_short_code_idx on public.shortened_urls (short_code);
create index shortened_urls_ip_created_idx on public.shortened_urls (ip_address, created_at);
create index shortened_urls_long_url_idx on public.shortened_urls (long_url);

-- Add function to update updated_at timestamp
create function public.handle_updated_at()
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

-- Function to clean up old URLs
create function public.cleanup_old_urls()
returns void
language plpgsql
security definer
as $$
begin
  delete from shortened_urls
  where created_at < now() - interval '30 days';
end;
$$;

-- Safely create the cron job
do $$
begin
  -- First remove the job if it exists
  if exists (select 1 from cron.job where jobname = 'cleanup-old-urls') then
    perform cron.unschedule('cleanup-old-urls');
  end if;
  -- Then create the new job
  perform cron.schedule(
    'cleanup-old-urls',
    '0 0 * * *', -- Run daily at midnight
    'select public.cleanup_old_urls();'
  );
end $$; 