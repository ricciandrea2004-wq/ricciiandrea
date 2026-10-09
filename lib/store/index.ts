import { memoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

// Supabase only when explicitly switched on and fully configured; otherwise the demo store.
export function getStore(): Store {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const organizationId = process.env.COMPETIA_ORGANIZATION_ID;
  if (process.env.COMPETIA_STORE === "supabase" && url && key && organizationId) {
    return createSupabaseStore({ url, key, organizationId });
  }
  return memoryStore;
}
