-- Competia: per-source check frequency, failure backoff, and the history of scraper runs.
-- Applied to the live project on 2026-10-12 with Andrea's OK, as two migrations
-- (sources_check_frequency, scrape_runs_and_source_checks).
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
