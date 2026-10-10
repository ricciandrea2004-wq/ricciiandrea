-- Indexes on the signals foreign keys, suggested by the Supabase performance advisor after the
-- first migration. Applied to the live project on 2026-10-10 with Andrea's OK.
create index if not exists signals_competitor_idx on public.signals (competitor_id);
create index if not exists signals_source_idx on public.signals (source_id);
create index if not exists signals_snapshot_idx on public.signals (snapshot_id);
