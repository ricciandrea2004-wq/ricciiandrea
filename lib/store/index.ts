import { memoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

// Thrown when COMPETIA_STORE=supabase is set but a variable it needs is missing. The API answers
// 503 instead of silently falling back to the demo data.
export class StoreConfigError extends Error {
  constructor(readonly missing: string[]) {
    super(`Manca ${missing.join(", ")}.`);
  }
}

// Supabase when COMPETIA_STORE=supabase; otherwise the demo store.
export function getStore(): Store {
  if (process.env.COMPETIA_STORE !== "supabase") return memoryStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const organizationId = process.env.COMPETIA_ORGANIZATION_ID;
  if (!url || !key || !organizationId) {
    const missing = Object.entries({ SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, COMPETIA_ORGANIZATION_ID: organizationId })
      .filter(([, v]) => !v)
      .map(([k]) => k);
    throw new StoreConfigError(missing);
  }
  return createSupabaseStore({ url, key, organizationId });
}
