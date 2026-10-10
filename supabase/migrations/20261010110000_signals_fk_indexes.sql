-- Indexes on the signals foreign keys, suggested by the Supabase performance advisor after the
-- first migration. NOT APPLIED to the live project yet.
create index if not exists signals_competitor_idx on public.signals (competitor_id);
create index if not exists signals_source_idx on public.signals (source_id);
create index if not exists signals_snapshot_idx on public.signals (snapshot_id);
