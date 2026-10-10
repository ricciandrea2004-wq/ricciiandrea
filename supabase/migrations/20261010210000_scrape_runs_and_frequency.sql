-- Competia: per-source check frequency, failure backoff, and the history of scraper runs.
-- Not applied to the live project yet: it needs Andrea's OK first.
--
-- sources.check_interval_hours: how often the page is read (the daily cron makes 24 the shortest
--   effective interval on Vercel Hobby). sources.failure_count: failed checks in a row, used to
--   space out retries on a broken page (lib/scraper/schedule.ts). A success sets it back to 0.
-- scrape_runs: one row per run (cron or manual). source_checks: one row per page read in a run,
--   with its outcome and message, so errors stay visible after the function logs expire.
-- Same access model as the other tables: RLS on, no policies, service role only.

alter table public.sources
  add column if not exists check_interval_hours integer not null default 24
    check (check_interval_hours between 1 and 720),
  add column if not exists failure_count integer not null default 0
    check (failure_count >= 0);

create table if not exists public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  trigger text not null check (trigger in ('cron', 'manual')),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_ms integer not null check (duration_ms >= 0),
  due integer not null default 0,
  checked integer not null default 0,
  changed integer not null default 0,
  failed integer not null default 0
);
create index if not exists scrape_runs_org_started_idx on public.scrape_runs (organization_id, started_at desc);

create table if not exists public.source_checks (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.scrape_runs (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  checked_at timestamptz not null,
  outcome text not null check (outcome in ('baseline', 'unchanged', 'changed', 'blocked', 'error')),
  message text,
  signal_id uuid references public.signals (id) on delete set null,
  duration_ms integer not null check (duration_ms >= 0)
);
create index if not exists source_checks_run_idx on public.source_checks (run_id);
create index if not exists source_checks_source_idx on public.source_checks (source_id, checked_at desc);
create index if not exists source_checks_signal_idx on public.source_checks (signal_id);

alter table public.scrape_runs enable row level security;
alter table public.source_checks enable row level security;

-- Called by the daily cron after its run: keeps the last 30 snapshots per source and 90 days of
-- runs (their page checks go with them).
create or replace function public.prune_scrape_history(keep_snapshots integer default 30, keep_days integer default 90)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.prune_source_snapshots(keep_snapshots);
  delete from public.scrape_runs where started_at < now() - make_interval(days => keep_days);
end;
$$;
revoke execute on function public.prune_scrape_history(integer, integer) from public, anon, authenticated;
grant execute on function public.prune_scrape_history(integer, integer) to service_role;
