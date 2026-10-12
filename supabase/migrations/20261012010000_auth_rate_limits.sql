-- Limits on sign-in attempts and on the emails sent for access (link, code, password reset).
-- Supabase Auth has its own limits, but it sees every request coming from Vercel's servers, so it
-- cannot tell one person from another: the site counts attempts here, per email and per IP.
-- Keys are SHA-256 hashes, never the address itself. Only the service role can read or write.
create table if not exists public.auth_rate_limits (
  key text not null,
  hit_at timestamptz not null default now()
);

create index if not exists auth_rate_limits_key_hit_idx on public.auth_rate_limits (key, hit_at);

alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from anon, authenticated;

-- Records one attempt for p_key and answers whether it is allowed: false once p_max attempts
-- already fall inside the last p_window_seconds. Refused attempts are not counted.
create or replace function public.auth_rate_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  recent integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  delete from public.auth_rate_limits
    where key = p_key and hit_at < now() - make_interval(secs => p_window_seconds);
  select count(*) into recent from public.auth_rate_limits where key = p_key;
  if recent >= p_max then
    return false;
  end if;
  insert into public.auth_rate_limits (key) values (p_key);
  -- Now and then, drop what is older than a day for every key.
  if random() < 0.01 then
    delete from public.auth_rate_limits where hit_at < now() - interval '1 day';
  end if;
  return true;
end;
$$;

revoke all on function public.auth_rate_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.auth_rate_hit(text, integer, integer) to service_role;
