-- Competia: competitors, sources, snapshots and signals for the scraping API (first version).
-- NOT APPLIED to the live project. Apply only after Andrea's OK, in its own step.
--
-- Access model for now: RLS is on and there are no policies, so only the service role
-- (used server side by the API with SUPABASE_SERVICE_ROLE_KEY) can read or write.
-- Per-member policies come with Supabase Auth and the memberships table.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  sector text not null default '',
  website text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists competitors_org_idx on public.competitors (organization_id);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  label text not null,
  category text not null check (category in ('price', 'assortment', 'promotion', 'news')),
  url text not null check (url ~ '^https?://'),
  selector text,
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'error', 'blocked')),
  last_checked_at timestamptz,
  last_observed_at timestamptz not null default now(),
  last_error text,
  added_at timestamptz not null default now(),
  unique (competitor_id, url)
);
create index if not exists sources_org_idx on public.sources (organization_id);
create index if not exists sources_due_idx on public.sources (status, last_checked_at nulls first);

create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  fetched_at timestamptz not null default now(),
  final_url text not null,
  http_status integer not null,
  content_hash text not null,
  title text,
  text_content text not null
);
create index if not exists source_snapshots_latest_idx on public.source_snapshots (source_id, fetched_at desc);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  snapshot_id uuid references public.source_snapshots (id) on delete set null,
  category text not null check (category in ('price', 'assortment', 'promotion', 'news')),
  title text not null,
  before_value text not null default '',
  after_value text not null default '',
  interpretation text not null default '',
  status text not null default 'to_verify' check (status in ('to_verify', 'verified', 'in_briefing', 'discarded')),
  origin text not null default 'manual' check (origin in ('manual', 'scraper')),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists signals_org_observed_idx on public.signals (organization_id, observed_at desc);

create table if not exists public.signal_status_changes (
  id bigint generated always as identity primary key,
  signal_id uuid not null references public.signals (id) on delete cascade,
  status text not null check (status in ('to_verify', 'verified', 'in_briefing', 'discarded')),
  changed_at timestamptz not null default now(),
  changed_by text not null
);
create index if not exists signal_status_changes_signal_idx on public.signal_status_changes (signal_id, changed_at);

alter table public.organizations enable row level security;
alter table public.competitors enable row level security;
alter table public.sources enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.signals enable row level security;
alter table public.signal_status_changes enable row level security;

-- Snapshot retention: keep the last 30 per source. Call from the scrape job or pg_cron later.
create or replace function public.prune_source_snapshots(keep integer default 30)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.source_snapshots s
  using (
    select id, row_number() over (partition by source_id order by fetched_at desc) as rn
    from public.source_snapshots
  ) ranked
  where s.id = ranked.id and ranked.rn > keep;
$$;
revoke execute on function public.prune_source_snapshots(integer) from public, anon, authenticated;
