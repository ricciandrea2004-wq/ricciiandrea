// Limits on sign-in attempts and access emails, per email and per IP.
//
// Counted in Postgres (public.auth_rate_hit, supabase/migrations/20261012010000_auth_rate_limits.sql)
// with the service role key, so every server instance shares the same count. Without the key or
// the function (previews, before the migration) it falls back to a count in this server's memory:
// weaker, because each Vercel instance counts on its own, but never unlimited.
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export type Limit = { scope: string; id: string; max: number; windowSeconds: number };

const memory = new Map<string, number[]>();
let warned = false;

const hash = (scope: string, id: string) => createHash("sha256").update(`competia:${scope}:${id.toLowerCase()}`).digest("hex");

function memoryHit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);
  if (recent.length >= max) {
    memory.set(key, recent);
    return false;
  }
  recent.push(now);
  memory.set(key, recent);
  if (memory.size > 10_000) memory.clear();
  return true;
}

async function databaseHit(key: string, max: number, windowSeconds: number): Promise<boolean | null> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/auth_rate_hit`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        // Same rule as lib/store/supabase.ts: only a legacy JWT key also goes in Authorization.
        ...(serviceKey.startsWith("eyJ") ? { Authorization: `Bearer ${serviceKey}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_key: key, p_window_seconds: windowSeconds, p_max: max }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      if (!warned) console.warn(`[auth] limiti nel database non disponibili (${res.status}): conto in memoria`);
      warned = true;
      return null;
    }
    return (await res.json()) === true;
  } catch {
    return null;
  }
}

/** The caller's IP as Vercel reports it (it overwrites x-forwarded-for, so the client can't forge it). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "sconosciuto";
}

/** True when every limit still has room; each one counts this attempt. */
export async function withinLimits(limits: Limit[]) {
  for (const l of limits) {
    const key = hash(l.scope, l.id);
    const allowed = (await databaseHit(key, l.max, l.windowSeconds)) ?? memoryHit(key, l.max, l.windowSeconds);
    if (!allowed) {
      console.warn(`[auth] limite superato: ${l.scope}`);
      return false;
    }
  }
  return true;
}
